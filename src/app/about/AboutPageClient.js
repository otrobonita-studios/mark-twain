'use client';

import { useState } from 'react';
import GenericBookReader from '@/components/GenericBookReader';

export default function AboutPageClient({ twainHtml, albertHtml }) {
  const [activeTab, setActiveTab] = useState('what-i-say');

  // Prepare "What I say" content
  let processedTwainHtml = twainHtml;
  if (processedTwainHtml.includes('<h2>')) {
    processedTwainHtml = processedTwainHtml.replace('<h2>', '<h2 id="intro-title">');
  }
  const twainTitleBlock = `
    <div class="book-title-block">
      <h1>MARK TWAIN</h1>
      <h2>Against My Better Judgment</h2>
    </div>
    <hr />
  `;
  const twainFullContent = twainTitleBlock + processedTwainHtml;
  const twainTocItems = [
    {
      id: 'intro-title',
      label: 'An Introduction',
      type: 'section'
    }
  ];

  // Prepare "Alberts Words" content
  let processedAlbertHtml = albertHtml;
  if (processedAlbertHtml.includes('<h2>')) {
    processedAlbertHtml = processedAlbertHtml.replace('<h2>', '<h2 id="albert-bio-title">');
  }
  const albertTitleBlock = `
    <div class="book-title-block">
      <h1>ALBERT BIGELOW PAINE</h1>
      <h2>Mark Twain</h2>
      <h2>A Biographical Summary</h2>
    </div>
    <hr />
  `;
  const albertFullContent = albertTitleBlock + processedAlbertHtml;
  const albertTocItems = [
    {
      id: 'albert-bio-title',
      label: 'Biographical Summary',
      type: 'section'
    }
  ];

  // Select active state based on tab
  const htmlContent = activeTab === 'what-i-say' ? twainFullContent : albertFullContent;
  const tocItems = activeTab === 'what-i-say' ? twainTocItems : albertTocItems;

  const headerExtra = (
    <div className="about-tabs-container flex justify-center gap-8 mb-8 pb-4 select-none">
      <button
        onClick={() => setActiveTab('what-i-say')}
        className={`px-4 py-2 font-mono text-xs tracking-wider uppercase transition-all duration-200 border-b-2 focus:outline-none ${
          activeTab === 'what-i-say'
            ? 'border-[var(--primary)] text-[var(--primary)] font-semibold scale-105'
            : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:scale-102'
        }`}
      >
        What I say
      </button>
      <button
        onClick={() => setActiveTab('albert-words')}
        className={`px-4 py-2 font-mono text-xs tracking-wider uppercase transition-all duration-200 border-b-2 focus:outline-none ${
          activeTab === 'albert-words'
            ? 'border-[var(--primary)] text-[var(--primary)] font-semibold scale-105'
            : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:scale-102'
        }`}
      >
        Alberts Words
      </button>
    </div>
  );

  return (
    <div className="about-me">
      <GenericBookReader
        htmlContent={htmlContent}
        tocItems={tocItems}
        bookTitle={activeTab === 'what-i-say' ? 'About Me' : 'Biographical Summary'}
        showExperienceSelector={false}
        headerExtra={headerExtra}
      />
    </div>
  );
}
