'use client';

import { useState, useRef, useEffect } from 'react';
import { Cpu, Maximize2, Minimize2, X } from 'lucide-react';

export default function TechDetect() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(true); // default to closed initially until mounted
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [techDetails, setTechDetails] = useState(null);
  
  const cardRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Initialize from LocalStorage and start listeners
  useEffect(() => {
    const savedClosed = localStorage.getItem('tech-detect-closed');
    const savedMinimized = localStorage.getItem('tech-detect-minimized');
    const savedPos = localStorage.getItem('tech-detect-position');

    const closed = savedClosed === 'true';
    const minimized = savedMinimized === 'true';
    
    setIsClosed(savedClosed !== null ? closed : false);
    setIsMinimized(minimized);

    // Trigger initial close-change event for headers
    window.dispatchEvent(new CustomEvent('tech-detect-close-change', { 
      detail: { isClosed: savedClosed !== null ? closed : false } 
    }));

    if (savedPos) {
      try {
        setPosition(JSON.parse(savedPos));
      } catch (e) {
        setDefaultPosition(minimized);
      }
    } else {
      setDefaultPosition(minimized);
    }
  }, []);

  const setDefaultPosition = (minimizedState) => {
    if (typeof window !== 'undefined') {
      const w = minimizedState ? 240 : 320;
      const h = minimizedState ? 52 : 180;
      // Position it slightly offset from the media player
      setPosition({
        x: window.innerWidth - w - 24,
        y: window.innerHeight - h - 220
      });
    }
  };

  // Sync isClosed / isMinimized state to localStorage
  const handleClose = (e) => {
    if (e) e.stopPropagation();
    setIsClosed(true);
    localStorage.setItem('tech-detect-closed', 'true');
    window.dispatchEvent(new CustomEvent('tech-detect-close-change', { detail: { isClosed: true } }));
  };

  const handleMinimizeToggle = (e) => {
    e.stopPropagation();
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    localStorage.setItem('tech-detect-minimized', String(newMinimized));
    
    if (typeof window !== 'undefined') {
      const w = newMinimized ? 240 : 320;
      const h = newMinimized ? 52 : 180;
      setPosition(prev => {
        const nextX = Math.max(10, Math.min(window.innerWidth - w - 10, prev.x));
        const nextY = Math.max(10, Math.min(window.innerHeight - h - 10, prev.y));
        const newPos = { x: nextX, y: nextY };
        localStorage.setItem('tech-detect-position', JSON.stringify(newPos));
        return newPos;
      });
    }
  };

  // Listen to open events from other buttons
  useEffect(() => {
    const handleOpenEvent = () => {
      setIsClosed(false);
      localStorage.setItem('tech-detect-closed', 'false');
      window.dispatchEvent(new CustomEvent('tech-detect-close-change', { detail: { isClosed: false } }));
    };

    window.addEventListener('tech-detect-open', handleOpenEvent);
    return () => {
      window.removeEventListener('tech-detect-open', handleOpenEvent);
    };
  }, []);

  // Save position when dragging finishes
  useEffect(() => {
    if (position.x !== -1) {
      localStorage.setItem('tech-detect-position', JSON.stringify(position));
    }
  }, [position]);

  // System parameters detection
  useEffect(() => {
    const updateTechDetails = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const ratio = window.devicePixelRatio;
      const maxTouch = navigator.maxTouchPoints || 0;
      const isTouch = maxTouch > 0;
      const cores = navigator.hardwareConcurrency || 'Unknown';
      
      const ua = navigator.userAgent;
      let browserName = "Other";
      if (ua.indexOf("Firefox") > -1) browserName = "Firefox";
      else if (ua.indexOf("SamsungBrowser") > -1) browserName = "Samsung";
      else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browserName = "Opera";
      else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) browserName = "Edge";
      else if (ua.indexOf("Chrome") > -1) browserName = "Chrome";
      else if (ua.indexOf("Safari") > -1) browserName = "Safari";

      let platform = "Unknown";
      if (navigator.platform) {
        platform = navigator.platform;
      }
      if (navigator.userAgentData?.platform) {
        platform = navigator.userAgentData.platform;
      }

      let layoutType = "Mobile Portrait";
      if (width >= 1200) {
        layoutType = "Two-Page Layout";
      } else if (width >= 768) {
        layoutType = "Single-Page Book";
      } else {
        layoutType = "Mobile Portrait";
      }

      setTechDetails({
        viewport: `${width} × ${height}`,
        screen: `${screenWidth} × ${screenHeight}`,
        dpr: ratio.toFixed(1),
        touch: isTouch ? `Yes (${maxTouch} pts)` : "No",
        cores: String(cores),
        browser: browserName,
        platform: platform,
        layout: layoutType
      });
    };

    updateTechDetails();
    window.addEventListener('resize', updateTechDetails);
    return () => window.removeEventListener('resize', updateTechDetails);
  }, []);

  // Dragging handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...position };
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('button')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    startPos.current = { ...position };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      updateDragPosition(dx, dy);
    };

    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStart.current.x;
      const dy = touch.clientY - dragStart.current.y;
      updateDragPosition(dx, dy);
    };

    const updateDragPosition = (dx, dy) => {
      let newX = startPos.current.x + dx;
      let newY = startPos.current.y + dy;
      
      const padding = 10;
      const w = isMinimized ? 240 : 320;
      const h = isMinimized ? 52 : 180;
      
      if (typeof window !== 'undefined') {
        newX = Math.max(padding, Math.min(window.innerWidth - w - padding, newX));
        newY = Math.max(padding, Math.min(window.innerHeight - h - padding, newY));
      }
      setPosition({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, isMinimized]);

  if (isClosed || position.x === -1) return null;

  const cardStyle = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 9998,
  };

  return (
    <div 
      ref={cardRef}
      className={`tech-detect-card ${isMinimized ? 'minimized' : 'expanded'} ${isDragging ? 'dragging' : ''}`}
      style={cardStyle}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {isMinimized ? (
        <div className="tech-detect-pill-content">
          <div className="tech-detect-icon-thumb">
            <Cpu size={16} />
          </div>
          <div className="tech-detect-pill-text">
            <span className="tech-detect-pill-title typewriter">Tech Detect</span>
          </div>
          <div className="mini-action-controls">
            <button onClick={handleMinimizeToggle} className="mini-control-btn" title="Expand Window">
              <Maximize2 size={10} />
            </button>
            <button onClick={handleClose} className="mini-control-btn close-btn" title="Close Window">
              <X size={10} />
            </button>
          </div>
        </div>
      ) : (
        <div className="tech-detect-content">
          {/* Header */}
          <div className="player-header">
            <span className="player-header-title typewriter" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Cpu size={10} /> Tech Detect
            </span>
            <div className="player-header-actions">
              <button onClick={handleMinimizeToggle} className="header-action-btn" title="Minimize Window">
                <Minimize2 size={10} />
              </button>
              <button onClick={handleClose} className="header-action-btn close-btn" title="Close Window">
                <X size={10} />
              </button>
            </div>
          </div>

          {/* Parameters Grid */}
          {techDetails && (
            <div className="tech-detect-grid-compact">
              <div className="tech-detect-item-compact">
                <span className="tech-detect-label-compact">Platform</span>
                <span className="tech-detect-value-compact">{techDetails.platform}</span>
              </div>
              <div className="tech-detect-item-compact">
                <span className="tech-detect-label-compact">Browser</span>
                <span className="tech-detect-value-compact">{techDetails.browser}</span>
              </div>
              <div className="tech-detect-item-compact">
                <span className="tech-detect-label-compact">Viewport</span>
                <span className="tech-detect-value-compact">{techDetails.viewport}</span>
              </div>
              <div className="tech-detect-item-compact">
                <span className="tech-detect-label-compact">Screen</span>
                <span className="tech-detect-value-compact">{techDetails.screen}</span>
              </div>
              <div className="tech-detect-item-compact">
                <span className="tech-detect-label-compact">DPR</span>
                <span className="tech-detect-value-compact">{techDetails.dpr}</span>
              </div>
              <div className="tech-detect-item-compact">
                <span className="tech-detect-label-compact">Touch</span>
                <span className="tech-detect-value-compact">{techDetails.touch}</span>
              </div>
              <div className="tech-detect-item-compact">
                <span className="tech-detect-label-compact">Cores</span>
                <span className="tech-detect-value-compact">{techDetails.cores}</span>
              </div>
              <div className="tech-detect-item-compact">
                <span className="tech-detect-label-compact">Layout</span>
                <span className="tech-detect-value-compact">{techDetails.layout}</span>
              </div>
            </div>
          )}

          {/* Footer Message */}
          <div className="tech-detect-message typewriter">
            The user experience has been adjusted to your technical platform.
          </div>
        </div>
      )}
    </div>
  );
}
