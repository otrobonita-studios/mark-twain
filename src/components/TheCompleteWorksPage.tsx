'use client';

import React, { useState, useEffect, useRef } from 'react';
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

interface BookListEntry { title: string; slug: string; year: number; }
interface LetterEntry { title: string; slug: string; years: string; }
interface WorkEntry { title: string; slug?: string; href?: string; year: number; }

const booksList: BookListEntry[] = [
  { title: "The Mysterious Stranger",                          slug: "Mysterious-Stranger",                        year: 1916 },
  { title: "The $30,000 Bequest and Others",                   slug: "The-30000-Bequest-and-Others",               year: 1906 },
  { title: "Following the Equator",                            slug: "Following-The-Equator",                      year: 1897 },
  { title: "Tom Sawyer, Detective",                            slug: "Tom-Sawyer-Detective",                       year: 1896 },
  { title: "Personal Recollections of Joan of Arc (Volume I)", slug: "Recollections-of-Joan-of-Arc-I",             year: 1896 },
  { title: "Personal Recollections of Joan of Arc (Volume II)",slug: "Recollections-of-Joan-of-Arc-II",            year: 1896 },
  { title: "The Tragedy of Pudd'nhead Wilson",                 slug: "Tragedy-of-Pudd'nhead-Wilson",               year: 1894 },
  { title: "Tom Sawyer Abroad",                                slug: "Tom-Sawyer-Abroad",                          year: 1894 },
  { title: "The American Claimant",                            slug: "The-American-Claimant",                      year: 1892 },
  { title: "A Connecticut Yankee in King Arthur's Court",      slug: "Connecticut-Yankee",                         year: 1889 },
  { title: "Adventures of Huckleberry Finn",                   slug: "Huckleberry-Finn",                           year: 1884 },
  { title: "Life on the Mississippi",                          slug: "Life-on-the-Mississippi",                    year: 1883 },
  { title: "The Prince and the Pauper",                        slug: "Prince-and-Pauper",                          year: 1881 },
  { title: "The Adventures of Tom Sawyer",                     slug: "Adventures-of-Tom-Sawyer",                   year: 1876 },
  { title: "Roughing It",                                      slug: "Roughing-It",                                year: 1872 },
  { title: "The Innocents Abroad",                             slug: "The-Innocents-Abroad",                       year: 1869 },
];

const lettersList: LetterEntry[] = [
  { title: "Mark Twain's Letters, Volume 6", slug: "Volume-6", years: "1907–1910" },
  { title: "Mark Twain's Letters, Volume 5", slug: "Volume-5", years: "1901–1906" },
  { title: "Mark Twain's Letters, Volume 4", slug: "Volume-4", years: "1886–1900" },
  { title: "Mark Twain's Letters, Volume 3", slug: "Volume-3", years: "1876–1885" },
  { title: "Mark Twain's Letters, Volume 2", slug: "Volume-2", years: "1867–1875" },
  { title: "Mark Twain's Letters, Volume 1", slug: "Volume-1", years: "1853–1866" },
];

const shortFiction: WorkEntry[] = [
  { title: "Extract from Captain Stormfield's Visit to Heaven", slug: "Captain-Stormfield's-Vist-to-Heaven",  year: 1909 },
  { title: "A Horse's Tale",                                    slug: "A-Horse's-Tale",                       year: 1907 },
  { title: "Eve's Diary",                                       href: "/read/eves-diary",                     year: 1906 },
  { title: "Alonzo Fitz and Other Stories",                     slug: "The-Loves-of-Alonzo-Fitz",             year: 1906 },
  { title: "A Dog's Tale",                                      slug: "A-Dog's-Tale",                         year: 1904 },
  { title: "A Double Barrelled Detective Story",                slug: "The-Double-Barrelled-Detective",        year: 1902 },
  { title: "The Man That Corrupted Hadleyburg and Other Stories",slug: "Hadleyberg-Stories-et-al",            year: 1900 },
  { title: "The Man That Corrupted Hadleyburg",                 slug: "The-Man-who-Corrupted-Hadleyburg",     year: 1899 },
  { title: "Those Extraordinary Twins",                         slug: "Those-Extraordinary-Twins",            year: 1894 },
  { title: "The Stolen White Elephant",                         slug: "The-Stolen-White-Elephant",            year: 1882 },
  { title: "1601",                                              slug: "1601",                                  year: 1880 },
  { title: "Some Rambling Notes of an Idle Excursion",          slug: "Rambling-Idle-Excursion",              year: 1878 },
  { title: "The Facts Concerning the Recent Carnival of Crime in Connecticut", slug: "Carnival-of-Crime-in-CT", year: 1876 },
  { title: "Sketches New and Old",                              slug: "Sketches-New-and-Old",                  year: 1875 },
  { title: "The Curious Republic of Gondour",                   slug: "Curious-Republic-of-Gondour",          year: 1875 },
  { title: "The Gilded Age",                                    slug: "A-Gilded-Age",                          year: 1873 },
  { title: "Mark Twain's Curious Dream",                        slug: "Mark-Twain's-Curious-Dream",           year: 1872 },
  { title: "A Burlesque Autobiography",                         slug: "A-Burlesque-Autobiography",             year: 1871 },
];

