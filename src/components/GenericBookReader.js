'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sun, Moon, BookOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GenericBookReader({ htmlContent, tocItems = [], bookTitle = 'Read Book' }) {
  const progressRef = useRef(null);
  const [theme, setTheme] = useState('charcoal'); // 'parchment' | 'charcoal'
  const [experience, setExperience] = useState('traditional');
  const [selectedZoomImage, setSelectedZoomImage] = useState(null);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

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
    const wrappers = document.querySelectorAll('.book-toc-collapsed-wrapper');
    const handlers = [];

    wrappers.forEach(wrapper => {
      const btn = wrapper.querySelector('.book-toc-expand-btn');
      if (btn) {
        const handler = () => {
          const isExpanded = wrapper.classList.toggle('expanded');
          btn.textContent = isExpanded ? 'Collapse Table of Contents' : 'Expand Table of Contents';
        };
        btn.addEventListener('click', handler);
        handlers.push({ btn, handler });
      }
    });

    return () => {
      handlers.forEach(({ btn, handler }) => {
        btn.removeEventListener('click', handler);
      });
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

      {/* Top Left Logo (Back to Home Link) */}
      <div className="book-logo-container" style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 10 }}>
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

          <div className="book-text-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
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
                    <span className="toc-label">{item.label}</span>
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
