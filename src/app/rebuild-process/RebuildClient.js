'use client';

import Image from 'next/image';
import { PenTool } from 'lucide-react';
import UpcomingEpisodes from '@/components/UpcomingEpisodes';
import { deskCopy, footerCopy } from '@/data/copy_i18n';

export default function RebuildClient() {

  const deskT = deskCopy.en;
  const footerT = footerCopy.en;

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
        </header>

        {/* Subscription / Newsletter Block */}
        {/* Behind the scenes. This was a "Learn more" modal; it is running text now. */}
        <section className="corpus-section">
          <div className="tactile-card" style={{ padding: '1.75rem' }}>
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
              Once the corpus is on disk, getting it into a vector database (Qdrant here) is a
              separate problem with separate failure modes. Embedding is CPU-bound and local;
              uploading is network-bound and cloud. Mixing them in one script means one timeout
              kills both. So the pipeline is two scripts, and the file between them is the
              contract:
            </p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
              <li style={{ marginBottom: '0.25rem' }}><code>embed_corpus.py</code> — pure local. Chunks each text into 200-word, paragraph-aligned pieces with one paragraph of overlap, embeds each chunk with <code>BAAI/bge-m3</code> (1024 dimensions), and writes <code>vectors.jsonl</code>, one JSON line per chunk.</li>
              <li style={{ marginBottom: '0.25rem' }}><code>stream_to_qdrant.py</code> — pure network. Reads that file, upserts in batches of 50, pauses briefly between batches and backs off exponentially on failure.</li>
            </ul>
            <p style={{ marginBottom: '1rem' }}>
              The throttle is not politeness for its own sake. A managed Qdrant cluster will start
              refusing writes if you hammer it without pause, and the failure looks like a network
              problem rather than a rate limit — a lesson imported from an earlier project rather
              than learned twice.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              Chunk IDs are a deterministic UUID5 of <code>filename:chunk_index</code>, so re-running
              either phase overwrites the same vectors instead of creating duplicates. Both phases
              track completed files in a state file: crash, restart, continue.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              Each chunk carries <code>source</code>, <code>work</code> and <code>type</code> alongside
              its filename and index, so retrieval can be filtered — the books alone, or only the
              biographical material — rather than searching one undifferentiated pile.
            </p>

            <h4 className="text-[var(--primary)] text-base mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>What Went Wrong, And Why It Matters</h4>
            <p style={{ marginBottom: '1rem' }}>
              The first corpus was quietly contaminated. An hourly job crawled news feeds into the
              same directory the embedder swept with a recursive glob, so the vector store filled up
              with technology journalism that had nothing to do with Twain. Retrieval still returned
              results. They were simply the wrong ones, and nothing in the system complained.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              That is the failure mode worth naming: a RAG system does not break loudly when its
              corpus is wrong. It answers confidently from whatever it was given. The rebuild
              replaced the recursive sweep with an explicit source list — the crawled feeds are not
              in it, and cannot wander back in.
            </p>

            <h4 className="text-[var(--primary)] text-base mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Measuring It: Evals and an LLM Judge</h4>
            <p style={{ marginBottom: '1rem' }}>
              A corpus you cannot measure is a corpus you are guessing about. The evaluation harness
              runs a fixed set of questions against the live API — retrieval questions with known
              answers, synthesis questions spanning several works, and questions the corpus should
              honestly refuse, because knowing what it does <em>not</em> know is part of the job.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              Scoring is done by a second model reading each answer against a written rubric, run
              locally so that hundreds of rounds cost nothing but time. The judge runs at
              temperature zero: a verdict should follow from the rubric, and randomness there adds
              noise rather than insight. The questions and their expected answers live in the
              repository, so a run is reproducible and a regression is visible rather than felt.
            </p>

            <h4 className="text-[var(--primary)] text-base mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>The Numbers</h4>
            <ul style={{ listStyleType: 'circle', paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
              <li style={{ marginBottom: '0.25rem' }}>214 source files, after the three sources are deduplicated</li>
              <li style={{ marginBottom: '0.25rem' }}>~37,100 chunks at 200 words each, with paragraph overlap</li>
              <li style={{ marginBottom: '0.25rem' }}>1024 dimensions per vector, <code>BAAI/bge-m3</code></li>
              <li style={{ marginBottom: '0.25rem' }}>Roughly an hour to embed; minutes to upload</li>
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

    </div>
  );
}
