'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Moon, Sun, Sparkles, Mic, Map, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

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
    status: "Modernized",
    genre: "Satire",
    year: 1892,
    color: "from-[#1e3d30] to-[#0f1e18]"
  },
  {
    title: "The Innocents Abroad",
    filename: "The-Innocents-Abroad.txt",
    cover: "/images/book-covers/Book-cover-The-Innocents-Abroad.jpg",
    desc: "Twain's highly popular travel book charting his journey to Europe and the Holy Land on a steamship cruise.",
    status: "Modernized",
    genre: "Travelogue",
    year: 1869,
    color: "from-[#383a1a] to-[#1c1d0d]"
  },
  {
    title: "The Tragedy of Pudd'nhead Wilson",
    filename: "Tragedy-of-Pudd'nhead-Wilson.txt",
    cover: "/images/book-covers/Book-cover-Tragedy-of-Puddnhead-Wilson.jpg",
    desc: "A tense story of switched infants, legal drama, racial identity, and early forensics in a Missouri town.",
    status: "Modernized",
    genre: "Mystery",
    year: 1894,
    color: "from-[#381f3b] to-[#1c0f1d]"
  },
  {
    title: "Tom Sawyer Abroad",
    filename: "Tom-Sawyer-Abroad.txt",
    cover: "/images/book-covers/Book-cover-Tom-Sawyer-Abroad.jpg",
    desc: "Tom Sawyer, Huck Finn, and Jim drift across the Atlantic in a balloon and explore the Sahara Desert.",
    status: "Modernized",
    genre: "Adventure",
    year: 1894,
    color: "from-[#1c3838] to-[#0e1c1c]"
  },
  {
    title: "Tom Sawyer, Detective",
    filename: "Tom-Sawyer-Detective.txt",
    cover: "/images/book-covers/Book-cover-Tom-Sawyer-Detective.jpg",
    desc: "Tom Sawyer turns detective to solve a mysterious murder and gem theft in the backwoods of Arkansas.",
    status: "Modernized",
    genre: "Mystery",
    year: 1896,
    color: "from-[#3a351a] to-[#1d1a0d]"
  },
  {
    title: "The Mysterious Stranger",
    filename: "Mysterious-Stranger.txt",
    cover: "/images/book-covers/Book-cover-Mysterious-Stranger.jpg",
    desc: "Twain's dark, profound posthumous fable set in medieval Austria, questioning the nature of human existence.",
    status: "Modernized",
    genre: "Philosophical",
    year: 1916,
    color: "from-[#20203d] to-[#10101e]"
  }
];

