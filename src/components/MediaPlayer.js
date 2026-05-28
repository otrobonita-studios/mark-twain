'use client';

/*
 * Copyright 2026 Otrobonita AI Labs (Jesper Karlsson)
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ListMusic } from 'lucide-react';

const soundtrack = [
  {
    id: "eves-diary",
    title: "Eve's Diary Theme",
    file: "/sounds/music/mark-twains-eves-diary.mp3",
    style: "Melancholic acoustic guitar & cello"
  },
  {
    id: "original-theme",
    title: "Mark Twain Reappears: Original Theme",
    file: "/sounds/music/mark-twain-reappears.mp3",
    style: "Saloon piano & cinematic warmth"
  },
  {
    id: "telephonic-conversation",
    title: "A Telephonic Conversation",
    file: "/sounds/music/a-telephonic-conversation.mp3",
    style: "Parlor piano & vintage jazz"
  }
];

export default function MediaPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  
  const audioRef = useRef(null);
  const currentTrack = soundtrack[currentTrackIndex] || soundtrack[0];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      // Auto-advance to next track or stop
      if (currentTrackIndex < soundtrack.length - 1) {
        setCurrentTrackIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex]);

  // Handle track source switching
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.load();
    if (hasPlayed && isPlaying) {
      audio.play().catch((err) => {
        console.error('Audio source switch play failed:', err);
      });
    }
  }, [currentTrackIndex]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setHasPlayed(true);
      audio.play().catch((err) => {
        console.error('Audio play failed:', err);
      });
      setIsPlaying(true);
    }
  };

  const selectTrack = (index, e) => {
    e.stopPropagation();
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setHasPlayed(true);
    setIsPlaylistOpen(false);
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

  const togglePlaylist = (e) => {
    e.stopPropagation();
    setIsPlaylistOpen(prev => !prev);
  };

  const isSoundwaveActive = !hasPlayed || isPlaying;

  return (
    <div 
      className="mini-player-pill"
      onMouseEnter={() => {
        if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches && window.innerWidth >= 1024) {
          setShowTooltip(true);
        }
      }}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handlePlayPause}
    >
      <audio
        ref={audioRef}
        src={currentTrack.file}
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
        {isPlaying ? currentTrack.title.replace("Mark Twain Reappears: ", "").replace(" Theme", "") : 'Soundtrack'}
      </span>

      {/* Action Controls */}
      <div className="mini-player-controls">
        <button 
          onClick={togglePlaylist}
          className={`mini-control-btn ${isPlaylistOpen ? 'active' : ''}`}
          title="Soundtrack Playlist"
        >
          <ListMusic size={12} />
        </button>
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
          title="Restart Track"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {/* Animated Play/Pause indicator circle */}
      <div className="mini-play-indicator">
        {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" style={{ marginLeft: '1px' }} />}
      </div>
      
      {/* Tooltip on hover */}
      {showTooltip && !isPlaylistOpen && (
        <div className="mini-player-tooltip typewriter hidden md:block">
          {currentTrack.title} • Click to {isPlaying ? 'Pause' : 'Play'}
        </div>
      )}

      {/* Playlist Drop-Up Menu */}
      {isPlaylistOpen && (
        <div className="mini-player-playlist-dropdown tactile-card custom-scrollbar" onClick={(e) => e.stopPropagation()}>
          <div className="playlist-header typewriter">Soundtrack Playlist</div>
          {soundtrack.map((track, idx) => (
            <button
              key={track.id}
              onClick={(e) => selectTrack(idx, e)}
              className={`playlist-item typewriter ${idx === currentTrackIndex ? 'active' : ''}`}
            >
              <div className="playlist-item-title">{track.title}</div>
              <div className="playlist-item-style">{track.style}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
