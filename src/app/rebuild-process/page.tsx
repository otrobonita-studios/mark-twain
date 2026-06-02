'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Moon, Sun, Briefcase } from 'lucide-react';

export default function RebuildProcessPage() {
  const [theme, setTheme] = useState('charcoal'); // 'parchment' | 'charcoal'
  const [fontSize, setFontSize] = useState('small'); // 'small' | 'normal' | 'large'
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync settings with localStorage
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

  const steps = [
    {
      num: '01',
      title: 'Identify your sources',
      desc: 'Where does knowledge live? Wikis, Slack archives, Google Docs, past projects, customer interviews, internal databases? List them all. (I used Project Gutenberg, Wikisource, and Internet Archive.)'
    },
    {
      num: '02',
      title: 'Write source-specific crawlers',
      desc: "Each source has different access patterns. Don't build one magical spider; build lightweight downloaders, one per source. Make them resumable — crashes shouldn't cost hours of re-downloading."
    },
    {
      num: '03',
      title: 'Normalize to a shared format',
      desc: 'Every downloader outputs the same shape: file + metadata sidecar (.meta.json) + text file. One schema, many sources. Downstream tools don\'t need to know where the data came from.'
    },
    {
      num: '04',
      title: 'Clean and deduplicate',
      desc: 'Strip out garbage (license blocks, HTML cruft, duplicate pages). Remove redundant copies before embedding — saves money and prevents hallucinations later.'
    },
    {
      num: '05',
      title: 'Chunk into searchable units',
      desc: 'Break long documents into pieces (~500 words each). Each chunk gets a unique ID. This is your actual unit of retrieval.'
    },
    {
      num: '06',
      title: 'Embed locally and offline',
      desc: 'Use a local model (BGE-M3, or similar) to turn chunks into vectors. Keep this phase disconnected from cloud APIs — one network blip shouldn\'t kill hours of CPU work.'
    },
    {
      num: '07',
      title: 'Store vectors in a searchable database',
      desc: 'Upload to Qdrant (or Weaviate, Pinecone, etc.). One collection, indexed, queryable. This is your "company brain" at rest.'
    },
    {
      num: '08',
      title: 'Build a retrieval layer',
      desc: 'When someone asks a question, encode it, search the vector store, grab the top 3–5 relevant chunks. Don\'t ask the LLM to guess — give it actual source material.'
    },
    {
      num: '09',
      title: 'Connect to an LLM',
      desc: 'Feed the retrieved chunks + the question to your model (local, cloud, whatever). The model synthesizes an answer grounded in your actual company knowledge, not generic training data.'
    },
    {
      num: '10',
      title: 'Deploy and iterate',
      desc: 'Monitor queries. Notice what people ask. Add new sources. Fine-tune when needed. The brain learns as the company evolves.'
    }
  ];

  const outcomes = [
    {
      title: 'No more knowledge drain',
      desc: 'Years of client context and institutional lessons remain inside the company even when key staff members move on.'
    },
    {
      title: 'Verifiable answers',
      desc: 'Every response is grounded directly in actual company files, with transparent tracing back to the source documents.'
    },
    {
      title: 'Faster onboarding',
      desc: 'New hires can query the company brain directly to get immediate context instead of constantly hunting down colleagues.'
    },
    {
      title: 'Competitive moat',
      desc: 'Your custom intelligence model knows proprietary processes, internal secrets, and historical client context the public internet cannot access.'
    }
  ];

  const isParchment = theme === 'parchment';

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
        <article className={`book-page-parchment font-serif size-${fontSize}`} style={{ paddingBottom: '6rem' }}>
          {/* Theme Selector (Floating inside parchment card) */}
          <button
            onClick={() => setTheme(theme === 'parchment' ? 'charcoal' : 'parchment')}
            className="book-control-btn theme-toggle parchment-theme-toggle"
            title={`Switch to ${theme === 'parchment' ? 'Charcoal' : 'Parchment'} theme`}
          >
            {theme === 'parchment' ? <Moon size={16} /> : <Sun size={16} />}
          </button>



          <h1 className="text-text-100 text-[2.25rem] font-bold text-center leading-tight mb-2">
            Building Your Company's Central Intelligence
          </h1>
          
          <h2 className="text-xs uppercase tracking-widest text-center font-mono opacity-60 mb-12">
            Your company needs a brain as much as Mark did.
          </h2>

          <div className="space-y-12">
            {/* The Challenge */}
            <section className="text-left">
              <h3 className="text-lg font-bold uppercase tracking-wider text-[var(--primary)] mb-4 text-left" style={{ marginTop: '4rem' }}>
                The Challenge
              </h3>
              <p className="text-base leading-relaxed text-justify mb-0">
                Right now, knowledge lives in people. When Sarah leaves, her years of client context go with her. 
                When the team pivots, the institutional lessons from three failed projects are scattered across forgotten 
                Slack threads and personal notebooks. Each new hire re-learns what the last one figured out. 
                You're not investing in a company that learns — you're investing in individuals who do.
              </p>
            </section>

            {/* The Opportunity */}
            <section className="text-left">
              <h3 className="text-lg font-bold uppercase tracking-wider text-[var(--primary)] mb-4 text-left">
                The Opportunity
              </h3>
              <p className="text-base leading-relaxed text-justify mb-0">
                Building central intelligence isn't hard, but it takes planning. Here's how I created the base 
                knowledge layer that Mark Twain's personality now runs on — and how your company can do the same.
              </p>
            </section>

            {/* The 10-Step Process */}
            <section className="text-left">
              <h3 className="text-lg font-bold uppercase tracking-wider text-[var(--primary)] mb-6 text-left">
                The 10-Step Process
              </h3>
              <div className="space-y-6">
                {steps.map((step, idx) => (
                  <div key={idx} className="border-b border-[rgba(217,163,74,0.06)] pb-5 last:border-b-0">
                    <div className="flex-1">
                      <h4 className="text-[1.05rem] font-bold mb-1 leading-normal text-left" style={{ margin: 0, color: 'var(--foreground)' }}>
                        <span className="font-mono text-sm font-bold text-[var(--primary)] opacity-85 pt-1 select-none" style={{ marginRight: '0.75rem' }}>
                          {step.num}
                        </span>
                        {step.title}
                      </h4>
                      <p className="text-sm leading-relaxed text-justify mb-0 opacity-80" style={{ color: 'inherit' }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* What You Get */}
            <section className="text-left">
              <h3 className="text-lg font-bold uppercase tracking-wider text-[var(--primary)] mb-6 text-left">
                What You Get
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {outcomes.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="rounded-lg border text-left" 
                    style={{
                      padding: '1.5rem',
                      backgroundColor: isParchment ? 'rgba(44, 31, 17, 0.02)' : 'rgba(255, 244, 223, 0.01)',
                      borderColor: isParchment ? 'rgba(44, 31, 17, 0.08)' : 'rgba(255, 244, 223, 0.06)'
                    }}
                  >
                    <h4 className="font-serif font-bold text-base mb-2 text-[var(--primary)] leading-normal">
                      {item.title}
                    </h4>
                    <p className="text-xs leading-relaxed opacity-85 mb-0" style={{ fontFamily: 'sans-serif' }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* The Next Step */}
            <section className="text-left border-t border-[rgba(217,163,74,0.12)] pt-10" style={{ marginTop: '5rem' }}>
              <h3 className="text-lg font-bold uppercase tracking-wider text-[var(--primary)] mb-4 text-left">
                The Next Step
              </h3>
              <p className="text-base leading-relaxed text-justify mb-6">
                Mr Twain's progress has been faster than expected, which means we have capacity.
              </p>
              <p className="text-base leading-relaxed text-justify mb-8">
                For companies ready to explore: <strong>Otrobonita Labs</strong> offers a <strong>Preliminary Architecture Sketch</strong> — a 2–3 page assessment that maps your current knowledge sources, identifies the highest-value starting point, and outlines a phased build plan.
              </p>
              <div className="p-6 rounded-lg border text-center" style={{
                backgroundColor: isParchment ? 'rgba(44, 31, 17, 0.03)' : 'rgba(255, 244, 223, 0.02)',
                borderColor: isParchment ? 'rgba(44, 31, 17, 0.12)' : 'rgba(217, 163, 74, 0.15)',
                margin: '2rem 0'
              }}>
                <p className="text-sm opacity-85 leading-relaxed mb-6 font-sans">
                  The sketch is designed to sit in your strategic backlog over the summer. Share it with stakeholders. Let the idea marinate. By autumn, you'll know exactly what the first sprint looks like and what you need.
                </p>
                <a
                  href="https://otrobonita.com/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded text-sm font-semibold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[#15110d] transition-all duration-200 shadow-md hover:shadow-lg inline-flex items-center gap-2 cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  <Briefcase size={16} />
                  <span>Request a Preliminary Sketch</span>
                </a>
              </div>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
