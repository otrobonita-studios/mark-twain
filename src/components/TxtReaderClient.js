'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Monitor, Laptop, HelpCircle, FileText, ChevronDown, AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline } from 'lucide-react';

export default function TxtReaderClient({ filename, initialContent, initialError, onClose }) {
  const [theme, setTheme] = useState('notepad'); // 'notepad' | 'textedit'
  const [content, setContent] = useState(initialContent || '');
  const [error, setError] = useState(initialError || null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [activeMenu, setActiveMenu] = useState(null);
  const [wordWrap, setWordWrap] = useState(true);
  const textareaRef = useRef(null);

  // Detect OS on mount to select initial theme
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.includes('mac') || userAgent.includes('ipad') || userAgent.includes('iphone')) {
        setTheme('textedit');
      } else {
        setTheme('notepad');
      }
    }
  }, []);

  // Update line and column position on selection/click/type
  const handleTextareaSelect = (e) => {
    const textarea = e.target;
    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
    const lines = textBeforeCursor.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  const handleMenuClick = (menuName) => {
    if (activeMenu === menuName) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menuName);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest('.notepad-menu-item')) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#241e17] text-[#fff4df] flex flex-col font-sans">
      {/* Top Bar with OS theme switcher and Back desk link */}
      <div className="bg-[#1b1510] border-b border-[rgba(255,244,223,0.08)] px-4 py-3 flex items-center justify-between z-50">
        {onClose ? (
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Library</span>
          </button>
        ) : (
          <Link href="/complete-works" className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-white transition-colors">
            <ArrowLeft size={16} />
            <span>Back to Library</span>
          </Link>
        )}

        {/* Theme Switcher Toggle */}
        <div className="flex items-center bg-[rgba(255,244,223,0.05)] rounded-lg p-1 border border-[rgba(255,244,223,0.1)]">
          <button 
            onClick={() => setTheme('notepad')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'notepad' ? 'bg-[#d9a34a] text-black shadow' : 'text-[#fff4df] hover:bg-[rgba(255,244,223,0.05)]'}`}
          >
            <Monitor size={14} />
            <span>Windows Notepad</span>
          </button>
          <button 
            onClick={() => setTheme('textedit')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'textedit' ? 'bg-[#d9a34a] text-black shadow' : 'text-[#fff4df] hover:bg-[rgba(255,244,223,0.05)]'}`}
          >
            <Laptop size={14} />
            <span>macOS TextEdit</span>
          </button>
        </div>

        <div className="text-xs text-[rgba(255,244,223,0.45)] flex items-center gap-1">
          <HelpCircle size={14} />
          <span>OS Mode (Editable Preview)</span>
        </div>
      </div>

      {/* Main OS Viewer Workspace */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#15110d] p-6 justify-center items-center">
        
        {/* WINDOW CONTAINER */}
        <div className="w-full max-w-5xl h-[80vh] flex flex-col rounded-lg overflow-hidden shadow-2xl border border-[rgba(255,244,223,0.15)] relative">
          
          {/* THEME 1: WINDOWS NOTEPAD */}
          {theme === 'notepad' && (
            <div className="flex-1 flex flex-col bg-[#1f1f1f] text-[#f1f1f1] font-mono select-none">
              
              {/* Notepad Title Bar */}
              <div className="h-10 bg-[#2d2d2d] flex items-center justify-between px-3 border-b border-[#3d3d3d] shrink-0 text-sm">
                <div className="flex items-center gap-2 text-xs text-[#c0c0c0]">
                  <FileText size={14} className="text-[#d9a34a]" />
                  <span>{error ? 'Error.txt' : filename} - Notepad</span>
                </div>
                {/* Windows Window Controls */}
                <div className="flex h-full items-center">
                  <button 
                    onClick={onClose || (() => {})} 
                    className="w-11 h-full hover:bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-sm text-[#e0e0e0]"
                  >
                    &mdash;
                  </button>
                  <button className="w-11 h-full hover:bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-xs text-[#e0e0e0]">&#9633;</button>
                  <button 
                    onClick={onClose || (() => {})} 
                    className="w-11 h-full hover:bg-[#e81123] hover:text-white flex items-center justify-center text-sm text-[#e0e0e0]"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Notepad Menu Bar */}
              <div className="h-8 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-2 gap-1 text-xs text-[#e0e0e0] shrink-0 relative">
                {[
                  { label: 'File', items: ['New Tab', 'New Window', 'Open...', 'Save', 'Save As...', 'Page Setup', 'Print', 'Exit'] },
                  { label: 'Edit', items: ['Undo', 'Cut', 'Copy', 'Paste', 'Delete', 'Find...', 'Replace...', 'Go To...', 'Select All', 'Time/Date'] },
                  { label: 'Format', items: ['Word Wrap', 'Font...'] },
                  { label: 'View', items: ['Zoom', 'Status Bar'] },
                  { label: 'Help', items: ['View Help', 'Send Feedback', 'About Notepad'] }
                ].map((menu) => (
                  <div key={menu.label} className="relative notepad-menu-item">
                    <button 
                      onClick={() => handleMenuClick(menu.label)} 
                      className={`px-3 py-1 rounded hover:bg-[rgba(255,255,255,0.08)] transition-all ${activeMenu === menu.label ? 'bg-[rgba(255,255,255,0.12)]' : ''}`}
                    >
                      {menu.label}
                    </button>
                    
                    {/* Dropdown Menu */}
                    {activeMenu === menu.label && (
                      <div className="absolute left-0 top-7 w-44 bg-[#2d2d2d] border border-[#444] rounded shadow-xl py-1 z-50 flex flex-col text-xs text-[#e0e0e0]">
                        {menu.items.map((item, idx) => {
                          if (item === 'Word Wrap') {
                            return (
                              <button 
                                key={idx} 
                                onClick={() => { setWordWrap(!wordWrap); setActiveMenu(null); }}
                                className="px-4 py-1.5 text-left hover:bg-[rgba(255,255,255,0.08)] flex justify-between items-center"
                              >
                                <span>{item}</span>
                                {wordWrap && <span className="text-[var(--primary)]">&#x2713;</span>}
                              </button>
                            );
                          }
                          return (
                            <button 
                              key={idx} 
                              onClick={() => {
                                setActiveMenu(null);
                                if (item === 'Exit' && onClose) {
                                  onClose();
                                }
                              }}
                              className="px-4 py-1.5 text-left hover:bg-[rgba(255,255,255,0.08)] w-full"
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Notepad Workspace / Text Area */}
              <div className="flex-1 overflow-auto bg-[#1e1e1e]">
                {error ? (
                  <div className="p-6 text-red-400 text-sm font-mono leading-relaxed">
                    [System Alert]<br />
                    {error}
                  </div>
                ) : (
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onSelect={handleTextareaSelect}
                    onKeyUp={handleTextareaSelect}
                    onClick={handleTextareaSelect}
                    className={`w-full h-full py-4 px-[15px] bg-[#1e1e1e] text-[#e0e0e0] font-mono text-sm border-none outline-none resize-none leading-relaxed ${wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'}`}
                    style={{ fontFamily: "'Courier Prime', Consolas, monospace" }}
                    placeholder="Empty document..."
                  />
                )}
              </div>

              {/* Notepad Status Bar */}
              <div className="h-6 bg-[#2d2d2d] border-t border-[#3d3d3d] flex items-center justify-end px-3 gap-6 text-[11px] text-[#a0a0a0] shrink-0 font-sans">
                <div>Ln {cursorPos.line}, Col {cursorPos.col}</div>
                <div>100%</div>
                <div>Windows (CRLF)</div>
                <div>UTF-8</div>
              </div>

            </div>
          )}

          {/* THEME 2: MACOS TEXTEDIT */}
          {theme === 'textedit' && (
            <div className="flex-1 flex flex-col bg-[#ececec] text-[#333] font-sans select-none">
              
              {/* TextEdit Top Titlebar */}
              <div className="h-10 bg-[#e0e0e0] flex items-center justify-between px-3 border-b border-[#cccccc] shrink-0 text-sm">
                {/* Traffic lights controls on left */}
                <div className="flex items-center gap-1.5 w-24">
                  <div 
                    onClick={onClose || (() => {})}
                    className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] cursor-pointer flex items-center justify-center text-[8px] font-bold text-[#4c0002] hover:after:content-['×']" 
                  />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dfa123] cursor-pointer flex items-center justify-center text-[8px] font-bold text-[#5c3e00] hover:after:content-['-']" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1a9c2b] cursor-pointer flex items-center justify-center text-[8px] font-bold text-[#006505] hover:after:content-['+']" />
                </div>
                
                {/* Centered Document Name */}
                <div className="font-semibold text-xs text-[#4a4a4a]">
                  {error ? 'Error' : filename}
                </div>
                
                <div className="w-24" /> {/* Spacer */}
              </div>

              {/* TextEdit Rich-Text Toolbar */}
              <div className="bg-[#f3f3f3] border-b border-[#cccccc] p-2 flex flex-wrap items-center gap-3 shrink-0">
                {/* Font Selector */}
                <div className="flex items-center gap-1 bg-white border border-[#ccc] rounded px-2 py-1 text-xs shadow-sm cursor-pointer hover:bg-[#fafafa]">
                  <span>Courier</span>
                  <ChevronDown size={12} className="text-[#888]" />
                </div>

                {/* Size Selector */}
                <div className="flex items-center gap-1 bg-white border border-[#ccc] rounded px-2 py-1 text-xs shadow-sm cursor-pointer hover:bg-[#fafafa]">
                  <span>14</span>
                  <ChevronDown size={12} className="text-[#888]" />
                </div>

                <div className="w-px h-5 bg-[#d8d8d8]" />

                {/* Font Style Toggles */}
                <div className="flex border border-[#ccc] rounded bg-white overflow-hidden shadow-sm">
                  <button className="p-1 px-2 text-xs hover:bg-[#eaeaea] font-bold border-r border-[#ccc]"><Bold size={12} /></button>
                  <button className="p-1 px-2 text-xs hover:bg-[#eaeaea] italic border-r border-[#ccc]"><Italic size={12} /></button>
                  <button className="p-1 px-2 text-xs hover:bg-[#eaeaea] underline"><Underline size={12} /></button>
                </div>

                {/* Align Toggles */}
                <div className="flex border border-[#ccc] rounded bg-white overflow-hidden shadow-sm">
                  <button className="p-1 px-2 text-xs hover:bg-[#eaeaea] border-r border-[#ccc]"><AlignLeft size={12} /></button>
                  <button className="p-1 px-2 text-xs hover:bg-[#eaeaea] border-r border-[#ccc]"><AlignCenter size={12} /></button>
                  <button className="p-1 px-2 text-xs hover:bg-[#eaeaea] border-r border-[#ccc]"><AlignRight size={12} /></button>
                  <button className="p-1 px-2 text-xs hover:bg-[#eaeaea]"><AlignJustify size={12} /></button>
                </div>
              </div>

              {/* Ruler Bar */}
              <div className="h-6 bg-[#eaeaea] border-b border-[#cccccc] shrink-0 relative flex items-end text-[9px] text-[#777] font-mono px-6">
                <div className="w-full h-1 bg-[#ccc] absolute bottom-0 left-0" />
                <div className="flex justify-between w-full pb-1">
                  <span>|</span><span>1</span><span>|</span><span>2</span><span>|</span><span>3</span><span>|</span><span>4</span><span>|</span><span>5</span><span>|</span><span>6</span><span>|</span><span>7</span>
                </div>
              </div>

              {/* TextEdit Page Canvas Container */}
              <div className="flex-1 overflow-auto bg-[#7c7c7c] p-6 flex justify-center">
                
                {/* Paper sheet representation */}
                <div className="w-full max-w-3xl min-h-[700px] bg-white shadow-xl py-10 px-[15px] border border-[#b8b8b8] flex flex-col text-left font-serif">
                  {error ? (
                    <div className="text-red-600 font-mono text-sm leading-relaxed">
                      [Document Error]<br /><br />
                      {error}
                    </div>
                  ) : (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full flex-1 border-none outline-none resize-none font-serif text-sm leading-relaxed text-[#1a1a1a]"
                      style={{ fontFamily: "'Courier New', Courier, Georgia, serif" }}
                      placeholder="Start typing..."
                    />
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
