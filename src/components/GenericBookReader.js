'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Sun, Moon, BookOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MarkTwainLetterCard from './MarkTwainLetterCard';

function isLetterSegment(segment) {
  const recipientMatch = segment.match(/^\s*(?:<a[^>]*>[\s\S]*?<\/a>)?\s*(?:<div[^>]*>[\s\S]*?<\/div>)?\s*(?:<br\s*\/?>)?\s*(?:<p[^>]*>)?\s*(To\s+|Fragment\s+of\s+a\s+letter\s+|Letter\s+to\s+)/i);
  return !!recipientMatch;
}

function isSignatureText(text) {
  const cleanText = text.replace(/<[^>]+>/g, '').trim();
  if (cleanText.length > 120) return false;
  const signaturePatterns = [
    /yours/i, /brother/i, /friend/i, /mark/i, /sam/i, /clemens/i, /ever/i, 
    /affectionately/i, /sinceres/i, /respectfully/i, /obedient/i, /devotedly/i, 
    /signing/i
  ];
  return signaturePatterns.some(pat => pat.test(cleanText)) || cleanText.length < 50;
}

function afterDateBlock(text) {
  const match = text.match(/^\s*(?:<a[^>]*>[\s\S]*?<\/a>)?\s*<pre[^>]*>([\s\S]*?)<\/pre>/i);
  if (match) {
    return {
      content: match[1],
      length: match[0].length
    };
  }
  return null;
}

function parseLetter(content, pendingContext) {
  const pMatch = content.match(/<p>([\s\S]*?)<\/p>/i);
  let recipient = '';
  let afterRecipient = content;
  
  if (pMatch) {
    recipient = pMatch[1].trim();
    afterRecipient = content.substring(pMatch.index + pMatch[0].length).trim();
  }
  
  const preMatch = afterDateBlock(afterRecipient);
  let date = '';
  let afterDate = afterRecipient;
  
  if (preMatch) {
    date = preMatch.content.trim();
    afterDate = afterRecipient.substring(preMatch.length).trim();
  }
  
  const preBlocks = [];
  const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  let match;
  while ((match = preRegex.exec(afterDate)) !== null) {
    preBlocks.push({
      index: match.index,
      length: match[0].length,
      content: match[1],
      full: match[0]
    });
  }
  
  let signature = '';
  let bodyHtml = afterDate;
  
  if (preBlocks.length > 0) {
    const sigBlock = preBlocks[preBlocks.length - 1];
    signature = sigBlock.content;
    bodyHtml = afterDate.substring(0, sigBlock.index) + afterDate.substring(sigBlock.index + sigBlock.length);
  }
  
  return {
    type: 'letter',
    recipient,
    date,
    bodyHtml: bodyHtml.trim(),
    signature,
    contextHtml: pendingContext
  };
}


function formatTocLabel(label) {
  if (!label) return '';
  
  const isRoman = (word) => {
    return /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i.test(word);
  };

  return label.split(/\s+/).map(word => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    if (cleanWord && isRoman(cleanWord)) {
      return word.toUpperCase();
    }
    
    if (word === word.toUpperCase() && /[a-zA-Z]/.test(word)) {
      const lower = word.toLowerCase();
      const firstLetterIdx = lower.search(/[a-z]/i);
      if (firstLetterIdx !== -1) {
        return lower.substring(0, firstLetterIdx) + 
               lower.charAt(firstLetterIdx).toUpperCase() + 
               lower.substring(firstLetterIdx + 1);
      }
      return lower;
    }
    
    return word;
  }).join(' ');
}

