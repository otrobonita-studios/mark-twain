'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, RotateCcw, Sun, Moon } from 'lucide-react';

export default function BookReader({ htmlContent }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [theme, setTheme] = useState('charcoal'); // 'parchment' | 'charcoal'
  const [fontSize, setFontSize] = useState('small'); // 'small' | 'normal' | 'large'
  const [experience, setExperience] = useState('traditional'); // 'traditional' | 'app' | 'parallax' | 'voice' | 'drama' | 'chat' | 'split' | 'comments' | 'child'
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

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

  const audioRef = useRef(null);
  const readerRef = useRef(null);

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

  // Monitor audio updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateAudioProgress = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setAudioProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateAudioProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateAudioProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch((err) => console.error('Audio play failed:', err));
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    if (!isPlaying) {
      audio.play().catch((err) => console.error(err));
      setIsPlaying(true);
    }
  };

  const handleAudioProgressChange = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    setAudioProgress(e.target.value);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className={`book-reader-container theme-${theme}`}>
      {/* Scroll Progress Bar */}
      <div 
        className="reading-progress-bar" 
        style={{ width: `${scrollProgress}%` }}
      />

      <audio 
        ref={audioRef}
        src="/sounds/music/mark-twains-eves-diary.mp3"
        loop
        preload="auto"
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
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
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

      {/* Floating Audio Controller */}
      <div className={`floating-audio-deck ${isPlaying ? 'active' : ''}`}>
        <div className="deck-track-info">
          <span className="deck-track-title typewriter">Eve's Diary Theme</span>
          <span className="deck-track-duration typewriter">{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>

        <div className="deck-slider-wrapper">
          <input 
            type="range"
            min="0"
            max="100"
            value={audioProgress}
            onChange={handleAudioProgressChange}
            className="deck-audio-slider"
          />
        </div>

        <div className="deck-controls">
          <button onClick={handlePlayPause} className="deck-play-btn" aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: '1px' }} />}
          </button>
          <button onClick={handleMuteToggle} className="deck-btn" title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button onClick={handleRestart} className="deck-btn" title="Restart Music">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