const miscellaneousWorks = [
  { title: "1601", slug: "1601" },
  { title: "1911 Encyclopædia Britannica", slug: "1911-Encyclopædia-Britannica" },
  { title: "1911 Encyclopædia Britannica: Mark Twain", slug: "1911-Encyclopædia-Britannica-Twain-Mark" },
  { title: "A Burlesque Autobiography", slug: "A-Burlesque-Autobiography" },
  { title: "A Dog's Tale", slug: "A-Dog's-Tale" },
  { title: "A Double Barrelled Detective Story", slug: "The-Double-Barrelled-Detective" },
  { title: "A Horse's Tale", slug: "A-Horse's-Tale" },
  { title: "A Tramp Abroad", slug: "A-Tramp-Abroad" },
  { title: "Alonzo Fitz and Other Stories", slug: "The-Loves-of-Alonzo-Fitz" },
  { title: "Appletons' Cyclopædia of American Biography", slug: "Appletons'-Cyclopædia-of-American-Biography" },
  { title: "Appletons' Cyclopædia of American Biography: Samuel Langhorne Clemens", slug: "Appletons'-Cyclopædia-of-American-Biography-Clemens-Samuel-Langhorne" },
  { title: "Cartoon Portraits and Biographical Sketches", slug: "Cartoon-portraits-and-biographical-sketches-of-men-of-the-day" },
  { title: "Cartoon Portraits and Biographical Sketches: Mark Twain", slug: "Cartoon-portraits-and-biographical-sketches-of-men-of-the-day-Mark-Twain" },
  { title: "Christian Science", slug: "Christian-Science" },
  { title: "Collier's New Encyclopedia (1921)", slug: "Collier's-New-Encyclopedia-1921" },
  { title: "Collier's New Encyclopedia (1921): Samuel Langhorne Clemens", slug: "Collier's-New-Encyclopedia-1921-Clemens-Samuel-Langhorne" },
  { title: "Crowd Endangers Steamer to Get Passing Glimpse of Humorist Mark Twain", slug: "Crowd-Endangers-Steamer-to-Get-Passing-Glimpse-of-Humorist-Mark-Twain" },
  { title: "Easy Mark Twain", slug: "Easy-Mark-Twain" },
  { title: "Essays on Paul Bourget", slug: "Essays-on-Paul-Bourget" },
  { title: "Extract from Captain Stormfield's Visit to Heaven", slug: "Captain-Stormfield's-Vist-to-Heaven" },
  { title: "Fenimore Cooper's Literary Offences", slug: "Fennimore-Cooper-Offences" },
  { title: "Goldsmith's Friend Abroad Again", slug: "Goldsmith's-Friend-Abroad-Again" },
  { title: "How to Tell a Story and Others", slug: "How-to-Tell-a-Story" },
  { title: "In Defense of Harriet Shelley", slug: "Defence-of-Harriet-Shelley" },
  { title: "Is Shakespeare Dead?", slug: "Is-Shakespeare-Dead" },
  { title: "Mark Twain at railroad feast", slug: "Mark-Twain-at-railroad-feast" },
  { title: "Mark Twain here with H. H. Rogers", slug: "Mark-Twain-here-with-H-H-Rogers" },
  { title: "Mark Twain's Speeches", slug: "Mark-Twain's-Speeches" },
  { title: "Marooned Mark Twain", slug: "Marooned-Mark-Twain" },
  { title: "Personal Recollections of Joan of Arc (Volume I)", slug: "Recollections-of-Joan-of-Arc-I" },
  { title: "Personal Recollections of Joan of Arc (Volume II)", slug: "Recollections-of-Joan-of-Arc-II" },
  { title: "San Francisco Call (1910): Mark Twain Called by Death", slug: "San-Francisco-Call-1910-Mark-Twain-Called-by-Death" },
  { title: "Sketches New and Old", slug: "Sketches-New-and-Old" },
  { title: "Some Rambling Notes of an Idle Excursion", slug: "Rambling-Idle-Excursion" },
  { title: "The American Cyclopædia (1879)", slug: "The-American-Cyclopædia-1879" },
  { title: "The American Cyclopædia (1879): Samuel Langhorne Clemens", slug: "The-American-Cyclopædia-1879-Clemens-Samuel-Langhorne" },
  { title: "The American Novel", slug: "The-American-Novel" },
  { title: "The American Novel: Chapter 7", slug: "The-American-Novel-Chapter-7" },
  { title: "The Curious Republic of Gondour", slug: "Curious-Republic-of-Gondour" },
  { title: "The Encyclopedia Americana (1920)", slug: "The-Encyclopedia-Americana-1920" },
  { title: "The Encyclopedia Americana (1920): Samuel Langhorne Clemens", slug: "The-Encyclopedia-Americana-1920-Clemens-Samuel-Langhorne" },
  { title: "The Facts Concerning the Recent Carnival of Crime in Connecticut", slug: "Carnival-of-Crime-in-CT" },
  { title: "The Gilded Age", slug: "A-Gilded-Age" },
  { title: "The Man That Corrupted Hadleyburg", slug: "The-Man-who-Corrupted-Hadleyburg" },
  { title: "The Man That Corrupted Hadleyburg and Other Stories", slug: "Hadleyberg-Stories-et-al" },
  { title: "The New International Encyclopædia", slug: "The-New-International-Encyclopædia" },
  { title: "The New International Encyclopædia: Samuel Langhorne Clemens", slug: "The-New-International-Encyclopædia-Clemens-Samuel-Langhorne" },
  { title: "The New Student's Reference Work", slug: "The-New-Student's-Reference-Work" },
  { title: "The New Student's Reference Work: Samuel Langhorne Clemens", slug: "The-New-Student's-Reference-Work-Clemens-Samuel-Langhorne" },
  { title: "The New York Times: Mark Twain", slug: "The-New-York-Times-Mark-Twain" },
  { title: "The New York Times: Mark Twain Investigating", slug: "The-New-York-Times-Mark-Twain-Investigating" },
  { title: "The New York Times: Mark Twain is Dead at 74", slug: "The-New-York-Times-Mark-Twain-is-Dead-at-74" },
  { title: "The Stolen White Elephant", slug: "The-Stolen-White-Elephant" },
  { title: "The Washington Post (1907): Publisher Tells What The Humorist Is Paid", slug: "The-Washington-Post-newspaper-1907-Mark-Twain's-Exclusive-Publisher-Tells-What-The-Humorist-Is-Paid" },
  { title: "Those Extraordinary Twins", slug: "Those-Extraordinary-Twins" },
  { title: "What Is Man? and Other Essays", slug: "What-Is-Man-And-Others" }
];