const essaysSpeechs: WorkEntry[] = [
  { title: "The American Novel (Mark Twain Chapter)", slug: "The-American-Novel-Chapter-7",         year: 1912 },
  { title: "Mark Twain's Speeches",                  slug: "Mark-Twain's-Speeches",                year: 1910 },
  { title: "Is Shakespeare Dead?",                   slug: "Is-Shakespeare-Dead",                  year: 1909 },
  { title: "Christian Science",                      slug: "Christian-Science",                    year: 1907 },
  { title: "What Is Man? and Other Essays",          slug: "What-Is-Man-And-Others",               year: 1906 },
  { title: "How to Tell a Story and Others",         slug: "How-to-Tell-a-Story",                  year: 1897 },
  { title: "Essays on Paul Bourget",                 slug: "Essays-on-Paul-Bourget",               year: 1895 },
  { title: "Fenimore Cooper's Literary Offences",    slug: "Fennimore-Cooper-Offences",            year: 1895 },
  { title: "In Defense of Harriet Shelley",          slug: "Defence-of-Harriet-Shelley",           year: 1894 },
  { title: "A Tramp Abroad",                         slug: "A-Tramp-Abroad",                       year: 1880 },
  { title: "Goldsmith's Friend Abroad Again",        slug: "Goldsmith's-Friend-Abroad-Again",      year: 1870 },
];

const referenceBio: WorkEntry[] = [
  { title: "Collier's New Encyclopedia (Mark Twain Entry)",           slug: "Collier's-New-Encyclopedia-1921-Clemens-Samuel-Langhorne",                            year: 1921 },
  { title: "The Encyclopedia Americana (Mark Twain Entry)",           slug: "The-Encyclopedia-Americana-1920-Clemens-Samuel-Langhorne",                           year: 1920 },
  { title: "The New Student's Reference Work (Mark Twain Entry)",     slug: "The-New-Student's-Reference-Work-Clemens-Samuel-Langhorne",                          year: 1914 },
  { title: "Encyclopædia Britannica (Mark Twain Entry)",              slug: "1911-Encyclopædia-Britannica-Twain-Mark",                                            year: 1911 },
  { title: "The New International Encyclopædia (Mark Twain Entry)",   slug: "The-New-International-Encyclopædia-Clemens-Samuel-Langhorne",                        year: 1902 },
  { title: "Appletons' Cyclopædia of American Biography (Mark Twain Entry)", slug: "Appletons'-Cyclopædia-of-American-Biography-Clemens-Samuel-Langhorne",        year: 1887 },
  { title: "The American Cyclopædia (Mark Twain Entry)",              slug: "The-American-Cyclopædia-1879-Clemens-Samuel-Langhorne",                              year: 1879 },
  { title: "Cartoon Portraits and Biographical Sketches (Mark Twain Entry)", slug: "Cartoon-portraits-and-biographical-sketches-of-men-of-the-day-Mark-Twain",   year: 1873 },
];

