'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon, BookOpen, X, Sparkles, Download, Clipboard, Check, Loader2, Play, Pause, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { youngReadersParagraphs, youngReadersGlossary, youngReadersNotes } from './YoungReadersText';

export default function BookReader({ htmlContent, tocItems = [], initialExperience = 'traditional' }) {
  const router = useRouter();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [theme, setTheme] = useState('charcoal'); // 'parchment' | 'charcoal'
  const [experience, setExperience] = useState(initialExperience); // 'traditional' | 'app' | 'parallax' | 'voice' | 'drama' | 'chat' | 'split' | 'comments' | 'child'
  const [isMusicPlayerClosed, setIsMusicPlayerClosed] = useState(false);
  const [selectedZoomImage, setSelectedZoomImage] = useState(null);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  // EPUB Compiler States
  const [epubStatus, setEpubStatus] = useState('idle'); // 'idle' | 'generating' | 'success' | 'error'
  const [epubUrl, setEpubUrl] = useState('');
  const [epubError, setEpubError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Open the global media player panel and switch to track 0 (Eve's Diary) when entering split experience (Sung Edition)
  useEffect(() => {
    if (experience === 'split') {
      window.dispatchEvent(new CustomEvent('media-player-open'));
      window.dispatchEvent(new CustomEvent('media-player-select-track-request', { detail: { index: 0 } }));
      window.dispatchEvent(new CustomEvent('media-player-play-request'));
    }
  }, [experience]);

  const handleGenerateEpub = async () => {
    setEpubStatus('generating');
    setEpubError('');
    try {
      const res = await fetch('/api/epub');
      const data = await res.json();
      if (res.ok && data.success) {
        setEpubUrl(data.downloadUrl);
        setEpubStatus('success');
      } else {
        throw new Error(data.error || 'Failed to generate EPUB');
      }
    } catch (err) {
      setEpubError(err.message);
      setEpubStatus('error');
    }
  };

  const handleCopyLink = () => {
    if (!epubUrl) return;
    const absoluteUrl = `${window.location.origin}${epubUrl}`;
    navigator.clipboard.writeText(absoluteUrl);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const experiences = [
    { id: 'drama', label: 'Index', description: 'Navigate the story by Index.' },
    { id: 'traditional', label: 'Traditional Read', description: "Original text and illustrations as published in the first edition." },
    { id: 'voice', label: 'E-Ink and Kindle', description: 'Optimal formatting for Kindle and e-paper screens.' },
    { id: 'chat', label: 'Dramatized Excerpt', description: 'Audio drama script for Eve and Adam.' },
    { id: 'split', label: 'Sung Edition', description: 'Hear the diary set to music.' },
    { id: 'child', label: 'Young Readers', description: 'Simplified text and glossary for young minds.' }
  ];

  const isLoadedRef = useRef(false);
  const readerRef = useRef(null);

  // Load settings from storage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('eves-diary-theme');
    const savedExperience = sessionStorage.getItem('eves-diary-experience');
    const savedClosed = sessionStorage.getItem('media-player-closed');

    if (savedTheme) setTheme(savedTheme);
    if (savedExperience) {
      if (savedExperience === 'drama') {
        setExperience(initialExperience === 'child' ? 'child' : 'traditional');
      } else {
        setExperience(initialExperience === 'child' ? 'child' : savedExperience);
      }
    } else if (initialExperience) {
      setExperience(initialExperience);
    }
    setIsMusicPlayerClosed(savedClosed !== null ? savedClosed === 'true' : true);

    isLoadedRef.current = true;

    // Listen to media player close-change events
    const handleCloseChange = (e) => {
      setIsMusicPlayerClosed(e.detail.isClosed);
    };

    window.addEventListener('media-player-close-change', handleCloseChange);
    
    return () => {
      window.removeEventListener('media-player-close-change', handleCloseChange);
    };
  }, []);

  // Save settings when they change
  useEffect(() => {
    if (!isLoadedRef.current) return;
    localStorage.setItem('eves-diary-theme', theme);
    sessionStorage.setItem('eves-diary-experience', experience);
  }, [theme, experience]);

  // Monitor page scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click on dynamic article elements to capture image zooms
  const handleArticleClick = (e) => {
    const wrapper = e.target.closest('.circle-img-wrapper');
    if (wrapper) {
      const img = wrapper.querySelector('.in-paragraph-img');
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
      
      if (currentActiveId) {
        setActiveId(currentActiveId);
      } else {
        setActiveId(tocItems[0].id);
      }
    };

    window.addEventListener('scroll', handleScrollActiveItem);
    handleScrollActiveItem(); // Initial call

    return () => window.removeEventListener('scroll', handleScrollActiveItem);
  }, [tocItems]);

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

  const handleReopenMusic = () => {
    window.dispatchEvent(new CustomEvent('media-player-open'));
  };

  return (
    <div className={`book-reader-container theme-${theme} ${isTocOpen ? 'toc-sidebar-open' : ''}`}>
      {/* Scroll Progress Bar */}
      <div 
        className="reading-progress-bar" 
        style={{ width: `${scrollProgress}%` }}
      />

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
          <div className="book-epigraph">
            “Wheresoever she was, there was Eden.”
          </div>
          <div className="book-epigraph-subtitle">
            This book is the first reworked version of many to come.
          </div>

          {/* Reading Experience Selector */}
          <div className="reading-experience-selector">
            <h4 className="experience-heading">WAYS TO EXPERIENCE</h4>
            <div className="experience-grid">
              {experiences.map((exp) => {
                const isActive = exp.id === 'drama' ? isTocOpen : experience === exp.id;
                return (
                  <button
                    key={exp.id}
                    onClick={() => {
                      if (exp.id === 'drama') {
                        if (!isTocOpen) {
                          setIsTocOpen(true);
                          if (experience === 'child') {
                            sessionStorage.setItem('eves-diary-experience', 'traditional');
                            router.push('/read/eves-diary');
                          } else {
                            setExperience('traditional');
                          }
                        } else if (experience !== 'traditional') {
                          if (experience === 'child') {
                            sessionStorage.setItem('eves-diary-experience', 'traditional');
                            router.push('/read/eves-diary');
                          } else {
                            setExperience('traditional');
                          }
                        } else {
                          setIsTocOpen(false);
                        }
                      } else if (exp.id === 'child') {
                        router.push('/read/eves-diary/young-readers');
                      } else {
                        if (experience === 'child') {
                          // Save chosen experience for when we land on /read/eves-diary
                          sessionStorage.setItem('eves-diary-experience', exp.id);
                          router.push('/read/eves-diary');
                        } else {
                          setExperience(exp.id);
                        }
                        if (exp.id === 'split') {
                          window.dispatchEvent(new CustomEvent('media-player-open'));
                        }
                      }
                    }}
                    className={`experience-card ${isActive ? 'active' : ''}`}
                  >
                    <span className="experience-card-label">{exp.label}</span>
                    <span className="experience-card-desc">{exp.description}</span>
                  </button>
                );
              })}
            </div>
          </div>



          {experience === 'traditional' || experience === 'split' ? (
            <div className="book-text-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          ) : experience === 'child' ? (
            <div className="book-text-content young-readers-reading-view">
              
              {youngReadersParagraphs.map((item, idx) => {
                if (item.type === 'title') {
                  return <h1 key={idx} className="young-readers-title">{item.text}</h1>;
                }
                if (item.type === 'subtitle') {
                  return <h2 key={idx} className="young-readers-subtitle">{item.text}</h2>;
                }
                if (item.type === 'section') {
                  return <h2 key={idx} className="young-readers-section-header">Adapted for Young Readers</h2>;
                }
                if (item.type === 'illustrator') {
                  return <h3 key={idx} className="young-readers-illustrator">{item.text}</h3>;
                }
                if (item.type === 'paragraph') {
                  // Parse brackets [word] into glossary term spans
                  let html = item.text.replace(/\[(.*?)\]/g, (match, word) => {
                    const cleanWord = word.toLowerCase();
                    const def = (youngReadersGlossary[cleanWord] || "").replace(/"/g, '&quot;');
                    return `<span class="glossary-term" data-definition="${def}">${word}</span>`;
                  });
                  // Parse weekdays like SATURDAY, SUNDAY, FRIDAY into diary-day-anchor style
                  html = html.replace(/^(SATURDAY|SUNDAY|NEXT WEEK SUNDAY|WEDNESDAY|THURSDAY|MONDAY|TUESDAY|FRIDAY)(\.&mdash;|&mdash;|—)/gi, (match, dayText, delimiter) => {
                    const hasDot = delimiter.startsWith('.');
                    const finalDayText = hasDot ? `${dayText}. ` : `${dayText} `;
                    const finalDelimiter = ' — ';
                    return `<span class="diary-day-anchor">${finalDayText}</span>${finalDelimiter}`;
                  });
                  return <p key={idx} dangerouslySetInnerHTML={{ __html: html }} />;
                }
                return null;
              })}

              {/* Adult Note Card */}
              <div className="adult-note-card">
                <h4>{youngReadersNotes.title}</h4>
                <p className="adult-note-intro">{youngReadersNotes.intro}</p>
                <ul className="adult-note-list">
                  {youngReadersNotes.items.map((note, noteIdx) => (
                    <li key={noteIdx}>
                      <strong>{note.term}</strong> {note.desc}
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => {
                  router.push('/read/eves-diary');
                }} 
                className="btn-gold return-traditional-btn"
                style={{ marginTop: '3rem' }}
              >
                Return to Traditional Read
              </button>
            </div>
          ) : experience === 'chat' ? (
            <div className="experience-dramatized-excerpt">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                <h3 className="excerpt-main-title" style={{ marginTop: '0.5rem' }}>EVE'S DIARY &mdash; DRAMATIZED EXCERPT</h3>
                <h4 className="excerpt-sub-title">&ldquo;The Reptile, and the First Sorrow&rdquo;</h4>
                <p className="excerpt-running-time">Running time: approximately 4 minutes</p>
                
                <p className="preview-status" style={{ textAlign: 'center', fontFamily: 'var(--font-mono), monospace', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '2rem', textIndent: 0 }}>
                  This configuration is currently in public test mode. Feel free to try it out.
                </p>
              </div>

              <div className="script-cast-section">
                <h5 className="script-cast-header">Cast:</h5>
                <ul className="script-cast-list">
                  <li><strong>EVE</strong> &mdash; young woman, alto, curious, unguarded. Speaks as though thinking aloud.</li>
                  <li><strong>ADAM</strong> &mdash; older man, baritone, slightly weary, observational. Voice of a man writing in a notebook, not performing.</li>
                  <li><strong>NARRATOR</strong> &mdash; neutral voice for date stamps. Can be folded into Eve if preferred.</li>
                </ul>
              </div>

              <div className="script-content-wrapper">
                <div className="script-sound-cue">[SOUND: Birdsong. Distant water. A small rustle of pages.]</div>
                
                <div className="script-entry">
                  <span className="script-speaker">NARRATOR:</span>
                  <div className="script-speech">
                    <p>Saturday.</p>
                  </div>
                </div>

                <div className="script-entry">
                  <span className="script-speaker">EVE:</span>
                  <div className="script-speech">
                    <p>I followed the other Experiment around, yesterday afternoon, at a distance, to see what it might be for, if I could.</p>
                    <p>But I was not able to make it out.</p>
                    <p>I think it is a man. I had never seen a man, but it looked like one, and I feel sure that that is what it is.</p>
                    <p className="script-direction">(slight pause, a private observation)</p>
                    <p>I realize that I feel more curiosity about it than about any of the other reptiles.</p>
                    <p>If it is a reptile &mdash; and I suppose it is &mdash; for it has frowzy hair and blue eyes, and looks like a reptile.</p>
                    <p>It has no hips. It tapers like a carrot. When it stands, it spreads itself apart like a derrick.</p>
                    <p>So I think it is a reptile.</p>
                    <p className="script-direction">(beat)</p>
                    <p>Though it may be architecture.</p>
                  </div>
                </div>

                <div className="script-sound-cue">[SOUND: A small rustle. A bird call.]</div>

                <div className="script-entry">
                  <span className="script-speaker">EVE:</span>
                  <div className="script-speech">
                    <p>I was afraid of it at first, and started to run every time it turned around, for I thought it was going to chase me.</p>
                    <p>But by and by I found it was only trying to get away.</p>
                    <p>So after that, I was not timid any more, but tracked it along, several hours, about twenty yards behind &mdash; which made it nervous and unhappy.</p>
                    <p>At last it was a good deal worried, and climbed a tree.</p>
                    <p>I waited a good while, then gave it up and went home.</p>
                  </div>
                </div>

                <div className="script-sound-cue">[BEAT. SOUND: Wind in leaves.]</div>

                <div className="script-entry">
                  <span className="script-speaker">NARRATOR:</span>
                  <div className="script-speech">
                    <p>Sunday.</p>
                  </div>
                </div>

                <div className="script-entry">
                  <span className="script-speaker">EVE:</span>
                  <div className="script-speech">
                    <p>It is up there yet.</p>
                    <p>Resting, apparently.</p>
                    <p>But that is a subterfuge. Sunday isn't the day of rest. Saturday is appointed for that.</p>
                    <p>It looks to me like a creature that is more interested in resting than in anything else.</p>
                    <p>It would tire me to rest so much.</p>
                    <p className="script-direction">(a small laugh, almost to herself)</p>
                    <p>It tires me just to sit around and watch the tree.</p>
                    <p>I do wonder what it is for. I never see it do anything.</p>
                  </div>
                </div>

                <div className="script-sound-cue">[SOUND: Water. A pause. The mood shifts &mdash; slightly closer mic on Eve.]</div>

                <div className="script-entry">
                  <span className="script-speaker">NARRATOR:</span>
                  <div className="script-speech">
                    <p>Thursday.</p>
                  </div>
                </div>

                <div className="script-entry">
                  <span className="script-speaker">EVE:</span>
                  <div className="script-speech">
                    <p className="script-direction">(quieter, more inward)</p>
                    <p>My first sorrow.</p>
                    <p>Yesterday he avoided me, and seemed to wish I would not talk to him. I could not believe it, and thought there was some mistake &mdash; for I loved to be with him, and loved to hear him talk.</p>
                    <p>And so how could it be that he could feel unkind toward me, when I had not done anything?</p>
                    <p>But at last it seemed true.</p>
                    <p>So I went away, and sat lonely in the place where I first saw him &mdash; the morning that we were made &mdash; and I did not know what he was, and was indifferent about him.</p>
                    <p>But now it was a mournful place. And every little thing spoke of him. And my heart was very sore.</p>
                    <p>I did not know why, very clearly. For it was a new feeling. I had not experienced it before. And it was all a mystery. And I could not make it out.</p>
                  </div>
                </div>

                <div className="script-sound-cue">[SOUND: Rain begins. Soft, sustained.]</div>

                <div className="script-entry">
                  <span className="script-speaker">EVE:</span>
                  <div className="script-speech">
                    <p>But when night came, I could not bear the lonesomeness, and went to the new shelter which he has built &mdash; to ask him what I had done that was wrong, and how I could mend it, and get back his kindness again.</p>
                    <p>But he put me out in the rain.</p>
                    <p className="script-direction">(quiet)</p>
                    <p>And it was my first sorrow.</p>
                  </div>
                </div>

                <div className="script-sound-cue">[BEAT. RAIN CONTINUES. THEN, A SHIFT &mdash; DIFFERENT ROOM TONE. ADAM, OFF-MIC AT FIRST, AS THOUGH READING ALOUD FROM A JOURNAL.]</div>

                <div className="script-entry">
                  <span className="script-speaker">ADAM:</span>
                  <div className="script-speech">
                    <p className="script-direction">(unhurried, dry)</p>
                    <p>Perhaps I ought to remember that she is very young &mdash; a mere girl &mdash; and make allowances.</p>
                    <p>She is all interest, eagerness, vivacity. The world is to her a charm, a wonder, a mystery, a joy.</p>
                    <p>She can't speak for delight when she finds a new flower. She must pet it, and caress it, and smell it, and talk to it, and pour out endearing names upon it.</p>
                    <p className="script-direction">(a small breath, almost a smile)</p>
                    <p>And she is color-mad.</p>
                    <p>Brown rocks, yellow sand, gray moss, green foliage, blue sky. The pearl of the dawn, the purple shadows on the mountains, the golden islands floating in crimson seas at sunset, the pallid moon sailing through the shredded cloud-rack, the star-jewels glittering in the wastes of space &mdash;</p>
                    <p>&mdash; none of them is of any practical value, so far as I can see.</p>
                    <p>But because they have color and majesty, that is enough for her. And she loses her mind over them.</p>
                    <p className="script-direction">(a pause, the voice softening)</p>
                    <p>If she could quiet down and keep still a couple minutes at a time, it would be a reposeful spectacle. In that case I think I could enjoy looking at her.</p>
                    <p>Indeed, I am sure I could.</p>
                    <p>For I am coming to realize that she is a quite remarkably comely creature. Lithe. Slender. Trim. Rounded. Shapely. Nimble. Graceful.</p>
                    <p className="script-direction">(beat)</p>
                    <p>And once, when she was standing marble-white and sun-drenched on a boulder, with her young head tilted back and her hand shading her eyes, watching the flight of a bird in the sky &mdash;</p>
                    <p>&mdash; I recognized that she was beautiful.</p>
                  </div>
                </div>

                <div className="script-sound-cue">[SILENCE. A SINGLE BIRD CALL. FADE.]</div>
                <div className="script-sound-cue">[END EXCERPT]</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', width: '100%' }}>
                <button 
                  onClick={() => {
                    setExperience('traditional');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="btn-gold return-traditional-btn"
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    textAlign: 'center',
                    padding: '0.85rem 2rem',
                    lineHeight: '1.4'
                  }}
                >
                  <span className="typewriter text-[10px] uppercase tracking-widest opacity-80 mb-0.5">Top of Page</span>
                  <span className="font-serif text-sm font-semibold">Return to Traditional Read</span>
                </button>
              </div>
            </div>
          ) : experience === 'voice' ? (
            <div className="experience-dramatized-excerpt">
              {/* Header block (inheriting design from the dramatized excerpt) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                <h3 className="excerpt-main-title" style={{ marginTop: '0.5rem' }}>E-INK &amp; KINDLE EDITION</h3>
                <p className="excerpt-running-time">Optimal formatting for Kindle and e-paper screens</p>
                
                <p className="preview-status" style={{ textAlign: 'center', fontFamily: 'var(--font-mono), monospace', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '2rem', textIndent: 0 }}>
                  This configuration is currently in public test mode. Feel free to try it out.
                </p>
              </div>

              {/* Compilation Panel Section */}
              <div className="script-cast-section" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 1.5rem' }}>
                <h5 className="script-cast-header" style={{ textAlign: 'center !important', alignSelf: 'center', marginBottom: '1.25rem' }}>EPUB Synthesizer</h5>
                <p className="font-serif text-sm leading-relaxed max-w-md mx-auto mb-6" style={{ color: 'rgba(255, 244, 223, 0.7)' }}>
                  Compile Eve's Diary into a standardized, DRM-free `.epub` file optimized for Kindle, Kobo, and modern e-paper screens.
                </p>

                {epubStatus === 'idle' && (
                  <div style={{ marginTop: '1rem' }}>
                    <button 
                      onClick={handleGenerateEpub}
                      className="btn-gold"
                      style={{ padding: '0.75rem 2rem' }}
                    >
                      <span>Compile E-Ink Edition</span>
                    </button>
                  </div>
                )}

                {epubStatus === 'generating' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
                    <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                    <p className="text-xs font-mono text-[var(--primary)] animate-pulse" style={{ margin: 0 }}>
                      Synthesizing chapters, parsing XHTML, packing ZIP...
                    </p>
                  </div>
                )}

                {epubStatus === 'success' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '1rem 0', width: '100%' }}>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Check className="w-6 h-6" />
                    </div>
                    
                    <div>
                      <h4 className="font-serif text-emerald-400 text-lg font-semibold" style={{ margin: 0 }}>Compilation Successful!</h4>
                      <p className="text-xs text-[rgba(255,244,223,0.45)] mt-1 font-mono" style={{ margin: 0 }}>eves-diary.epub ready for download</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                      <a 
                        href={epubUrl}
                        download="eves-diary.epub"
                        className="btn-gold decoration-none"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem 1.5rem' }}
                      >
                        <Download size={16} />
                        <span>Download EPUB Edition</span>
                      </a>
                      
                      <button 
                        onClick={handleCopyLink}
                        className="sources-trigger"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', border: '1px solid rgba(255, 244, 223, 0.15)', padding: '0.65rem 1.5rem', borderRadius: '4px', background: 'transparent' }}
                      >
                        {copyFeedback ? <Check size={16} className="text-emerald-400" /> : <Clipboard size={16} />}
                        <span>{copyFeedback ? 'Copied Link!' : 'Copy Download Link'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {epubStatus === 'error' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
                    <p className="text-red-400 text-sm font-sans" style={{ margin: 0 }}>
                      Failed to compile book: {epubError}
                    </p>
                    <button 
                      onClick={handleGenerateEpub}
                      className="btn-gold"
                      style={{ padding: '0.5rem 1.5rem', fontSize: '0.75rem' }}
                    >
                      Retry Compilation
                    </button>
                  </div>
                )}
              </div>

            </div>

          ) : (
            <div className="experience-design-preview">
              <h3>{experiences.find(e => e.id === experience).label}</h3>
              <p className="preview-status">
                This reading room configuration is currently in public test mode. Feel free to try it out.
              </p>
              <div className="preview-concept">
              </div>
              <button onClick={() => setExperience('traditional')} className="btn-gold return-traditional-btn">
                Return to Traditional Read
              </button>
            </div>
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
                <h3>Diary Index</h3>
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
