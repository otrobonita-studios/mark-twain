'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ListMusic, Minimize2, Maximize2, X } from 'lucide-react';

const SpotifyIcon = ({ size = 16, className = "" }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    className={className} 
    fill="currentColor"
  >
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.377-1.454-5.37-1.783-8.892-1.007-.336.074-.67-.14-.744-.476-.074-.336.14-.67.476-.744 3.856-.88 7.15-.506 9.81 1.127.295.18.387.563.207.857c-.001-.001-.001-.001 0 0zm1.225-2.72c-.226.367-.707.487-1.074.26-2.722-1.672-6.87-2.157-10.082-1.182-.413.125-.847-.107-.972-.52-.125-.413.107-.847.52-.972 3.676-1.116 8.243-.574 11.348 1.33.367.227.487.708.26 1.074v.01zm.106-2.833c-.273.447-.858.594-1.306.32-3.178-1.89-8.412-2.083-11.454-1.16-.503.152-1.037-.134-1.189-.637-.152-.502.135-1.036.637-1.188 3.633-1.102 9.404-.888 13.084 1.3 448.272.274.595.858.32 1.306v-.002z"/>
  </svg>
);

const soundtrack = [
  {
    id: "eves-diary",
    title: "Eve's Diary",
    file: "/sounds/music/eves-diary-by-eve.mp3",
    style: "Album: Mark Twain Reappears",
    cover: "/images/eves-diary-the-scratched-experience-cover.jpg",
    spotifyUrl: "https://open.spotify.com/album/4TA8m9s8x1rq127gt8Nj5n"
  },
  {
    id: "original-theme",
    title: "Mark Twain Reappears: Original Theme",
    file: "/sounds/music/mark-twain-reappears.mp3",
    style: "Album: Mark Twain Reappears",
    spotifyUrl: "https://open.spotify.com/album/5PX3bNZYZmfxoHcR7iEg9S"
  },
  {
    id: "telephonic-conversation",
    title: "A Telephonic Conversation",
    file: "/sounds/music/a-telephonic-conversation.mp3",
    style: "Album: Mark Twain Reappears",
    spotifyUrl: "https://open.spotify.com/album/5PX3bNZYZmfxoHcR7iEg9S"
  },
  {
    id: "what-is-man",
    title: "What Is Man",
    file: "/sounds/music/what-is-man.mp3",
    style: "Album: Mark Twain Reappears",
    cover: "/images/live-sepia.webp",
    spotifyUrl: "https://open.spotify.com/track/3Bd0wJdOTlmRhEXpFYJFen"
  }
];

