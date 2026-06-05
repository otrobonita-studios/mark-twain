'use client';

import { useState } from 'react';
import { Copy, Check, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MarkTwainLetterCard({ recipient, date, bodyHtml, signature, contextHtml }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('letter'); // 'letter' | 'context'
  const [copied, setCopied] = useState(false);

  // Subject line for the letter
  const isFrom = /^\s*From/i.test(recipient || '');
  const cleanRecipient = (recipient || '')
    .replace(/<[^>]+>/g, '') // strip HTML
    .replace(/^(?:To|From)\s+/i, '')
    .replace(/:/g, '')
    .trim();
    
  const cleanDate = (date || '').replace(/<[^>]+>/g, '').trim();
  const subject = `Concerning the letter ${isFrom ? 'from' : 'to'} ${cleanRecipient || 'Friend'}${cleanDate ? ' (' + cleanDate + ')' : ''}`;

  // Helper to extract plain text from HTML for copy function
  const getPlainText = (html) => {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&mdash;/g, '—')
      .replace(/&amp;/g, '&')
      .replace(/&ldquo;/g, '“')
      .replace(/&rdquo;/g, '”')
      .replace(/&lsquo;/g, '‘')
      .replace(/&rsquo;/g, '’')
      .trim();
  };

  const handleCopy = () => {
    const plainBody = getPlainText(bodyHtml);
    const plainSig = getPlainText(signature);
    const fullText = `${cleanRecipient ? 'To: ' + cleanRecipient + '\n' : ''}${cleanDate ? 'Date: ' + cleanDate + '\n' : ''}${cleanRecipient || cleanDate ? '\n' : ''}${plainBody}${plainSig ? '\n\n' + plainSig : ''}`;
    
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommentAwareness = () => {
    const plainBody = getPlainText(bodyHtml);
    const snippet = plainBody.substring(0, 150).trim() + '...';
    const query = `Regarding your letter to ${cleanRecipient}${cleanDate ? ' on ' + cleanDate : ''} where you wrote:\n"${snippet}"\n\nCan you tell me more about what was happening in your life when you wrote this?`;
    router.push(`/chat?query=${encodeURIComponent(query)}&excerpt=${encodeURIComponent(snippet)}`);
  };

  return (
    <div className="letter-card-container -mx-1 mb-8 overflow-hidden rounded-lg bg-[#1c1814] border border-[rgba(255,244,223,0.08)] shadow-lg font-sans">
      {/* Tab List */}
      <div className="flex items-center justify-between border-b border-[rgba(255,244,223,0.08)] bg-[#15110d] px-4 py-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('letter')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'letter'
                ? 'bg-[var(--primary)] text-[#15110d]'
                : 'text-[var(--muted-foreground)] hover:text-white hover:bg-[rgba(255,244,223,0.04)]'
            }`}
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[rgba(255,244,223,0.15)] text-[10px] font-bold">A</span>
            The Letter
          </button>
          
          {contextHtml && (
            <button
              onClick={() => setActiveTab('context')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'context'
                  ? 'bg-[var(--primary)] text-[#15110d]'
                  : 'text-[var(--muted-foreground)] hover:text-white hover:bg-[rgba(255,244,223,0.04)]'
              }`}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[rgba(255,244,223,0.15)] text-[10px] font-bold">B</span>
              Historical Context
            </button>
          )}
        </div>
      </div>

      {/* Subject Line */}
      <div className="flex items-center gap-3 border-b border-[rgba(255,244,223,0.06)] px-5 py-2.5 bg-[#181411]">
        <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">Subject:</span>
        <input
          readOnly
          value={subject}
          className="bg-transparent text-sm text-[var(--primary)] w-full outline-none font-medium"
        />
      </div>

      {/* Content Area */}
      <div className="relative min-h-[220px] max-h-[400px] overflow-y-auto px-6 py-1 bg-[#1d1915] text-[var(--foreground)] scrollbar-thin">
        {activeTab === 'letter' ? (
          <div className="font-serif leading-relaxed text-justify space-y-4">
            {recipient && (
              <p 
                className="font-bold text-[var(--primary)] text-lg"
                style={{ lineHeight: 1.5, marginTop: '2.18rem' }}
                dangerouslySetInnerHTML={{ __html: recipient }}
              />
            )}
            {date && (
              <div 
                className="italic text-sm text-[var(--muted-foreground)] text-right font-mono"
                dangerouslySetInnerHTML={{ __html: date }}
              />
            )}
            <div 
              className="text-base text-[rgba(255,244,223,0.9)] book-letter-body"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
            {signature && (
              <div 
                className="text-right font-mono text-xs text-[var(--primary)] opacity-85 pt-4 border-t border-[rgba(255,244,223,0.03)]"
                dangerouslySetInnerHTML={{ __html: signature }}
              />
            )}
          </div>
        ) : (
          <div 
            className="font-sans leading-relaxed text-sm text-[var(--muted-foreground)] space-y-4 italic book-letter-context"
            dangerouslySetInnerHTML={{ __html: contextHtml }}
          />
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-end gap-2 border-t border-[rgba(255,244,223,0.08)] bg-[#15110d] p-2">
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="flex h-8 w-8 items-center justify-center rounded border border-[rgba(255,244,223,0.08)] bg-[#1d1915] text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all duration-200"
          title="Copy letter to clipboard"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>

        {/* Ask Me Action Button */}
        <button
          onClick={handleCommentAwareness}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[rgba(255,244,223,0.08)] bg-[#1d1915] text-xs font-semibold text-[rgba(255,244,223,0.85)] hover:text-white hover:border-[var(--primary)] hover:bg-[rgba(255,244,223,0.02)] transition-all duration-200"
        >
          Ask Me
          <ArrowRight size={12} className="text-[var(--primary)]" />
        </button>
      </div>
    </div>
  );
}
