'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { SLIDES, Slide } from '@/data/restorationSlides';
import { Moon, Sun, Shuffle, LayoutGrid, Layers, HelpCircle, ArrowLeft, ArrowRight } from 'lucide-react';

export default function RestorationPage() {
  const [theme, setTheme] = useState<'charcoal' | 'parchment'>('charcoal');
  const [activeTab, setActiveTab] = useState<'flashcards' | 'grid'>('flashcards');
  const [pos, setPos] = useState<number>(0);
  const [gridFlips, setGridFlips] = useState<Record<string, boolean>>({});
  const [showChevrons, setShowChevrons] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('restoration-theme');
    if (savedTheme === 'parchment' || savedTheme === 'charcoal') {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage
  const toggleTheme = () => {
    const nextTheme = theme === 'charcoal' ? 'parchment' : 'charcoal';
    setTheme(nextTheme);
    localStorage.setItem('restoration-theme', nextTheme);
  };

  const totalGroups = 80;
  const currentSlide = SLIDES[pos] || SLIDES[0];
  const isFlipped = pos % 2 === 1;

  // Step sequence
  const step = useCallback((d: number) => {
    setPos((prev) => (prev + d + SLIDES.length) % SLIDES.length);
  }, []);

  const flipCard = useCallback(() => {
    setPos((prev) => (prev % 2 === 0 ? prev + 1 : prev - 1));
  }, []);

  const triggerShuffle = useCallback(() => {
    const randomGroup = Math.floor(Math.random() * totalGroups);
    setPos(randomGroup * 2); // Start at the original side of a random group
  }, [totalGroups]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'flashcards') return;
      if (e.code === 'Space') {
        e.preventDefault();
        step(1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        step(1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        triggerShuffle();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        flipCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, step, triggerShuffle, flipCard]);

  // Grid card flip toggle
  const toggleGridFlip = (stem: string) => {
    setGridFlips((prev) => ({
      ...prev,
      [stem]: !prev[stem],
    }));
  };

  // Group slides for the grid view
  const groupedSlides = [];
  for (let i = 0; i < SLIDES.length; i += 2) {
    groupedSlides.push({
      original: SLIDES[i],
      recreated: SLIDES[i + 1],
      stem: SLIDES[i].stem,
      status: SLIDES[i].status,
    });
  }

  const bgClass = theme === 'charcoal' ? 'bg-[#15110d] text-[rgba(255,244,223,0.95)]' : 'bg-[#f4efe6] text-[#2c1f11]';
  const cardBgClass = theme === 'charcoal' ? 'bg-[#0d0a07]' : 'bg-[#eadecc]';
  const controlBgClass = theme === 'charcoal' ? 'bg-[#1d1611]' : 'bg-[#dfd3c3]';
  const borderClass = theme === 'charcoal' ? 'border-[rgba(217,163,74,0.3)]' : 'border-[rgba(44,31,17,0.2)]';
  const primaryText = 'text-[#d9a34a]';

  return (
    <div className={`min-h-screen flex flex-col font-mono transition-colors duration-300 pb-16 p-3 md:p-8 ${bgClass}`}>
      {/* Interactive 3D Card styles injected locally to guarantee performance */}
      <style dangerouslySetInnerHTML={{ __html: `
        .scene-3d {
          perspective: 2000px;
        }
        .card-3d {
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .card-3d.flipped {
          transform: rotateY(180deg);
        }
        .face-3d {
          backface-visibility: hidden;
          position: absolute;
          inset: 0;
        }
        .face-back-3d {
          transform: rotateY(180deg);
        }
      `}} />

      {/* Header Panel */}
      <header className={`w-full max-w-7xl mx-auto pt-24 pb-8 border-b ${theme === 'charcoal' ? 'border-amber-500/10' : 'border-amber-900/10'} mb-8`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <Link href="/" className="hover:opacity-85 transition-opacity">
                <img
                  alt="Mark Twain Logo"
                  width="70"
                  height="25"
                  className="mark-twain-solo-logo"
                  src="/images/MarkTwainSoloLogo.webp"
                  style={{ color: 'transparent' }}
                />
              </Link>
              <span className="text-[10px] uppercase tracking-widest text-[#d9a34a] font-bold">Restoration Labs</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#d9a34a] tracking-wide mt-2">
              Following the Equator
            </h1>
            <p className="text-xs opacity-65 mt-1">
              Restoring Mark Twain's 1897 travelogue illustrations as high-fidelity 1899 photographs.
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* View switcher */}
            <div className={`flex rounded overflow-hidden p-1 border ${borderClass} ${controlBgClass}`}>
              <button
                onClick={() => setActiveTab('flashcards')}
                className={`px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'flashcards'
                    ? 'bg-[#d9a34a] text-[#15110d] font-bold'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Layers size={13} />
                <span>Inspector</span>
              </button>
              <button
                onClick={() => setActiveTab('grid')}
                className={`px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'grid'
                    ? 'bg-[#d9a34a] text-[#15110d] font-bold'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <LayoutGrid size={13} />
                <span>Grid View</span>
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-md border ${borderClass} ${controlBgClass} hover:text-[#d9a34a] hover:border-[#d9a34a] transition-all`}
              title="Toggle Theme"
            >
              {theme === 'charcoal' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full mx-auto flex-1 flex flex-col items-center justify-center">
        {activeTab === 'flashcards' ? (
          /* ==================== FLASHCARDS MODE ==================== */
          <div className="w-full flex flex-col items-center gap-6">
            <div className="w-full max-w-2xl text-center">
              <span className={`text-[10px] tracking-[2px] font-bold uppercase py-1 px-3.5 rounded border border-[#d9a34a]/30 bg-[#d9a34a]/5 ${primaryText}`}>
                Interactive Flashcards
              </span>
            </div>

            {/* 3D Card Scene */}
            <div className="relative w-full max-w-lg aspect-square scene-3d">
              <div className={`w-full h-full card-3d ${isFlipped ? 'flipped' : ''}`}>
                {/* Front Face: Original Drawing */}
                <div className={`face-3d w-full h-full rounded-lg overflow-hidden flex flex-col shadow-2xl border ${borderClass} ${cardBgClass}`}>
                  <div className="flex-1 relative overflow-hidden bg-[#0a0806] flex items-center justify-center p-4 select-none">
                    <img
                      src={SLIDES[pos % 2 === 0 ? pos : pos - 1].src}
                      alt="Original illustration"
                      className="max-w-full max-h-full object-contain pointer-events-none"
                    />
                  </div>
                  <div className="p-4 flex items-center justify-between border-t border-[#d9a34a]/15 bg-black/25">
                    <div className="flex flex-col">
                      <span className="font-serif font-bold text-sm text-[#d9a34a]">Original Drawing</span>
                      <span className="text-[11px] opacity-60 font-mono mt-0.5">{SLIDES[pos % 2 === 0 ? pos : pos - 1].stem}</span>
                    </div>
                    <span className="text-[10px] border border-amber-500/20 px-2 py-0.5 rounded text-amber-500/70 font-mono uppercase bg-amber-500/5">
                      {SLIDES[pos % 2 === 0 ? pos : pos - 1].status}
                    </span>
                  </div>
                </div>

                {/* Back Face: Recreated Photograph */}
                <div className={`face-3d face-back-3d w-full h-full rounded-lg overflow-hidden flex flex-col shadow-2xl border ${borderClass} ${cardBgClass}`}>
                  <div className="flex-1 relative overflow-hidden bg-[#0a0806] flex items-center justify-center p-4 select-none">
                    <img
                      src={SLIDES[pos % 2 === 1 ? pos : pos + 1].src}
                      alt="Recreated photograph"
                      className="max-w-full max-h-full object-contain pointer-events-none"
                    />
                  </div>
                  <div className="p-4 flex items-center justify-between border-t border-[#d9a34a]/15 bg-black/25">
                    <div className="flex flex-col">
                      <span className="font-serif font-bold text-sm text-[rgba(255,244,223,0.9)]">Recreated Photo</span>
                      <span className="text-[11px] opacity-60 font-mono mt-0.5">{SLIDES[pos % 2 === 1 ? pos : pos + 1].stem}</span>
                    </div>
                    <span className="text-[10px] border border-[#d9a34a]/30 px-2 py-0.5 rounded text-[#d9a34a] font-mono uppercase bg-[#d9a34a]/5">
                      {SLIDES[pos % 2 === 1 ? pos : pos + 1].status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Click / Tap Hotspots */}
              <div className="absolute inset-0 flex z-20">
                {/* Back Zone */}
                <div
                  onClick={() => {
                    step(-1);
                    setShowChevrons(prev => ({ ...prev, left: true }));
                    setTimeout(() => setShowChevrons(prev => ({ ...prev, left: false })), 400);
                  }}
                  onMouseEnter={() => setShowChevrons(prev => ({ ...prev, left: true }))}
                  onMouseLeave={() => setShowChevrons(prev => ({ ...prev, left: false }))}
                  className="w-[30%] h-full cursor-w-resize"
                  title="Previous (Click left 30%)"
                />
                {/* Forward Zone */}
                <div
                  onClick={() => {
                    step(1);
                    setShowChevrons(prev => ({ ...prev, right: true }));
                    setTimeout(() => setShowChevrons(prev => ({ ...prev, right: false })), 400);
                  }}
                  onMouseEnter={() => setShowChevrons(prev => ({ ...prev, right: true }))}
                  onMouseLeave={() => setShowChevrons(prev => ({ ...prev, right: false }))}
                  className="w-[70%] h-full cursor-pointer"
                  title="Next (Click right 70%)"
                />
              </div>

              {/* Navigation Chevrons */}
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/75 border border-[#d9a34a]/30 rounded-full text-[#d9a34a] transition-all duration-300 pointer-events-none z-30 ${
                  showChevrons.left ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
              >
                <ArrowLeft size={20} />
              </div>
              <div
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/75 border border-[#d9a34a]/30 rounded-full text-[#d9a34a] transition-all duration-300 pointer-events-none z-30 ${
                  showChevrons.right ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
              >
                <ArrowRight size={20} />
              </div>
            </div>

            {/* Deck Controls */}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs opacity-75 font-mono min-w-[80px] text-center select-none">
                {currentSlide.gi + 1} / {totalGroups}
              </span>
              <button
                onClick={flipCard}
                className={`px-4 py-2 text-xs border ${borderClass} ${controlBgClass} hover:border-[#d9a34a] hover:text-[#d9a34a] transition-all active:scale-95`}
              >
                Flip (F)
              </button>
              <button
                onClick={triggerShuffle}
                className={`px-4 py-2 text-xs border ${borderClass} ${controlBgClass} hover:border-[#d9a34a] hover:text-[#d9a34a] transition-all flex items-center gap-1.5 active:scale-95`}
              >
                <Shuffle size={12} />
                <span>Shuffle (S)</span>
              </button>
            </div>

            {/* Quick Hint */}
            <div className={`text-[10px] text-center max-w-md leading-relaxed opacity-55 flex items-center justify-center gap-1.5 p-3 rounded border border-dashed ${borderClass} mt-4`}>
              <HelpCircle size={14} className="shrink-0 text-[#d9a34a]" />
              <span>
                <strong>Controls:</strong> Click card right &rarr; next side/illustration &middot; Click card left &larr; back &middot; <kbd className="bg-black/35 px-1 py-0.5 rounded">Space</kbd> / <kbd className="bg-black/35 px-1 py-0.5 rounded">&rarr;</kbd> forward &middot; <kbd className="bg-black/35 px-1 py-0.5 rounded">F</kbd> flip &middot; <kbd className="bg-black/35 px-1 py-0.5 rounded">S</kbd> shuffle.
              </span>
            </div>
          </div>
        ) : (
          /* ==================== GRID MODE ==================== */
          <div className="w-full flex flex-col gap-6">
            <div className="text-center md:text-left border-b border-[#d9a34a]/10 pb-4">
              <h2 className="font-serif text-lg font-bold text-[#d9a34a]">Photographs vs. Original Sketches</h2>
              <p className="text-xs opacity-60 mt-1">
                Hover or tap a card to flip and view the original Gutenberg sketch. Click/tap to lock the flipped state.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
              {groupedSlides.map((group) => {
                const isCardFlipped = gridFlips[group.stem] || false;
                const isApproved = group.status === 'approved';

                return (
                  <figure
                    key={group.stem}
                    onClick={() => toggleGridFlip(group.stem)}
                    className={`group cursor-pointer rounded-lg overflow-hidden border-l-4 p-2 transition-all duration-300 relative ${
                      isApproved 
                        ? 'border-[#d9a34a] hover:shadow-[#d9a34a]/5' 
                        : 'border-amber-500/35 hover:shadow-amber-500/5'
                    } ${theme === 'charcoal' ? 'bg-[#1d1611]' : 'bg-[#eadecc]'} shadow-lg hover:shadow-xl`}
                  >
                    <div className="aspect-[16/10] relative w-full overflow-hidden bg-black/60 rounded">
                      {/* Photo Face (Shown by default) */}
                      <img
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0 ${
                          isCardFlipped ? 'opacity-0' : 'opacity-100'
                        }`}
                        src={group.recreated.src}
                        alt={`${group.stem} photograph`}
                        loading="lazy"
                      />

                      {/* Original Drawing Face (Revealed on hover/flip) */}
                      <img
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-100 ${
                          isCardFlipped ? 'opacity-100' : 'opacity-0'
                        }`}
                        src={group.original.src}
                        alt={`${group.stem} original`}
                        loading="lazy"
                      />

                      {/* Small Overlay indicator on hover */}
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] tracking-wider uppercase font-bold bg-black/75 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCardFlipped ? 'Lock: Original' : 'Preview: Original'}
                      </div>
                    </div>

                    <figcaption className="flex justify-between items-center mt-3 px-1 text-xs">
                      <span className="font-mono text-xs opacity-75">{group.stem}</span>
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold ${
                        isApproved
                          ? 'border-[#d9a34a] text-[#d9a34a] bg-[#d9a34a]/5'
                          : 'border-amber-500/30 text-amber-500/80 bg-amber-500/5'
                      }`}>
                        {group.status}
                      </span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