const newsAccounts: WorkEntry[] = [
  { title: "The New York Times: Mark Twain",                                           slug: "The-New-York-Times-Mark-Twain",                                                                              year: 1910 },
  { title: "The New York Times: Mark Twain is Dead at 74",                             slug: "The-New-York-Times-Mark-Twain-is-Dead-at-74",                                                               year: 1910 },
  { title: "San Francisco Call (1910): Mark Twain Called by Death",                    slug: "San-Francisco-Call-1910-Mark-Twain-Called-by-Death",                                                        year: 1910 },
  { title: "The Washington Post (1907): Publisher Tells What The Humorist Is Paid",    slug: "The-Washington-Post-newspaper-1907-Mark-Twain's-Exclusive-Publisher-Tells-What-The-Humorist-Is-Paid",      year: 1907 },
  { title: "Crowd Endangers Steamer to Get Passing Glimpse of Humorist Mark Twain",   slug: "Crowd-Endangers-Steamer-to-Get-Passing-Glimpse-of-Humorist-Mark-Twain",                                   year: 1907 },
  { title: "Easy Mark Twain",                                                          slug: "Easy-Mark-Twain",                                                                                            year: 1907 },
  { title: "Mark Twain at railroad feast",                                             slug: "Mark-Twain-at-railroad-feast",                                                                               year: 1907 },
  { title: "Mark Twain here with H. H. Rogers",                                       slug: "Mark-Twain-here-with-H-H-Rogers",                                                                            year: 1907 },
  { title: "Marooned Mark Twain",                                                     slug: "Marooned-Mark-Twain",                                                                                        year: 1907 },
  { title: "The New York Times: Mark Twain Investigating",                             slug: "The-New-York-Times-Mark-Twain-Investigating",                                                               year: 1907 },
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
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {booksList.map((book) => (
                    <tr key={book.slug} className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push(`/read/${book.slug}`)}>
                      <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">{book.title}</td>
                      <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">{book.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


            <h2 className="text-text-100 mt-5 -mb-1 text-[1.3rem] font-bold">The Complete Correspondence of Mark Twain</h2>
            <div className="overflow-x-auto w-full mb-[3.5rem]">
              <table className="min-w-full border-collapse text-md leading-[1.7] whitespace-normal">
                <thead className="text-left">
                  <tr>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Title</th>
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {lettersList.map((vol) => (
                    <tr key={vol.slug} className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push(`/read/${vol.slug}`)}>
                      <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">{vol.title}</td>
                      <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">{vol.years}</td>
                    </tr>
                  ))}
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
                    <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Year</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">[Interview: AI and the American Dream]</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Chat conversation</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">2026</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">[Mark on Modern Education]</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">X/Twitter thread</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">2026</td></tr>
                  <tr><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">[Analysis: What Twain Would Say About 2026]</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">Synthesized from corpus + current events</td><td className="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">2026</td></tr>
                </tbody>
              </table>
            </div>


            {([
              { heading: 'Short Fiction',                data: shortFiction    },
              { heading: 'Essays &amp; Speeches',        data: essaysSpeechs   },
              { heading: 'Reference &amp; Biography',    data: referenceBio    },
              { heading: 'News &amp; Contemporary Accounts', data: newsAccounts },
            ] as { heading: string; data: WorkEntry[] }[]).map(({ heading, data }) => (
              <React.Fragment key={heading}>
                <h2 className="text-text-100 mt-5 -mb-1 text-[1.3rem] font-bold" dangerouslySetInnerHTML={{ __html: heading }} />
                <div className="overflow-x-auto w-full mb-[3.5rem]">
                  <table className="min-w-full border-collapse text-md leading-[1.7] whitespace-normal">
                    <thead className="text-left">
                      <tr>
                        <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Title</th>
                        <th scope="col" className="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((work) => {
                        const dest = work.href ?? `/read/${work.slug}`;
                        return (
                          <tr key={dest} className="hover:bg-[rgba(217,163,74,0.03)] cursor-pointer transition-colors" onClick={() => router.push(dest)}>
                            <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top font-semibold text-[var(--primary)]">{work.title}</td>
                            <td className="border-b-0.5 border-border-300/30 py-2.5 pr-4 align-top">{work.year}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </React.Fragment>
            ))}


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
