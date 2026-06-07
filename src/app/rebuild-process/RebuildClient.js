'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { db, isConfigured } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Mail, ShieldAlert, Award, PenTool, X } from 'lucide-react';
import UpcomingEpisodes from '@/components/UpcomingEpisodes';
import { deskCopy, subscribeCopy, footerCopy } from '@/data/copy_i18n';

export default function RebuildClient() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('spectator'); // 'spectator' | 'thinker' | 'builder'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const [submitMessage, setSubmitMessage] = useState('');
  const [firebaseActive, setFirebaseActive] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  useEffect(() => {
    if (isConfigured && db) {
      setFirebaseActive(true);
    }
  }, []);

  const deskT = deskCopy.en;
  const subscribeT = subscribeCopy.en;
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

      {/* RIGHT PANEL: Desk, Sign-up, Journal */}
      <main className="desk-panel">
        {/* Top Left Header */}
        <div className="desk-header-left">
          <PenTool size={14} className="desk-header-icon" />
          <span className="typewriter text-xs uppercase tracking-widest">
            {deskT.eyebrow}
          </span>
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
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => setShowLearnMore(true)}
              className="btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            >
              Learn more
            </button>
          </div>
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

      {/* BEHIND THE SCENES MODAL / LEARN MORE */}
      <AnimatePresence>
        {showLearnMore && (
          <div className="modal-backdrop-wrapper" style={{ zIndex: 2100 }}>
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLearnMore(false)}
            />
            <motion.div
              className="modal-container"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              style={{ maxWidth: '800px', width: '90%' }}
            >
              <div className="modal-content tactile-card">
                <button 
                  className="modal-close-btn" 
                  onClick={() => setShowLearnMore(false)}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
                <div className="modal-body custom-scrollbar" style={{ marginTop: '1rem', maxHeight: '75vh', overflowY: 'auto' }}>
                  <h2 className="text-2xl text-[var(--primary)] mb-1">Building a Mark Twain Corpus</h2>
                  <h3 className="typewriter text-xs text-white mb-4 uppercase tracking-widest">RAG: Read And Guess-less</h3>
                  <div className="modal-divider mb-6" />

                  <div className="typewriter text-xs text-[var(--muted-foreground)] mb-6" style={{ fontStyle: 'italic' }}>
                    "Get your facts first, and then you can distort them as much as you please." – Mark Twain
                  </div>

                  <div className="space-y-4 text-sm leading-relaxed" style={{ fontSize: '0.92rem', color: 'rgba(255, 244, 223, 0.85)' }}>
                    <p style={{ marginBottom: '1rem' }}>
                      The hardest thing to understand about RAG might be the actual acronym: <strong>Retrieval Augmented (= enhanced) Generation</strong>. 
                      In practice, when you ask the model a question, it first reads topic-specific data from an added database, 
                      then generates an answer augmented (enhanced) by what it just read — so the response is less of a guessing game.
                    </p>
                    <p style={{ marginBottom: '1.5rem' }}>
                      The word "corpus" — Latin for "body" — is what scholars call an author's body of writing. 
                      Twain's corpus is everything by him and about him. By embedding it into a vector database, 
                      we turn that body of texts into a searchable memory the AI can consult before speaking. 
                      The body becomes the brain.
                    </p>
                    
                    <h4 className="text-[var(--primary)] text-base mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>The Goal</h4>
                    <p style={{ marginBottom: '1rem' }}>
                      Build a corpus of public-domain material by and about Mark Twain — substantial enough and clean enough 
                      to feed into a Retrieval-Augmented Generation (RAG) system. The corpus needed to be:
                    </p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                      <li style={{ marginBottom: '0.25rem' }}><strong>Diverse:</strong> Different kinds of sources, not just one.</li>
                      <li style={{ marginBottom: '0.25rem' }}><strong>Well-attributed:</strong> Every chunk traceable back to its origin.</li>
                      <li style={{ marginBottom: '0.25rem' }}><strong>Reproducible:</strong> The build pipeline itself should be runnable from scratch by anyone.</li>
                    </ul>

                    <h4 className="text-[var(--primary)] text-base mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>The Three Sources</h4>
                    <p style={{ marginBottom: '1rem' }}>
                      Each holds Twain-related material, but each uses a different access pattern. That diversity is part of the lesson: 
                      in any real corpus-building project, the sources don't conform to one shape.
                    </p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                      <li style={{ marginBottom: '0.75rem' }}>
                        <strong>Standard Digital Library:</strong> The canonical English-language editions of Twain's works (the novels, the autobiography, the seven-volume Letters, the speeches, the essays). About 50 works, ~20 MB. We started from a curated index page that organizes Twain's output into a clean bibliography. The same script also handles "subject" pages, which is how you find works about a person rather than by them.
                      </li>
                      <li style={{ marginBottom: '0.75rem' }}>
                        <strong>Wikisource:</strong> Human-transcribed (not OCR'd) public-domain texts. Smaller volume, very clean. For "works about Twain", Wikisource doesn't use a category — instead, the author page has a hand-curated "Works about Twain" section. The script reads that section via the MediaWiki API and downloads each linked page: encyclopedia entries from the 1911 Britannica, 1879 American Cyclopædia, Collier's, Appletons'; biographical sketches; obituaries from the New York Times and the San Francisco Call.
                      </li>
                      <li style={{ marginBottom: '0.75rem' }}>
                        <strong>Internet Archive:</strong> Broad, mid-quality OCR of pre-1929 books and monographs. We queried by subject + date range, capped at 200 items to keep volume sane, and let the internetarchive Python library handle the actual downloads. This is where the early 20th-century biographies live — Paine, Howells, contemporary scholarship.
                      </li>
                    </ul>
                    <p className="italic text-[var(--muted-foreground)]" style={{ fontStyle: 'italic', marginBottom: '1.5rem', color: 'var(--muted-foreground)' }}>
                      (Notably absent: Chronicling America at the Library of Congress, which would have given historic newspaper coverage. The script existed but failed at run time — see "Lessons" below.)
                    </p>

                    <h4 className="text-[var(--primary)] text-base mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>The Architecture</h4>
                    <p style={{ marginBottom: '1rem' }}>
                      Each of those sources got its own downloader, but they all produce output in the same shared shape: one HTML file (or plain text, for sources without HTML) + a <code>.txt</code> sidecar + a <code>.meta.json</code> sidecar following a common schema (id, source, source_url, title, author, date, category, file, text_file, bytes_text, fetched_at). A downstream aggregator walks the corpus directory, finds every <code>.meta.json</code>, and produces one unified <code>corpus.json</code> index.
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                      <strong>The benefit:</strong> The RAG ingester doesn't need to know that source A used MediaWiki and source B used a custom library. It just iterates one schema. Adding a fourth source later (Chronicling America once the API stabilizes; HathiTrust; the Mark Twain Project at Berkeley) means writing a fourth downloader that emits the same sidecar shape — no plumbing changes downstream.
                    </p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                      <li style={{ marginBottom: '0.25rem' }}><strong>Polite by default:</strong> Every script identifies itself with a User-Agent that includes contact info, paces requests with a configurable delay (1–1.5 s default), backs off exponentially on 429/503, and respects rate limits.</li>
                      <li style={{ marginBottom: '0.25rem' }}><strong>Resumable everywhere:</strong> Each script writes a small state file as it works. Crash mid-run, restart, pick up where you left off.</li>
                      <li style={{ marginBottom: '0.25rem' }}><strong>Idempotent:</strong> Chunk IDs in the embedding phase are deterministic (UUID5 of filename:chunk_index), so re-running any phase overwrites the same vectors rather than creating duplicates.</li>
                    </ul>

                    <h4 className="text-[var(--primary)] text-base mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>The Two-Phase Ingestion</h4>
                    <p style={{ marginBottom: '1rem' }}>
                      Once the corpus is on disk, getting it into a vector database (Qdrant in this case) is a separate problem with separate failure modes. Embedding is CPU-bound and local; uploading is network-bound and cloud. Mixing them in one script means one timeout kills both.
                    </p>
                    <p style={{ marginBottom: '1rem' }}>So we split into two scripts:</p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                      <li style={{ marginBottom: '0.25rem' }}><code>embed_corpus.py</code> — pure local. Chunks each text into 500-word pieces, embeds each chunk via a sentence-transformer model, writes <code>vectors.jsonl</code> (one JSON line per chunk).</li>
                      <li style={{ marginBottom: '0.25rem' }}><code>upload_vectors.py</code> — pure network. Reads <code>vectors.jsonl</code>, batches into 250-vector upserts, pushes to Qdrant with retries.</li>
                    </ul>

                    <h4 className="text-[var(--primary)] text-base mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>The Numbers</h4>
                    <ul style={{ listStyleType: 'circle', paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                      <li style={{ marginBottom: '0.25rem' }}>~189 source files in the corpus (after PG + Wikisource + IA, deduped)</li>
                      <li style={{ marginBottom: '0.25rem' }}>~50 books from PG canon (~20 MB), ~30 Wikisource pages, ~100–200 IA items</li>
                      <li style={{ marginBottom: '0.25rem' }}>~18,000 expected chunks at 500 words each</li>
                      <li style={{ marginBottom: '0.25rem' }}>~300 MB of vectors at typical embedding dimensions</li>
                      <li style={{ marginBottom: '0.25rem' }}>Total pipeline runtime: hours for embedding, minutes for upload</li>
                    </ul>

                    <h4 className="text-[var(--primary)] text-base mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Lessons Learned</h4>
                    <ul style={{ listStyleType: 'decimal', paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                      <li style={{ marginBottom: '0.5rem' }}><strong>APIs decay — and your pipeline needs to notice.</strong> Halfway through the project the Library of Congress migrated Chronicling America (August 2025); the old endpoint just 404s now. Swapping in new APIs should be cheap.</li>
                      <li style={{ marginBottom: '0.5rem' }}><strong>Conventions vary by source.</strong> Generalizing requires building source-by-source, not designing one ideal abstraction up front.</li>
                      <li style={{ marginBottom: '0.5rem' }}><strong>Heuristics misfire.</strong> Auto-categorization on heterogeneous documents always has edge cases, and your code needs hooks for fixing them after the fact.</li>
                      <li style={{ marginBottom: '0.5rem' }}><strong>Separate concerns aggressively.</strong> The split between download, embedding, and uploading saved hours of re-running in case of failures.</li>
                      <li style={{ marginBottom: '0.5rem' }}><strong>Open-source-friendly defaults.</strong> Environment-driven configurations make repository code highly portable and secure.</li>
                    </ul>
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