export default function MediaPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  
  // Custom features
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(true); // default to closed initially until mounted
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef(null);
  const playerRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const currentTrack = soundtrack[currentTrackIndex] || soundtrack[0];
  const prevTrackRef = useRef(currentTrack.file);
  const spotifyHref = currentTrack.spotifyUrl || 'https://open.spotify.com/album/5PX3bNZYZmfxoHcR7iEg9S';

  // Initialize from sessionStorage (isolated per tab)
  useEffect(() => {
    const savedClosed = sessionStorage.getItem('media-player-closed');
    const savedMinimized = sessionStorage.getItem('media-player-minimized');
    const savedPos = sessionStorage.getItem('media-player-position');
    const savedTrackIndex = sessionStorage.getItem('media-player-track-index');

    const closed = savedClosed !== null ? (savedClosed === 'true') : true;
    const minimized = savedMinimized === 'true';
    
    setIsClosed(closed);
    setIsMinimized(minimized);
    
    if (savedTrackIndex !== null) {
      setCurrentTrackIndex(parseInt(savedTrackIndex, 10));
    } else {
      // Set default track based on pathname
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.includes('/eves-diary')) {
          setCurrentTrackIndex(0); // Eve's Diary Theme
        } else if (path === '/' || path === '/home') {
          setCurrentTrackIndex(1); // Original Theme on homepage
        }
      }
    }

    // Trigger initial close-change event for headers
    window.dispatchEvent(new CustomEvent('media-player-close-change', { 
      detail: { isClosed: closed } 
    }));

    // Position setup
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
      const w = minimizedState ? 240 : 280;
      const h = minimizedState ? 52 : 390;
      setPosition({
        x: window.innerWidth - w - 24,
        y: window.innerHeight - h - 24
      });
    }
  };

  // Sync isClosed / isMinimized state to sessionStorage
  const handleClose = (e) => {
    if (e) e.stopPropagation();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
    setIsPlaying(false);
    setIsClosed(true);
    sessionStorage.setItem('media-player-closed', 'true');
    window.dispatchEvent(new CustomEvent('media-player-close-change', { detail: { isClosed: true } }));
  };

  const handleMinimizeToggle = (e) => {
    e.stopPropagation();
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    sessionStorage.setItem('media-player-minimized', String(newMinimized));
    
    // Adjust position if it would overflow the window
    if (typeof window !== 'undefined') {
      const w = newMinimized ? 240 : 280;
      const h = newMinimized ? 52 : 390;
      setPosition(prev => {
        const nextX = Math.max(10, Math.min(window.innerWidth - w - 10, prev.x));
        const nextY = Math.max(10, Math.min(window.innerHeight - h - 10, prev.y));
        const newPos = { x: nextX, y: nextY };
        sessionStorage.setItem('media-player-position', JSON.stringify(newPos));
        return newPos;
      });
    }
  };

  // Listen to open events from other buttons
  useEffect(() => {
    const handleOpenEvent = () => {
      setIsClosed(false);
      sessionStorage.setItem('media-player-closed', 'false');
      window.dispatchEvent(new CustomEvent('media-player-close-change', { detail: { isClosed: false } }));
      
      // Try default position if uninitialized
      if (position.x === -1) {
        setDefaultPosition(isMinimized);
      }
    };

    window.addEventListener('media-player-open', handleOpenEvent);
    return () => {
      window.removeEventListener('media-player-open', handleOpenEvent);
    };
  }, [position, isMinimized]);

  // Save position when dragging finishes
  useEffect(() => {
    if (position.x !== -1) {
      sessionStorage.setItem('media-player-position', JSON.stringify(position));
    }
  }, [position]);

  const handleEnded = () => {
    if (currentTrackIndex < soundtrack.length - 1) {
      const nextIdx = currentTrackIndex + 1;
      setCurrentTrackIndex(nextIdx);
      sessionStorage.setItem('media-player-track-index', String(nextIdx));
    } else {
      setIsPlaying(false);
    }
  };

  const updateAudioProgress = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
      setDuration(audio.duration);
      setAudioProgress((audio.currentTime / audio.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
      setDuration(audio.duration);
      setAudioProgress((audio.currentTime / audio.duration) * 100);
    }
  };

  // Sync state if audio already loaded metadata
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.readyState >= 1 && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
      setAudioProgress((audio.currentTime / audio.duration) * 100);
    }
  }, [currentTrackIndex]);


  // External control listener (e.g. from Voice of Mark play)
  useEffect(() => {
    const handlePauseEvent = () => {
      const audio = audioRef.current;
      if (audio && isPlaying) {
        audio.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener('media-player-pause', handlePauseEvent);
    return () => {
      window.removeEventListener('media-player-pause', handlePauseEvent);
    };
  }, [isPlaying]);

  // Dispatch play event to external listeners (e.g. Voice of Mark) when music starts playing
  useEffect(() => {
    if (isPlaying) {
      window.dispatchEvent(new CustomEvent('media-player-play'));
    }
  }, [isPlaying]);

  // Dispatch state updates for other components (e.g. BookReader's Sung Edition)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('media-player-state-update', {
      detail: {
        isPlaying,
        currentTime,
        duration,
        currentTrackIndex
      }
    }));
  }, [isPlaying, currentTime, duration, currentTrackIndex]);

  // Handle state sync requests
  useEffect(() => {
    const handleSyncRequest = () => {
      window.dispatchEvent(new CustomEvent('media-player-state-update', {
        detail: {
          isPlaying,
          currentTime,
          duration,
          currentTrackIndex
        }
      }));
    };
    window.addEventListener('media-player-request-state-sync', handleSyncRequest);
    return () => {
      window.removeEventListener('media-player-request-state-sync', handleSyncRequest);
    };
  }, [isPlaying, currentTime, duration, currentTrackIndex]);

  // Handle external control requests
  useEffect(() => {
    const handlePlayRequest = () => {
      const audio = audioRef.current;
      if (audio && !isPlaying) {
        audio.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(err => {
            console.error('Play request failed:', err);
            setIsPlaying(false);
          });
      }
    };

    const handlePauseRequest = () => {
      const audio = audioRef.current;
      if (audio && isPlaying) {
        audio.pause();
        setIsPlaying(false);
      }
    };

    const handleSeekRequest = (e) => {
      const audio = audioRef.current;
      if (audio && e.detail && typeof e.detail.time === 'number') {
        audio.currentTime = e.detail.time;
        setCurrentTime(e.detail.time);
      }
    };

    const handleSelectTrackRequest = (e) => {
      if (e.detail && typeof e.detail.index === 'number') {
        const nextIdx = e.detail.index;
        setCurrentTrackIndex(nextIdx);
        sessionStorage.setItem('media-player-track-index', String(nextIdx));
        setIsClosed(false);
        sessionStorage.setItem('media-player-closed', 'false');
        window.dispatchEvent(new CustomEvent('media-player-close-change', { detail: { isClosed: false } }));
        
        // If the track is already the selected one, manually play audio if paused
        const audio = audioRef.current;
        if (audio && currentTrackIndex === nextIdx && audio.paused) {
          audio.play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch(err => {
              console.error('Select track play failed:', err);
              setIsPlaying(false);
            });
        } else {
          setIsPlaying(true);
        }
      }
    };

    window.addEventListener('media-player-play-request', handlePlayRequest);
    window.addEventListener('media-player-pause-request', handlePauseRequest);
    window.addEventListener('media-player-seek-request', handleSeekRequest);
    window.addEventListener('media-player-select-track-request', handleSelectTrackRequest);

    return () => {
      window.removeEventListener('media-player-play-request', handlePlayRequest);
      window.removeEventListener('media-player-pause-request', handlePauseRequest);
      window.removeEventListener('media-player-seek-request', handleSeekRequest);
      window.removeEventListener('media-player-select-track-request', handleSelectTrackRequest);
    };
  }, [currentTrackIndex, isPlaying]);


  // Handle track source switching and play/pause synchronization
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const trackFile = currentTrack.file;
    const isTrackChanged = prevTrackRef.current !== trackFile;

    if (isTrackChanged) {
      prevTrackRef.current = trackFile;
      audio.load();
      // Reset progress states on load
      setAudioProgress(0);
      setCurrentTime(0);
      setDuration(0);
    }

    if (isPlaying) {
      if (isTrackChanged || audio.paused) {
        audio.play().catch((err) => {
          console.log('Audio play blocked/failed:', err);
          setIsPlaying(false);
        });
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [currentTrackIndex, isPlaying]);


  const handlePlayPause = (e) => {
    if (e) e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Audio play failed:', err);
          setIsPlaying(false);
        });
    }
  };

  const selectTrack = (index, e) => {
    e.stopPropagation();
    setCurrentTrackIndex(index);
    sessionStorage.setItem('media-player-track-index', String(index));
    setIsPlaying(true);
    setIsPlaylistOpen(false);
    
    // If the track is already the selected one, manually play audio if paused
    const audio = audioRef.current;
    if (audio && currentTrackIndex === index && audio.paused) {
      audio.play().catch(err => {
        console.error('Playlist play failed:', err);
        setIsPlaying(false);
      });
    }
  };

  const handleReset = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    if (!isPlaying) {
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Reset play failed:', err);
          setIsPlaying(false);
        });
    }
  };

  const handleMuteToggle = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleAudioProgressChange = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    setAudioProgress(e.target.value);
  };

  // Dragging event handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0 || e.target.closest('button') || e.target.closest('input') || e.target.closest('.playlist-item')) return;
    
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...position };
    
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.playlist-item')) return;
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
      const w = isMinimized ? 240 : 280;
      const h = isMinimized ? 52 : 390;
      
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

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isClosed || position.x === -1) return null;

  const cardStyle = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 9999,
  };

  return (
    <div 
      ref={playerRef}
      className={`media-player-card ${isMinimized ? 'minimized' : 'expanded'} ${isDragging ? 'dragging' : ''}`}
      style={cardStyle}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <audio
        ref={audioRef}
        src={currentTrack.file}
        preload="auto"
        onEnded={handleEnded}
        onTimeUpdate={updateAudioProgress}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={updateAudioProgress}
        onCanPlay={updateAudioProgress}
      />

      {isMinimized ? (
        // MINIMIZED MODE (Pill structure)
        <div className="mini-player-pill-content">
          <a 
            href={spotifyHref} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="mini-cover-link"
            title="Add to your Library"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mini-cover-thumb">
              <Image 
                src="/images/MarkTwainSpotifyCover.png" 
                alt="Cover Thumbnail" 
                width={36} 
                height={36}
                priority
                className="mini-thumb-img"
              />
            </div>
          </a>

          <div className="mini-text-info">
            <div className="mini-title typewriter">{currentTrack.title.replace("Mark Twain Reappears: ", "").replace(" Theme", "")}</div>
            <div className="mini-time typewriter" style={{ fontSize: '9px', opacity: 0.7 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="mini-action-controls">
            <a 
              href={spotifyHref} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mini-control-btn spotify-link-btn" 
              title="Add to your Library"
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <SpotifyIcon size={11} />
            </a>
            <button onClick={handlePlayPause} className="mini-control-btn play-btn" aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
            </button>
            <button onClick={handleMinimizeToggle} className="mini-control-btn" title="Expand Player">
              <Maximize2 size={10} />
            </button>
            <button onClick={handleClose} className="mini-control-btn close-btn" title="Close Player">
              <X size={10} />
            </button>
          </div>
          {/* Mini progress bar */}
          <div className="mini-progress" style={{ width: `${audioProgress}%`, height: '2px', background: 'var(--primary)', transition: 'width 0.2s', position: 'absolute', bottom: 0, left: 0 }} />
        </div>
      ) : (
        // EXPANDED MODE (Full player card)
        <div className="expanded-player-content">
          {/* Header Bar */}
          <div className="player-header">
            <span className="player-header-title typewriter">Twain Audio Desk</span>
            <div className="player-header-actions">
              <button onClick={handleMinimizeToggle} className="header-action-btn" title="Minimize Player">
                <Minimize2 size={10} />
              </button>
              <button onClick={handleClose} className="header-action-btn close-btn" title="Close Player">
                <X size={10} />
              </button>
            </div>
          </div>

          {/* Album Cover Art */}
          <a 
            href={spotifyHref} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="player-cover-link"
            title="Add to your Library"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="player-cover-art">
              <Image 
                src={currentTrack.cover || "/images/MarkTwainSpotifyCover.png"} 
                alt={currentTrack.title + " cover"} 
                width={264} 
                height={264}
                priority
                className="cover-img"
              />
              {isPlaying && (
                <div className="soundwave active">
                  <div className="soundwave-bar"></div>
                  <div className="soundwave-bar"></div>
                  <div className="soundwave-bar"></div>
                  <div className="soundwave-bar"></div>
                  <div className="soundwave-bar"></div>
                  <div className="soundwave-bar"></div>
                </div>
              )}
              {/* Spotify Icon Overlay on hover */}
              <div className="spotify-hover-overlay">
                <SpotifyIcon size={32} />
                <span className="typewriter">Add to your Library</span>
              </div>
            </div>
          </a>

          {/* Track Metadata */}
          <div className="player-metadata">
            <h4 className="track-title typewriter">{currentTrack.title}</h4>
            <span className="track-style">{currentTrack.style}</span>
          </div>

          {/* Progress Slider */}
          <div className="player-timeline">
            <input 
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={audioProgress}
              onChange={handleAudioProgressChange}
              className="player-audio-slider"
            />
            <div className="time-display typewriter">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="player-controls">
            <button onClick={(e) => setIsPlaylistOpen(!isPlaylistOpen)} className={`control-btn ${isPlaylistOpen ? 'active' : ''}`} title="Playlist">
              <ListMusic size={14} />
            </button>
            <button onClick={handleReset} className="control-btn" title="Restart">
              <RotateCcw size={14} />
            </button>
            <button onClick={handleMuteToggle} className="control-btn" title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <a 
              href={spotifyHref} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="control-btn spotify-link-btn" 
              title="Add to your Library"
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <SpotifyIcon size={14} />
            </a>
            <button onClick={handlePlayPause} className="play-pause-btn" aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: '1.5px' }} />}
            </button>
          </div>

          {/* Playlist Dropdown */}
          {isPlaylistOpen && (
            <div className="player-playlist-dropdown custom-scrollbar">
              {soundtrack.map((track, idx) => (
                <div
                  key={track.id}
                  onClick={(e) => selectTrack(idx, e)}
                  className={`playlist-item ${idx === currentTrackIndex ? 'active' : ''}`}
                >
                  <div className="playlist-item-meta">
                    <span className="playlist-item-title typewriter">{track.title}</span>
                    <span className="playlist-item-style">{track.style}</span>
                  </div>
                  {track.id === 'eves-diary' && (
                    <Link
                      href="/read/eves-diary"
                      onClick={(e) => e.stopPropagation()}
                      className="playlist-read-link"
                    >
                      Read
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