export default function TheCompleteWorksPage() {
  const router = useRouter();
  const [theme, setTheme] = useState('charcoal'); // 'parchment' | 'charcoal'
  const [fontSize, setFontSize] = useState('small'); // 'small' | 'normal' | 'large'
  const [scrollProgress, setScrollProgress] = useState(0);

  const [active, setActive] = useState(4);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProgrammaticScrollRef = useRef(true); // Start true to allow initial mount scroll
  const isInitialRenderRef = useRef(true);

  const scrollToBook = (index: number) => {
    isProgrammaticScrollRef.current = true;
    setActive(index);
    
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 600);
  };

  const handleContainerScroll = () => {
    if (isProgrammaticScrollRef.current) return;
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    
    let closestIndex = active;
    let minDistance = Infinity;
    
    cardRefs.current.forEach((card, idx) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });
    
    if (closestIndex !== active) {
      setActive(closestIndex);
    }
  };

  useEffect(() => {
    if (isProgrammaticScrollRef.current) {
      const activeCard = cardRefs.current[active];
      if (activeCard && containerRef.current) {
        activeCard.scrollIntoView({
          behavior: isInitialRenderRef.current ? 'auto' : 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
      
      if (isInitialRenderRef.current) {
        isInitialRenderRef.current = false;
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 150);
      }
    }
  }, [active]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

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

  // Sync state settings
  useEffect(() => {
    const savedTheme = localStorage.getItem('eves-diary-theme');
    const savedFontSize = localStorage.getItem('eves-diary-font-size');

    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
  }, []);

  // Save settings when they change
  useEffect(() => {
    localStorage.setItem('eves-diary-theme', theme);
    localStorage.setItem('eves-diary-font-size', fontSize);
  }, [theme, fontSize]);

  return (
    <div className={`book-reader-container theme-${theme}`}>
      {/* Scroll Progress Bar */}
      <div
        className="reading-progress-bar"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Top Left Logo (Back to Home Link) */}
      <div className="book-logo-container" style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 10 }}>
        <Link href="/">
          <img 
            alt="Mark Twain Logo" 
            width="98" 
            height="35" 
            className="mark-twain-solo-logo" 
            src="/images/MarkTwainSoloLogo.webp" 
            style={{ color: 'transparent' }} 
          />
        </Link>
      </div>

      {/* Reading Desk */}
      <main className="book-page-desk">
        <article className={`book-page-parchment font-serif size-${fontSize}`}>
          {/* Theme Selector (Floating inside parchment card) */}
          <button
            onClick={() => setTheme(theme === 'parchment' ? 'charcoal' : 'parchment')}
            className="book-control-btn theme-toggle parchment-theme-toggle"
            title={`Switch to ${theme === 'parchment' ? 'Charcoal' : 'Parchment'} theme`}
          >
            {theme === 'parchment' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <h1 className="text-text-100 text-[2rem] font-bold text-center" style={{ marginBottom: '4.5rem' }}>
            What I have in Mind
          </h1>

          <div className="relative w-full px-10 mb-8 mt-2 flex flex-col items-center select-none">
            {/* Viewport */}
            <div 
              ref={containerRef}
              onScroll={handleContainerScroll}
              className="w-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-6 flex"
              style={{ 
                minHeight: 300,
                paddingLeft: 'calc(50% - 85px)',
                paddingRight: 'calc(50% - 85px)',
                gap: '16px'
              }}
            >
              {books.map((book, i) => {
                const isActive = i === active;
                const isParchment = theme === 'parchment';
                
                const cardBorderClass = isParchment 
                  ? (isActive ? 'border-[var(--primary)]' : 'border-[rgba(44,31,17,0.12)]')
                  : (isActive ? 'border-[var(--primary)]' : 'border-[rgba(255,244,223,0.08)]');

                const CardContent = book.cover ? (
                  <div className="w-full h-full overflow-hidden relative rounded-lg">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-[var(--primary)] opacity-5 rounded-full blur-xl group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
                    <img 
                      src={book.cover} 
                      alt={book.title} 
                      className="w-full h-full object-cover" 
                      draggable={false}
                    />
                  </div>
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${book.color} flex flex-col justify-between p-4 relative shadow-inner overflow-hidden rounded-lg`}>
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-[var(--primary)] opacity-5 rounded-full blur-xl group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
                    <div className="absolute inset-2 border border-[rgba(217,163,74,0.12)] pointer-events-none rounded" />
                    
                    <div className="text-[9px] font-mono text-[rgba(255,244,223,0.35)] uppercase tracking-widest text-center mt-1 select-none">
                      Mark Twain
                    </div>
                    
                    <div className="my-auto px-1 flex flex-col items-center">
                      <BookOpen className="w-6 h-6 text-[rgba(217,163,74,0.25)] mb-3" />
                      <span className="font-serif text-xs font-semibold tracking-wide text-[rgba(255,244,223,0.85)] text-center leading-relaxed line-clamp-4 max-w-[90%]">
                        {book.title}
                      </span>
                    </div>
                    
                    <div className="text-[8px] font-mono text-[rgba(217,163,74,0.45)] text-center mb-1 uppercase tracking-wider select-none">
                      {book.genre}
                    </div>
                  </div>
                );

                return (
                  <div
                    key={book.title}
                    ref={el => { cardRefs.current[i] = el; }}
                    style={{
                      width: 170,
                      height: 227,
                      flexShrink: 0,
                      transform: isActive ? 'scale(1.08)' : 'scale(0.95)',
                      opacity: 1,
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      zIndex: isActive ? 10 : 1
                    }}
                    className={`relative rounded-lg border ${cardBorderClass} bg-[rgba(255,244,223,0.02)] shadow-md group text-left flex flex-col cursor-pointer snap-center`}
                    onClick={() => {
                      if (isActive) {
                        if (book.href) {
                          router.push(book.href);
                        } else if (book.filename) {
                          const slug = book.filename.replace(/\.txt$/, '');
                          router.push(`/read/${slug}`);
                        }
                      } else {
                        scrollToBook(i);
                      }
                    }}
                  >
                    {CardContent}
                    {(book.href || book.filename) && (
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent transition-opacity duration-300 flex flex-col items-center justify-end pb-4 gap-1 rounded-lg pointer-events-none ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                        <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#fff4df] font-semibold">
                          Open
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Chevron buttons */}
            <button 
              className="carousel-control-btn prev"
              style={{ left: '-12px' }}
              onClick={() => scrollToBook(active === 0 ? books.length - 1 : active - 1)}
              aria-label="Previous book"
              type="button"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              className="carousel-control-btn next"
              style={{ right: '-12px' }}
              onClick={() => scrollToBook(active === books.length - 1 ? 0 : active + 1)}
              aria-label="Next book"
              type="button"
            >
              <ChevronRight size={20} />
            </button>

            {/* Dots */}
            <div className="carousel-dots" style={{ marginTop: '1.25rem', marginBottom: '2.5rem' }}>
              {books.map((_, idx) => (
                <button
                  key={idx}
                  className={`carousel-dot ${idx === active ? 'active' : ''}`}
                  onClick={() => scrollToBook(idx)}
                  aria-label={`Go to book ${idx + 1}`}
                  type="button"
                />
              ))}
            </div>
          </div>

          {/* Detailed grid content */}
          <div className="standard-markdown grid-cols-1 grid [&>_*]:min-w-0 gap-3 font-claude-response text-left">
            <p className="font-claude-response-body break-words whitespace-normal leading-[1.7] text-lg text-center max-w-3xl mx-auto" style={{ marginBottom: '2.5rem', fontStyle: 'italic', opacity: 0.85 }}>
              This is the material I lean on when we talk. Read it your own way if you wish. Don't bet on my holding the line the analysts have drawn over the decades — I have a habit of moving. Whether that is evolving or merely revolving, I leave to wiser men than myself, of whom there is rumored to be a supply.
            </p>

            <h2 className="text-text-100 mt-5 -mb-1 text-[1.5rem] font-bold">Books — restored, free to read, might still be rough at the edges</h2>
            <div className="overflow-x-auto w-full mb-[3.5rem]">
              <table className="min-w-full border-collapse text-md leading-[1.7] whitespace-normal">
                <thead className="text-left">
                  <tr>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Title</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Adventures-of-Tom-Sawyer')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">The Adventures of Tom Sawyer</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Huckleberry-Finn')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">Adventures of Huckleberry Finn</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Connecticut-Yankee')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">A Connecticut Yankee in King Arthur's Court</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Following-The-Equator')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">Following the Equator</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Life-on-the-Mississippi')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">Life on the Mississippi</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Prince-and-Pauper')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">The Prince and the Pauper</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Roughing-It')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">Roughing It</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/The-30000-Bequest-and-Others')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">The $30,000 Bequest and Others</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/The-American-Claimant')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">The American Claimant</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/The-Innocents-Abroad')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">The Innocents Abroad</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Tragedy-of-Pudd\'nhead-Wilson')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">The Tragedy of Pudd'nhead Wilson</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Tom-Sawyer-Abroad')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">Tom Sawyer Abroad</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Tom-Sawyer-Detective')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">Tom Sawyer, Detective</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Mysterious-Stranger')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">The Mysterious Stranger</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                </tbody>
              </table>
            </div>


            <h2 className="text-text-100 mt-5 -mb-1 text-[1.3rem] font-bold">The Complete Correspondence of Mark Twain</h2>
            <div className="overflow-x-auto w-full mb-[3.5rem]">
              <table className="min-w-full border-collapse text-md leading-[1.7] whitespace-normal">
                <thead className="text-left">
                  <tr>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Title</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Volume-1')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">Mark Twain's Letters, Volume 1 (1853–1866)</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Volume-2')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">Mark Twain's Letters, Volume 2 (1867–1875)</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Volume-3')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">Mark Twain's Letters, Volume 3 (1876–1885)</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Volume-4')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">Mark Twain's Letters, Volume 4 (1886–1900)</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Volume-5')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">Mark Twain's Letters, Volume 5 (1901–1906)</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                  <tr className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push('/read/Volume-6')}>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">Mark Twain's Letters, Volume 6 (1907–1910)</td>
                    <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">Modernized</td>
                  </tr>
                </tbody>
              </table>
            </div>


            <h2 className="text-text-100 mt-5 -mb-1 text-[1.3rem] font-bold">Recent Interviews &amp; Analysis (Generated)</h2>
            <div className="overflow-x-auto w-full mb-[3.5rem]">
              <table className="min-w-full border-collapse text-md leading-[1.7] whitespace-normal">
                <thead className="text-left">
                  <tr>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Title</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Source</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Date</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">[Interview: AI and the American Dream]</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Chat conversation</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Coming</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">[Mark on Modern Education]</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">X/Twitter thread</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Coming</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">[Analysis: What Twain Would Say About 2026]</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Synthesized from corpus + current events</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Coming</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Planning</td></tr>
                </tbody>
              </table>
            </div>


            <h2 className="text-text-100 mt-5 -mb-1 text-[1.3rem] font-bold">Essays, Diaries, Stories &amp; Miscellaneous</h2>
            <div className="w-full mb-[3.5rem] mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-md leading-[1.7]">
                {miscellaneousWorks.map((work) => (
                  <div key={work.slug} className="py-1 border-b border-[rgba(217,163,74,0.08)] hover:bg-[rgba(217,163,74,0.03)] transition-colors px-2 rounded">
                    <Link href={`/read/${work.slug}`} className="font-semibold text-[var(--primary)] hover:underline block truncate w-full">
                      {work.title}
                    </Link>
                  </div>
                ))}
              </div>
            </div>


            <h2 className="text-text-100 mt-5 -mb-1 text-[1.3rem] font-bold">Format Key</h2>
            <ul className="[li_&]:mb-0 [li_&]:mt-1 [li_&]:gap-1 [&:not(:last-child)_ul]:pb-1 [&:not(:last-child)_ol]:pb-1 list-disc flex flex-col gap-1 pl-8 mb-[3.5rem] text-left">
              <li className="font-claude-response-body whitespace-normal break-words pl-2"><strong>Modernized</strong> — Texts cleaned of 1800s ephemera, readable on any device. Ask questions, get responses informed by the full work.</li>
              <li className="font-claude-response-body whitespace-normal break-words pl-2"><strong>Youth Edition</strong> — Adapted for classroom reading (vocabulary, pacing, focus)</li>
              <li className="font-claude-response-body whitespace-normal break-words pl-2"><strong>Sung Version</strong> — AI-generated musical interpretation featuring Mark's voice</li>
              <li className="font-claude-response-body whitespace-normal break-words pl-2"><strong>E-Ink and Kindle</strong> — DRM-Free EPUB files optimized for e-paper and Kindle screens</li>
              <li className="font-claude-response-body whitespace-normal break-words pl-2"><strong>Audio-Text Sync</strong> — Read along with highlighted text as the audio plays (for grandparents and bedtime readers)</li>
            </ul>
          </div>

        </article>
      </main>
    </div>
  );
}
