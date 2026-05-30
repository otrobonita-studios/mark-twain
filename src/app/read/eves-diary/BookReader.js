'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sun, Moon, Volume2, Cpu } from 'lucide-react';
import MediaPlayer from '@/components/MediaPlayer';

export default function BookReader({ htmlContent }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [theme, setTheme] = useState('charcoal'); // 'parchment' | 'charcoal'
  const [fontSize, setFontSize] = useState('small'); // 'small' | 'normal' | 'large'
  const [experience, setExperience] = useState('traditional'); // 'traditional' | 'app' | 'parallax' | 'voice' | 'drama' | 'chat' | 'split' | 'comments' | 'child'
  const [isMusicPlayerClosed, setIsMusicPlayerClosed] = useState(false);
  const [techDetails, setTechDetails] = useState(null);

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
        layoutType = "Two-Page Landscape (Desktop)";
      } else if (width >= 768) {
        layoutType = "Single-Page Book (Tablet/Desktop)";
      } else {
        layoutType = "Single-Page Portrait (Mobile)";
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

  const experiences = [
    { id: 'traditional', label: 'Traditional Read', description: "Original Gutenberg text and illustrations." },
    { id: 'app', label: 'Downloadable APK', description: 'Standalone Android mobile application format.' },
    { id: 'parallax', label: 'Parallax Illustrated', description: 'Depth illustrations shifting with mouse movement.' },
    { id: 'voice', label: 'Voice-First Edition', description: 'Voice-command navigation and speech narration.' },
    { id: 'drama', label: 'Short Audio Drama', description: 'Immersive soundscapes and actor dramatization.' },
    { id: 'chat', label: 'Chat-Native Edition', description: 'Interact with Eve directly in instant message format.' },
    { id: 'split', label: 'Parallel Diary', description: "Eve's and Adam's entries split side-by-side." },
    { id: 'comments', label: 'Editor Notes Only', description: 'Annotated sections and board observations.' },
    { id: 'child', label: 'Child Version', description: 'Simplified text with educational hover cards.' }
  ];

  const isLoadedRef = useRef(false);
  const readerRef = useRef(null);

  // Load settings from local storage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('eves-diary-theme');
    const savedFontSize = localStorage.getItem('eves-diary-font-size');
    const savedExperience = localStorage.getItem('eves-diary-experience');
    const savedClosed = localStorage.getItem('media-player-closed');

    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
    if (savedExperience) setExperience(savedExperience);
    setIsMusicPlayerClosed(savedClosed === 'true');

    isLoadedRef.current = true;

    // Listen to media player close-change events
    const handleCloseChange = (e) => {
      setIsMusicPlayerClosed(e.detail.isClosed);
    };

    window.addEventListener('media-player-close-change', handleCloseChange);
    return () => {
      window.removeEventListener('media-player-close-change', handleCloseChange);
    };
  }, []);

  // Save settings when they change
  useEffect(() => {
    if (!isLoadedRef.current) return;
    localStorage.setItem('eves-diary-theme', theme);
    localStorage.setItem('eves-diary-font-size', fontSize);
    localStorage.setItem('eves-diary-experience', experience);
  }, [theme, fontSize, experience]);

  // Monitor page scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleReopenMusic = () => {
    window.dispatchEvent(new CustomEvent('media-player-open'));
  };

  return (
    <div className={`book-reader-container theme-${theme}`}>
      {/* Scroll Progress Bar */}
      <div 
        className="reading-progress-bar" 
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Top Header Deck */}
      <header className="book-reader-header">
        <Link href="/" className="book-back-link">
          <ArrowLeft size={16} />
          <span>Writing Desk</span>
        </Link>

        <div className="book-reader-controls">
          {/* Font Size Selector */}
          <div className="font-size-selector">
            <button 
              onClick={() => setFontSize('small')}
              className={`size-btn ${fontSize === 'small' ? 'active' : ''}`}
              title="Small text size (Standard)"
            >
              Small
            </button>
            <button 
              onClick={() => setFontSize('normal')}
              className={`size-btn ${fontSize === 'normal' ? 'active' : ''}`}
              title="Normal text size"
            >
              Normal
            </button>
            <button 
              onClick={() => setFontSize('large')}
              className={`size-btn ${fontSize === 'large' ? 'active' : ''}`}
              title="Large text size"
            >
              Large
            </button>
          </div>

          {/* Reopen Music Icon (only if closed) */}
          {isMusicPlayerClosed && (
            <button 
              onClick={handleReopenMusic} 
              className="book-control-btn reopen-music-btn" 
              title="Open Music Player"
            >
              <Volume2 size={16} />
            </button>
          )}

          {/* Theme Selector */}
          <button 
            onClick={() => setTheme(theme === 'parchment' ? 'charcoal' : 'parchment')}
            className="book-control-btn theme-toggle"
            title={`Switch to ${theme === 'parchment' ? 'Charcoal' : 'Parchment'} theme`}
          >
            {theme === 'parchment' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      {/* Reading Desk */}
      <main className="book-page-desk" ref={readerRef}>
        <article className={`book-page-parchment font-serif size-${fontSize}`}>
          <div className="book-epigraph">
            “Wheresoever she was, there was Eden.”
          </div>

          {/* Reading Experience Selector */}
          <div className="reading-experience-selector">
            <h4 className="experience-heading">Reading Experience</h4>
            <div className="experience-grid">
              {experiences.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setExperience(exp.id)}
                  className={`experience-card ${experience === exp.id ? 'active' : ''}`}
                >
                  <span className="experience-card-label">{exp.label}</span>
                  <span className="experience-card-desc">{exp.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tech Detect Panel */}
          {techDetails && (
            <div className="tech-detect-panel">
              <div className="tech-detect-header">
                <Cpu size={14} />
                <span>Tech Detect</span>
              </div>
              <div className="tech-detect-grid">
                <div className="tech-detect-item">
                  <span className="tech-detect-label">Platform</span>
                  <span className="tech-detect-value">{techDetails.platform}</span>
                </div>
                <div className="tech-detect-item">
                  <span className="tech-detect-label">Browser</span>
                  <span className="tech-detect-value">{techDetails.browser}</span>
                </div>
                <div className="tech-detect-item">
                  <span className="tech-detect-label">Viewport</span>
                  <span className="tech-detect-value">{techDetails.viewport}</span>
                </div>
                <div className="tech-detect-item">
                  <span className="tech-detect-label">Screen Size</span>
                  <span className="tech-detect-value">{techDetails.screen}</span>
                </div>
                <div className="tech-detect-item">
                  <span className="tech-detect-label">Device Pixel Ratio</span>
                  <span className="tech-detect-value">{techDetails.dpr}</span>
                </div>
                <div className="tech-detect-item">
                  <span className="tech-detect-label">Touch Support</span>
                  <span className="tech-detect-value">{techDetails.touch}</span>
                </div>
                <div className="tech-detect-item">
                  <span className="tech-detect-label">CPU Cores</span>
                  <span className="tech-detect-value">{techDetails.cores}</span>
                </div>
                <div className="tech-detect-item">
                  <span className="tech-detect-label">Active Layout</span>
                  <span className="tech-detect-value">{techDetails.layout}</span>
                </div>
              </div>
              <div className="tech-detect-message typewriter">
                The user experience has been adjusted to your technical platform.
              </div>
            </div>
          )}

          {experience === 'traditional' ? (
            <div className="book-text-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          ) : (
            <div className="experience-design-preview">
              <div className="preview-stamp">DESIGN PHASE</div>
              <h3>{experiences.find(e => e.id === experience).label}</h3>
              <p className="preview-status">
                This reading room configuration is currently in layout design.
              </p>
              <div className="preview-concept">
                {experience === 'app' && "Concept: We can compile a standalone Next.js/Cordova or React Native Android app using the local Android SDK tools to package the diary as an offline-capable mobile application."}
                {experience === 'parallax' && "Concept: Utilizing Framer Motion and mouse/gyroscope coordinates to shift Lester Ralph's illustrations relative to the text, creating depth layers."}
                {experience === 'voice' && "Concept: An Android APK integrating speech-to-text recognition to navigate the diary entries and play corresponding audio segments."}
                {experience === 'drama' && "Concept: A multi-track audio player syncing background ambient tracks with segmented character dialogues for Adam and Eve."}
                {experience === 'chat' && "Concept: Transforming the static text entries into a sequential messaging interface where you unlock Eve's thoughts chronologically."}
                {experience === 'split' && "Concept: A two-column responsive desktop layout displaying Eve's Diary on the left and Adam's Diary on the right, aligned by date."}
                {experience === 'comments' && "Concept: Filtering the corpus to only show diary entries that include contemporary annotations, board discussions, and AI observations."}
                {experience === 'child' && "Concept: An educational format with larger typography, simplified words, and hover definition popups for 19th-century terminology."}
              </div>
              <button onClick={() => setExperience('traditional')} className="btn-gold return-traditional-btn">
                Return to Traditional Read
              </button>
            </div>
          )}
        </article>
      </main>

      {/* Persistent Audio Player */}
      <MediaPlayer />
    </div>
  );
}
