'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Sun, Moon, BookOpen, X, Search, Bookmark, MessageSquare, Send, Copy, Check, Loader2, Download, Clipboard, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MarkTwainLetterCard from './MarkTwainLetterCard';
import { soundtrack } from '@/data/soundtrack';
import { youngReadersParagraphs, youngReadersGlossary, youngReadersNotes } from '@/app/read/eves-diary/YoungReadersText';
import { storyProvenance } from '@/data/provenance';

export default function GenericBookReader({ 
  document: propDocument, 
  bookSlug, 
  htmlContent, 
  tocItems: propTocItems, 
  bookTitle, 
  showExperienceSelector = true, 
  headerExtra = null,
  defaultTypeface = 'georgia',
  defaultTheme = 'charcoal',
  customFonts = ['georgia', 'inter'],
  customThemes = null,
  defaultExperience = 'traditional'
}) {
  const progressRef = useRef(null);
  const readerRef = useRef(null);
  const chatInputRef = useRef(null);

  // Normalize document prop or fallback to htmlContent
  const documentModel = useMemo(() => {
    if (propDocument) return propDocument;

    // Fallback: construct a ReaderDocument from htmlContent
    const sections = [];
    if (htmlContent) {
      sections.push({
        id: 'main',
        title: bookTitle || 'About',
        blocks: [
          {
            kind: 'html',
            id: 'raw-html-block',
            text: htmlContent
          }
        ]
      });
    }

    return {
      meta: {
        id: bookSlug || 'about',
        type: 'book',
        title: bookTitle || 'About',
        author: 'Mark Twain',
        language: 'en'
      },
      manifest: {
        editions: ['traditional'],
        contentStates: {
          sanitized: htmlContent?.includes('{var_nword') || false,
          languages: ['en'],
          mkiiLayer: htmlContent?.includes('class="mkii-note"') || htmlContent?.includes('class="adult-note-card"') || false
        },
        illustrationStyles: ['original'],
        features: {
          mkiiChat: true,
          quote: true,
          bookmarks: true,
          search: true,
          contents: true
        }
      },
      sections
    };
  }, [propDocument, htmlContent, bookTitle, bookSlug]);

  const themes = useMemo(() => {
    const baseThemes = {
      light: {
        bg: '#ffffff',
        fg: '#000000',
        muted: 'rgba(0, 0, 0, 0.6)',
        border: 'rgba(0, 0, 0, 0.1)'
      },
      sepia: {
        bg: '#f5eedc',
        fg: '#2c1f11',
        muted: 'rgba(44, 31, 17, 0.65)',
        border: 'rgba(44, 31, 17, 0.1)'
      },
      charcoal: {
        bg: '#15110d',
        fg: 'rgba(255, 244, 223, 0.95)',
        muted: 'rgba(255, 244, 223, 0.55)',
        border: 'rgba(255, 244, 223, 0.12)'
      }
    };
    if (customThemes) {
      return { ...baseThemes, ...customThemes };
    }
    return baseThemes;
  }, [customThemes]);

  // Reading preferences & state
  const [theme, setTheme] = useState(defaultTheme);
  const [textSize, setTextSize] = useState(2); // 1 = small, 2 = normal, 3 = large
  const [typeface, setTypeface] = useState(defaultTypeface);
  const [contrast, setContrast] = useState('normal'); // 'soft' | 'normal' | 'high'
  const [wordSetting, setWordSetting] = useState('sanitized'); // 'original' | 'sanitized'
  const [experience, setExperience] = useState(defaultExperience); // traditional, split, child, chat, voice

  const [bookmarks, setBookmarks] = useState([]);
  const [collapsedNotes, setCollapsedNotes] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, text: '' });

  // Layout drawers
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isBookmarkMenuOpen, setIsBookmarkMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDisplayMenuOpen, setIsDisplayMenuOpen] = useState(false);
  const [isMkiiChatOpen, setIsMkiiChatOpen] = useState(false);

  // Helper to toggle a menu and close others
  const toggleMenu = (menuName) => {
    setIsTocOpen(menuName === 'toc' ? !isTocOpen : false);
    setIsBookmarkMenuOpen(menuName === 'bookmark' ? !isBookmarkMenuOpen : false);
    setIsSearchOpen(menuName === 'search' ? !isSearchOpen : false);
    setIsDisplayMenuOpen(menuName === 'display' ? !isDisplayMenuOpen : false);
    setIsMkiiChatOpen(menuName === 'chat' ? !isMkiiChatOpen : false);
    
    // Dispatch event to close global navigation menu when opening a local menu
    if (menuName) {
      window.dispatchEvent(new CustomEvent('close-global-nav'));
    }
  };

  const handleToggleGlobalNav = () => {
    // Close all local menus
    setIsTocOpen(false);
    setIsBookmarkMenuOpen(false);
    setIsSearchOpen(false);
    setIsDisplayMenuOpen(false);
    setIsMkiiChatOpen(false);
    window.dispatchEvent(new CustomEvent('toggle-global-nav'));
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatContext, setChatContext] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});

  // EPUB Synthesis state (for voice/e-ink experience)
  const [epubStatus, setEpubStatus] = useState('idle'); // 'idle' | 'generating' | 'success' | 'error'
  const [epubUrl, setEpubUrl] = useState('');
  const [epubError, setEpubError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Header auto-hiding scroll state
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Zoom modal image
  const [selectedZoomImage, setSelectedZoomImage] = useState(null);

  // Resolve font-family property for typography scoping
  const activeFontFamily = useMemo(() => {
    if (typeface === 'inter') return "'Inter', system-ui, -apple-system, sans-serif";
    if (typeface === 'georgia') return "Georgia, serif";
    return typeface;
  }, [typeface]);

  // Load preferences and document states on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('twain-pref-theme');
    const savedSize = localStorage.getItem('twain-pref-size');
    const savedTypeface = localStorage.getItem('twain-pref-typeface');
    const savedContrast = localStorage.getItem('twain-pref-contrast');
    const savedWord = localStorage.getItem('twain-word-setting');
    const savedExperience = sessionStorage.getItem(`twain-pref-exp-${bookSlug}`);

    const savedBookmarks = localStorage.getItem(`twain-bookmarks-${bookSlug}`);
    const savedCollapsed = localStorage.getItem(`twain-collapsed-${bookSlug}`);

    setTimeout(() => {
      let normalizedTheme = savedTheme;
      if (savedTheme === 'light' || savedTheme === 'sepia') {
        normalizedTheme = 'parchment';
      }
      setTheme(normalizedTheme || defaultTheme);
      if (savedSize) setTextSize(parseInt(savedSize));
      
      let normalizedTypeface = savedTypeface;
      if (savedTypeface === 'newsreader' || savedTypeface === 'fraunces') {
        normalizedTypeface = 'inter';
      }
      setTypeface(normalizedTypeface || defaultTypeface);
      if (savedContrast) setContrast(savedContrast);
      if (savedWord) setWordSetting(savedWord);
      if (savedExperience) setExperience(savedExperience);

      if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
      if (savedCollapsed) setCollapsedNotes(JSON.parse(savedCollapsed));
    }, 0);

    // Restore scroll position
    const savedPosition = localStorage.getItem(`twain-position-${bookSlug}`);
    if (savedPosition) {
      setTimeout(() => {
        const el = window.document.getElementById(savedPosition);
        if (el) {
          el.scrollIntoView({ block: 'start' });
        }
      }, 300);
    }
  }, [bookSlug, defaultTheme, defaultTypeface]);

  // Save preferences on change
  const savePref = (key, val) => {
    localStorage.setItem(key, val);
  };

  const handleWordSettingChange = (newSetting) => {
    setWordSetting(newSetting);
    savePref('twain-word-setting', newSetting);
  };

  const handleToggleBookmark = () => {
    const currentId = getFirstVisibleElementId();
    if (!currentId) return;

    let newBookmarks;
    if (bookmarks.includes(currentId)) {
      newBookmarks = bookmarks.filter(id => id !== currentId);
    } else {
      newBookmarks = [...bookmarks, currentId];
    }
    setBookmarks(newBookmarks);
    localStorage.setItem(`twain-bookmarks-${bookSlug}`, JSON.stringify(newBookmarks));
  };

  const handleToggleNoteCollapse = (noteId) => {
    const next = { ...collapsedNotes, [noteId]: !collapsedNotes[noteId] };
    setCollapsedNotes(next);
    localStorage.setItem(`twain-collapsed-${bookSlug}`, JSON.stringify(next));
  };

  // Determine if book contains sanitization variables
  const hasSanitization = useMemo(() => {
    if (!documentModel) return false;
    return documentModel.manifest.contentStates.sanitized;
  }, [documentModel]);

  // Word-setting text resolution
  const resolveText = useCallback((text) => {
    if (!text) return '';
    if (!hasSanitization) return text;
    const isOriginal = wordSetting === 'original';
    return text
      .replace(/{var_nword_possessive}/g, isOriginal ? "nigger's" : "slave's")
      .replace(/{var_nwords}/g, isOriginal ? 'niggers' : 'slaves')
      .replace(/{var_Nwords}/g, isOriginal ? 'Niggers' : 'Slaves')
      .replace(/{var_nword}/g, isOriginal ? 'nigger' : 'slave')
      .replace(/{var_Nword}/g, isOriginal ? 'Nigger' : 'Slave');
  }, [hasSanitization, wordSetting]);

  // Derived TOC items
  const tocItems = useMemo(() => {
    if (propTocItems && propTocItems.length > 0) return propTocItems;
    if (!documentModel) return [];
    return documentModel.sections.map(sec => ({
      id: sec.id,
      label: sec.title || sec.id,
      type: sec.id.startsWith('day-') ? 'day' : 'section'
    }));
  }, [propTocItems, documentModel]);

  const activeChapterTitle = useMemo(() => {
    const activeSec = documentModel?.sections.find(s => s.id === activeId);
    return activeSec ? activeSec.title : '';
  }, [documentModel, activeId]);

  // Track active TOC heading and scroll position
  useEffect(() => {
    if (tocItems.length === 0) return;

    const handleScrollActiveItem = () => {
      const elements = tocItems.map(item => window.document.getElementById(item.id)).filter(Boolean);
      let currentActiveId = null;

      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 160) {
          currentActiveId = el.id;
        } else {
          break;
        }
      }

      const newActiveId = currentActiveId || tocItems[0].id;
      setActiveId(prev => {
        if (prev !== newActiveId) {
          localStorage.setItem(`twain-position-${bookSlug}`, newActiveId);
          return newActiveId;
        }
        return prev;
      });
    };

    window.addEventListener('scroll', handleScrollActiveItem);
    handleScrollActiveItem();

    return () => window.removeEventListener('scroll', handleScrollActiveItem);
  }, [tocItems, bookSlug]);

  // Monitor page scroll progress
  useEffect(() => {
    const handleScrollProgress = () => {
      const totalHeight = window.document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        if (progressRef.current) {
          progressRef.current.style.width = `${progress}%`;
        }
      }
    };

    window.addEventListener('scroll', handleScrollProgress);
    return () => window.removeEventListener('scroll', handleScrollProgress);
  }, []);

  // Auto-focus chat input when drawer opens
  useEffect(() => {
    if (isMkiiChatOpen && chatInputRef.current) {
      const timer = setTimeout(() => {
        chatInputRef.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMkiiChatOpen]);

  const getFirstVisibleElementId = () => {
    const elements = window.document.querySelectorAll('.book-text-content [id]');
    let closestId = null;
    let minDistance = Infinity;
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.top >= 0 && rect.top < minDistance) {
        minDistance = rect.top;
        closestId = el.id;
      }
    }
    return closestId || (documentModel?.sections[0] && documentModel.sections[0].id);
  };

  const getElementSnippet = (id) => {
    const el = window.document.getElementById(id);
    if (!el) return id;
    const text = el.innerText || el.textContent || '';
    return text.substring(0, 30).trim() + (text.length > 30 ? '...' : '');
  };

  const scrollToId = (id) => {
    const element = window.document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = window.document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      setIsTocOpen(false);
    }
  };

  // Image zoom click intercept
  const handleArticleClick = (e) => {
    const wrapper = e.target.closest('.circle-img-wrapper');
    if (wrapper) {
      const img = wrapper.querySelector('.in-paragraph-img') || wrapper.querySelector('img');
      if (img) {
        setSelectedZoomImage(img.getAttribute('data-zoom-src') || img.getAttribute('src'));
        return;
      }
    }

    const clickedImg = e.target.closest('img');
    if (clickedImg) {
      const isBookImage = clickedImg.closest('.book-text-content') || 
                          clickedImg.closest('.book-cover-trio') || 
                          clickedImg.closest('.book-epigraph') || 
                          clickedImg.closest('.paragraph-with-image') ||
                          clickedImg.closest('.fig');
      if (isBookImage) {
        setSelectedZoomImage(clickedImg.getAttribute('data-zoom-src') || clickedImg.getAttribute('src'));
      }
    }
  };

  // Live in-book search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = [];
    const lowerQuery = query.toLowerCase();

    documentModel.sections.forEach(sec => {
      sec.blocks.forEach(block => {
        if (block.text && block.text.toLowerCase().includes(lowerQuery)) {
          const plainText = block.text.replace(/<[^>]+>/g, '');
          const idx = plainText.toLowerCase().indexOf(lowerQuery);
          const start = Math.max(0, idx - 40);
          const end = Math.min(plainText.length, idx + query.length + 40);
          let snippet = plainText.substring(start, end);
          if (start > 0) snippet = '...' + snippet;
          if (end < plainText.length) snippet = snippet + '...';

          results.push({
            id: block.id,
            sectionTitle: sec.title || 'Introduction',
            snippet
          });
        }
      });
    });

    setSearchResults(results);
  };

  // RAG Chat support
  const handleSendChatMessage = async (textToSend, excerptToSend) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    setChatInput('');
    setChatLoading(true);

    const newMessages = [...chatMessages, { role: 'user', content: text }];
    setChatMessages(newMessages);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          excerpt: excerptToSend || (chatContext ? chatContext.passage : undefined),
          history: chatMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [
          ...prev,
          {
            role: 'model',
            content: data.response,
            sources: data.sources || [],
            translation: data.translation || ''
          }
        ]);
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            role: 'model',
            content: `Apologies. I hit a snag in the line: ${data.error || 'Unknown error'}`
          }
        ]);
      }
    } catch (e) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: 'The telegraph lines seem tangled. Please check back shortly.'
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Selection to prefill chat context
  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

      const selectedText = sel.toString().trim();
      if (selectedText.length > 5 && selectedText.length < 500) {
        setChatContext({
          chapter: activeChapterTitle || 'Read Book',
          passage: selectedText
        });
      }
    };

    window.document.addEventListener('mouseup', handleMouseUp);
    return () => window.document.removeEventListener('mouseup', handleMouseUp);
  }, [activeChapterTitle]);

  // EPUB Synthesis (for Voice/E-Ink mode)
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

  // Determine soundtrack support
  const trackIndex = soundtrack.findIndex(t => t.id.toLowerCase() === (bookSlug || "").toLowerCase());
  const hasTrack = trackIndex !== -1;

  // Sound track dispatch
  useEffect(() => {
    if (experience === 'split' && hasTrack) {
      window.dispatchEvent(new CustomEvent('media-player-open'));
      window.dispatchEvent(new CustomEvent('media-player-select-track-request', { detail: { index: trackIndex } }));
      window.dispatchEvent(new CustomEvent('media-player-play-request'));
    }
  }, [experience, hasTrack, trackIndex]);

  // Manifest dynamic configurations
  const isEvesDiary = bookSlug === 'eves-diary' || bookSlug === 'Eves-Diary-young-readers';
  const experiencesList = useMemo(() => {
    return [
      { id: 'drama', label: 'Index', description: 'Navigate the story by Index.', supported: true },
      { id: 'traditional', label: 'Traditional Read', description: 'Original text and illustrations as published.', supported: true },
      { id: 'voice', label: 'E-Ink and Kindle', description: 'Optimal formatting for e-paper.', supported: isEvesDiary },
      { id: 'chat', label: 'Dramatized Excerpt', description: 'Audio drama script.', supported: isEvesDiary },
      { id: 'split', label: 'Sung Edition', description: hasTrack ? 'Hear the book set to music.' : 'Hear the book set to music. (Unavailable)', supported: hasTrack },
      { id: 'child', label: 'Young Readers', description: 'Simplified text and glossary.', supported: isEvesDiary }
    ];
  }, [isEvesDiary, hasTrack]);

  // Render a structured block based on its kind
  const renderBlock = (block) => {
    if (block.kind === 'heading') {
      const Tag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3';
      return (
        <Tag 
          key={block.id} 
          id={block.id} 
          className="text-center font-serif text-[var(--primary)] font-bold mt-8 mb-4" 
          dangerouslySetInnerHTML={{ __html: resolveText(block.text) }} 
        />
      );
    }

    if (block.kind === 'html') {
      return (
        <div 
          key={block.id} 
          id={block.id} 
          dangerouslySetInnerHTML={{ __html: resolveText(block.text) }} 
        />
      );
    }

    if (block.kind === 'p') {
      return (
        <p 
          key={block.id} 
          id={block.id} 
          className={block.conversation ? 'conversation-line' : ''} 
          dangerouslySetInnerHTML={{ __html: resolveText(block.text) }} 
        />
      );
    }

    if (block.kind === 'figure') {
      const activeStyle = block.styles.find(s => s.id === 'original') || block.styles[0];
      if (!activeStyle) return null;
      return (
        <div key={block.id} id={block.id} className="fig my-6 max-w-[60%] mx-auto text-center">
          <img src={activeStyle.src} alt={block.caption || ''} className="w-full h-auto rounded border border-[var(--border)]" />
          {block.caption && <span className="block text-xs text-[var(--muted-foreground)] mt-1.5">{block.caption}</span>}
        </div>
      );
    }

    if (block.kind === 'note') {
      const isCollapsed = collapsedNotes[block.id];
      return (
        <div key={block.id} id={block.id} className={`mkii-note-card my-4 p-4 border-l-2 border-[var(--primary)] rounded-r bg-[rgba(255,244,223,0.03)] text-sm transition-all duration-200 ${isCollapsed ? 'collapsed py-2' : ''}`}>
          <div className="flex items-center justify-between select-none cursor-pointer" onClick={() => handleToggleNoteCollapse(block.id)}>
            <span className="typewriter text-[9px] uppercase tracking-widest text-[var(--primary)] font-bold">
              Mark Twain · MkII {isCollapsed ? '· Collapsed' : ''}
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              {isCollapsed ? 'Expand +' : 'Collapse -'}
            </span>
          </div>
          {!isCollapsed && (
            <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)] italic font-sans" dangerouslySetInnerHTML={{ __html: block.text }} />
          )}
        </div>
      );
    }

    return null;
  };

  const renderProvenanceAlert = (slug) => {
    if (!slug) return null;
    const info = storyProvenance[slug] || Object.entries(storyProvenance).find(([k]) => k.toLowerCase() === slug.toLowerCase())?.[1];
    if (!info) return null;

    const currentBookSlug = bookSlug;
    const otherAppearances = (info.reprints || []).filter(rep => rep.slug.toLowerCase() !== currentBookSlug.toLowerCase());

    const isCanonicalSelf = info.canonical.slug && info.canonical.slug.toLowerCase() === currentBookSlug.toLowerCase();

    return (
      <div 
        className={`provenance-alert-banner ${
          theme === 'parchment' 
            ? 'bg-[#ebe1cd]/30 border border-[#2c1f11]/15 text-[#2c1f11]' 
            : 'bg-[rgba(217,163,74,0.05)] border border-[#d9a34a]/30 text-[rgba(255,244,223,0.95)]'
        } rounded p-4 my-6 text-xs text-left max-w-2xl mx-auto leading-relaxed font-sans`}
      >
        <div className="flex items-start gap-2.5">
          <span className="text-sm select-none" style={{ color: theme === 'parchment' ? '#8b5a2b' : '#d9a34a' }}>📖</span>
          <div>
            <p className="margin-0 font-bold uppercase tracking-wider mb-1" style={{ color: theme === 'parchment' ? '#8b5a2b' : '#d9a34a', fontSize: '10px' }}>
              Publishing Provenance
            </p>
            <p className="m-0 mb-1.5 font-sans">
              This {info.genre} was canonically published in{' '}
              {info.canonical.slug && !isCanonicalSelf ? (
                <Link href={`/read/${info.canonical.slug}`} className="underline font-bold hover:opacity-85 transition-opacity" style={{ color: 'inherit' }}>
                  {info.canonical.title}
                </Link>
              ) : (
                <strong>{info.canonical.title}</strong>
              )}
              {' '}({info.canonical.year}).
            </p>
            {otherAppearances.length > 0 && (
              <p className="m-0 opacity-80 font-sans">
                Also appears in:{' '}
                {otherAppearances.map((app, index) => (
                  <span key={app.slug}>
                    {index > 0 && ", "}
                    <Link href={`/read/${app.slug}`} className="underline hover:opacity-85 transition-opacity" style={{ color: 'inherit' }}>
                      {app.title}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const bookProvenance = useMemo(() => {
    if (!bookSlug) return null;
    const info = storyProvenance[bookSlug] || Object.entries(storyProvenance).find(([k]) => k.toLowerCase() === bookSlug.toLowerCase())?.[1];
    return info || null;
  }, [bookSlug]);

  return (
    <div className={`book-reader-container theme-${theme} ${isTocOpen ? 'toc-sidebar-open' : ''}`}>
      <style jsx>{`
        /* Self-contained CSS parameters. Do not pollute global typography */
        .contrast-soft {
          --font-weight-override: 400;
          --foreground-opacity: 0.75;
        }
        .contrast-normal {
          --font-weight-override: 400;
          --foreground-opacity: 0.95;
        }
        .contrast-high {
          --font-weight-override: 600;
          --foreground-opacity: 1;
        }

        /* Scoped styling directly under the book page element */
        .book-page-parchment.contrast-soft :global(p) {
          font-weight: 400;
          opacity: 0.75;
        }
        .book-page-parchment.contrast-normal :global(p) {
          font-weight: 400;
          opacity: 0.95;
        }
        .book-page-parchment.contrast-high :global(p) {
          font-weight: 600;
          opacity: 1;
        }

        /* Young Readers Adapted Glossary Term Spans */
        :global(.glossary-term) {
          position: relative;
          text-decoration: underline dotted var(--primary);
          cursor: help;
          font-weight: 500;
          color: var(--primary);
        }
        :global(.glossary-term)::after {
          content: attr(data-definition);
          position: absolute;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%) scale(0.95);
          background-color: #1c1814;
          color: rgba(255, 244, 223, 0.95);
          padding: 0.6rem 0.8rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 244, 223, 0.15);
          font-size: 0.75rem;
          white-space: normal;
          width: max-content;
          max-width: 600px;
          z-index: 50;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          pointer-events: none;
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.4;
          text-align: center;
          opacity: 0;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        :global(.glossary-term):hover::after {
          opacity: 1;
          transform: translateX(-50%) scale(1);
        }
        :global(.adult-note-card) {
          margin-top: 3rem;
          padding: 1.5rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background-color: rgba(255, 244, 223, 0.03);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        /* Scoped Custom Theme: Sepia support */
        :global(.theme-sepia) {
          --background: #f5eedc;
          --card: #ede4cd;
          --foreground: #2c1f11;
          --muted-foreground: rgba(44, 31, 17, 0.65);
          --border: rgba(44, 31, 17, 0.15);
          --primary: #8b5a2b;
        }
      `}</style>

      {/* Reading Progress Bar */}
      <div ref={progressRef} className="reading-progress-bar" style={{ width: '0%' }} />

      {/* Running Title (Discreet Centered Header) */}
      <div className={`fixed top-0 left-0 right-0 h-10 flex items-center justify-center bg-[var(--background)] border-b border-[var(--border)] z-20 pointer-events-none transition-opacity duration-300 ${!isHeaderVisible ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-[10px] font-sans uppercase tracking-widest text-[var(--muted-foreground)]">
          {documentModel.meta.title} {activeChapterTitle ? `· ${activeChapterTitle}` : ''}
        </span>
      </div>

      {/* Header Toolbar */}
      <header className={`book-reader-header fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--background)] z-30 transition-transform duration-300 font-sans ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => toggleMenu('search')} className="book-control-btn" title="Search Book">
            <Search size={16} />
          </button>
          <Link href="/complete-works" className="text-xs uppercase tracking-wider text-[var(--primary)] font-sans decoration-none hover:text-white transition-colors" style={{ textDecoration: 'none' }}>
            ‹ The Library
          </Link>
          <span className="text-xs text-[var(--muted-foreground)] select-none">|</span>
          <span className="text-xs font-sans text-[var(--foreground)] font-semibold truncate max-w-[120px] md:max-w-[240px]">
            {documentModel.meta.title}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Bookmark Dropdown */}
          <div className="relative font-sans">
            <button onClick={() => toggleMenu('bookmark')} className={`book-control-btn ${bookmarks.includes(activeId) ? 'text-[var(--primary)]' : ''}`} title="Bookmarks">
              <Bookmark size={16} className={bookmarks.includes(activeId) ? 'fill-current' : ''} />
            </button>
            <AnimatePresence>
              {isBookmarkMenuOpen && (
                <motion.div 
                  className={`absolute right-0 mt-2 w-64 rounded shadow-lg p-4 z-50 text-[var(--foreground)] font-sans border ${
                    theme === 'parchment'
                      ? 'bg-[#fdfaf2] border-[#2c1f11]/15'
                      : 'bg-[#1c1814] border-[rgba(255,244,223,0.08)]'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <button onClick={handleToggleBookmark} className="w-full text-center py-2 px-3 bg-[var(--primary)] text-[#15110d] rounded text-xs font-semibold mb-3 font-sans hover:bg-[var(--primary-hover)] transition-colors">
                    {bookmarks.includes(activeId) ? 'Remove Bookmark Here' : 'Bookmark this Spot'}
                  </button>
                  <div className={`border-t pt-2 max-h-40 overflow-y-auto custom-scrollbar font-sans ${
                    theme === 'parchment' ? 'border-[#2c1f11]/10' : 'border-[rgba(255,244,223,0.06)]'
                  }`}>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] block mb-1 font-sans">Your Bookmarks</span>
                    {bookmarks.length === 0 ? (
                      <span className="text-xs text-[var(--muted-foreground)] italic font-sans">No bookmarks saved</span>
                    ) : (
                      bookmarks.map(id => (
                        <button 
                          key={id} 
                          onClick={() => { scrollToId(id); setIsBookmarkMenuOpen(false); }} 
                          className={`block w-full text-left py-1.5 px-2 text-xs truncate border-none bg-transparent font-sans rounded transition-colors ${
                            theme === 'parchment'
                              ? 'text-[#2c1f11] hover:bg-[rgba(44,31,17,0.04)]'
                              : 'text-[rgba(255,244,223,0.85)] hover:bg-[rgba(255,244,223,0.04)]'
                          }`}
                        >
                          {getElementSnippet(id)}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button onClick={() => toggleMenu('display')} className="book-control-btn" title="Display Settings">
            <span className="font-sans font-bold text-sm">Aa</span>
          </button>

          <button onClick={() => toggleMenu('chat')} className="book-control-btn text-[var(--primary)]" title="Ask Mark MkII">
            <MessageSquare size={16} />
          </button>

          <button onClick={() => toggleMenu('toc')} className="book-control-btn" title="Index">
            <BookOpen size={16} />
          </button>

          <button onClick={handleToggleGlobalNav} className="book-control-btn" title="Navigation Desk">
            <Menu size={16} />
          </button>
        </div>
      </header>

      {/* Aa Settings Panel */}
      <AnimatePresence>
        {isDisplayMenuOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setIsDisplayMenuOpen(false)}>
            <div className={`absolute right-6 top-16 w-80 rounded-lg p-5 text-[var(--foreground)] font-sans border shadow-2xl ${
              theme === 'parchment'
                ? 'bg-[#fdfaf2] border-[#2c1f11]/15'
                : 'bg-[#1c1814] border-[rgba(255,244,223,0.08)]'
            }`} onClick={e => e.stopPropagation()}>
              <h3 className={`font-sans text-lg font-bold mb-4 border-b pb-2 ${
                theme === 'parchment' ? 'border-[#2c1f11]/10' : 'border-[rgba(255,244,223,0.06)]'
              }`}>Display</h3>
              
              {/* Themes */}
              <div className="mb-4 font-sans">
                <span className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] block mb-2 font-sans">Theme</span>
                <div className="grid grid-cols-2 gap-2">
                  {['parchment', 'charcoal'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => { setTheme(t); savePref('twain-pref-theme', t); }} 
                      className={`py-1.5 px-2 text-xs font-semibold rounded border transition-colors font-sans ${
                        theme === t 
                          ? 'bg-[var(--primary)] text-[#15110d] border-[var(--primary)]' 
                          : 'bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--primary)]'
                      }`}
                    >
                      {t === 'parchment' ? 'Light' : 'Dark'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Sizes */}
              <div className="mb-4 font-sans">
                <span className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] block mb-2 font-sans">Text Size</span>
                <div className="flex justify-between items-center gap-1.5 font-sans">
                  {[1, 2, 3].map(s => (
                    <button 
                      key={s} 
                      onClick={() => { setTextSize(s); savePref('twain-pref-size', s); }} 
                      className={`size-8 rounded-full border flex items-center justify-center font-sans transition-colors ${
                        textSize === s 
                          ? 'bg-[var(--primary)] text-[#15110d] border-[var(--primary)]' 
                          : 'bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--primary)]'
                      }`}
                    >
                      {s === 1 ? 'A' : s === 2 ? 'A+' : 'A++'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typefaces */}
              <div className="mb-4 font-sans">
                <span className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] block mb-2 font-sans">Typeface</span>
                <div className="grid grid-cols-2 gap-2 font-sans">
                  {customFonts.map(f => (
                    <button 
                      key={f} 
                      onClick={() => { setTypeface(f); savePref('twain-pref-typeface', f); }} 
                      className={`py-1.5 px-2 text-xs font-semibold rounded border transition-colors font-sans ${
                        typeface === f 
                          ? 'bg-[var(--primary)] text-[#15110d] border-[var(--primary)]' 
                          : 'bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--primary)]'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contrast */}
              <div className="mb-4 font-sans">
                <span className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] block mb-2 font-sans">Contrast / Weight</span>
                <div className="grid grid-cols-3 gap-2 font-sans">
                  {['soft', 'normal', 'high'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => { setContrast(c); savePref('twain-pref-contrast', c); }} 
                      className={`py-1.5 px-2 text-xs font-semibold rounded border transition-colors font-sans ${
                        contrast === c 
                          ? 'bg-[var(--primary)] text-[#15110d] border-[var(--primary)]' 
                          : 'bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--primary)]'
                      }`}
                    >
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sanitization toggle */}
              {hasSanitization && (
                <div className={`flex items-center justify-between mt-3 pt-3 border-t font-sans ${
                  theme === 'parchment' ? 'border-[#2c1f11]/10' : 'border-[rgba(255,244,223,0.06)]'
                }`}>
                  <div>
                    <span className="text-[11px] font-sans font-bold block">Sanitization Toggle</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5 leading-tight font-sans">Original Mark Twain text vs. sanitized replacement phrases.</span>
                  </div>
                  <button 
                    onClick={() => handleWordSettingChange(wordSetting === 'original' ? 'sanitized' : 'original')}
                    className="book-control-btn word-setting-toggle font-sans"
                    style={{ fontSize: '0.62rem', fontWeight: 'bold', width: 'auto', height: '2rem', padding: '0 0.75rem', borderRadius: '4px', textTransform: 'uppercase' }}
                  >
                    {wordSetting === 'original' ? "Original" : "Sanitized"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="book-page-desk pt-16" ref={readerRef}>
        <article 
          className={`book-page-parchment font-serif size-${textSize === 1 ? 'small' : textSize === 3 ? 'large' : 'normal'} contrast-${contrast}`}
          style={{ fontFamily: activeFontFamily }}
          onClick={handleArticleClick}
        >
          {/* Cover/Illustrations Epigraph & Selector (custom styles preserved for Eve's Diary) */}
          {bookSlug === 'eves-diary' && (
            <>
              <div className="book-epigraph">
                &ldquo;Wheresoever she was, there was Eden.&rdquo;
              </div>
              <div className="book-epigraph-subtitle">
                This book is the first reworked version of many to come.
              </div>
            </>
          )}

          {/* Reading Experience Selector */}
          {showExperienceSelector && (
            <div className="reading-experience-selector" style={{ marginTop: '2.5rem' }}>
              <h4 className="experience-heading font-sans">WAYS TO EXPERIENCE</h4>
              <div className="experience-grid font-sans">
                {experiencesList.map((exp) => {
                  const isActive = exp.id === 'drama' ? isTocOpen : experience === exp.id;
                  return (
                    <button
                      key={exp.id}
                      disabled={!exp.supported}
                      onClick={() => {
                        if (exp.id === 'drama') {
                          toggleMenu('toc');
                        } else {
                          setExperience(exp.id);
                          sessionStorage.setItem(`twain-pref-exp-${bookSlug}`, exp.id);
                          if (exp.id === 'split') {
                            window.dispatchEvent(new CustomEvent('media-player-open'));
                          }
                        }
                      }}
                      className={`experience-card ${isActive ? 'active' : ''} ${exp.supported ? '' : 'opacity-40 cursor-not-allowed pointer-events-none'}`}
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

          {/* Render layout views based on experience */}
          {experience === 'traditional' || experience === 'split' ? (
            <div className="book-text-content">
               {bookProvenance && renderProvenanceAlert(bookSlug)}
              {propDocument ? (
                documentModel.sections.map((section) => {
                  const metaBlock = section.blocks.find(b => b.kind === 'meta');
                  if (metaBlock) {
                    // Reconstruct letter body html by joining blocks
                    const letterBodyHtml = section.blocks
                      .filter(b => b.kind === 'p' && b.id !== `${section.id}-p-raw-end`)
                      .map(b => `<p class="${b.conversation ? 'conversation-line' : ''}">${resolveText(b.text)}</p>`)
                      .join('\n');

                    return (
                      <div key={section.id} id={section.id} className="book-section mb-12">
                        <MarkTwainLetterCard
                          recipient={metaBlock.fields.recipient}
                          date={metaBlock.fields.date}
                          bodyHtml={letterBodyHtml}
                          signature={metaBlock.fields.signature}
                          contextHtml={metaBlock.fields.context}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={section.id} id={section.id} className="book-section mb-12">
                      {section.title && !section.title.startsWith('Introductory Note') && !section.title.startsWith('Prologue') && (
                        <>
                          <h2 id={`${section.id}-title`} className="chapter-heading text-center font-bold font-serif mb-6 text-[var(--primary)] mt-12">
                            {resolveText(section.title)}
                          </h2>
                          {section.canonicalSlug && section.canonicalSlug.toLowerCase() !== bookSlug.toLowerCase() && renderProvenanceAlert(section.canonicalSlug)}
                        </>
                      )}
                      {section.blocks.map(block => renderBlock(block))}
                    </div>
                  );
                })
              ) : (
                <div dangerouslySetInnerHTML={{ __html: resolveText(htmlContent) }} />
              )}
            </div>
          ) : experience === 'child' ? (
            <div className="book-text-content young-readers-reading-view">
              {youngReadersParagraphs.map((item, idx) => {
                if (item.type === 'title') {
                  return <h1 key={idx} className="young-readers-title font-serif">{item.text}</h1>;
                }
                if (item.type === 'subtitle') {
                  return <h2 key={idx} className="young-readers-subtitle font-serif">{item.text}</h2>;
                }
                if (item.type === 'section') {
                  return <h2 key={idx} className="young-readers-section-header font-serif">Adapted for Young Readers</h2>;
                }
                if (item.type === 'illustrator') {
                  return <h3 key={idx} className="young-readers-illustrator font-serif">{item.text}</h3>;
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
              <div className="adult-note-card font-sans">
                <h4 className="font-serif font-bold text-base mb-2 text-[var(--primary)]">{youngReadersNotes.title}</h4>
                <p className="text-xs mb-3 italic opacity-75">{youngReadersNotes.intro}</p>
                <ul className="text-xs space-y-2 pl-4 list-disc">
                  {youngReadersNotes.items.map((note, noteIdx) => (
                    <li key={noteIdx}>
                      <strong>{note.term}</strong> &mdash; {note.desc}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => {
                  setExperience('traditional');
                  sessionStorage.setItem(`twain-pref-exp-${bookSlug}`, 'traditional');
                }}
                className="btn-gold return-traditional-btn mt-8"
              >
                Return to Traditional Read
              </button>
            </div>
          ) : experience === 'chat' ? (
            <div className="experience-dramatized-excerpt font-sans">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                <h3 className="excerpt-main-title font-serif text-lg font-bold" style={{ marginTop: '0.5rem' }}>EVE&apos;S DIARY &mdash; DRAMATIZED EXCERPT</h3>
                <h4 className="excerpt-sub-title text-sm italic opacity-85">&ldquo;The Reptile, and the First Sorrow&rdquo;</h4>
                <p className="excerpt-running-time text-xs opacity-60">Running time: approximately 4 minutes</p>
                
                <p className="preview-status" style={{ textAlign: 'center', fontFamily: 'var(--font-mono), monospace', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '2rem', textIndent: 0 }}>
                  This configuration is currently in public test mode. Feel free to try it out.
                </p>
              </div>

              <div className="script-cast-section p-4 border border-[var(--border)] rounded mb-6">
                <h5 className="script-cast-header font-bold mb-2">Cast:</h5>
                <ul className="script-cast-list text-xs space-y-1.5 pl-4 list-disc">
                  <li><strong>EVE</strong> &mdash; young woman, alto, curious, unguarded. Speaks as though thinking aloud.</li>
                  <li><strong>ADAM</strong> &mdash; older man, baritone, slightly weary, observational. Voice of a man writing in a notebook, not performing.</li>
                  <li><strong>NARRATOR</strong> &mdash; neutral voice for date stamps. Can be folded into Eve if preferred.</li>
                </ul>
              </div>

              <div className="script-content-wrapper text-sm space-y-4">
                <div className="script-sound-cue text-xs italic opacity-60">[SOUND: Birdsong. Distant water. A small rustle of pages.]</div>
                
                <div className="script-entry">
                  <span className="script-speaker font-bold block mb-1">NARRATOR:</span>
                  <div className="script-speech"><p>Saturday.</p></div>
                </div>

                <div className="script-entry">
                  <span className="script-speaker font-bold block mb-1">EVE:</span>
                  <div className="script-speech">
                    <p>I followed the other Experiment around, yesterday afternoon, at a distance, to see what it might be for, if I could.</p>
                    <p>But I was not able to make it out.</p>
                    <p>I think it is a man. I had never seen a man, but it looked like one, and I feel sure that that is what it is.</p>
                    <p className="script-direction text-xs italic opacity-60">(slight pause, a private observation)</p>
                    <p>I realize that I feel more curiosity about it than about any of the other reptiles.</p>
                    <p>If it is a reptile &mdash; and I suppose it is &mdash; for it has frowzy hair and blue eyes, and looks like a reptile.</p>
                    <p>It has no hips. It tapers like a carrot. When it stands, it spreads itself apart like a derrick.</p>
                    <p>So I think it is a reptile.</p>
                    <p className="script-direction text-xs italic opacity-60">(beat)</p>
                    <p>Though it may be architecture.</p>
                  </div>
                </div>

                <div className="script-sound-cue text-xs italic opacity-60">[SOUND: A small rustle. A bird call.]</div>

                <div className="script-entry">
                  <span className="script-speaker font-bold block mb-1">EVE:</span>
                  <div className="script-speech">
                    <p>I was afraid of it at first, and started to run every time it turned around, for I thought it was going to chase me.</p>
                    <p>But by and by I found it was only trying to get away.</p>
                    <p>So after that, I was not timid any more, but tracked it along, several hours, about twenty yards behind &mdash; which made it nervous and unhappy.</p>
                    <p>At last it was a good deal worried, and climbed a tree.</p>
                    <p>I waited a good while, then gave it up and went home.</p>
                  </div>
                </div>

                <div className="script-sound-cue text-xs italic opacity-60">[BEAT. SOUND: Wind in leaves.]</div>

                <div className="script-entry">
                  <span className="script-speaker font-bold block mb-1">NARRATOR:</span>
                  <div className="script-speech"><p>Sunday.</p></div>
                </div>

                <div className="script-entry">
                  <span className="script-speaker font-bold block mb-1">EVE:</span>
                  <div className="script-speech">
                    <p>It is up there yet.</p>
                    <p>Resting, apparently.</p>
                    <p>But that is a subterfuge. Sunday isn&apos;t the day of rest. Saturday is appointed for that.</p>
                    <p>It looks to me like a creature that is more interested in resting than in anything else.</p>
                    <p>It would tire me to rest so much.</p>
                    <p className="script-direction text-xs italic opacity-60">(a small laugh, almost to herself)</p>
                    <p>It tires me just to sit around and watch the tree.</p>
                    <p>I do wonder what it is for. I never see it do anything.</p>
                  </div>
                </div>

                <div className="script-sound-cue text-xs italic opacity-60">[SOUND: Water. A pause. The mood shifts &mdash; slightly closer mic on Eve.]</div>

                <div className="script-entry">
                  <span className="script-speaker font-bold block mb-1">NARRATOR:</span>
                  <div className="script-speech"><p>Thursday.</p></div>
                </div>

                <div className="script-entry">
                  <span className="script-speaker font-bold block mb-1">EVE:</span>
                  <div className="script-speech">
                    <p className="script-direction text-xs italic opacity-60">(quieter, more inward)</p>
                    <p>My first sorrow.</p>
                    <p>Yesterday he avoided me, and seemed to wish I would not talk to him. I could not believe it, and thought there was some mistake &mdash; for I loved to be with him, and loved to hear him talk.</p>
                    <p>And so how could it be that he could feel unkind toward me, when I had not done anything?</p>
                    <p>But at last it seemed true.</p>
                    <p>So I went away, and sat lonely in the place where I first saw him &mdash; the morning that we were made &mdash; and I did not know what he was, and was indifferent about him.</p>
                    <p>But now it was a mournful place. And every little thing spoke of him. And my heart was very sore.</p>
                    <p>I did not know why, very clearly. For it was a new feeling. I had not experienced it before. And it was all a mystery. And I could not make it out.</p>
                  </div>
                </div>

                <div className="script-sound-cue text-xs italic opacity-60">[SOUND: Rain begins. Soft, sustained.]</div>

                <div className="script-entry">
                  <span className="script-speaker font-bold block mb-1">EVE:</span>
                  <div className="script-speech">
                    <p>But when night came, I could not bear the lonesomeness, and went to the new shelter which he has built &mdash; to ask him what I had done that was wrong, and how I could mend it, and get back his kindness again.</p>
                    <p>But he put me out in the rain.</p>
                    <p className="script-direction text-xs italic opacity-60">(quiet)</p>
                    <p>And it was my first sorrow.</p>
                  </div>
                </div>

                <div className="script-sound-cue text-xs italic opacity-60">[BEAT. RAIN CONTINUES. THEN, A SHIFT &mdash; DIFFERENT ROOM TONE. ADAM, OFF-MIC AT FIRST, AS THOUGH READING ALOUD FROM A JOURNAL.]</div>

                <div className="script-entry">
                  <span className="script-speaker font-bold block mb-1">ADAM:</span>
                  <div className="script-speech">
                    <p className="script-direction text-xs italic opacity-60">(unhurried, dry)</p>
                    <p>Perhaps I ought to remember that she is very young &mdash; a mere girl &mdash; and make allowances.</p>
                    <p>She is all interest, eagerness, vivacity. The world is to her a charm, a wonder, a mystery, a joy.</p>
                    <p>She can&apos;t speak for delight when she finds a new flower. She must pet it, and caress it, and smell it, and talk to it, and pour out endearing names upon it.</p>
                    <p className="script-direction text-xs italic opacity-60">(a small breath, almost a smile)</p>
                    <p>And she is color-mad.</p>
                    <p>Brown rocks, yellow sand, gray moss, green foliage, blue sky. The pearl of the dawn, the purple shadows on the mountains, the golden islands floating in crimson seas at sunset, the pallid moon sailing through the shredded cloud-rack, the star-jewels glittering in the wastes of space &mdash;</p>
                    <p>&mdash; none of them is of any practical value, so far as I can see.</p>
                    <p>But because they have color and majesty, that is enough for her. And she loses her mind over them.</p>
                    <p className="script-direction text-xs italic opacity-60">(a pause, the voice softening)</p>
                    <p>If she could quiet down and keep still a couple minutes at a time, it would be a reposeful spectacle. In that case I think I could enjoy looking at her.</p>
                    <p>Indeed, I am sure I could.</p>
                    <p>For I am coming to realize that she is a quite remarkably comely creature. Lithe. Slender. Trim. Rounded. Shapely. Nimble. Graceful.</p>
                    <p className="script-direction text-xs italic opacity-60">(beat)</p>
                    <p>And once, when she was standing marble-white and sun-drenched on a boulder, with her young head tilted back and her hand shading her eyes, watching the flight of a bird in the sky &mdash;</p>
                    <p>&mdash; I recognized that she was beautiful.</p>
                  </div>
                </div>

                <div className="script-sound-cue text-xs italic opacity-60">[SILENCE. A SINGLE BIRD CALL. FADE.]</div>
                <div className="script-sound-cue text-xs italic opacity-60">[END EXCERPT]</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', width: '100%' }}>
                <button
                  onClick={() => {
                    setExperience('traditional');
                    sessionStorage.setItem(`twain-pref-exp-${bookSlug}`, 'traditional');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="btn-gold return-traditional-btn"
                >
                  Return to Traditional Read
                </button>
              </div>
            </div>
          ) : experience === 'voice' ? (
            <div className="experience-dramatized-excerpt font-sans">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                <h3 className="excerpt-main-title font-serif text-lg font-bold" style={{ marginTop: '0.5rem' }}>E-INK &amp; KINDLE EDITION</h3>
                <p className="excerpt-running-time text-xs opacity-60">Optimal formatting for Kindle and e-paper screens</p>
                
                <p className="preview-status" style={{ textAlign: 'center', fontFamily: 'var(--font-mono), monospace', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '2rem', textIndent: 0 }}>
                  This configuration is currently in public test mode. Feel free to try it out.
                </p>
              </div>

              <div className="script-cast-section flex flex-col items-center p-6 border border-[var(--border)] rounded text-center">
                <h5 className="script-cast-header font-bold mb-2">EPUB Synthesizer</h5>
                <p className="text-xs max-w-md mx-auto mb-6 opacity-75">
                  Compile Eve&apos;s Diary into a standardized, DRM-free `.epub` file optimized for Kindle, Kobo, and modern e-paper screens.
                </p>

                {epubStatus === 'idle' && (
                  <button onClick={handleGenerateEpub} className="btn-gold" style={{ padding: '0.75rem 2rem' }}>
                    Compile E-Ink Edition
                  </button>
                )}

                {epubStatus === 'generating' && (
                  <div className="flex flex-col items-center gap-2 p-4">
                    <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin" />
                    <p className="text-xs font-mono text-[var(--primary)] animate-pulse">
                      Synthesizing chapters, parsing XHTML, packing ZIP...
                    </p>
                  </div>
                )}

                {epubStatus === 'success' && (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-400">Compilation Successful!</h4>
                      <p className="text-[10px] font-mono opacity-65">eves-diary.epub ready for download</p>
                    </div>
                    <div className="flex flex-col gap-2 w-full max-w-[260px] mx-auto">
                      <a href={epubUrl} download="eves-diary.epub" className="btn-gold decoration-none justify-center">
                        <Download size={14} />
                        <span>Download EPUB Edition</span>
                      </a>
                      <button onClick={handleCopyLink} className="btn-outline justify-center" style={{ height: '2.5rem' }}>
                        {copyFeedback ? <Check size={14} className="text-emerald-400" /> : <Clipboard size={14} />}
                        <span>{copyFeedback ? 'Copied Link!' : 'Copy Download Link'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {epubStatus === 'error' && (
                  <div className="flex flex-col items-center gap-3 p-4">
                    <p className="text-red-400 text-xs font-sans">
                      Failed to compile book: {epubError}
                    </p>
                    <button onClick={handleGenerateEpub} className="btn-gold" style={{ padding: '0.5rem 1.5rem', fontSize: '0.75rem' }}>
                      Retry Compilation
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </article>
      </main>

      {/* Table of Contents Drawer (Sidebar) */}
      <AnimatePresence>
        {isTocOpen && (
          <>
            <motion.div className="toc-backdrop fixed inset-0 bg-black/40 z-45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTocOpen(false)} />
            <motion.div className="toc-drawer fixed top-0 right-0 bottom-0 w-80 bg-[#15110d] border-l border-[var(--border)] p-6 z-50 text-[var(--foreground)] font-sans" style={{ left: 'auto', right: 0 }} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }}>
              <div className="flex items-center justify-between border-b border-[rgba(255,244,223,0.08)] pb-4 mb-4">
                <h3 className="font-sans font-bold text-lg m-0">Index</h3>
                <button onClick={() => setIsTocOpen(false)} className="book-control-btn border-none bg-transparent">
                  <X size={18} />
                </button>
              </div>
              <nav className="toc-drawer-list flex flex-col gap-2 max-h-[85vh] overflow-y-auto custom-scrollbar font-sans">
                {tocItems.map(item => (
                  <button key={item.id} onClick={() => scrollToId(item.id)} className={`text-left py-1.5 px-2 text-xs font-sans transition-colors rounded ${activeId === item.id ? 'bg-[var(--primary)] text-[#15110d]' : 'bg-transparent text-[var(--muted-foreground)] hover:text-white hover:bg-[rgba(255,244,223,0.03)] border-none'}`}>
                    {item.label}
                  </button>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Overlay Panel Drawer */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div className="toc-backdrop fixed inset-0 bg-black/40 z-45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSearchOpen(false)} />
            <motion.div className="toc-drawer fixed top-0 left-0 bottom-0 w-80 bg-[#15110d] border-r border-[var(--border)] p-6 z-50 text-[var(--foreground)] font-sans" style={{ left: 0, right: 'auto' }} initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }}>
              <div className="flex items-center justify-between border-b border-[rgba(255,244,223,0.08)] pb-4 mb-4 font-sans">
                <h3 className="font-sans font-bold text-lg m-0">Search</h3>
                <button onClick={() => setIsSearchOpen(false)} className="book-control-btn border-none bg-transparent">
                  <X size={18} />
                </button>
              </div>

              <div className="relative mb-4 font-sans">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Find in this text..."
                  className="w-full py-2 pl-3 pr-8 bg-[var(--input-bg)] border border-[var(--border)] rounded text-xs outline-none text-[var(--foreground)] font-sans"
                />
                {searchQuery && (
                  <button onClick={() => handleSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-[var(--muted-foreground)] hover:text-white p-0">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="max-h-[75vh] overflow-y-auto custom-scrollbar flex flex-col gap-3 font-sans">
                {searchResults.length === 0 && searchQuery.trim() && (
                  <span className="text-xs text-[var(--muted-foreground)] italic text-center block mt-4 font-sans">No matches found</span>
                )}
                {searchResults.map((res, idx) => (
                  <div key={idx} onClick={() => { scrollToId(res.id); setIsSearchOpen(false); }} className="p-2.5 rounded bg-[rgba(255,244,223,0.02)] border border-[rgba(255,244,223,0.05)] cursor-pointer hover:bg-[rgba(255,244,223,0.05)] transition-colors font-sans">
                    <span className="text-[9px] font-sans font-semibold text-[var(--primary)] uppercase tracking-wider block mb-0.5">{res.sectionTitle}</span>
                    <p className="text-xs font-sans leading-relaxed text-[var(--muted-foreground)] m-0">{res.snippet}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Ask Mark RAG Chat Drawer */}
      <AnimatePresence>
        {isMkiiChatOpen && (
          <>
            <motion.div className="toc-backdrop fixed inset-0 bg-black/40 z-45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMkiiChatOpen(false)} />
            <motion.div className="toc-drawer fixed top-0 right-0 bottom-0 w-[420px] max-w-[95vw] bg-[#15110d] border-l border-[var(--border)] flex flex-col z-50 text-[var(--foreground)] font-sans" style={{ left: 'auto', right: 0 }} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }}>
              <div className="p-5 border-b border-[rgba(255,244,223,0.08)] flex items-center justify-between bg-[#181411] font-sans">
                <div className="flex items-center gap-2 font-sans">
                  <h3 className="font-sans font-bold text-lg m-0">Ask Mark</h3>
                  <span className="font-sans font-semibold text-[9px] uppercase tracking-wider text-[var(--primary)] border border-[var(--primary)] px-1.5 py-0.5 rounded leading-none">MkII</span>
                </div>
                <button onClick={() => setIsMkiiChatOpen(false)} className="book-control-btn border-none bg-transparent">
                  <X size={18} />
                </button>
              </div>

              {chatContext && (
                <div className="px-5 py-2.5 bg-[rgba(255,244,223,0.03)] border-b border-[rgba(255,244,223,0.05)] flex justify-between items-center text-xs text-[var(--muted-foreground)] font-sans">
                  <span className="truncate">Reading: <strong>{chatContext.chapter}</strong> &ldquo;{chatContext.passage.substring(0, 30)}...&rdquo;</span>
                  <button onClick={() => setChatContext(null)} className="ml-2 text-[var(--primary)] hover:text-white bg-transparent border-none p-0 cursor-pointer font-sans">Clear context</button>
                </div>
              )}

              <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4 font-sans">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8 font-sans">
                    <p className="font-sans text-xs text-[var(--muted-foreground)] tracking-widest max-w-[600px] leading-relaxed mb-4">
                      Ask me about the page in front of you, or about anything the years have taught me.
                    </p>
                    <div className="flex flex-col gap-2 w-full max-w-[600px] font-sans">
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className="flex flex-col font-sans" style={{ alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div className={`max-w-[85%] rounded p-3 text-xs leading-relaxed font-sans ${
                        msg.role === 'user' 
                          ? 'bg-[rgba(217,163,74,0.1)] text-[var(--foreground)] rounded-tr-none' 
                          : `${theme === 'parchment' ? 'bg-[rgba(44,31,17,0.03)] border-[rgba(44,31,17,0.08)]' : 'bg-[rgba(255,244,223,0.02)] border-[rgba(255,244,223,0.05)]'} text-[var(--foreground)] border rounded-tl-none`
                      }`}>
                        <span className="text-[9px] font-sans font-semibold text-[var(--primary)] uppercase tracking-wider block mb-1">
                          {msg.role === 'user' ? 'You' : 'Mark Twain · MkII'}
                        </span>
                        <p className="m-0 font-sans">{msg.content}</p>

                        {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-[rgba(255,244,223,0.05)] font-sans">
                            <button onClick={() => setExpandedSources(prev => ({ ...prev, [idx]: !prev[idx] }))} className="text-[9px] font-sans font-semibold tracking-wider text-[var(--primary)] hover:text-white bg-transparent border-none p-0 cursor-pointer flex items-center gap-1 select-none">
                              Source Materials ({msg.sources.length}) {expandedSources[idx] ? '▲' : '▼'}
                            </button>
                            {expandedSources[idx] && (
                              <div className="mt-1.5 flex flex-col gap-1.5 pl-1.5 border-l border-[var(--primary)] font-sans">
                                {msg.sources.map((src, sIdx) => (
                                  <div key={sIdx} className="text-[10px] text-[var(--muted-foreground)] font-sans">
                                    <span className="font-semibold block mb-0.5">Work: {src.filename} (Score: {Math.round(src.score * 100)}%)</span>
                                    <span className="italic font-sans">&ldquo;{src.text.substring(0, 100)}...&rdquo;</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {msg.role === 'model' && msg.translation && (
                          <div className="mt-2 pt-2 border-t border-[rgba(255,244,223,0.05)] text-[11px] text-[var(--muted-foreground)] italic font-sans leading-relaxed">
                            <span className="text-[9px] font-sans font-semibold text-[var(--primary)] block mb-0.5">Translation:</span>
                            {msg.translation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {chatLoading && (
                  <div className="flex items-start font-sans">
                    <div className={`p-3 text-xs font-sans rounded rounded-tl-none border ${
                      theme === 'parchment' ? 'bg-[rgba(44,31,17,0.03)] border-[rgba(44,31,17,0.08)]' : 'bg-[rgba(255,244,223,0.02)] border-[rgba(255,244,223,0.05)]'
                    }`}>
                      <span className="text-[9px] font-sans font-semibold text-[var(--primary)] uppercase tracking-wider block mb-1">Mark Twain · MkII</span>
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[rgba(255,244,223,0.08)] bg-[#181411] font-sans">
                <div className="flex gap-2 font-sans">
                  <input 
                    ref={chatInputRef}
                    type="text" 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                    placeholder="Spit it out..."
                    className="flex-1 py-2 px-3 bg-[var(--input-bg)] border border-[var(--border)] rounded text-xs outline-none text-[var(--foreground)] font-sans"
                    autoFocus
                  />
                  <button onClick={() => handleSendChatMessage()} disabled={chatLoading || !chatInput.trim()} className="btn-gold px-3.5 py-2 rounded flex items-center justify-center font-sans">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Zoom Modal Overlay */}
      <AnimatePresence>
        {selectedZoomImage && (
          <motion.div className="zoom-modal-backdrop fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-pointer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedZoomImage(null)}>
            <motion.div className="zoom-modal-content max-w-[90vw] max-h-[90vh]" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
              <img src={selectedZoomImage} alt="Enlarged Illustration" className="max-w-full max-h-full object-contain rounded shadow-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