export default function GenericBookReader({ htmlContent, tocItems = [], bookTitle = 'Read Book', showExperienceSelector = true, headerExtra = null }) {
  const progressRef = useRef(null);
  const [theme, setTheme] = useState('charcoal'); // 'parchment' | 'charcoal'
  const [experience, setExperience] = useState('traditional');
  const [selectedZoomImage, setSelectedZoomImage] = useState(null);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const isLetters = bookTitle.toLowerCase().includes('letter');

  const parsedSegments = useMemo(() => {
    if (!isLetters) return [];

    const parts = htmlContent.split(/<hr\s*\/?>/gi);
    const segments = [];
    let pendingContext = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const nextIsLetter = i + 1 < parts.length && isLetterSegment(parts[i + 1]);

      let currentContent = part;
      let nextContext = '';

      if (nextIsLetter) {
        const preBlocks = [];
        const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
        let match;
        while ((match = preRegex.exec(part)) !== null) {
          preBlocks.push({
            index: match.index,
            length: match[0].length,
            content: match[1],
            full: match[0]
          });
        }

        if (preBlocks.length > 0) {
          const lastBlock = preBlocks[preBlocks.length - 1];
          if (!isSignatureText(lastBlock.content)) {
            nextContext = lastBlock.content;
            currentContent = part.substring(0, lastBlock.index) + part.substring(lastBlock.index + lastBlock.length);
          }
        }
      }

      if (isLetterSegment(part)) {
        const letter = parseLetter(currentContent, pendingContext);
        segments.push(letter);
      } else {
        segments.push({
          type: 'html',
          content: currentContent
        });
      }

      pendingContext = nextContext;
    }

    return segments;
  }, [htmlContent, isLetters]);

  const experiences = [
    { id: 'drama', label: 'Index', description: 'Navigate the story by Index.', supported: true },
    { id: 'traditional', label: 'Traditional Read', description: 'Original text and illustrations as published.', supported: true },
    { id: 'voice', label: 'E-Ink and Kindle', description: 'Optimal formatting for e-paper. (Unavailable)', supported: false },
    { id: 'chat', label: 'Dramatized Excerpt', description: 'Audio drama script. (Unavailable)', supported: false },
    { id: 'split', label: 'Sung Edition', description: 'Hear the book set to music. (Unavailable)', supported: false },
    { id: 'child', label: 'Young Readers', description: 'Simplified text and glossary. (Unavailable)', supported: false }
  ];

  const isLoadedRef = useRef(false);
  const readerRef = useRef(null);

  // Load settings from storage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('eves-diary-theme');
    if (savedTheme) setTheme(savedTheme);
    isLoadedRef.current = true;
  }, []);

  // Save settings when they change
  useEffect(() => {
    if (!isLoadedRef.current) return;
    localStorage.setItem('eves-diary-theme', theme);
  }, [theme]);

  // Monitor page scroll progress directly on DOM to prevent re-renders
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        if (progressRef.current) {
          progressRef.current.style.width = `${progress}%`;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click on dynamic article elements to capture image zooms
  const handleArticleClick = (e) => {
    const wrapper = e.target.closest('.circle-img-wrapper');
    if (wrapper) {
      const img = wrapper.querySelector('.in-paragraph-img') || wrapper.querySelector('img');
      if (img) {
        const zoomSrc = img.getAttribute('data-zoom-src') || img.getAttribute('src');
        setSelectedZoomImage(zoomSrc);
        return;
      }
    }

    const clickedImg = e.target.closest('img');
    if (clickedImg) {
      const isBookImage = clickedImg.closest('.book-text-content') || 
                          clickedImg.closest('.book-cover-trio') || 
                          clickedImg.closest('.book-epigraph') || 
                          clickedImg.closest('.paragraph-with-image') ||
                          clickedImg.closest('.fig') ||
                          clickedImg.closest('.fig-trio-item');
      if (isBookImage) {
        const zoomSrc = clickedImg.getAttribute('data-zoom-src') || clickedImg.getAttribute('src');
        setSelectedZoomImage(zoomSrc);
      }
    }
  };

  // Scroll tracking to update the active Table of Contents item
  useEffect(() => {
    if (tocItems.length === 0) return;

    const handleScrollActiveItem = () => {
      const elements = tocItems.map(item => document.getElementById(item.id)).filter(Boolean);
      let currentActiveId = null;
      
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        // If the element's top boundary is above or near the top viewport threshold (e.g. 160px)
        if (rect.top <= 160) {
          currentActiveId = el.id;
        } else {
          break; // Headings are ordered, so stop once we find one below the threshold
        }
      }
      
      const newActiveId = currentActiveId || tocItems[0].id;
      setActiveId(prev => (prev !== newActiveId ? newActiveId : prev));
    };

    window.addEventListener('scroll', handleScrollActiveItem);
    handleScrollActiveItem(); // Initial call

    return () => window.removeEventListener('scroll', handleScrollActiveItem);
  }, [tocItems]);

  // Dynamic event binding for collapsible Table of Contents in injected HTML
  useEffect(() => {
    const handleTocClick = (e) => {
      // Table of Contents expand button
      const btn = e.target.closest('.book-toc-expand-btn');
      if (btn) {
        // Find the outermost wrapper containing this button
        let current = btn.closest('.book-toc-collapsed-wrapper');
        let outermost = current;
        while (current) {
          const parent = current.parentElement ? current.parentElement.closest('.book-toc-collapsed-wrapper') : null;
          if (parent) {
            outermost = parent;
          }
          current = parent;
        }

        if (!outermost) return;

        const willExpand = !outermost.classList.contains('expanded');

        // Toggle expanded on outermost and all nested wrappers
        const allWrappers = [outermost, ...outermost.querySelectorAll('.book-toc-collapsed-wrapper')];
        allWrappers.forEach(w => {
          if (willExpand) {
            w.classList.add('expanded');
          } else {
            w.classList.remove('expanded');
          }
        });

        // Update text for all buttons inside the outermost wrapper
        const allButtons = outermost.querySelectorAll('.book-toc-expand-btn');
        allButtons.forEach(b => {
          b.textContent = willExpand ? 'Collapse Table of Contents' : 'Expand Table of Contents';
        });
        return;
      }

      // Illustrations (LOI) expand button
      const loiBtn = e.target.closest('.book-loi-expand-btn');
      if (loiBtn) {
        const wrapper = loiBtn.closest('.book-loi-collapsed-wrapper');
        if (wrapper) {
          wrapper.classList.toggle('expanded');
        }
        return;
      }
    };

    const container = document.querySelector('.book-text-content');
    if (container) {
      container.addEventListener('click', handleTocClick);
    }

    return () => {
      if (container) {
        container.removeEventListener('click', handleTocClick);
      }
    };
  }, [htmlContent]);

  // Smooth scroll helper that offsets for the sticky header
  const scrollToId = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Automatically close drawer on mobile
      if (window.innerWidth < 768) {
        setIsTocOpen(false);
      }
    }
  };

  return (
    <div className={`book-reader-container theme-${theme} ${isTocOpen ? 'toc-sidebar-open' : ''}`}>
      {/* Scroll Progress Bar */}
      <div 
        ref={progressRef}
        className="reading-progress-bar" 
        style={{ width: '0%' }}
      />

      {/* Top Left: Logo + Back to Library */}
      <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 10, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link href="/">
          <img
            alt="Mark Twain Logo"
            width={98}
            height={35}
            className="mark-twain-solo-logo"
            src="/images/MarkTwainSoloLogo.webp"
            style={{ color: 'transparent' }}
          />
        </Link>
        <Link
          href="/complete-works"
          style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(217,163,74,0.6)',
            textDecoration: 'none',
            borderBottom: '1px solid rgba(217,163,74,0.25)',
            paddingBottom: '1px',
            whiteSpace: 'nowrap',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(217,163,74,1)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(217,163,74,0.6)'}
        >
          ← The Library
        </Link>
      </div>

      {/* Reading Desk */}
      <main className="book-page-desk" ref={readerRef}>
        <article 
          className="book-page-parchment font-serif size-small"
          onClick={handleArticleClick}
        >
          {/* Theme Selector (Floating inside parchment card) */}
          <button 
            onClick={() => setTheme(theme === 'parchment' ? 'charcoal' : 'parchment')}
            className="book-control-btn theme-toggle parchment-theme-toggle"
            title={`Switch to ${theme === 'parchment' ? 'Charcoal' : 'Parchment'} theme`}
          >
            {theme === 'parchment' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Reading Experience Selector */}
          {showExperienceSelector && (
            <div className="reading-experience-selector" style={{ marginTop: '2.5rem' }}>
              <h4 className="experience-heading">WAYS TO EXPERIENCE</h4>
              <div className="experience-grid">
                {experiences.map((exp) => {
                  const isCardActive = exp.id === 'drama' ? isTocOpen : experience === exp.id;
                  
                  return (
                    <button
                      key={exp.id}
                      disabled={!exp.supported}
                      onClick={() => {
                        if (exp.id === 'drama') {
                          setIsTocOpen(!isTocOpen);
                        } else {
                          setExperience(exp.id);
                        }
                      }}
                      className={`experience-card ${isCardActive ? 'active' : ''} ${exp.supported ? '' : 'opacity-40 cursor-not-allowed'}`}
                      style={!exp.supported ? { pointerEvents: 'none' } : {}}
                    >
                      <span className="experience-card-label">{exp.label}</span>
                      <span className="experience-card-desc">{exp.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {headerExtra}

          {isLetters ? (
            <div className="book-text-content letters-collection space-y-8">
              {parsedSegments.map((seg, idx) => {
                if (seg.type === 'letter') {
                  return (
                    <MarkTwainLetterCard
                      key={idx}
                      recipient={seg.recipient}
                      date={seg.date}
                      bodyHtml={seg.bodyHtml}
                      signature={seg.signature}
                      contextHtml={seg.contextHtml}
                    />
                  );
                } else {
                  return (
                    <div 
                      key={idx} 
                      className="book-html-block" 
                      dangerouslySetInnerHTML={{ __html: seg.content }} 
                    />
                  );
                }
              })}
            </div>
          ) : (
            <div className="book-text-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          )}
        </article>
      </main>

      {/* Table of Contents Drawer */}
      <AnimatePresence>
        {isTocOpen && (
          <>
            {/* Backdrop for closing */}
            <motion.div
              className="toc-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTocOpen(false)}
            />

            {/* Sidebar drawer panel */}
            <motion.div
              className="toc-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
            >
              <div className="toc-drawer-header">
                <h3>Book Index</h3>
                <button onClick={() => setIsTocOpen(false)} className="toc-close-btn">
                  <X size={18} />
                </button>
              </div>

              <nav className="toc-drawer-list">
                {tocItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToId(item.id)}
                    className={`toc-item type-${item.type} ${activeId === item.id ? 'active' : ''}`}
                  >
                    {item.type === 'day' && <span className="toc-bullet">•</span>}
                    <span className="toc-label">{formatTocLabel(item.label)}</span>
                  </button>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Zoom Modal Overlay */}
      <AnimatePresence>
        {selectedZoomImage && (
          <motion.div
            className="zoom-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedZoomImage(null)}
          >
            <motion.div
              className="zoom-modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <img src={selectedZoomImage} alt="Enlarged Illustration" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
