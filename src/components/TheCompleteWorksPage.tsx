'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Volume2, Moon, Sun, Sparkles, Mic, Map, BookOpen } from 'lucide-react';
import TxtReaderClient from './TxtReaderClient';

export default function TheCompleteWorksPage() {
  const [theme, setTheme] = useState('charcoal'); // 'parchment' | 'charcoal'
  const [fontSize, setFontSize] = useState('small'); // 'small' | 'normal' | 'large'
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMusicPlayerClosed, setIsMusicPlayerClosed] = useState(true);

  // Modal states for .txt manuscripts
  const [activeTxtFile, setActiveTxtFile] = useState<string | null>(null);
  const [txtContent, setTxtContent] = useState('');
  const [txtLoading, setTxtLoading] = useState(false);
  const [txtError, setTxtError] = useState<string | null>(null);
  const handleOpenTxtFile = async (filename: string) => {
    setActiveTxtFile(filename);
    setTxtLoading(true);
    setTxtError(null);
    setTxtContent('');
    try {
      const res = await fetch(`/api/txt?file=${encodeURIComponent(filename)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTxtContent(data.content);
      } else {
        throw new Error(data.error || 'Failed to load text file.');
      }
    } catch (err: any) {
      setTxtError(err.message || 'An error occurred while loading the file.');
    } finally {
      setTxtLoading(false);
    }
  };

  const handleCloseTxtFile = () => {
    setActiveTxtFile(null);
    setTxtContent('');
    setTxtError(null);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('/read/txt?file=')) {
        e.preventDefault();
        const urlParams = new URLSearchParams(href.split('?')[1]);
        const file = urlParams.get('file');
        if (file) {
          handleOpenTxtFile(file);
        }
      }
    }
  };

  const books = [
    {
      title: "A Connecticut Yankee in King Arthur's Court",
      filename: "Connecticut-Yankee.txt",
      cover: "/images/book-covers/Book-cover-Connecticut-Yankee.jpg",
      desc: "An ingenious Yankee mechanic is transported to 6th-century England and uses modern science to reform Camelot.",
      status: "Modernized",
      genre: "Satire / Sci-Fi",
      year: 1889,
      color: "from-[#382b1f] to-[#1c150f]"
    },
    {
      title: "Life on the Mississippi",
      filename: "Life-on-the-Mississippi.txt",
      cover: "/images/book-covers/Book-cover-Life-on-the-Mississippi.jpg",
      desc: "Twain's evocative memoir of his pre-war days as a steamboat pilot, charting the river's changing landscape.",
      status: "Modernized",
      genre: "Memoir",
      year: 1883,
      color: "from-[#202d3d] to-[#101720]"
    },
    {
      title: "Roughing It",
      filename: "Roughing-It.txt",
      cover: "/images/book-covers/Book-cover-Roughing-It.jpg",
      desc: "A wild and humorous account of Twain's stagecoach journey to Nevada and his search for silver in the frontier.",
      status: "Modernized",
      genre: "Travel / Humor",
      year: 1872,
      color: "from-[#3f2024] to-[#201012]"
    },
    {
      title: "Following the Equator",
      filename: "Following-The-Equator.txt",
      cover: "/images/book-covers/Book-cover-Following-The-Equator.jpg",
      desc: "A witty, critical record of Twain's worldwide lecture tour across Australia, India, and South Africa.",
      status: "Modernized",
      genre: "Travelogue",
      year: 1897,
      color: "from-[#1a382c] to-[#0d1c16]"
    },
    {
      title: "Adventures of Huckleberry Finn",
      filename: "Huckleberry-Finn.txt",
      cover: "/images/book-covers/Book-cover-Huckleberry-Finn.jpg",
      desc: "The legendary journey of Huck and Jim escaping civilization down the Mississippi, tackling race, freedom, and friendship.",
      status: "Youth Edition",
      genre: "Fiction",
      year: 1884,
      color: "from-[#35381f] to-[#1a1c0f]"
    },
    {
      title: "The Adventures of Tom Sawyer",
      filename: "Adventures-of-Tom-Sawyer.txt",
      cover: "/images/book-covers/Book-cover-Adventures-of-Tom-Sawyer.jpg",
      desc: "The classic tale of childhood escapades, whitewashed fences, and puppy love in St. Petersburg, Missouri.",
      status: "Youth Edition",
      genre: "Fiction",
      year: 1876,
      color: "from-[#3d2a1f] to-[#1e150f]"
    },
    {
      title: "The Prince and the Pauper",
      filename: "Prince-and-Pauper.txt",
      cover: "/images/book-covers/Book-cover-Prince-and-Pauper.jpg",
      desc: "A royal prince and a beggar boy switch roles in Tudor London, exposing the dramatic class divides of England.",
      status: "Youth Edition",
      genre: "Historical Fiction",
      year: 1881,
      color: "from-[#3a1a2e] to-[#1d0d17]"
    },
    {
      title: "The $30,000 Bequest and Others",
      filename: "The-30000-Bequest-and-Others.txt",
      cover: "/images/book-covers/Book-cover-The-30000-Bequest-and-Others.jpg",
      desc: "A rich anthology of Twain's late short fiction, highlighting his biting satire and deep irony.",
      status: "Modernized",
      genre: "Short Stories",
      year: 1906,
      color: "from-[#1d2d3d] to-[#0e161e]"
    },
    {
      title: "Eve's Diary",
      filename: null,
      href: "/read/eves-diary",
      cover: "/images/book-covers/book-cover-eves-diary.jpg",
      desc: "Eve's exquisite, poetic account of life in Eden, her fascination with Adam, and the beauty of creation.",
      status: "Interactive, Voiced",
      genre: "Diary / Romance",
      year: 1906,
      color: "from-[#3a2020] to-[#1d1010]"
    },
    {
      title: "The American Claimant",
      filename: "The-American-Claimant.txt",
      cover: "/images/book-covers/Book-cover-The-American-Claimant.jpg",
      desc: "A comedy of errors involving an eccentric American inventor claiming a British earldom and swapping lives.",
      status: "Planning",
      genre: "Satire",
      year: 1892,
      color: "from-[#1e3d30] to-[#0f1e18]"
    },
    {
      title: "The Innocents Abroad",
      filename: "The-Innocents-Abroad.txt",
      cover: "/images/book-covers/Book-cover-The-Innocents-Abroad.jpg",
      desc: "Twain's highly popular travel book charting his journey to Europe and the Holy Land on a steamship cruise.",
      status: "Planning",
      genre: "Travelogue",
      year: 1869,
      color: "from-[#383a1a] to-[#1c1d0d]"
    },
    {
      title: "The Tragedy of Pudd'nhead Wilson",
      filename: "Tragedy-of-Pudd'nhead-Wilson.txt",
      cover: "/images/book-covers/Book-cover-Tragedy-of-Puddnhead-Wilson.jpg",
      desc: "A tense story of switched infants, legal drama, racial identity, and early forensics in a Missouri town.",
      status: "Planning",
      genre: "Mystery",
      year: 1894,
      color: "from-[#381f3b] to-[#1c0f1d]"
    },
    {
      title: "Tom Sawyer Abroad",
      filename: "Tom-Sawyer-Abroad.txt",
      cover: "/images/book-covers/Book-cover-Tom-Sawyer-Abroad.jpg",
      desc: "Tom Sawyer, Huck Finn, and Jim drift across the Atlantic in a balloon and explore the Sahara Desert.",
      status: "Planning",
      genre: "Adventure",
      year: 1894,
      color: "from-[#1c3838] to-[#0e1c1c]"
    },
    {
      title: "Tom Sawyer, Detective",
      filename: "Tom-Sawyer-Detective.txt",
      cover: null,
      desc: "Tom Sawyer turns detective to solve a mysterious murder and gem theft in the backwoods of Arkansas.",
      status: "Planning",
      genre: "Mystery",
      year: 1896,
      color: "from-[#3a351a] to-[#1d1a0d]"
    },
    {
      title: "The Mysterious Stranger",
      filename: "Mysterious-Stranger.txt",
      cover: "/images/book-covers/Book-cover-Mysterious-Stranger.jpg",
      desc: "Twain's dark, profound posthumous fable set in medieval Austria, questioning the nature of human existence.",
      status: "Planning",
      genre: "Philosophical",
      year: 1916,
      color: "from-[#20203d] to-[#10101e]"
    }
  ];

  const [displayedIndices, setDisplayedIndices] = useState([0, 1, 2, 3]);
  const [fadingSlot, setFadingSlot] = useState<number | null>(null);

  // Rotation effect using a ref to prevent stale closures and resetting interval on state changes
  const displayedIndicesRef = useRef(displayedIndices);
  useEffect(() => {
    displayedIndicesRef.current = displayedIndices;
  }, [displayedIndices]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Pick a random slot to rotate (0, 1, 2, or 3)
      const slotToChange = Math.floor(Math.random() * 4);
      const currentIndices = displayedIndicesRef.current;
      
      // Get list of indices not currently displayed
      const inactiveIndices = books
        .map((_, idx) => idx)
        .filter(idx => !currentIndices.includes(idx));
        
      if (inactiveIndices.length === 0) return;
      
      // Pick a random inactive book
      const nextIndex = inactiveIndices[Math.floor(Math.random() * inactiveIndices.length)];
      
      // Trigger fade out
      setFadingSlot(slotToChange);
      
      setTimeout(() => {
        setDisplayedIndices(prev => {
          const next = [...prev];
          next[slotToChange] = nextIndex;
          return next;
        });
        // Trigger fade in
        setFadingSlot(null);
      }, 500); // 500ms match transition fade-out duration
    }, 6000); // Change a cover every 6 seconds

    return () => clearInterval(interval);
  }, []);

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

  // Sync state for media player
  useEffect(() => {
    const savedTheme = localStorage.getItem('eves-diary-theme');
    const savedFontSize = localStorage.getItem('eves-diary-font-size');
    const savedClosed = localStorage.getItem('media-player-closed');

    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
    setIsMusicPlayerClosed(savedClosed !== null ? savedClosed === 'true' : true);

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
    localStorage.setItem('eves-diary-theme', theme);
    localStorage.setItem('eves-diary-font-size', fontSize);
  }, [theme, fontSize]);

  const handleReopenMusic = () => {
    window.dispatchEvent(new CustomEvent('media-player-open'));
  };

  return (
    <div className={`book-reader-container theme-${theme}`}>
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
      <main className="book-page-desk" onClick={handleContainerClick}>
        <article className={`book-page-parchment font-serif size-${fontSize}`}>
          
          <h2 className="text-2xl font-semibold mb-6">Featured Editions & Manuscripts</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {displayedIndices.map((bookIdx, slotIdx) => {
              const book = books[bookIdx];
              const isFading = fadingSlot === slotIdx;
              
              const CardContent = book.cover ? (
                <div className="w-full h-full overflow-hidden relative">
                  {/* Subtle gold glow card overlay */}
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-[var(--primary)] opacity-5 rounded-full blur-xl group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
                  <img 
                    src={book.cover} 
                    alt={book.title} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${book.color} flex flex-col justify-between p-6 relative shadow-inner overflow-hidden`}>
                  {/* Subtle gold glow card overlay */}
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-[var(--primary)] opacity-5 rounded-full blur-xl group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
                  {/* Elegant cover lines */}
                  <div className="absolute inset-3 border border-[rgba(217,163,74,0.12)] pointer-events-none rounded" />
                  
                  <div className="text-[10px] font-mono text-[rgba(255,244,223,0.35)] uppercase tracking-widest text-center mt-2 select-none">
                    Mark Twain
                  </div>
                  
                  <div className="my-auto px-2 flex flex-col items-center">
                    <BookOpen className="w-7 h-7 text-[rgba(217,163,74,0.25)] mb-4" />
                    <span className="font-serif text-sm font-semibold tracking-wide text-[rgba(255,244,223,0.85)] text-center leading-relaxed line-clamp-4 max-w-[90%]">
                      {book.title}
                    </span>
                  </div>
                  
                  <div className="text-[9px] font-mono text-[rgba(217,163,74,0.45)] text-center mb-2 uppercase tracking-wider select-none">
                    {book.genre}
                  </div>
                </div>
              );

              const cardClass = `relative overflow-hidden rounded-xl border border-[rgba(255,244,223,0.08)] bg-[rgba(255,244,223,0.02)] transition-all duration-500 ease-in-out hover:border-[rgba(217,163,74,0.3)] hover:bg-[rgba(255,244,223,0.04)] shadow-lg hover:shadow-2xl hover:-translate-y-1.5 group text-left flex flex-col aspect-[3/4] w-full ${
                isFading ? 'opacity-0 scale-95 translate-y-1 blur-[2px]' : 'opacity-100 scale-100 translate-y-0 blur-none'
              }`;

              if (book.href) {
                return (
                  <Link 
                    key={slotIdx}
                    href={book.href}
                    className={cardClass}
                  >
                    {CardContent}
                  </Link>
                );
              }

              return (
                <div 
                  key={slotIdx}
                  onClick={() => !isFading && book.filename && handleOpenTxtFile(book.filename)}
                  className={cardClass + " cursor-pointer"}
                >
                  {CardContent}
                </div>
              );
            })}
          </div>

          {/* Detailed grid content */}
          <div className="standard-markdown grid-cols-1 grid [&>_*]:min-w-0 gap-3 font-claude-response text-left">
            <h1 className="text-text-100 mt-5 -mb-1 text-[2rem] font-bold">Mark Twain's Complete Works</h1>
            <p className="font-claude-response-body break-words whitespace-normal leading-[1.7] text-lg mb-[2rem]">All 101 works. Digitized. Voiced. Interactive. Coming to classrooms and bed tables autumn 2026.</p>
            
            <h2 className="text-text-100 mt-3 -mb-1 text-[1.5rem] font-bold">Books (16 full-length novels &amp; story collections)</h2>
            <div className="overflow-x-auto w-full mb-[3.5rem]">
              <table className="min-w-full border-collapse text-sm leading-[1.7] whitespace-normal">
                <thead className="text-left">
                  <tr>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Title</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Filename</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Formats</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">The Adventures of Tom Sawyer</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=Adventures-of-Tom-Sawyer.txt" target="_blank" rel="noopener noreferrer">Adventures-of-Tom-Sawyer.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized, Youth Edition</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Adventures of Huckleberry Finn</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=Huckleberry-Finn.txt" target="_blank" rel="noopener noreferrer">Huckleberry-Finn.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized, Youth Edition</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">A Connecticut Yankee in King Arthur's Court</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=Connecticut-Yankee.txt" target="_blank" rel="noopener noreferrer">Connecticut-Yankee.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Following the Equator</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=Following-The-Equator.txt" target="_blank" rel="noopener noreferrer">Following-The-Equator.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Life on the Mississippi</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=Life-on-the-Mississippi.txt" target="_blank" rel="noopener noreferrer">Life-on-the-Mississippi.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">The Prince and the Pauper</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=Prince-and-Pauper.txt" target="_blank" rel="noopener noreferrer">Prince-and-Pauper.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized, Youth Edition</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Roughing It</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=Roughing-It.txt" target="_blank" rel="noopener noreferrer">Roughing-It.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">The $30,000 Bequest and Others</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=The-30000-Bequest-and-Others.txt" target="_blank" rel="noopener noreferrer">The-30000-Bequest-and-Others.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">The American Claimant</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=The-American-Claimant.txt" target="_blank" rel="noopener noreferrer">The-American-Claimant.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">The Innocents Abroad</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=The-Innocents-Abroad.txt" target="_blank" rel="noopener noreferrer">The-Innocents-Abroad.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">The Tragedy of Pudd'nhead Wilson</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=Tragedy-of-Pudd'nhead-Wilson.txt" target="_blank" rel="noopener noreferrer">Tragedy-of-Pudd'nhead-Wilson.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Tom Sawyer Abroad</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=Tom-Sawyer-Abroad.txt" target="_blank" rel="noopener noreferrer">Tom-Sawyer-Abroad.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Tom Sawyer, Detective</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=Tom-Sawyer-Detective.txt" target="_blank" rel="noopener noreferrer">Tom-Sawyer-Detective.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">The Mysterious Stranger</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=Mysterious-Stranger.txt" target="_blank" rel="noopener noreferrer">Mysterious-Stranger.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Complete Works Vol. 1</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=Volume-1.txt" target="_blank" rel="noopener noreferrer">Volume-1.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Complete Works Vol. 2–6</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=Volume-2.txt" target="_blank" rel="noopener noreferrer">Volume-2.txt through Volume-6.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                </tbody>
              </table>
            </div>
            

            <h2 className="text-text-100 mt-3 -mb-1 text-[1.3rem] font-bold">Letters (1)</h2>
            <div className="overflow-x-auto w-full mb-[3.5rem]">
              <table className="min-w-full border-collapse text-sm leading-[1.7] whitespace-normal">
                <thead className="text-left">
                  <tr>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Title</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Filename</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Formats</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">The Complete Correspondence of Mark Twain</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=Letters.txt" target="_blank" rel="noopener noreferrer">Letters.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized, searchable</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                </tbody>
              </table>
            </div>


            <h2 className="text-text-100 mt-3 -mb-1 text-[1.3rem] font-bold">Essays, Diaries, Stories &amp; Miscellaneous (84)</h2>
            <div className="overflow-x-auto w-full mb-[3.5rem]">
              <table className="min-w-full border-collapse text-sm leading-[1.7] whitespace-normal">
                <thead className="text-left">
                  <tr>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Title</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Filename</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Formats</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">What Is Man? and Other Essays</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=What-Is-Man-And-Others.txt" target="_blank" rel="noopener noreferrer">What-Is-Man-And-Others.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Recollections of Joan of Arc</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=Recollections-of-Joan-of-Arc-I.txt" target="_blank" rel="noopener noreferrer">Recollections-of-Joan-of-Arc-I.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Mark's Diary</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top"><Link href="/read/txt?file=MarksDiary.txt" target="_blank" rel="noopener noreferrer">MarksDiary.txt</Link></td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">81 additional works</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">[essays, short stories, speeches, travel sketches, diaries]</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                </tbody>
              </table>
            </div>


            <h2 className="text-text-100 mt-3 -mb-1 text-[1.3rem] font-bold">Recent Interviews &amp; Analysis (Generated)</h2>
            <p className="font-claude-response-body break-words whitespace-normal leading-[1.7]">New material created by Mark through conversation and social media engagement.</p>
            <div className="overflow-x-auto w-full mb-[3.5rem]">
              <table className="min-w-full border-collapse text-sm leading-[1.7] whitespace-normal">
                <thead className="text-left">
                  <tr>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Title</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Source</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Date</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Format</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">[Interview: AI and the American Dream]</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Chat conversation</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Coming</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">[Mark on Modern Education]</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">X/Twitter thread</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Coming</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">[Analysis: What Twain Would Say About 2026]</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Synthesized from corpus + current events</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Coming</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Modernized</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                </tbody>
              </table>
            </div>
            <p className="font-claude-response-body break-words whitespace-normal leading-[1.7]"><em>This section grows as Mark engages with readers and current events.</em></p>


            <h2 className="text-text-100 mt-3 -mb-1 text-[1.3rem] font-bold">Format Key</h2>
            <ul className="[li_&]:mb-0 [li_&]:mt-1 [li_&]:gap-1 [&:not(:last-child)_ul]:pb-1 [&:not(:last-child)_ol]:pb-1 list-disc flex flex-col gap-1 pl-8 mb-[3.5rem] text-left">
              <li className="font-claude-response-body whitespace-normal break-words pl-2"><strong>Modernized</strong> — Texts cleaned of 1800s ephemera, readable on any device. Ask questions, get responses informed by the full work.</li>
              <li className="font-claude-response-body whitespace-normal break-words pl-2"><strong>Youth Edition</strong> — Adapted for classroom reading (vocabulary, pacing, focus)</li>
              <li className="font-claude-response-body whitespace-normal break-words pl-2"><strong>Sung Version</strong> — AI-generated musical interpretation featuring Mark's voice</li>
              <li className="font-claude-response-body whitespace-normal break-words pl-2"><strong>Voice</strong> — Text-to-speech narration in Mark's custom voice (coming autumn 2026)</li>
              <li className="font-claude-response-body whitespace-normal break-words pl-2"><strong>Audio-Text Sync</strong> — Read along with highlighted text as the audio plays (coming autumn 2026, for grandparents and bedtime readers)</li>
            </ul>
          </div>

        </article>
      </main>

      {/* OS-Themed Text Viewer Modal */}
      {activeTxtFile && (
        <div className="fixed inset-0 z-[9999] bg-[#241e17] overflow-auto">
          {txtLoading ? (
            <div className="flex flex-col items-center justify-center w-full min-h-screen bg-[#15110d] space-y-4">
              <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-mono text-[var(--primary)]">Retrieving manuscript: {activeTxtFile}...</p>
            </div>
          ) : (
            <TxtReaderClient
              filename={activeTxtFile}
              initialContent={txtContent}
              initialError={txtError}
              onClose={handleCloseTxtFile}
            />
          )}
        </div>
      )}
    </div>
  );
}
