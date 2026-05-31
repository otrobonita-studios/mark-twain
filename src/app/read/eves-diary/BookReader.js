'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sun, Moon, Volume2, Cpu, BookOpen, X } from 'lucide-react';
import MediaPlayer from '@/components/MediaPlayer';
import TechDetect from '@/components/TechDetect';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookReader({ htmlContent, tocItems = [] }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [theme, setTheme] = useState('charcoal'); // 'parchment' | 'charcoal'
  const [fontSize, setFontSize] = useState('small'); // 'small' | 'normal' | 'large'
  const [experience, setExperience] = useState('traditional'); // 'traditional' | 'app' | 'parallax' | 'voice' | 'drama' | 'chat' | 'split' | 'comments' | 'child'
  const [isMusicPlayerClosed, setIsMusicPlayerClosed] = useState(false);
  const [isTechDetectClosed, setIsTechDetectClosed] = useState(false);
  const [selectedZoomImage, setSelectedZoomImage] = useState(null);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const experiences = [
    { id: 'drama', label: 'Index', description: 'Navigate the story by Index.' },
    { id: 'traditional', label: 'Traditional Read', description: "Original Gutenberg text and illustrations." },
    { id: 'voice', label: 'Voice-First Edition', description: 'Voice-command navigation and speech narration.' },
    { id: 'chat', label: 'Chat-Native Edition', description: 'Interact with Eve directly in instant message format.' },
    { id: 'split', label: 'Sung Edition', description: 'Hear the diary set to music.' },
    { id: 'child', label: 'Young Readers', description: 'Simplified text and glossary for young minds.' }
  ];

  const isLoadedRef = useRef(false);
  const readerRef = useRef(null);

  // Load settings from local storage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('eves-diary-theme');
    const savedFontSize = localStorage.getItem('eves-diary-font-size');
    const savedExperience = localStorage.getItem('eves-diary-experience');
    const savedClosed = localStorage.getItem('media-player-closed');
    const savedTechClosed = localStorage.getItem('tech-detect-closed');

    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
    if (savedExperience) {
      if (savedExperience === 'drama') {
        setExperience('traditional');
      } else {
        setExperience(savedExperience);
      }
    }
    setIsMusicPlayerClosed(savedClosed !== null ? savedClosed === 'true' : true);
    setIsTechDetectClosed(savedTechClosed === 'true');

    isLoadedRef.current = true;

    // Listen to media player close-change events
    const handleCloseChange = (e) => {
      setIsMusicPlayerClosed(e.detail.isClosed);
    };

    // Listen to tech-detect close-change events
    const handleTechCloseChange = (e) => {
      setIsTechDetectClosed(e.detail.isClosed);
    };

    window.addEventListener('media-player-close-change', handleCloseChange);
    window.addEventListener('tech-detect-close-change', handleTechCloseChange);
    
    return () => {
      window.removeEventListener('media-player-close-change', handleCloseChange);
      window.removeEventListener('tech-detect-close-change', handleTechCloseChange);
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

  // Handle click on dynamic article elements to capture image zooms
  const handleArticleClick = (e) => {
    const wrapper = e.target.closest('.circle-img-wrapper');
    if (wrapper) {
      const img = wrapper.querySelector('.in-paragraph-img');
      if (img) {
        setSelectedZoomImage(img.getAttribute('src'));
        return;
      }
    }

    const clickedImg = e.target.closest('img');
    if (clickedImg) {
      const isBookImage = clickedImg.closest('.book-text-content') || 
                          clickedImg.closest('.book-cover-trio') || 
                          clickedImg.closest('.book-epigraph') || 
                          clickedImg.closest('.paragraph-with-image') ||
                          clickedImg.closest('.fig') ||
                          clickedImg.closest('.fig-trio-item');
      if (isBookImage) {
        setSelectedZoomImage(clickedImg.getAttribute('src'));
      }
    }
  };

  // Scroll tracking to update the active Table of Contents item
  useEffect(() => {
    if (tocItems.length === 0) return;

    const handleScrollActiveItem = () => {
      const elements = tocItems.map(item => document.getElementById(item.id)).filter(Boolean);
      let currentActiveId = null;
      
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        // If the element's top boundary is above or near the top viewport threshold (e.g. 160px)
        if (rect.top <= 160) {
          currentActiveId = el.id;
        } else {
          break; // Headings are ordered, so stop once we find one below the threshold
        }
      }
      
      if (currentActiveId) {
        setActiveId(currentActiveId);
      } else {
        setActiveId(tocItems[0].id);
      }
    };

    window.addEventListener('scroll', handleScrollActiveItem);
    handleScrollActiveItem(); // Initial call

    return () => window.removeEventListener('scroll', handleScrollActiveItem);
  }, [tocItems]);

  // Smooth scroll helper that offsets for the sticky header
  const scrollToId = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Automatically close drawer on mobile
      if (window.innerWidth < 768) {
        setIsTocOpen(false);
      }
    }
  };

  const handleReopenMusic = () => {
    window.dispatchEvent(new CustomEvent('media-player-open'));
  };

  const handleReopenTechDetect = () => {
    window.dispatchEvent(new CustomEvent('tech-detect-open'));
  };

  return (
    <div className={`book-reader-container theme-${theme} ${isTocOpen ? 'toc-sidebar-open' : ''}`}>
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

          {/* Reopen Tech Detect Icon (only if closed) */}
          {isTechDetectClosed && (
            <button 
              onClick={handleReopenTechDetect} 
              className="book-control-btn reopen-music-btn" 
              title="Open Tech Detect Window"
              style={{ marginRight: '0.45rem' }}
            >
              <Cpu size={16} />
            </button>
          )}

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
        <article 
          className={`book-page-parchment font-serif size-${fontSize}`}
          onClick={handleArticleClick}
        >
          <div className="book-epigraph">
            “Wheresoever she was, there was Eden.”
          </div>

          {/* Reading Experience Selector */}
          <div className="reading-experience-selector">
            <h4 className="experience-heading">WAYS TO EXPERIENCE</h4>
            <div className="experience-grid">
              {experiences.map((exp) => {
                const isActive = exp.id === 'drama' ? isTocOpen : experience === exp.id;
                return (
                  <button
                    key={exp.id}
                    onClick={() => {
                      if (exp.id === 'drama') {
                        if (!isTocOpen) {
                          setIsTocOpen(true);
                          setExperience('traditional');
                        } else if (experience !== 'traditional') {
                          setExperience('traditional');
                        } else {
                          setIsTocOpen(false);
                        }
                      } else {
                        setExperience(exp.id);
                        if (exp.id === 'split') {
                          window.dispatchEvent(new CustomEvent('media-player-open'));
                        }
                      }
                    }}
                    className={`experience-card ${isActive ? 'active' : ''}`}
                  >
                    <span className="experience-card-label">{exp.label}</span>
                    <span className="experience-card-desc">{exp.description}</span>
                  </button>
                );
              })}
            </div>
          </div>



          {experience === 'traditional' ? (
            <div className="book-text-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          ) : experience === 'child' ? (
            <div className="experience-younger-readers">
              <h3>For Younger Readers</h3>
              <div className="preview-concept">
                Two doors into the Garden. Choose the one that fits.
              </div>
              <div className="edition-choice">
                <div className="edition-card">
                  <h4>Young Readers</h4>
                  <p className="edition-ages">Ages 7–9</p>
                  <p className="edition-description">
                    Eve's first days in the Garden — her arrival, her discoveries, her invention of fire, and the moment Adam finally sees her. Twain's voice with a gentle hand on the harder words. Hover any underlined word for a kind definition.
                  </p>
                  <button onClick={() => setExperience('traditional')} className="btn-gold return-traditional-btn">Start Reading</button>
                </div>
                <div className="edition-card">
                  <h4>Middle Grade</h4>
                  <p className="edition-ages">Ages 10–14</p>
                  <p className="edition-description">
                    The complete diary, from Eve's first day in the Garden to Adam's words at her grave. Twain's prose untouched, with a glossary for the harder words. Paired with <em>Extracts from Adam's Diary</em> — the same story from the other side.
                  </p>
                  <button onClick={() => setExperience('traditional')} className="btn-gold return-traditional-btn">Start Reading</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="experience-design-preview">
              <div className="preview-stamp">DESIGN PHASE</div>
              <h3>{experiences.find(e => e.id === experience).label}</h3>
              <p className="preview-status">
                This reading room configuration is currently in layout design.
              </p>
              <div className="preview-concept">
                {experience === 'voice' && "Coming to an appstore on your mobile device."}
                {experience === 'drama' && "Concept: A multi-track audio player syncing background ambient tracks with segmented character dialogues for Adam and Eve."}
                {experience === 'chat' && "Concept: Transforming the static text entries into a sequential messaging interface where you unlock Eve's thoughts chronologically."}
                {experience === 'split' && "Concept: A musical edition setting Eve's diary entries to original compositions and vocal performances."}
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

      {/* Persistent Tech Detect Window */}
      <TechDetect />



      {/* Table of Contents Drawer */}
      <AnimatePresence>
        {isTocOpen && (
          <>
            {/* Backdrop for closing */}
            <motion.div
              className="toc-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTocOpen(false)}
            />

            {/* Sidebar drawer panel */}
            <motion.div
              className="toc-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
            >
              <div className="toc-drawer-header">
                <h3>Diary Index</h3>
                <button onClick={() => setIsTocOpen(false)} className="toc-close-btn">
                  <X size={18} />
                </button>
              </div>

              <nav className="toc-drawer-list">
                {tocItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToId(item.id)}
                    className={`toc-item type-${item.type} ${activeId === item.id ? 'active' : ''}`}
                  >
                    {item.type === 'day' && <span className="toc-bullet">•</span>}
                    <span className="toc-label">{item.label}</span>
                  </button>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Zoom Modal Overlay */}
      <AnimatePresence>
        {selectedZoomImage && (
          <motion.div
            className="zoom-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedZoomImage(null)}
          >
            <motion.div
              className="zoom-modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <img src={selectedZoomImage} alt="Enlarged Illustration" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
