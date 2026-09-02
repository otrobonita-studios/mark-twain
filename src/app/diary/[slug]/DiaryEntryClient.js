'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function DiaryEntryClient({ staticEntry, slug }) {
  // Diary entries are served from static content only. The Firestore lookup
  // that used to back unknown slugs was removed with the Firebase teardown.
  const [entry] = useState(staticEntry);
  const loading = false;
  const error = !staticEntry;

  if (error) {
    notFound();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15110d] text-[rgba(255,244,223,0.88)] flex flex-col items-center justify-center py-12 px-4">
        <div className="animate-pulse font-mono text-xs uppercase tracking-widest text-[var(--primary)]">
          Retrieving journal entry...
        </div>
      </div>
    );
  }

  const handlePlayAudio = () => {
    if (entry.audioIndex !== undefined) {
      window.dispatchEvent(new CustomEvent('media-player-select-track-request', { 
        detail: { index: entry.audioIndex } 
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#15110d] text-[rgba(255,244,223,0.88)] flex justify-center py-12 px-4 md:px-8">
      <div className="w-full max-w-2xl">
        {/* Navigation / Header */}
        <div className="mb-8 flex justify-between items-center border-b border-[rgba(217,163,74,0.15)] pb-4">
          <Link 
            href="/"
            className="font-mono text-xs tracking-widest uppercase text-[var(--primary)] hover:text-white transition-all flex items-center gap-2"
          >
            ← Return to Writing Desk
          </Link>
          <span className="typewriter text-xs text-[var(--muted-foreground)]">
            Journal Entry
          </span>
        </div>

        {/* Tactile Parchment Paper Card */}
        <article className="tactile-card p-6 md:p-10 bg-[#1a1510] border border-[rgba(217,163,74,0.2)] rounded-lg shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          {/* Header */}
          <header className="mb-6 border-b border-[rgba(217,163,74,0.15)] pb-4">
            <span className="typewriter text-xs text-[var(--primary)] block mb-2 font-mono">
              {entry.date}
            </span>
            <h1 className="font-sans text-2xl md:text-3xl font-bold text-[var(--primary)] tracking-wide leading-tight">
              {entry.title}
            </h1>
          </header>

          {/* Content */}
          <div className="font-sans text-[15px] md:text-[16px] leading-relaxed whitespace-pre-line text-[rgba(255,244,223,0.9)] space-y-4 mb-8">
            {entry.content}
            <Image 
              src="/images/mark-twain-signature.webp" 
              alt="Mark Twain Signature" 
              width={3848}
              height={755}
              className="modal-signature-img block"
              style={{ display: 'block', width: '220px', height: 'auto', marginTop: '25px', marginBottom: '25px' }}
            />
          </div>

          {/* Optional Image */}
          {entry.image && (
            <div className="my-8 flex flex-col items-center">
              <div className="relative w-full max-w-lg aspect-[4/3] rounded-lg overflow-hidden">
                <Image
                  src={entry.image}
                  alt={entry.title}
                  fill
                  className="object-cover"
                />
              </div>
              {entry.postscript && (
                <p className="font-sans text-center mt-4 text-sm italic opacity-90 max-w-lg text-[var(--primary)]">
                  {entry.postscript}
                </p>
              )}
            </div>
          )}

          {/* Optional Audio / Spotify Controls */}
          {(entry.spotifyUrl || entry.audioIndex !== undefined) && (
            <div className="modal-audio-controls flex flex-wrap gap-4 justify-center items-center my-6 p-4">
              {entry.audioIndex !== undefined && (
                <button
                  onClick={handlePlayAudio}
                  className="flex items-center gap-2 px-5 py-3 rounded bg-[var(--primary)] text-black hover:bg-[var(--primary-hover)] transition-all font-sans font-semibold text-xs tracking-wider uppercase shadow-md cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="shrink-0">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Listen on Audio Desk
                </button>
              )}
              
              {entry.spotifyUrl && (
                <a
                  href={entry.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded bg-[#1DB954] text-white hover:bg-[#1ed760] transition-all font-sans font-semibold text-xs tracking-wider uppercase shadow-md"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" className="shrink-0" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.377-1.454-5.37-1.783-8.892-1.007-.336.074-.67-.14-.744-.476-.074-.336.14-.67.476-.744 3.856-.88 7.15-.506 9.81 1.127.295.18.387.563.207.857c-.001-.001-.001-.001 0 0zm1.225-2.72c-.226.367-.707.487-1.074.26-2.722-1.672-6.87-2.157-10.082-1.182-.413.125-.847-.107-.972-.52-.125-.413.107-.847.52-.972 3.676-1.116 8.243-.574 11.348 1.33.367.227.487.708.26 1.074v.01zm.106-2.833c-.273.447-.858.594-1.306.32-3.178-1.89-8.412-2.083-11.454-1.16-.503.152-1.037-.134-1.189-.637-.152-.502.135-1.036.637-1.188 3.633-1.102 9.404-.888 13.084 1.3 448.272.274.595.858.32 1.306v-.002z"/>
                  </svg>
                  Listen on Spotify
                </a>
              )}
            </div>
          )}




        </article>
      </div>
    </div>
  );
}
