'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Send, ChevronDown, ChevronUp, RefreshCw, X, Info, BookOpen, Menu, Volume2, Play, Pause, Globe, Copy, Check, Download } from 'lucide-react';

export default function ChatClient() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({}); // { [messageIndex]: boolean }
  const [expandedTranslations, setExpandedTranslations] = useState({}); // { [messageIndex]: boolean }
  const [conversationStyle, setConversationStyle] = useState('brief'); // 'brief' | 'in-depth'
  const [conversationTone, setConversationTone] = useState('critical'); // 'playful' | 'critical'
  const [simplifyLanguage, setSimplifyLanguage] = useState(true);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMusicPlayerClosed, setIsMusicPlayerClosed] = useState(false);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);

  const voiceAudioRef = useRef(null);
  const chatInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const voiceFocusTimeoutRef = useRef(null);



  const searchParams = useSearchParams();
  const initialQueryProcessed = useRef(false);

  useEffect(() => {
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

  // Voice of Mark audio synchronization
  useEffect(() => {
    const handleMainPlayerPlay = () => {
      const audio = voiceAudioRef.current;
      if (audio && !audio.paused) {
        audio.pause();
        setIsVoicePlaying(false);
      }
    };

    window.addEventListener('media-player-play', handleMainPlayerPlay);

    const audio = voiceAudioRef.current;
    const handleAudioEndedOrPaused = () => {
      setIsVoicePlaying(false);
    };

    if (audio) {
      audio.addEventListener('ended', handleAudioEndedOrPaused);
      audio.addEventListener('pause', handleAudioEndedOrPaused);
    }

    return () => {
      window.removeEventListener('media-player-play', handleMainPlayerPlay);
      if (audio) {
        audio.removeEventListener('ended', handleAudioEndedOrPaused);
        audio.removeEventListener('pause', handleAudioEndedOrPaused);
        audio.pause();
      }
      if (voiceFocusTimeoutRef.current) {
        clearTimeout(voiceFocusTimeoutRef.current);
      }
    };
  }, []);

  const handlePlayVoiceOfMark = () => {
    const audio = voiceAudioRef.current;
    if (!audio) return;

    if (isVoicePlaying) {
      audio.pause();
      setIsVoicePlaying(false);
      if (voiceFocusTimeoutRef.current) {
        clearTimeout(voiceFocusTimeoutRef.current);
        voiceFocusTimeoutRef.current = null;
      }
    } else {
      // Pause background music in the main media player first
      window.dispatchEvent(new CustomEvent('media-player-pause'));
      
      if (voiceFocusTimeoutRef.current) {
        clearTimeout(voiceFocusTimeoutRef.current);
      }

      audio.play()
        .then(() => {
          setIsVoicePlaying(true);

          // Focus input after 5 seconds of playing (on desktop)
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          if (!isMobile) {
            voiceFocusTimeoutRef.current = setTimeout(() => {
              if (voiceAudioRef.current && !voiceAudioRef.current.paused && document.activeElement !== chatInputRef.current) {
                chatInputRef.current?.focus();
              }
              voiceFocusTimeoutRef.current = null;
            }, 5000);
          }
        })
        .catch((err) => {
          console.error("Failed to play Mark's voice audio:", err);
        });
    }
  };


  const handleSend = useCallback(async (textToSend, excerptToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    // If there's an ongoing request, abort it!
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setInput('');

    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

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
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          style: conversationStyle,
          tone: conversationTone,
          simplify: simplifyLanguage,
          excerpt: excerptToSend,
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
            sources: data.sources || [],
            translation: data.translation || ""
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
      if (error.name === 'AbortError') {
        console.log('Request aborted by user.');
        return; // Gracefully do nothing on manual interruption
      }
      
      console.error("Chat page error:", error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'model', 
          content: "Great Scott! My telegraph wires seem to have tangled up. Please check your connection and try again."
        }
      ]);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setLoading(false);


      }
    }
  }, [input, messages, conversationStyle, conversationTone, simplifyLanguage]);

  // Keyboard-first focus retention: focus textarea whenever messages or loading state changes
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const shouldFocus = !isMobile || messages.length > 0;

    if (shouldFocus && chatInputRef.current) {
      const timer = setTimeout(() => {
        if (document.activeElement !== chatInputRef.current) {
          chatInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages.length, loading, conversationStyle, conversationTone, simplifyLanguage]);

  useEffect(() => {
    if (initialQueryProcessed.current) return;
    const query = searchParams.get('query');
    const excerpt = searchParams.get('excerpt');
    if (query) {
      initialQueryProcessed.current = true;
      handleSend(query, excerpt);
    }
  }, [searchParams, handleSend]);

  const toggleSources = (index) => {
    setExpandedSources(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleTranslation = (index) => {
    setExpandedTranslations(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleCopyMessage = (text, index) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedMessageIndex(index);
        setTimeout(() => {
          setCopiedMessageIndex(null);
        }, 2000);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  };

  const handleDownloadChat = () => {
    if (messages.length === 0) return;
    
    const header = `==================================================\n` +
                   `          MARK TWAIN CHAT TRANSCRIPT              \n` +
                   `          Generated: ${new Date().toLocaleString()} \n` +
                   `==================================================\n\n`;
                   
    const body = messages.map((msg) => {
      const roleName = msg.role === 'user' ? 'YOU' : 'MARK TWAIN';
      let messageText = `[${roleName}]\n${msg.content}\n`;
      
      if (msg.role === 'model' && msg.translation) {
        messageText += `\n[MODERN TRANSLATION]\n${msg.translation}\n`;
      }
      
      if (msg.role === 'model' && msg.sources && msg.sources.length > 0) {
        messageText += `\n[SOURCES]\n`;
        msg.sources.forEach((src) => {
          messageText += `- ${src.filename} (Match: ${Math.round(src.score * 100)}%): "${src.text}"\n`;
        });
      }
      
      return messageText;
    }).join('\n--------------------------------------------------\n\n');
    
    const fullText = header + body;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mark-twain-chat-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            src="/images/MarkTwainWithPen.jpg"
            alt="Mark Twain holding a pen"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="hero-bg-image-mobile"
            style={{ objectPosition: 'center 20%' }}
          />
          <Image
            src="/images/MarkTwainWithPen.jpg"
            alt="Mark Twain holding a pen (Square)"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 0vw"
            className="hero-bg-image-desktop"
            style={{ objectPosition: 'center 20%' }}
          />
        </div>
        <div className="hero-overlay hero-overlay-visible" />
      </Link>

      {/* RIGHT PANEL: The Writing Desk / Chat Feed */}
      <main className="desk-panel chat-container">
        {/* Visually hidden h1 for SEO */}
        <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: '0' }}>
          Converse with Mark Twain
        </h1>

        {/* Desk Header / Status bar */}
        <div className="desk-header-left" style={{ position: 'relative', top: 'auto', left: 'auto', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Image
              src="/images/MarkTwainSoloLogo.webp"
              alt="Mark Twain Logo"
              width={98}
              height={35}
              priority
              className="mark-twain-solo-logo"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link
              href="/read/eves-diary"
              className="typewriter text-xs md:text-sm uppercase tracking-widest hover:text-[var(--primary)] transition-colors desktop-only-control"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted-foreground)' }}
            >
              <BookOpen size={18} color="currentColor" />
              Read Eve's Diary
            </Link>
            <button 
              onClick={() => setShowNotesModal(true)}
              className="typewriter text-xs md:text-sm uppercase tracking-widest hover:text-[var(--primary)] transition-colors desktop-only-control"
              style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--muted-foreground)' }}
            >
              <Info size={18} color="currentColor" />
              The Rebuild Process
            </button>
            {isMusicPlayerClosed && (
              <button 
                onClick={handleReopenMusic}
                className="typewriter text-xs md:text-sm uppercase tracking-widest hover:text-[var(--primary)] transition-colors desktop-only-control"
                style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--primary)' }}
                title="Open Music Player"
              >
                <Volume2 size={18} color="currentColor" />
                Listen
              </button>
            )}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="mobile-only-control"
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Settings Drawer */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              className="mobile-settings-drawer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="mobile-settings-drawer-inner">
                {/* Navigation */}
                <div className="drawer-section">
                  <Link 
                    href="/" 
                    onClick={() => setShowMobileMenu(false)}
                    className="drawer-link"
                  >
                    <ArrowLeft size={16} />
                    <span>Go to Home</span>
                  </Link>
                  <Link 
                    href="/read/eves-diary" 
                    onClick={() => setShowMobileMenu(false)}
                    className="drawer-link"
                  >
                    <BookOpen size={16} />
                    <span>Read Eve's Diary</span>
                  </Link>
                  <button 
                    onClick={() => { setShowNotesModal(true); setShowMobileMenu(false); }}
                    className="drawer-btn"
                  >
                    <Info size={16} />
                    <span>The Rebuild Process</span>
                  </button>
                  {isMusicPlayerClosed && (
                    <button 
                      onClick={() => { handleReopenMusic(); setShowMobileMenu(false); }}
                      className="drawer-btn"
                      style={{ color: 'var(--primary)' }}
                    >
                      <Volume2 size={16} />
                      <span>Open Music Player</span>
                    </button>
                  )}
                </div>

                {/* Settings Switches */}
                <div className="drawer-section">
                  <div className="drawer-switch-row">
                    <span className="typewriter text-[11px] uppercase tracking-widest text-[var(--muted-foreground)]">
                      Answer Size:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="typewriter text-[10px]" style={{ color: conversationStyle === 'brief' ? 'var(--primary)' : 'var(--muted-foreground)' }}>Brief</span>
                      <div 
                        onClick={() => setConversationStyle(conversationStyle === 'brief' ? 'in-depth' : 'brief')}
                        className={`switch-track ${conversationStyle === 'in-depth' ? 'active' : ''}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="switch-thumb" />
                      </div>
                      <span className="typewriter text-[10px]" style={{ color: conversationStyle === 'in-depth' ? 'var(--primary)' : 'var(--muted-foreground)' }}>In-Depth</span>
                    </div>
                  </div>

                  <div className="drawer-switch-row">
                    <span className="typewriter text-[11px] uppercase tracking-widest text-[var(--muted-foreground)]">
                      Tone:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="typewriter text-[10px]" style={{ color: conversationTone === 'playful' ? 'var(--primary)' : 'var(--muted-foreground)' }}>Playful</span>
                      <div 
                        onClick={() => setConversationTone(conversationTone === 'playful' ? 'critical' : 'playful')}
                        className={`switch-track ${conversationTone === 'critical' ? 'active' : ''}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="switch-thumb" />
                      </div>
                      <span className="typewriter text-[10px]" style={{ color: conversationTone === 'critical' ? 'var(--primary)' : 'var(--muted-foreground)' }}>Critical</span>
                    </div>
                  </div>

                  <div className="drawer-switch-row">
                    <span className="typewriter text-[11px] uppercase tracking-widest text-[var(--muted-foreground)]">
                      Language:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="typewriter text-[10px]" style={{ color: !simplifyLanguage ? 'var(--primary)' : 'var(--muted-foreground)' }}>Standard</span>
                      <div 
                        onClick={() => setSimplifyLanguage(!simplifyLanguage)}
                        className={`switch-track ${simplifyLanguage ? 'active' : ''}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="switch-thumb" />
                      </div>
                      <span className="typewriter text-[10px]" style={{ color: simplifyLanguage ? 'var(--primary)' : 'var(--muted-foreground)' }}>Simplified</span>
                    </div>
                  </div>
                </div>

                {/* Clear Conversation */}
                {messages.length > 0 && (
                  <div className="drawer-section" style={{ borderBottom: 'none' }}>
                    <button 
                      onClick={() => { clearChat(); setShowMobileMenu(false); }}
                      className="drawer-btn clear-btn"
                    >
                      <RefreshCw size={14} />
                      <span>Clear conversation</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages list */}
        <div className="chat-messages-container custom-scrollbar">
          <div className="chat-messages-inner">
            {messages.length === 0 ? (
              <div className="empty-chat-state">
                <p className="empty-chat-text typewriter">
                  The reports of my death have been exaggerated
                </p>
                <h2 className="empty-chat-title" style={{ lineHeight: '1.35' }}>
                  I have returned to discover whether mankind has improved
                </h2>
                <Image
                  src="/images/mark-twain-signature.png"
                  alt="Mark Twain Signature"
                  width={250}
                  height={80}
                  className="modal-signature-img empty-state-signature"
                  style={{ marginTop: '1.5rem' }}
                />
                <div className="voice-of-mark-container">
                  <button
                    onClick={handlePlayVoiceOfMark}
                    className="voice-of-mark-btn"
                  >
                    {isVoicePlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                    <span>Picture the Voice</span>
                  </button>
                </div>
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
                        {msg.role === 'user' ? 'You' : 'Mark Twain'}
                      </span>
                      <div className="chat-bubble-text">
                        <p>{msg.content}</p>
                      </div>

                      {/* User message copy button */}
                      {msg.role === 'user' && (
                        <div className="message-footer-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'center' }}>
                          <button
                            onClick={() => handleCopyMessage(msg.content, idx)}
                            className="sources-trigger"
                            aria-label="Copy question"
                          >
                            {copiedMessageIndex === idx ? <Check size={10} /> : <Copy size={10} />}
                            <span>{copiedMessageIndex === idx ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      )}

                      {/* Sources and Translations (for Twain's responses) */}
                      {msg.role === 'model' && (
                        <div className="message-footer-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'center' }}>
                          <button
                            onClick={() => handleCopyMessage(msg.content, idx)}
                            className="sources-trigger"
                            aria-label="Copy answer"
                          >
                            {copiedMessageIndex === idx ? <Check size={10} /> : <Copy size={10} />}
                            <span>{copiedMessageIndex === idx ? 'Copied' : 'Copy'}</span>
                          </button>

                          {msg.sources && msg.sources.length > 0 && (
                              <button
                                onClick={() => toggleSources(idx)}
                                className="sources-trigger"
                              >
                                <BookOpen size={10} />
                                <span>Source Materials ({msg.sources.length})</span>
                                {expandedSources[idx] ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                              </button>
                          )}
 
                          {msg.translation && (
                              <button
                                onClick={() => toggleTranslation(idx)}
                                className="sources-trigger"
                              >
                                <Globe size={10} />
                                <span>Understand My Language</span>
                                {expandedTranslations[idx] ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                              </button>
                          )}
                        </div>
                      )}

                      {/* Collapsible Sources List */}
                      {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
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
                      )}

                      {/* Collapsible Translation Box */}
                      <AnimatePresence>
                        {expandedTranslations[idx] && msg.translation && (
                          <motion.div
                            className="translation-text-box"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            style={{ overflow: 'hidden', marginTop: '0.5rem', padding: '0.75rem', borderLeft: '2px solid var(--primary)', backgroundColor: 'rgba(255, 244, 223, 0.03)', borderRadius: '0 4px 4px 0' }}
                          >
                            <span className="typewriter text-[9px] uppercase tracking-widest text-[var(--primary)]" style={{ display: 'block', marginBottom: '0.25rem' }}>
                              Modern Translation
                            </span>
                            <p className="font-sans text-[13px] leading-relaxed" style={{ margin: 0, color: 'var(--foreground)' }}>
                              {msg.translation}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
        </div>

        {/* Input Panel */}
        <div className="chat-input-panel">
          {messages.length === 0 && (
            <h2 className="empty-chat-title" style={{ lineHeight: '1.15', fontSize: '1.6rem', textAlign: 'center', margin: '1rem 0 2rem 0' }}>
              Let us talk
            </h2>
          )}

          <div className="chat-input-wrapper">
            {messages.length > 0 && (
              <button
                id="chat-download-button"
                onClick={handleDownloadChat}
                className="chat-download-btn"
                title="Download chat history"
                aria-label="Download chat history"
              >
                <Download size={16} />
              </button>
            )}
            <textarea
              ref={chatInputRef}
              id="chat-input-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Spit it out..."
              className="tactile-input chat-input custom-scrollbar"
              rows={1}
            />
            <button
              id="chat-send-button"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="btn-gold chat-send-btn"
              aria-label="Skicka meddelande"
            >
              <Send size={16} />
            </button>
          </div>

          {/* Conversation Switches (Placed UNDER the input field) */}
          <div className="desktop-only-control" style={{ gap: '2rem', justifyContent: 'center', alignItems: 'center', marginTop: '1.75rem', width: '100%', flexWrap: 'wrap' }}>
            {/* Length Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', whiteSpace: 'nowrap' }}>
              <span className="typewriter text-[11px] uppercase tracking-widest text-[var(--muted-foreground)]" style={{ marginRight: '0.25rem' }}>
                Answer
              </span>
              <span className="typewriter text-[10px]" style={{ color: conversationStyle === 'brief' ? 'var(--primary)' : 'var(--muted-foreground)', transition: 'color 0.2s' }}>Brief</span>
              <div 
                id="chat-length-switch"
                onClick={() => setConversationStyle(conversationStyle === 'brief' ? 'in-depth' : 'brief')}
                className={`switch-track ${conversationStyle === 'in-depth' ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
                aria-label="Toggle response length"
              >
                <div className="switch-thumb" />
              </div>
              <span className="typewriter text-[10px]" style={{ color: conversationStyle === 'in-depth' ? 'var(--primary)' : 'var(--muted-foreground)', transition: 'color 0.2s' }}>In-Depth</span>
            </div>

            {/* Tone Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', whiteSpace: 'nowrap' }}>
              <span className="typewriter text-[11px] uppercase tracking-widest text-[var(--muted-foreground)]" style={{ marginRight: '0.25rem' }}>
                Tone:
              </span>
              <span className="typewriter text-[10px]" style={{ color: conversationTone === 'playful' ? 'var(--primary)' : 'var(--muted-foreground)', transition: 'color 0.2s' }}>Playful</span>
              <div 
                id="chat-tone-switch"
                onClick={() => setConversationTone(conversationTone === 'playful' ? 'critical' : 'playful')}
                className={`switch-track ${conversationTone === 'critical' ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
                aria-label="Toggle response tone"
              >
                <div className="switch-thumb" />
              </div>
              <span className="typewriter text-[10px]" style={{ color: conversationTone === 'critical' ? 'var(--primary)' : 'var(--muted-foreground)', transition: 'color 0.2s' }}>Critical</span>
            </div>

            {/* Simplify Language Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', whiteSpace: 'nowrap' }}>
              <span className="typewriter text-[11px] uppercase tracking-widest text-[var(--muted-foreground)]" style={{ marginRight: '0.25rem' }}>
                Language:
              </span>
              <span className="typewriter text-[10px]" style={{ color: !simplifyLanguage ? 'var(--primary)' : 'var(--muted-foreground)', transition: 'color 0.2s' }}>Standard</span>
              <div 
                id="chat-simplify-switch"
                onClick={() => setSimplifyLanguage(!simplifyLanguage)}
                className={`switch-track ${simplifyLanguage ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
                aria-label="Toggle simplified language"
              >
                <div className="switch-thumb" />
              </div>
              <span className="typewriter text-[10px]" style={{ color: simplifyLanguage ? 'var(--primary)' : 'var(--muted-foreground)', transition: 'color 0.2s' }}>Simplified</span>
            </div>

            {/* Clear Conversation Button */}
            {messages.length > 0 && (
              <button 
                id="chat-clear-button"
                onClick={clearChat}
                className="typewriter text-[11px] uppercase tracking-widest hover:text-[var(--primary)] transition-colors"
                style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}
              >
                <RefreshCw size={11} />
                Clear conversation
              </button>
            )}
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
      <audio
        ref={voiceAudioRef}
        src="/sounds/music/the-awakening.mp3"
        preload="auto"
      />
    </div>
  );
}
