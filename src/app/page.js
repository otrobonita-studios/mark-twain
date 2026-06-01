'use client';

/*
 * Copyright 2026 Otrobonita AI Labs (Jesper Karlsson)
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { db, isConfigured } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Mail, ShieldAlert, Award, PenTool, X, Volume2 } from 'lucide-react';
import UpcomingEpisodes from '@/components/UpcomingEpisodes';
import { deskCopy, subscribeCopy, diaryCopy, footerCopy } from '@/data/copy_i18n';

export default function Home() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('spectator'); // 'spectator' | 'thinker' | 'builder'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const [submitMessage, setSubmitMessage] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isMusicPlayerClosed, setIsMusicPlayerClosed] = useState(false);
  const [firebaseActive, setFirebaseActive] = useState(false);

  useEffect(() => {
    if (isConfigured && db) {
      setFirebaseActive(true);
    }

    const savedClosed = sessionStorage.getItem('media-player-closed');
    setIsMusicPlayerClosed(savedClosed !== null ? savedClosed === 'true' : true);

    const handleCloseChange = (e) => {
      setIsMusicPlayerClosed(e.detail.isClosed);
    };

    window.addEventListener('media-player-close-change', handleCloseChange);
    return () => {
      window.removeEventListener('media-player-close-change', handleCloseChange);
    };
  }, []);

  const handleReopenMusic = () => {
    window.dispatchEvent(new CustomEvent('media-player-open'));
  };

  const deskT = deskCopy.en;
  const subscribeT = subscribeCopy.en;
  const diaryT = diaryCopy.en;
  const footerT = footerCopy.en;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setSubmitStatus('error');
      setSubmitMessage(subscribeT.invalidEmail);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      if (firebaseActive) {
        // Save to Firestore
        await addDoc(collection(db, 'subscribers'), {
          email,
          role,
          timestamp: serverTimestamp(),
          lang: 'en'
        });
      } else {
        // Fallback to local storage
        const subs = JSON.parse(localStorage.getItem('mt_subscribers') || '[]');
        subs.push({ email, role, timestamp: new Date().toISOString(), lang: 'en' });
        localStorage.setItem('mt_subscribers', JSON.stringify(subs));
        console.log('Saved locally (Firebase not configured):', { email, role, lang: 'en' });
      }

      setSubmitStatus('success');
      if (role === 'builder') {
        setSubmitMessage(subscribeT.successBuilder);
      } else if (role === 'thinker') {
        setSubmitMessage(subscribeT.successThinker);
      } else {
        setSubmitMessage(subscribeT.successSpectator);
      }
      setEmail('');
    } catch (err) {
      console.error('Subscription error:', err);
      setSubmitStatus('error');
      setSubmitMessage(subscribeT.error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      </section>

      {/* RIGHT PANEL: Desk, Sign-up, Journal */}
      <main className="desk-panel">
        {/* Top Left Header */}
        <div className="desk-header-left">
          <PenTool size={14} className="desk-header-icon" />
          <span className="typewriter text-xs uppercase tracking-widest" style={{ marginRight: isMusicPlayerClosed ? '0.75rem' : '0' }}>
            {deskT.eyebrow}
          </span>
          {isMusicPlayerClosed && (
            <button 
              onClick={handleReopenMusic} 
              className="mini-reopen-music-btn" 
              title="Open Music Player"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0, display: 'flex', alignItems: 'center' }}
            >
              <Volume2 size={14} />
            </button>
          )}
        </div>

        {/* Upcoming Episodes Carousel */}
        <UpcomingEpisodes />

        {/* Intro Section */}
        <header className="intro-section">
          <h1 className="desk-title">
            {deskT.title}
          </h1>
          <p className="intro-quote">
            {deskT.quote}
          </p>
        </header>

        {/* Subscription / Newsletter Block */}
        <section className="subscribe-section">
          <div className="tactile-card subscribe-card">
            <h2 className="subscribe-title">
              {subscribeT.title}
            </h2>
            <p 
              className="typewriter text-xs mb-6"
              dangerouslySetInnerHTML={{ __html: subscribeT.subtext }}
            />

            <form onSubmit={handleSubmit} className="subscribe-form">
              {/* Role Selection */}
              <div className="role-toggle-group">
                <button
                  id="role-btn-spectator"
                  type="button"
                  onClick={() => setRole('spectator')}
                  className={`role-btn ${role === 'spectator' ? 'active' : ''}`}
                >
                  <span className="role-btn-title">{subscribeT.spectator}</span>
                  <span className="typewriter text-[9px] block mt-0.5">{subscribeT.spectatorSub}</span>
                </button>

                <button
                  id="role-btn-thinker"
                  type="button"
                  onClick={() => setRole('thinker')}
                  className={`role-btn ${role === 'thinker' ? 'active' : ''}`}
                >
                  <span className="role-btn-title">{subscribeT.thinker}</span>
                  <span className="typewriter text-[9px] block mt-0.5">{subscribeT.thinkerSub}</span>
                </button>

                <button
                  id="role-btn-builder"
                  type="button"
                  onClick={() => setRole('builder')}
                  className={`role-btn ${role === 'builder' ? 'active' : ''}`}
                >
                  <span className="role-btn-title">{subscribeT.builder}</span>
                  <span className="typewriter text-[9px] block mt-0.5">{subscribeT.builderSub}</span>
                </button>
              </div>

              {/* Email & Submit */}
              <div className="form-row">
                <input
                  id="subscribe-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={subscribeT.placeholder}
                  required
                  className="tactile-input email-input"
                />
                <button
                  id="subscribe-submit-button"
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold submit-btn"
                >
                  {isSubmitting ? subscribeT.submitting : subscribeT.btn}
                </button>
              </div>
            </form>

            {/* Notification messages */}
            {submitStatus === 'success' && (
              <div className="status-box status-success">
                <Award className="shrink-0" size={20} />
                <p className="typewriter text-xs leading-normal">
                  {submitMessage}
                </p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="status-box status-error">
                <ShieldAlert className="shrink-0" size={20} />
                <p className="typewriter text-xs leading-normal">
                  {submitMessage}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Diary Logs (The Diary of Mark) */}
        <section className="diary-section">
          <div className="diary-header">
            <h2 className="diary-title">
              {diaryT.title}
            </h2>
            <span className="diary-subtitle typewriter text-[10px] text-[var(--primary)] uppercase tracking-wider">
              {diaryT.subtitle}
            </span>
          </div>

          <div className="diary-list">
            {diaryT.entries.filter(entry => entry.id !== 2).map((entry) => (
              <article 
                key={entry.id} 
                className="tactile-card diary-card"
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="diary-meta">
                  <span className="typewriter text-[11px] text-[var(--primary)]">
                    {entry.date}
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
                <div className="modal-header">
                  <span className="typewriter modal-date">
                    {selectedEntry.date}
                  </span>
                  <h2 className="modal-title font-serif">
                    {selectedEntry.title}
                  </h2>
                  <div className="modal-divider" />
                </div>
                <div className="modal-body custom-scrollbar">
                  <p className="modal-text font-serif">
                    {selectedEntry.content}
                  </p>
                  <div className="modal-signature-wrapper">
                    <Image 
                      src="/images/mark-twain-signature.png" 
                      alt="Mark Twain Signature" 
                      width={250}
                      height={80}
                      className="modal-signature-img"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
