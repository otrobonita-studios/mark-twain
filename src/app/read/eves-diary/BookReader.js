'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sun, Moon, Volume2, Cpu, BookOpen, X } from 'lucide-react';
import MediaPlayer from '@/components/MediaPlayer';
import TechDetect from '@/components/TechDetect';
import { motion, AnimatePresence } from 'framer-motion';
import { youngReadersParagraphs, youngReadersGlossary, youngReadersNotes } from './YoungReadersText';

export default function BookReader({ htmlContent, tocItems = [] }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [theme, setTheme] = useState('charcoal'); // 'parchment' | 'charcoal'
  const [fontSize, setFontSize] = useState('small'); // 'small' | 'normal' | 'large'
  const [experience, setExperience] = useState('traditional'); // 'traditional' | 'app' | 'parallax' | 'voice' | 'drama' | 'chat' | 'split' | 'comments' | 'child'
  const [subExperience, setSubExperience] = useState(null); // null | 'young'
  const [isMusicPlayerClosed, setIsMusicPlayerClosed] = useState(false);
  const [isTechDetectClosed, setIsTechDetectClosed] = useState(false);
  const [selectedZoomImage, setSelectedZoomImage] = useState(null);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const experiences = [
    { id: 'drama', label: 'Index', description: 'Navigate the story by Index.' },
    { id: 'traditional', label: 'Traditional Read', description: "Original Gutenberg text and illustrations." },
    { id: 'voice', label: 'Voice-First Edition', description: 'Voice-command navigation and speech narration.' },
    { id: 'chat', label: 'Dramatized Excerpt', description: 'Audio drama script for Eve and Adam.' },
    { id: 'split', label: 'Sung Edition', description: 'Hear the diary set to music.' },
    { id: 'child', label: 'Young Readers', description: 'Simplified text and glossary for young minds.' }
  ];

  const isLoadedRef = useRef(false);
  const readerRef = useRef(null);

  // Load settings from local storage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('eves-diary-theme');
    const savedFontSize = localStorage.getItem('eves-diary-font-size');
    const savedExperience = localStorage.getItem('eves-diary-experience');
    const savedClosed = localStorage.getItem('media-player-closed');
    const savedTechClosed = localStorage.getItem('tech-detect-closed');

    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
    if (savedExperience) {
      if (savedExperience === 'drama') {
        setExperience('traditional');
      } else {
        setExperience(savedExperience);
      }
    }
    setIsMusicPlayerClosed(savedClosed !== null ? savedClosed === 'true' : true);
    setIsTechDetectClosed(savedTechClosed === 'true');

    isLoadedRef.current = true;

    // Listen to media player close-change events
    const handleCloseChange = (e) => {
      setIsMusicPlayerClosed(e.detail.isClosed);
    };

    // Listen to tech-detect close-change events
    const handleTechCloseChange = (e) => {
      setIsTechDetectClosed(e.detail.isClosed);
    };

    window.addEventListener('media-player-close-change', handleCloseChange);
    window.addEventListener('tech-detect-close-change', handleTechCloseChange);
    
    return () => {
      window.removeEventListener('media-player-close-change', handleCloseChange);
      window.removeEventListener('tech-detect-close-change', handleTechCloseChange);
    };
  }, []);

  // Save settings when they change
  useEffect(() => {
    if (!isLoadedRef.current) return;
    localStorage.setItem('eves-diary-theme', theme);
    localStorage.setItem('eves-diary-font-size', fontSize);
    localStorage.setItem('eves-diary-experience', experience);
  }, [theme, fontSize, experience]);

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
        setSelectedZoomImage(img.getAttribute('src'));
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
        setSelectedZoomImage(clickedImg.getAttribute('src'));
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

  const handleReopenTechDetect = () => {
    window.dispatchEvent(new CustomEvent('tech-detect-open'));
  };

  return (
    <div className={`book-reader-container theme-${theme} ${isTocOpen ? 'toc-sidebar-open' : ''}`}>
      {/* Scroll Progress Bar */}
      <div 
        className="reading-progress-bar" 
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Top Header Deck */}
      <header className="book-reader-header">
        <Link href="/" className="book-back-link">
          <ArrowLeft size={16} />
          <span>Writing Desk</span>
        </Link>

        <div className="book-reader-controls">
          {/* Font Size Selector */}
          <div className="font-size-selector">
            <button 
              onClick={() => setFontSize('small')}
              className={`size-btn ${fontSize === 'small' ? 'active' : ''}`}
              title="Small text size (Standard)"
            >
              Small
            </button>
            <button 
              onClick={() => setFontSize('normal')}
              className={`size-btn ${fontSize === 'normal' ? 'active' : ''}`}
              title="Normal text size"
            >
              Normal
            </button>
            <button 
              onClick={() => setFontSize('large')}
              className={`size-btn ${fontSize === 'large' ? 'active' : ''}`}
              title="Large text size"
            >
              Large
            </button>
          </div>

          {/* Reopen Tech Detect Icon (only if closed) */}
          {isTechDetectClosed && (
            <button 
              onClick={handleReopenTechDetect} 
              className="book-control-btn reopen-music-btn" 
              title="Open Tech Detect Window"
              style={{ marginRight: '0.45rem' }}
            >
              <Cpu size={16} />
            </button>
          )}

          {/* Reopen Music Icon (only if closed) */}
          {isMusicPlayerClosed && (
            <button 
              onClick={handleReopenMusic} 
              className="book-control-btn reopen-music-btn" 
              title="Open Music Player"
            >
              <Volume2 size={16} />
            </button>
          )}

          {/* Theme Selector */}
          <button 
            onClick={() => setTheme(theme === 'parchment' ? 'charcoal' : 'parchment')}
            className="book-control-btn theme-toggle"
            title={`Switch to ${theme === 'parchment' ? 'Charcoal' : 'Parchment'} theme`}
          >
            {theme === 'parchment' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      {/* Reading Desk */}
      <main className="book-page-desk" ref={readerRef}>
        <article 
          className={`book-page-parchment font-serif size-${fontSize}`}
          onClick={handleArticleClick}
        >
          <div className="book-epigraph">
            “Wheresoever she was, there was Eden.”
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
                      setSubExperience(null);
                      if (exp.id === 'drama') {
                        if (!isTocOpen) {
                          setIsTocOpen(true);
                          setExperience('traditional');
                        } else if (experience !== 'traditional') {
                          setExperience('traditional');
                        } else {
                          setIsTocOpen(false);
                        }
                      } else {
                        setExperience(exp.id);
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
          ) : (experience === 'child' && subExperience === 'young') ? (
            <div className="book-text-content young-readers-reading-view">
              
              {youngReadersParagraphs.map((item, idx) => {
                if (item.type === 'title') {
                  return <h1 key={idx} className="young-readers-title">{item.text}</h1>;
                }
                if (item.type === 'subtitle') {
                  return <h2 key={idx} className="young-readers-subtitle">{item.text}</h2>;
                }
                if (item.type === 'section') {
                  return <h2 key={idx} className="young-readers-section-header">{item.text}</h2>;
                }
                if (item.type === 'illustrator') {
                  return <h3 key={idx} className="young-readers-illustrator">{item.text}</h3>;
                }
                if (item.type === 'paragraph') {
                  // Parse brackets [word] into glossary term spans
                  let html = item.text.replace(/\[(.*?)\]/g, (match, word) => {
                    const cleanWord = word.toLowerCase();
                    const def = youngReadersGlossary[cleanWord] || "";
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
                  setSubExperience(null);
                  setExperience('traditional');
                }} 
                className="btn-gold return-traditional-btn"
                style={{ marginTop: '3rem' }}
              >
                Return to Traditional Read
              </button>
            </div>
          ) : experience === 'child' ? (
            <div className="experience-younger-readers">
              <h3>For Younger Readers</h3>
              <div className="preview-concept">
                Two doors into the Garden. Choose the one that fits.
              </div>
              <div className="edition-choice">
                <div className="edition-card">
                  <h4>Young Readers</h4>
                  <p className="edition-ages">Ages 7–9</p>
                  <p className="edition-description">
                    Eve's first days in the Garden — her arrival, her discoveries, her invention of fire, and the moment Adam finally sees her. Twain's voice with a gentle hand on the harder words. Hover any underlined word for a kind definition.
                  </p>
                  <button onClick={() => setSubExperience('young')} className="btn-gold return-traditional-btn">Start Reading</button>
                </div>
                <div className="edition-card">
                  <h4>Middle Grade</h4>
                  <p className="edition-ages">Ages 10–14</p>
                  <p className="edition-description">
                    The complete diary, from Eve's first day in the Garden to Adam's words at her grave. Twain's prose untouched, with a glossary for the harder words. Paired with <em>Extracts from Adam's Diary</em> — the same story from the other side.
                  </p>
                  <button onClick={() => setExperience('traditional')} className="btn-gold return-traditional-btn">Start Reading</button>
                </div>
              </div>
            </div>
          ) : experience === 'chat' ? (
            <div className="experience-dramatized-excerpt">
              <div className="preview-stamp">DESIGN PHASE</div>
              <h3 className="excerpt-main-title">EVE'S DIARY &mdash; DRAMATIZED EXCERPT</h3>
              <h4 className="excerpt-sub-title">&ldquo;The Reptile, and the First Sorrow&rdquo;</h4>
              <p className="excerpt-running-time">Running time: approximately 4 minutes</p>
              
              <p className="preview-status">
                This configuration is currently in layout design.
              </p>

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

              <button onClick={() => setExperience('traditional')} className="btn-gold return-traditional-btn">
                Return to Traditional Read
              </button>
            </div>
          ) : (
            <div className="experience-design-preview">
              <div className="preview-stamp">DESIGN PHASE</div>
              <h3>{experiences.find(e => e.id === experience).label}</h3>
              <p className="preview-status">
                This reading room configuration is currently in layout design.
              </p>
              <div className="preview-concept">
                {experience === 'voice' && "Coming to an appstore on your mobile device."}
                {experience === 'drama' && "Concept: A multi-track audio player syncing background ambient tracks with segmented character dialogues for Adam and Eve."}
              </div>
              <button onClick={() => setExperience('traditional')} className="btn-gold return-traditional-btn">
                Return to Traditional Read
              </button>
            </div>
          )}
        </article>
      </main>

      {/* Persistent Audio Player */}
      <MediaPlayer />

      {/* Persistent Tech Detect Window */}
      <TechDetect />



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
