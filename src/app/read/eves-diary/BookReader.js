'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sun, Moon, Volume2, Cpu } from 'lucide-react';
import MediaPlayer from '@/components/MediaPlayer';
import TechDetect from '@/components/TechDetect';

export default function BookReader({ htmlContent }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [theme, setTheme] = useState('charcoal'); // 'parchment' | 'charcoal'
  const [fontSize, setFontSize] = useState('small'); // 'small' | 'normal' | 'large'
  const [experience, setExperience] = useState('traditional'); // 'traditional' | 'app' | 'parallax' | 'voice' | 'drama' | 'chat' | 'split' | 'comments' | 'child'
  const [isMusicPlayerClosed, setIsMusicPlayerClosed] = useState(false);
  const [isTechDetectClosed, setIsTechDetectClosed] = useState(false);

  const experiences = [
    { id: 'traditional', label: 'Traditional Read', description: "Original Gutenberg text and illustrations." },
    { id: 'voice', label: 'Voice-First Edition', description: 'Voice-command navigation and speech narration.' },
    { id: 'drama', label: 'Short Audio Drama', description: 'Immersive soundscapes and actor dramatization.' },
    { id: 'chat', label: 'Chat-Native Edition', description: 'Interact with Eve directly in instant message format.' },
    { id: 'split', label: 'Parallel Diary', description: "Eve's and Adam's entries split side-by-side." },
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
    const savedTechClosed = localStorage.getItem('tech-detect-closed');

    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
    if (savedExperience) setExperience(savedExperience);
    setIsMusicPlayerClosed(savedClosed === 'true');
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

  const handleReopenMusic = () => {
    window.dispatchEvent(new CustomEvent('media-player-open'));
  };

  const handleReopenTechDetect = () => {
    window.dispatchEvent(new CustomEvent('tech-detect-open'));
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
                {experience === 'voice' && "Concept: An Android APK integrating speech-to-text recognition to navigate the diary entries and play corresponding audio segments."}
                {experience === 'drama' && "Concept: A multi-track audio player syncing background ambient tracks with segmented character dialogues for Adam and Eve."}
                {experience === 'chat' && "Concept: Transforming the static text entries into a sequential messaging interface where you unlock Eve's thoughts chronologically."}
                {experience === 'split' && "Concept: A two-column responsive desktop layout displaying Eve's Diary on the left and Adam's Diary on the right, aligned by date."}
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

      {/* Persistent Tech Detect Window */}
      <TechDetect />
    </div>
  );
}
