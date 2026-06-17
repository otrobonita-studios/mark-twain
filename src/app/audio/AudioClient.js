'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
    desc: "A concise 17-minute discussion focusing on the Mark Reappears project as well as the upcoming novel."
  },
  long: {
    id: "long",
    title: "In-depth Book Focus",
    duration: "46 min",
    file: "/sounds/podcast/DebriefOfADeadLong.m4a",
    desc: "A comprehensive 46-minute exploration of the Mark Reappears project as well as the upcoming novel."
  },
  swedish: {
    id: "swedish",
    title: "Swedish Translation",
    duration: "30 min",
    file: "/sounds/podcast/DebriefOfADead-Swedish.m4a",
    desc: "A 30-minute discussion in Swedish, focusing on the Mark Reappears project, the tech used, as well as the upcoming novel."
  }
};

const TWAIN_SONGS_ORDER = ['mud-on-the-page', 'the-sequel', 'eves-diary', 'what-is-man', 'original-theme'];

export default function AudioClient({ initialFormat = 'short' }) {
  const router = useRouter();
  const [currentFormat, setCurrentFormat] = useState(initialFormat || 'short');
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [podcastProgress, setPodcastProgress] = useState(0);
  const [podcastCurrentTime, setPodcastCurrentTime] = useState(0);
  const [podcastDuration, setPodcastDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Sync format with URL route parameter
  useEffect(() => {
    if (initialFormat && PODCAST_FORMATS[initialFormat]) {
      setCurrentFormat(initialFormat);
    }
  }, [initialFormat]);

  const handleFormatChange = (formatId) => {
    setCurrentFormat(formatId);
    router.push(`/audio/${formatId}`);
  };

  const songsToDisplay = useMemo(() => {
    return TWAIN_SONGS_ORDER.map(id => {
      const track = soundtrack.find(t => t.id === id);
      const index = soundtrack.findIndex(t => t.id === id);
      return track ? { ...track, globalIndex: index } : null;
    }).filter(Boolean);
  }, []);

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
          </div>
        </div>

        {/* Custom Audio Visualizer Disk */}
        <div className="flex flex-col items-center justify-center h-full z-10 select-none pointer-events-none mt-16 lg:mt-32">
          <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-full flex items-center justify-center bg-[#1a140f] shadow-2xl overflow-hidden">
            {/* Spinning Outer Ring & Vinyl Lines */}
            <div 
              className={`absolute inset-0 rounded-full border-2 border-[var(--primary)] transition-all duration-1000 ${
                isPlayingPodcast || isPlayingGlobal ? 'animate-[spin_12s_linear_infinite] border-opacity-100 shadow-[0_0_25px_rgba(217,163,74,0.25)]' : 'border-opacity-30'
              }`}
            >
              <div className="absolute inset-2 rounded-full border border-dashed border-[rgba(217,163,74,0.25)]" />
              <div className="absolute inset-8 rounded-full border border-[rgba(217,163,74,0.1)] bg-[#15100c]" />
            </div>

            {/* Static Center Label */}
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


        {/* Page Title */}
        <header className="intro-section">
          <h1 className="desk-title">The Audio Desk</h1>
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
              Podcast: Debrief of a Dead
            </h2>
          </div>

          <div className="tactile-card rounded-lg p-5 flex flex-col gap-5">
            {/* Format Selection Tabs */}
            <div className="flex gap-2 border-b border-[rgba(255,244,223,0.08)] pb-3 overflow-x-auto">
              {Object.values(PODCAST_FORMATS).map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => {
                    handleFormatChange(fmt.id);
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Headphones size={16} className="text-[var(--primary)]" />
              <h2 className="font-sans font-semibold text-lg uppercase tracking-wider text-[var(--foreground)]">
                Soundtrack & Inspired Songs
              </h2>
            </div>
            <a
              href="https://open.spotify.com/playlist/2DutKyPGDlvUgnaeRuWgPa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-wider uppercase font-semibold border border-[#1DB954] hover:bg-[#1DB954] text-[#1DB954] hover:text-white transition-all rounded font-sans max-w-max shadow-md"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.377-1.454-5.37-1.783-8.892-1.007-.336.074-.67-.14-.744-.476-.074-.336.14-.67.476-.744 3.856-.88 7.15-.506 9.81 1.127.295.18.387.563.207.857c-.001-.001-.001-.001 0 0zm1.225-2.72c-.226.367-.707.487-1.074.26-2.722-1.672-6.87-2.157-10.082-1.182-.413.125-.847-.107-.972-.52-.125-.413.107-.847.52-.972 3.676-1.116 8.243-.574 11.348 1.33.367.227.487.708.26 1.074v.01zm.106-2.833c-.273.447-.858.594-1.306.32-3.178-1.89-8.412-2.083-11.454-1.16-.503.152-1.037-.134-1.189-.637-.152-.502.135-1.036.637-1.188 3.633-1.102 9.404-.888 13.084 1.3 448.272.274.595.858.32 1.306v-.002z" />
              </svg>
              Playlist on Spotify
            </a>
          </div>

          <div className="flex flex-col gap-3">
            {songsToDisplay.map((track) => {
              const isCurrentPlayingSong =
                globalPlayerState.isPlaying && globalPlayerState.currentTrackIndex === track.globalIndex;

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
                    Chat with Mark II
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)] font-sans">
                    Learn to know the main character talking directly to the digital recreation of Mark.
                  </span>
                </div>
                <Link
                  href="/"
                  className="btn-gold flex items-center justify-center gap-1 text-[10px] py-1 px-3 max-w-max"
                  style={{ textTransform: 'none', letterSpacing: 'normal' }}
                >
                  Open Chat
                </Link>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-[rgba(255,244,223,0.02)] border border-[rgba(255,244,223,0.05)] rounded">
                <div className="flex flex-col">
                  <span className="font-sans font-semibold text-xs text-[var(--foreground)]">
                    Image Lab & Restorations
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)] font-sans pr-2">
                    We use Flux2 and Nano Banana to give some images from the books a touch, had cameras been more easy to access.
                  </span>
                </div>
                <Link
                  href="/restoration"
                  className="btn-gold flex items-center justify-center gap-1 text-[10px] py-1 px-3 max-w-max"
                  style={{ textTransform: 'none', letterSpacing: 'normal' }}
                >
                  Open Image Lab
                  <ArrowRight size={10} />
                </Link>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-[rgba(255,244,223,0.02)] border border-[rgba(255,244,223,0.05)] rounded">
                <div className="flex flex-col">
                  <span className="font-sans font-semibold text-xs text-[var(--foreground)]">
                    GitHub Repo + Machine Learning API
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)] font-sans pr-2">
                    Explore the open-source embedding pipelines. Reach out for Qdrant Vector Embedding Access.
                  </span>
                </div>
                <a
                  href="https://github.com/otrobonita-studios/mark-twain"
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
              href="https://github.com/otrobonita-studios/mark-twain"
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
