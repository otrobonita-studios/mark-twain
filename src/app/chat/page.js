'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Send, Sparkles, BookOpen, ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({}); // { [messageIndex]: boolean }
  const [conversationStyle, setConversationStyle] = useState('brief'); // 'brief' | 'in-depth'
  const [conversationTone, setConversationTone] = useState('playful'); // 'playful' | 'critical'
  const [showNotesModal, setShowNotesModal] = useState(false);
  
  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    "Hey Mark, throw me your favorite quotes",
    "How deep is deep",
    "Why did you write Eve's Diary, and how do you view it?",
    "Has the human race made any moral progress?"
  ];

  // Scroll to bottom whenever messages list changes or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput('');

    // Append user message
    const updatedMessages = [...messages, { role: 'user', content: text }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          style: conversationStyle,
          tone: conversationTone,
          // Extract only role and content for API history seed
          history: messages.map(msg => ({ role: msg.role, content: msg.content }))
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [
          ...prev, 
          { 
            role: 'model', 
            content: data.response, 
            sources: data.sources || [] 
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { 
            role: 'model', 
            content: `Excuse me, my dear friend. Something went wrong in the machinery (Error: ${data.error || 'Unknown error'}). Please try again.`
          }
        ]);
      }
    } catch (error) {
      console.error("Chat page error:", error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'model', 
          content: "Great Scott! My telegraph wires seem to have tangled up. Please check your connection and try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSources = (index) => {
    setExpandedSources(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="app-container chat-layout">
      {/* LEFT PANEL: Cover / Portrait (Desktop Sticky) - Clickable home link */}
      <Link href="/" className="hero-panel" style={{ display: 'flex', textDecoration: 'none' }}>
        <div className="hero-bg-wrapper">
          <Image
            src="/images/MarkTwainThinking.jpg"
            alt="Mark Twain in deep thought"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="hero-bg-image-mobile"
            style={{ objectPosition: 'center 20%' }}
          />
          <Image
            src="/images/MarkTwainThinking.jpg"
            alt="Mark Twain in deep thought (Square)"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 0vw"
            className="hero-bg-image-desktop"
            style={{ objectPosition: 'center 20%' }}
          />
        </div>
        <div className="hero-overlay" style={{ display: 'block', background: 'linear-gradient(to top, rgba(21, 17, 13, 0.95) 0%, rgba(21, 17, 13, 0.4) 100%)' }} />

        {/* Top Content on Image */}
        <div className="logo-container" style={{ marginTop: 'auto' }}>
          <Image
            src="/images/MarkTwainnReappears.webp"
            alt="Mark Twain Reappears Logo"
            width={300}
            height={110}
            priority
            className="logo-img"
          />
          <p className="logo-subtitle" style={{ color: 'var(--primary)', textShadow: '1px 1px 2px black' }}>
            RAG-powered Gemini Chat
          </p>
        </div>
      </Link>

      {/* RIGHT PANEL: The Writing Desk / Chat Feed */}
      <main className="desk-panel chat-container">
        {/* Desk Header / Status bar */}
        <div className="desk-header-left" style={{ position: 'relative', top: 'auto', left: 'auto', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={14} className="desk-header-icon" />
            <span className="typewriter text-xs uppercase tracking-widest">
              Conversation with Twain
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setShowNotesModal(true)}
              className="typewriter text-xs uppercase tracking-widest hover:text-[var(--primary)] transition-colors"
              style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              <BookOpen size={10} />
              The Rebuild of Mark Twain
            </button>
            {messages.length > 0 && (
              <button 
                onClick={clearChat}
                className="typewriter text-xs uppercase tracking-widest hover:text-[var(--primary)] transition-colors"
                style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              >
                <RefreshCw size={10} />
                Clear conversation
              </button>
            )}
          </div>
        </div>

        {/* Messages list */}
        <div className="chat-messages-container custom-scrollbar">
          {messages.length === 0 ? (
            <div className="empty-chat-state">
              <h2 className="empty-chat-title font-serif" style={{ lineHeight: '1.35' }}>
                I have returned to discover whether mankind has improved.
                <br className="hidden md:block" /> Come — let us talk.
              </h2>
              <p className="empty-chat-text typewriter">
                "It is better to keep your mouth closed and let people think you are a fool than to open it and remove all doubt." 
                <span style={{ display: 'block', marginTop: '0.5rem', fontStyle: 'italic', color: 'var(--primary)' }}>– Mark Twain</span>
              </p>
              <p className="typewriter text-xs text-[var(--muted-foreground)] mb-6">
                I'm a state of the art machine loaded with every single text that I've wrote and will reason just as I would have a century ago.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  className={`chat-message-row ${msg.role === 'user' ? 'user' : 'twain'}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`chat-bubble ${msg.role === 'user' ? 'user' : 'twain'}`}>
                    <span className="chat-bubble-sender">
                      {msg.role === 'user' ? 'Visitor' : 'Mark Twain'}
                    </span>
                    <div className="chat-bubble-text font-serif">
                      <p>{msg.content}</p>
                    </div>

                    {/* Sources (for Twain's responses) */}
                    {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                      <div className="sources-container">
                        <button
                          onClick={() => toggleSources(idx)}
                          className="sources-trigger"
                        >
                          <BookOpen size={10} />
                          <span>Source Materials ({msg.sources.length})</span>
                          {expandedSources[idx] ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        </button>
                        
                        <AnimatePresence>
                          {expandedSources[idx] && (
                            <motion.div
                              className="sources-list"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              style={{ overflow: 'hidden' }}
                            >
                              {msg.sources.map((src, sIdx) => (
                                <div key={sIdx} className="source-item">
                                  <div className="source-item-meta">
                                    <span>Work: {src.filename}</span>
                                    <span>Match: {Math.round(src.score * 100)}%</span>
                                  </div>
                                  <p className="source-item-text">
                                    "...{src.text}..."
                                  </p>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="chat-message-row twain">
              <div className="chat-bubble twain">
                <span className="chat-bubble-sender">Mark Twain</span>
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Panel */}
        <div className="chat-input-panel">
          {messages.length === 0 && (
            <div className="chat-suggestions">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(prompt)}
                  className="chat-suggestion-pill"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="chat-input-wrapper">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Let's have a conversation..."
              className="tactile-input chat-input custom-scrollbar"
              disabled={loading}
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="btn-gold chat-send-btn"
              aria-label="Skicka meddelande"
            >
              <Send size={16} />
            </button>
          </div>

          {/* Conversation Switches (Placed UNDER the input field) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', alignItems: 'center', marginTop: '0.75rem', width: '100%' }}>
            {/* Length Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span className="typewriter text-[11px] uppercase tracking-widest text-[var(--muted-foreground)]" style={{ marginRight: '0.25rem' }}>
                Length:
              </span>
              <span className="typewriter text-[10px]" style={{ color: conversationStyle === 'brief' ? 'var(--primary)' : 'var(--muted-foreground)', transition: 'color 0.2s ease' }}>Brief</span>
              <div 
                onClick={() => setConversationStyle(conversationStyle === 'brief' ? 'in-depth' : 'brief')}
                className={`switch-track ${conversationStyle === 'in-depth' ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
                aria-label="Toggle response length"
              >
                <div className="switch-thumb" />
              </div>
              <span className="typewriter text-[10px]" style={{ color: conversationStyle === 'in-depth' ? 'var(--primary)' : 'var(--muted-foreground)', transition: 'color 0.2s ease' }}>In-Depth</span>
            </div>

            {/* Tone Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span className="typewriter text-[11px] uppercase tracking-widest text-[var(--muted-foreground)]" style={{ marginRight: '0.25rem' }}>
                Tone:
              </span>
              <span className="typewriter text-[10px]" style={{ color: conversationTone === 'playful' ? 'var(--primary)' : 'var(--muted-foreground)', transition: 'color 0.2s ease' }}>Playful</span>
              <div 
                onClick={() => setConversationTone(conversationTone === 'playful' ? 'critical' : 'playful')}
                className={`switch-track ${conversationTone === 'critical' ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
                aria-label="Toggle response tone"
              >
                <div className="switch-thumb" />
              </div>
              <span className="typewriter text-[10px]" style={{ color: conversationTone === 'critical' ? 'var(--primary)' : 'var(--muted-foreground)', transition: 'color 0.2s ease' }}>Critical</span>
            </div>
          </div>
        </div>
      </main>

      {/* BEHIND THE SCENES MODAL */}
      <AnimatePresence>
        {showNotesModal && (
          <div className="modal-backdrop-wrapper" style={{ zIndex: 2100 }}>
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotesModal(false)}
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
                  onClick={() => setShowNotesModal(false)}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
                <div className="modal-body custom-scrollbar" style={{ marginTop: '1rem' }}>
                  <h2 className="font-serif text-2xl text-[var(--primary)] mb-1">Building a Mark Twain Corpus</h2>
                  <h3 className="typewriter text-xs text-white mb-4 uppercase tracking-widest">RAG: Read And Guess-less</h3>
                  <div className="modal-divider mb-6" />

                  <div className="typewriter text-xs text-[var(--muted-foreground)] mb-6" style={{ fontStyle: 'italic' }}>
                    "Get your facts first, and then you can distort them as much as you please." – Mark Twain
                  </div>

                  <div className="font-serif space-y-4 text-sm leading-relaxed" style={{ fontSize: '0.92rem', color: 'rgba(255, 244, 223, 0.85)' }}>
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
                    
                    <h4 className="font-serif text-[var(--primary)] text-base mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>The Goal</h4>
                    <p style={{ marginBottom: '1rem' }}>
                      Build a corpus of public-domain material by and about Mark Twain — substantial enough and clean enough 
                      to feed into a Retrieval-Augmented Generation (RAG) system. The corpus needed to be:
                    </p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                      <li style={{ marginBottom: '0.25rem' }}><strong>Diverse:</strong> Different kinds of sources, not just one.</li>
                      <li style={{ marginBottom: '0.25rem' }}><strong>Well-attributed:</strong> Every chunk traceable back to its origin.</li>
                      <li style={{ marginBottom: '0.25rem' }}><strong>Reproducible:</strong> The build pipeline itself should be runnable from scratch by anyone.</li>
                    </ul>

                    <h4 className="font-serif text-[var(--primary)] text-base mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>The Three Sources</h4>
                    <p style={{ marginBottom: '1rem' }}>
                      Each holds Twain-related material, but each uses a different access pattern. That diversity is part of the lesson: 
                      in any real corpus-building project, the sources don't conform to one shape.
                    </p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                      <li style={{ marginBottom: '0.75rem' }}>
                        <strong>Project Gutenberg:</strong> The canonical English-language editions of Twain's works (the novels, the autobiography, the seven-volume Letters, the speeches, the essays). About 50 works, ~20 MB. We started from a curated index page edited by David Widger that organizes Twain's PG output into a clean bibliography. The same script also handles PG's "subject" pages, which is how you find works about a person rather than by them.
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

                    <h4 className="font-serif text-[var(--primary)] text-base mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>The Architecture</h4>
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

                    <h4 className="font-serif text-[var(--primary)] text-base mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>The Two-Phase Ingestion</h4>
                    <p style={{ marginBottom: '1rem' }}>
                      Once the corpus is on disk, getting it into a vector database (Qdrant in this case) is a separate problem with separate failure modes. Embedding is CPU-bound and local; uploading is network-bound and cloud. Mixing them in one script means one timeout kills both.
                    </p>
                    <p style={{ marginBottom: '1rem' }}>So we split into two scripts:</p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                      <li style={{ marginBottom: '0.25rem' }}><code>embed_corpus.py</code> — pure local. Chunks each text into 500-word pieces, embeds each chunk via a sentence-transformer model, writes <code>vectors.jsonl</code> (one JSON line per chunk).</li>
                      <li style={{ marginBottom: '0.25rem' }}><code>upload_vectors.py</code> — pure network. Reads <code>vectors.jsonl</code>, batches into 250-vector upserts, pushes to Qdrant with retries.</li>
                    </ul>

                    <h4 className="font-serif text-[var(--primary)] text-base mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>The Numbers</h4>
                    <ul style={{ listStyleType: 'circle', paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                      <li style={{ marginBottom: '0.25rem' }}>~189 source files in the corpus (after PG + Wikisource + IA, deduped)</li>
                      <li style={{ marginBottom: '0.25rem' }}>~50 books from PG canon (~20 MB), ~30 Wikisource pages, ~100–200 IA items</li>
                      <li style={{ marginBottom: '0.25rem' }}>~18,000 expected chunks at 500 words each</li>
                      <li style={{ marginBottom: '0.25rem' }}>~300 MB of vectors at typical embedding dimensions</li>
                      <li style={{ marginBottom: '0.25rem' }}>Total pipeline runtime: hours for embedding, minutes for upload</li>
                    </ul>

                    <h4 className="font-serif text-[var(--primary)] text-base mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Lessons Learned</h4>
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
