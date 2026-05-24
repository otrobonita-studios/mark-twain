'use client';

/*
 * Copyright 2026 Otrobonita AI Labs (Jesper Karlsson)
 * Licensed under the Apache License, Version 2.0 (the "License");
 */


import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

export default function MediaPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
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
      audio.currentTime = 0;
      setHasPlayed(true);
      audio.play().catch((err) => {
        console.error('Audio play failed:', err);
      });
      setIsPlaying(true);
    }
  };

  const handleReset = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    if (!isPlaying) {
      audio.play().catch((err) => console.error(err));
      setIsPlaying(true);
      setHasPlayed(true);
    }
  };

  const handleMuteToggle = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const isSoundwaveActive = !hasPlayed || isPlaying;

  return (
    <div 
      className="mini-player-pill"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handlePlayPause}
    >
      <audio
        ref={audioRef}
        src="/sounds/music/mark-twain-reappears.mp3"
        preload="auto"
      />

      {/* Tiny soundwave graphic */}
      <div className={`mini-soundwave ${isSoundwaveActive ? 'active' : 'paused'}`}>
        <div className="mini-soundwave-bar"></div>
        <div className="mini-soundwave-bar"></div>
        <div className="mini-soundwave-bar"></div>
        <div className="mini-soundwave-bar"></div>
      </div>

      {/* Track info / state text */}
      <span className="mini-player-title typewriter">
        {isPlaying ? 'Twain Theme' : 'Soundtrack'}
      </span>

      {/* Action Controls */}
      <div className="mini-player-controls">
        <button 
          onClick={handleMuteToggle}
          className="mini-control-btn"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </button>
        <button 
          onClick={handleReset}
          className="mini-control-btn"
          title="Restart Theme"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {/* Animated Play/Pause indicator circle */}
      <div className="mini-play-indicator">
        {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" style={{ marginLeft: '1px' }} />}
      </div>
      
      {/* Tooltip on hover */}
      {showTooltip && (
        <div className="mini-player-tooltip typewriter">
          Mark Twain Reappears: Original Theme • Click to {isPlaying ? 'Pause' : 'Play'}
        </div>
      )}
    </div>
  );
}
