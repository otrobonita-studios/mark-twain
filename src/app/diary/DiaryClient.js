'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { diaryCopy, footerCopy } from '@/data/copy_i18n';

export default function DiaryClient() {
  const [selectedEntry, setSelectedEntry] = useState(null);

  const diaryT = diaryCopy.en;
  const footerT = footerCopy.en;

  const combinedEntries = useMemo(() => {
    const staticList = diaryT.entries || [];
    return [...staticList].sort((a, b) => {
      const idA = typeof a.id === 'number' ? a.id : Number(a.id) || 0;
      const idB = typeof b.id === 'number' ? b.id : Number(b.id) || 0;
      return idB - idA;
    });
  }, [diaryT.entries]);

  return (
    <div className="app-container">
      {/* LEFT PANEL: Media & Poster (Splash image, Logo) */}
      <section className="hero-panel">
        <div className="hero-bg-wrapper">
          {/* Mobile Background Image (Landscape) */}
          <Image
            src="/images/mark-twain-reappears-poster.webp"
            alt="Mark Twain Reappears Poster"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 0vw"
            className="hero-bg-image-mobile"
          />
          {/* Desktop Background Image (Square) */}
          <Image
            src="/images/mark-twain-reappears-square-poster.webp"
            alt="Mark Twain Reappears Poster (Square)"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 0vw"
            className="hero-bg-image-desktop"
          />
        </div>
        {/* Visual Overlay */}
        <div className="hero-overlay" />

        {/* Top: Logo */}
        <div className="logo-container">
          {/* Mobile Logo */}
          <div className="logo-mobile-only">
            <Image
              src="/images/MarkTwainSoloLogo.webp"
              alt="Mark Twain Logo"
              width={98}
              height={35}
              priority
              className="mark-twain-solo-logo"
              style={{ color: 'transparent' }}
            />
          </div>
          {/* Desktop Logo */}
          <div className="logo-desktop-only">
            <Image
              src="/images/MarkTwainnReappears.webp"
              alt="Mark Twain Reappears"
              width={400}
              height={150}
              priority
              className="logo-img"
            />
            <p className="logo-subtitle">
              The Open Source AI Project
            </p>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL: Desk, Journal */}
      <main className="desk-panel">


        {/* Diary Logs (The Diary of Mark) */}
        <section className="diary-section" style={{ marginTop: '2.5rem' }}>
          <div className="diary-header">
            <h2 className="diary-title">
              {diaryT.title}
            </h2>

          </div>

          <div className="diary-list">
            {combinedEntries.filter(entry => entry.id !== 2).map((entry) => (
              <article
                key={entry.id}
                className="tactile-card diary-card"
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="diary-meta">
                  <span className="typewriter text-[11px] text-[var(--primary)] flex items-center gap-1.5">
                    {entry.date}
                    {entry.audioIndex !== undefined && (
                      <span className="inline-flex items-center text-[9px] px-1 py-0.5 rounded bg-[rgba(217,163,74,0.15)] text-[var(--primary)] uppercase tracking-widest font-sans font-bold">
                        Audio
                      </span>
                    )}
                  </span>
                  <span className="typewriter text-[9px] text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                    {diaryT.read}
                  </span>
                </div>
                <h3 className="diary-entry-title">
                  {entry.title}
                </h3>
                <p className="diary-entry-content collapsed">
                  {entry.content}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="desk-footer">
          <p className="footer-text">
            {footerT.trademark}
          </p>
          <div className="footer-links">
            <a
              href="https://github.com/otrobonita-studios/mark-twain.git"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="footer-link-icon">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              GitHub
            </a>
          </div>
        </footer>
      </main>

      {/* DIARY ENTRY MODAL */}
      <AnimatePresence>
        {selectedEntry && (
          <div className="modal-backdrop-wrapper">
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEntry(null)}
            />
            <motion.div
              className="modal-container"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            >
              <div className="modal-content tactile-card">
                <button
                  className="modal-close-btn"
                  onClick={() => setSelectedEntry(null)}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
                <div className="modal-body custom-scrollbar">
                  <div className="modal-header">
                    <span className="typewriter modal-date">
                      {selectedEntry.date}
                    </span>
                    <h2 className="modal-title font-sans">
                      {selectedEntry.title}
                    </h2>
                    <div className="modal-divider" />
                  </div>
                  <p className="modal-text font-sans">
                    {selectedEntry.content}
                    <Image
                      src="/images/mark-twain-signature.webp"
                      alt="Mark Twain Signature"
                      width={3848}
                      height={755}
                      className="modal-signature-img block"
                      style={{ display: 'block', width: '220px', height: 'auto', marginTop: '25px', marginBottom: '25px' }}
                    />
                  </p>

                  {selectedEntry.image && (
                    <div className="modal-rich-media my-6 flex flex-col items-center">
                      <div className="relative w-full max-w-md aspect-[4/3] rounded-lg overflow-hidden">
                        <Image
                          src={selectedEntry.image}
                          alt={selectedEntry.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {selectedEntry.postscript && (
                        <p className="modal-text font-sans mt-4 text-center italic opacity-90 max-w-md text-[var(--primary)]">
                          {selectedEntry.postscript}
                        </p>
                      )}
                    </div>
                  )}

                  {(selectedEntry.spotifyUrl || selectedEntry.audioIndex !== undefined) && (
                    <div className="modal-audio-controls flex flex-wrap gap-4 justify-center items-center my-6 p-4">
                      {selectedEntry.audioIndex !== undefined && (
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('media-player-select-track-request', {
                              detail: { index: selectedEntry.audioIndex }
                            }));
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded bg-[var(--primary)] text-black hover:bg-[var(--primary-hover)] transition-all font-sans font-semibold text-xs tracking-wider uppercase shadow-md cursor-pointer"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="shrink-0">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          Listen on Twain Audio Desk
                        </button>
                      )}

                      {selectedEntry.spotifyUrl && (
                        <a
                          href={selectedEntry.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 rounded bg-[#1DB954] text-white hover:bg-[#1ed760] transition-all font-sans font-semibold text-xs tracking-wider uppercase shadow-md"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" className="shrink-0" fill="currentColor">
                            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.377-1.454-5.37-1.783-8.892-1.007-.336.074-.67-.14-.744-.476-.074-.336.14-.67.476-.744 3.856-.88 7.15-.506 9.81 1.127.295.18.387.563.207.857c-.001-.001-.001-.001 0 0zm1.225-2.72c-.226.367-.707.487-1.074.26-2.722-1.672-6.87-2.157-10.082-1.182-.413.125-.847-.107-.972-.52-.125-.413.107-.847.52-.972 3.676-1.116 8.243-.574 11.348 1.33.367.227.487.708.26 1.074v.01zm.106-2.833c-.273.447-.858.594-1.306.32-3.178-1.89-8.412-2.083-11.454-1.16-.503.152-1.037-.134-1.189-.637-.152-.502.135-1.036.637-1.188 3.633-1.102 9.404-.888 13.084 1.3 448.272.274.595.858.32 1.306v-.002z" />
                          </svg>
                          Listen on Spotify
                        </a>
                      )}
                    </div>
                  )}

                  {selectedEntry.slug && (
                    <div className="flex justify-start items-center mt-6 pt-4 border-t border-[rgba(217,163,74,0.1)]">
                      <Link
                        href={`/diary/${selectedEntry.slug}`}
                        className="font-mono text-[10px] uppercase tracking-widest text-[var(--primary)] hover:text-white transition-all flex items-center gap-1.5"
                      >
                        🔗 Share / Full Page
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
