'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, Volume2, VolumeX, Headphones, ArrowRight, ExternalLink, Activity } from 'lucide-react';
import { soundtrack } from '@/data/soundtrack';
import { footerCopy } from '@/data/copy_i18n';

const PODCAST_FORMATS = {
  short: {
    id: "short",
    title: "Short & Tech-Focused",
    duration: "17 min",
    file: "/sounds/podcast/DebriefOfADead-Short.m4a",
    desc: "A concise 17-minute discussion focusing on the mechanics of digital resurrection, modern tech bubbles, and the boardroom logic of Stella Studios."
  },
  long: {
    id: "long",
    title: "In-depth Book Focus",
    duration: "41 min",
    file: "/sounds/podcast/DebriefOfADeadLong.m4a",
    desc: "A comprehensive 41-minute exploration of Mark Twain's bibliography, private letters, and the philosophical challenges of constructing a digital double."
  },
  swedish: {
    id: "swedish",
    title: "Swedish Translation",
    duration: "30 min",
    file: "/sounds/podcast/DebriefOfADead-Swedish.m4a",
    desc: "A 30-minute translation of the debrief for our Scandinavian correspondents (processed via a semi-good AI Swedish translation pipeline)."
  }
};

export default function AudioClient() {
  const [currentFormat, setCurrentFormat] = useState('short');
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [podcastProgress, setPodcastProgress] = useState(0);
  const [podcastCurrentTime, setPodcastCurrentTime] = useState(0);
  const [podcastDuration, setPodcastDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Global player state sync
  const [globalPlayerState, setGlobalPlayerState] = useState({
    isPlaying: false,
    currentTrackIndex: 0
  });

  const podcastAudioRef = useRef(null);
  const footerT = footerCopy.en;
  const currentFormatData = PODCAST_FORMATS[currentFormat];

  // Sync state with global MusicDesk
  useEffect(() => {
    const handleGlobalUpdate = (e) => {
      if (e.detail) {
        setGlobalPlayerState({
          isPlaying: e.detail.isPlaying,
          currentTrackIndex: e.detail.currentTrackIndex
        });
      }
    };

    // Request state sync from MusicDesk on mount
    window.dispatchEvent(new CustomEvent('media-player-request-state-sync'));

    window.addEventListener('media-player-state-update', handleGlobalUpdate);
    return () => {
      window.removeEventListener('media-player-state-update', handleGlobalUpdate);
    };
  }, []);

  // Listen to global MusicDesk play events to pause podcast
  useEffect(() => {
    const handleGlobalPlay = () => {
      if (isPlayingPodcast) {
        podcastAudioRef.current?.pause();
        setIsPlayingPodcast(false);
      }
    };

    window.addEventListener('media-player-play', handleGlobalPlay);
    return () => {
      window.removeEventListener('media-player-play', handleGlobalPlay);
    };
  }, [isPlayingPodcast]);

  // Adjust volume / muted state on local audio element
  useEffect(() => {
    const audio = podcastAudioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
      audio.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Set speed on local audio element
  useEffect(() => {
    const audio = podcastAudioRef.current;
    if (audio) {
      audio.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, currentFormat]);

  // Load new format file if selected
  useEffect(() => {
    const audio = podcastAudioRef.current;
    if (audio) {
      const wasPlaying = isPlayingPodcast;
      audio.load();
      if (wasPlaying) {
        audio.play()
          .then(() => {
            audio.playbackRate = playbackSpeed;
          })
          .catch((err) => {
            console.log('Podcast playback failed:', err);
            setIsPlayingPodcast(false);
          });
      } else {
        setPodcastProgress(0);
        setPodcastCurrentTime(0);
        setPodcastDuration(0);
      }
    }
  }, [currentFormat]);

  const handlePodcastPlayPause = () => {
    const audio = podcastAudioRef.current;
    if (!audio) return;

    if (isPlayingPodcast) {
      audio.pause();
      setIsPlayingPodcast(false);
    } else {
      // Pause global music desk before playing podcast
      window.dispatchEvent(new CustomEvent('media-player-pause-request'));

      audio.play()
        .then(() => {
          audio.playbackRate = playbackSpeed;
          setIsPlayingPodcast(true);
        })
        .catch((err) => {
          console.error('Podcast play error:', err);
          setIsPlayingPodcast(false);
        });
    }
  };

  const handlePodcastTimeUpdate = () => {
    const audio = podcastAudioRef.current;
    if (!audio) return;
    setPodcastCurrentTime(audio.currentTime);
    if (audio.duration && !isNaN(audio.duration)) {
      setPodcastDuration(audio.duration);
      setPodcastProgress((audio.currentTime / audio.duration) * 100);
    }
  };

  const handlePodcastLoadedMetadata = () => {
    const audio = podcastAudioRef.current;
    if (!audio) return;
    setPodcastDuration(audio.duration || 0);
  };

  const handlePodcastProgressChange = (e) => {
    const audio = podcastAudioRef.current;
    if (!audio || !podcastDuration) return;
    const newTime = (parseFloat(e.target.value) / 100) * podcastDuration;
    audio.currentTime = newTime;
    setPodcastCurrentTime(newTime);
    setPodcastProgress(e.target.value);
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (podcastAudioRef.current) {
      podcastAudioRef.current.playbackRate = speed;
    }
  };

  const handleSongPlay = (songId) => {
    // Pause podcast first
    if (isPlayingPodcast) {
      podcastAudioRef.current?.pause();
      setIsPlayingPodcast(false);
    }

    // Find the track index in the soundtrack database
    const idx = soundtrack.findIndex(t => t.id === songId);
    if (idx !== -1) {
      // Request global MusicDesk to play it
      window.dispatchEvent(new CustomEvent('media-player-select-track-request', {
        detail: { index: idx }
      }));
    }
  };

  const handleSongPause = () => {
    window.dispatchEvent(new CustomEvent('media-player-pause-request'));
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Check if any audio is active on this page for the visualizer
  const isPlayingGlobal = globalPlayerState.isPlaying;

  return (
    <div className="app-container">
      {/* LEFT PANEL: Media & Poster (Splash image, Logo & Custom visualizer) */}
      <section className="hero-panel">
        <div className="hero-bg-wrapper">
          <Image
            src="/images/mark-twain-reappears-poster.webp"
            alt="Mark Twain Reappears Poster"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 0vw"
            className="hero-bg-image-mobile"
          />
          <Image
            src="/images/mark-twain-reappears-square-poster.webp"
            alt="Mark Twain Reappears Poster (Square)"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 0vw"
            className="hero-bg-image-desktop"
          />
        </div>
        <div className="hero-overlay hero-overlay-visible" />

        {/* Top Logo */}
        <div className="logo-container">
          <div className="logo-mobile-only">
            <Image
              src="/images/MarkTwainSoloLogo.webp"
              alt="Mark Twain Logo"
              width={98}
              height={35}
              priority
              className="mark-twain-solo-logo"
            />
          </div>
          <div className="logo-desktop-only">
            <Image
              src="/images/MarkTwainnReappears.webp"
              alt="Mark Twain Reappears"
              width={400}
              height={150}
              priority
              className="logo-img"
            />
            <p className="logo-subtitle">The Open Source AI Project</p>
          </div>
        </div>

        {/* Custom Audio Visualizer Disk */}
        <div className="flex flex-col items-center justify-center h-full z-10 select-none pointer-events-none mt-16 lg:mt-32">
          <div 
            className={`relative w-40 h-40 md:w-56 md:h-56 rounded-full border-2 border-[var(--primary)] flex items-center justify-center overflow-hidden bg-[#1a140f] shadow-2xl transition-all duration-1000 ${
              isPlayingPodcast || isPlayingGlobal ? 'animate-[spin_12s_linear_infinite] border-opacity-100 shadow-[0_0_25px_rgba(217,163,74,0.25)]' : 'border-opacity-30'
            }`}
          >
            <div className="absolute inset-2 rounded-full border border-dashed border-[rgba(217,163,74,0.25)]" />
            <div className="absolute inset-8 rounded-full border border-[rgba(217,163,74,0.1)] bg-[#15100c]" />
            <div className="z-10 text-center">
              <span className="text-[9px] uppercase tracking-widest text-[var(--primary)] font-mono font-bold block">
                Audio Desk
              </span>
              <span className="text-[8px] text-[var(--muted-foreground)] font-mono block mt-0.5">
                {isPlayingPodcast ? "Podcast Active" : isPlayingGlobal ? "Music Active" : "Desk Standby"}
              </span>
            </div>
          </div>

          {/* Equalizer Bars */}
          <div className="flex items-end gap-1 h-8 mt-6">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className="w-0.5 bg-[var(--primary)] rounded-full transition-all duration-300"
                style={{
                  height: (isPlayingPodcast || isPlayingGlobal) ? `${Math.floor(Math.random() * 24) + 4}px` : '3px',
                  animation: (isPlayingPodcast || isPlayingGlobal) ? `bounce 0.8s ease-in-out infinite alternate` : 'none',
                  animationDelay: `${idx * 0.07}s`,
                  transformOrigin: 'bottom'
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* RIGHT PANEL: Audio Players & Links */}
      <main className="desk-panel">
        {/* Top Left Header */}
        <div className="desk-header-left">
          <Headphones size={14} className="desk-header-icon" />
          <span className="typewriter text-xs uppercase tracking-widest">
            Samuel Clemens' Audio Desk
          </span>
        </div>

        {/* Page Title */}
        <header className="intro-section">
          <h1 className="desk-title">The Recorded Voice</h1>
          <p className="intro-quote">
            "A man's voice is the index of his soul. If we can capture its rhythm, we can capture the shadow of his memory."
          </p>
        </header>

        {/* local audio tag for podcast */}
        <audio
          ref={podcastAudioRef}
          src={currentFormatData.file}
          preload="none"
          onTimeUpdate={handlePodcastTimeUpdate}
          onLoadedMetadata={handlePodcastLoadedMetadata}
          onEnded={() => setIsPlayingPodcast(false)}
        />

        {/* 1. PODCAST PLAYER SECTION */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-[var(--primary)]" />
            <h2 className="font-sans font-semibold text-lg uppercase tracking-wider text-[var(--foreground)]">
              Podcast: Debrief of a Dead Man
            </h2>
          </div>

          <div className="tactile-card rounded-lg p-5 flex flex-col gap-5">
            {/* Format Selection Tabs */}
            <div className="flex gap-2 border-b border-[rgba(255,244,223,0.08)] pb-3 overflow-x-auto">
              {Object.values(PODCAST_FORMATS).map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => {
                    setCurrentFormat(fmt.id);
                  }}
                  className={`px-3 py-1.5 font-sans text-xs uppercase tracking-wider transition-all border whitespace-nowrap ${
                    currentFormat === fmt.id
                      ? 'border-[var(--primary)] bg-[rgba(217,163,74,0.08)] text-[var(--primary)]'
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-white'
                  }`}
                >
                  {fmt.title} ({fmt.duration})
                </button>
              ))}
            </div>

            {/* Selected Format Description */}
            <div>
              <p className="text-xs text-[var(--muted-foreground)] italic leading-relaxed font-sans m-0">
                {currentFormatData.desc}
              </p>
            </div>

            {/* Audio Control Desk */}
            <div className="flex flex-col gap-4 bg-[rgba(255,244,223,0.02)] p-4 border border-[rgba(255,244,223,0.04)] rounded-md">
              {/* Play / Progress / Time Display */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePodcastPlayPause}
                  className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-black hover:bg-[var(--primary-hover)] transition-all shrink-0 shadow-lg cursor-pointer"
                  aria-label={isPlayingPodcast ? "Pause Podcast" : "Play Podcast"}
                >
                  {isPlayingPodcast ? (
                    <Pause size={18} fill="currentColor" />
                  ) : (
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  )}
                </button>

                <div className="flex-grow flex flex-col gap-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={podcastProgress}
                    onChange={handlePodcastProgressChange}
                    className="player-audio-slider w-full"
                  />
                  <div className="flex justify-between items-center text-[10px] font-mono text-[var(--muted-foreground)]">
                    <span>{formatTime(podcastCurrentTime)}</span>
                    <span>{formatTime(podcastDuration)}</span>
                  </div>
                </div>
              </div>

              {/* Volume & Speed Controls */}
              <div className="flex flex-wrap justify-between items-center gap-4 border-t border-[rgba(255,244,223,0.06)] pt-3">
                {/* Volume slider */}
                <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="hover:text-[var(--primary)] transition-colors"
                  >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      setIsMuted(false);
                    }}
                    className="w-16 h-1 bg-[rgba(255,244,223,0.15)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                  />
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-widest text-[var(--muted-foreground)] font-mono">
                    Speed:
                  </span>
                  {[1.0, 1.25, 1.5, 2.0].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      className={`px-2 py-0.5 rounded font-mono text-[9px] border transition-all ${
                        playbackSpeed === speed
                          ? 'border-[var(--primary)] text-[var(--primary)] bg-[rgba(217,163,74,0.05)] font-bold'
                          : 'border-[rgba(255,244,223,0.1)] text-[var(--muted-foreground)] hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. SONGS SECTION */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Headphones size={16} className="text-[var(--primary)]" />
            <h2 className="font-sans font-semibold text-lg uppercase tracking-wider text-[var(--foreground)]">
              Soundtrack & Inspired Songs
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {soundtrack.map((track, index) => {
              const isCurrentPlayingSong =
                globalPlayerState.isPlaying && globalPlayerState.currentTrackIndex === index;

              return (
                <div
                  key={track.id}
                  className={`tactile-card rounded-lg p-4 flex items-center justify-between transition-all ${
                    isCurrentPlayingSong
                      ? 'border-[var(--primary)] bg-[rgba(217,163,74,0.03)]'
                      : 'hover:border-[rgba(255,244,223,0.2)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Tiny Play/Pause button */}
                    <button
                      onClick={() =>
                        isCurrentPlayingSong ? handleSongPause() : handleSongPlay(track.id)
                      }
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        isCurrentPlayingSong
                          ? 'border-[var(--primary)] text-[var(--primary)] bg-[rgba(217,163,74,0.1)]'
                          : 'border-[rgba(255,244,223,0.15)] text-[var(--muted-foreground)] hover:text-white hover:border-white'
                      }`}
                    >
                      {isCurrentPlayingSong ? (
                        <Pause size={12} fill="currentColor" />
                      ) : (
                        <Play size={12} fill="currentColor" className="ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0 flex flex-col">
                      <span className="font-sans font-semibold text-sm text-[var(--foreground)] truncate">
                        {track.title}
                      </span>
                      <span className="font-mono text-[9px] text-[var(--muted-foreground)]">
                        {track.style}
                      </span>
                    </div>
                  </div>

                  {/* Right side playing status indicator */}
                  {isCurrentPlayingSong && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[8px] uppercase tracking-widest text-[var(--primary)] font-mono font-bold animate-pulse">
                        Playing
                      </span>
                      <div className="flex items-end gap-0.5 h-3">
                        <div className="w-0.5 bg-[var(--primary)] h-full animate-[bounce_0.6s_ease-in-out_infinite_alternate]" />
                        <div className="w-0.5 bg-[var(--primary)] h-1/2 animate-[bounce_0.8s_ease-in-out_infinite_alternate_0.2s]" />
                        <div className="w-0.5 bg-[var(--primary)] h-3/4 animate-[bounce_0.5s_ease-in-out_infinite_alternate_0.1s]" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. RESOURCE LINKS SECTION */}
        <section className="mb-6">
          <div className="tactile-card rounded-lg p-5 border border-[rgba(217,163,74,0.2)] bg-[rgba(217,163,74,0.02)]">
            <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-[var(--primary)] mb-3">
              Developer Resources & System Access
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-[rgba(255,244,223,0.02)] border border-[rgba(255,244,223,0.05)] rounded">
                <div className="flex flex-col">
                  <span className="font-sans font-semibold text-xs text-[var(--foreground)]">
                    Interactive Dialogue System
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)] font-sans">
                    Have an on-demand conversation with the digital recreation of Mark.
                  </span>
                </div>
                <Link
                  href="/"
                  className="btn-gold flex items-center justify-center gap-1 text-[10px] py-1 px-3 max-w-max"
                  style={{ textTransform: 'none', letterSpacing: 'normal' }}
                >
                  Open Chat
                  <ArrowRight size={10} />
                </Link>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-[rgba(255,244,223,0.02)] border border-[rgba(255,244,223,0.05)] rounded">
                <div className="flex flex-col">
                  <span className="font-sans font-semibold text-xs text-[var(--foreground)]">
                    Chat + Diary + Machine Learning API
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)] font-sans pr-2">
                    Explore the open-source embedding pipelines. Reach out for Qdrant Vector Embedding Access.
                  </span>
                </div>
                <a
                  href="https://github.com/fltman/aimusicvideo.git"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline flex items-center justify-center gap-1 text-[10px] py-1 px-3 max-w-max border-[rgba(255,244,223,0.15)] text-[var(--muted-foreground)] hover:text-white"
                  style={{ textTransform: 'none', letterSpacing: 'normal' }}
                >
                  View Code
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="desk-footer">
          <p className="footer-text">{footerT.trademark}</p>
          <div className="footer-links">
            <a
              href="https://github.com/fltman/aimusicvideo.git"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="footer-link-icon"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              GitHub
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
