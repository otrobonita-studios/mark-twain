// scripts/compile-books.js
const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');
const outputDir = path.join(__dirname, '../src/data/books/json');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function cleanTitleString(rawTitle, filename) {
  let title = rawTitle || filename.replace(/\.(html|txt)$/, '');
  title = title
    .replace(/\s*\|\s*Project Gutenberg/gi, '')
    .replace(/\s*,\s*by Mark Twain/gi, '')
    .replace(/\s*by Mark Twain/gi, '')
    .replace(/\s*,\s*By\s*Twain/gi, '')
    .replace(/\s*By\s*Twain/gi, '')
    .replace(/\s*,\s*by\s*Mark\s*Twain\s*\(Samuel\s*Clemens\)/gi, '')
    .replace(/\s*by\s*Mark\s*Twain\s*\(Samuel\s*Clemens\)/gi, '')
    .trim();
  return title;
}

function isLetterSegment(segment) {
  const recipientMatch = segment.match(/^\s*(?:<a[^>]*>[\s\S]*?<\/a>)?\s*(?:<div[^>]*>[\s\S]*?<\/div>)?\s*(?:<br\s*\/?>)?\s*(?:<p\b[^>]*>)?\s*(To\s+|From\s+|Fragment\s+(?:of|to)\s+a\s+letter\s+|Part\s+of\s+a\s+letter\s+|Letter\s+to\s+|Letters\s+to\s+|Telegram\s+to\s+|Telegrams\s+to\s+)/i);
  return !!recipientMatch;
}

function isSignatureText(text) {
  const cleanText = text.replace(/<[^>]+>/g, '').trim();
  if (cleanText.length > 120) return false;
  const signaturePatterns = [
    /yours/i, /brother/i, /friend/i, /mark/i, /sam/i, /clemens/i, /ever/i, 
    /affectionately/i, /sinceres/i, /respectfully/i, /obedient/i, /devotedly/i, 
    /signing/i
  ];
  return signaturePatterns.some(pat => pat.test(cleanText)) || cleanText.length < 50;
}

function afterDateBlock(text) {
  const match = text.match(/^\s*(?:<a[^>]*>[\s\S]*?<\/a>)?\s*<pre[^>]*>([\s\S]*?)<\/pre>/i);
  if (match) {
    return {
      content: match[1],
      length: match[0].length
    };
  }
  return null;
}

function parseLetter(content, pendingContext) {
  const pMatch = content.match(/<p>([\s\S]*?)<\/p>/i);
  let recipient = '';
  let afterRecipient = content;
  
  if (pMatch) {
    recipient = pMatch[1].trim();
    afterRecipient = content.substring(pMatch.index + pMatch[0].length).trim();
  }
  
  const preMatch = afterDateBlock(afterRecipient);
  let date = '';
  let afterDate = afterRecipient;
  
  if (preMatch) {
    date = preMatch.content.trim();
    afterDate = afterRecipient.substring(preMatch.length).trim();
  }
  
  const preBlocks = [];
  const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  let match;
  while ((match = preRegex.exec(afterDate)) !== null) {
    preBlocks.push({
      index: match.index,
      length: match[0].length,
      content: match[1],
      full: match[0]
    });
  }
  
  let signature = '';
  let bodyHtml = afterDate;
  
  if (preBlocks.length > 0) {
    const sigBlock = preBlocks[preBlocks.length - 1];
    signature = sigBlock.content;
    bodyHtml = afterDate.substring(0, sigBlock.index) + afterDate.substring(sigBlock.index + sigBlock.length);
  }
  
  return {
    type: 'letter',
    recipient,
    date,
    bodyHtml: bodyHtml.trim(),
    signature,
    contextHtml: pendingContext
  };
}

function parseHTMLToBlocks(htmlSegment, blockIdPrefix) {
  const blocks = [];
  let blockIndex = 0;
  
  // Clean Gutenberg markers from segments
  let cleaned = htmlSegment
    .replace(/\*\*\*\s*START OF THE PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '')
    .replace(/\*\*\*\s*END OF THE PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '')
    .replace(/\*\*\*\s*START OF THIS PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '')
    .replace(/\*\*\*\s*END OF THIS PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '')
    .trim();

  // Basic regex to tokenise block-level elements
  const blockRegex = /<(p|h1|h2|h3|h4|div|pre|table|blockquote|ul|ol|hr)\b([^>]*)>([\s\S]*?)<\/\1>|<(hr|img)\b([^>]*)\/?>/gi;
  let match;
  let lastIndex = 0;
  
  while ((match = blockRegex.exec(cleaned)) !== null) {
    const textBefore = cleaned.substring(lastIndex, match.index).trim();
    if (textBefore) {
      // Inline text that was not wrapped in block elements (wrap as p)
      blocks.push({
        kind: 'p',
        id: `${blockIdPrefix}-p-raw-${blockIndex++}`,
        text: textBefore
      });
    }
    
    const tagName = (match[1] || match[4]).toLowerCase();
    const attrs = match[2] || match[5] || '';
    const content = match[3] || '';
    
    const idAttr = attrs.match(/id="([^"]+)"/i);
    const blockId = idAttr ? idAttr[1] : `${blockIdPrefix}-${tagName}-${blockIndex++}`;
    
    if (tagName === 'p') {
      const isConv = attrs.includes('conversation-line') || attrs.includes('conversation');
      blocks.push({
        kind: 'p',
        id: blockId,
        text: content.trim(),
        ...(isConv ? { conversation: true } : {})
      });
    } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
      const level = parseInt(tagName.charAt(1));
      blocks.push({
        kind: 'heading',
        id: blockId,
        level,
        text: content.replace(/<[^>]+>/g, '').trim()
      });
    } else if (tagName === 'div') {
      const classAttr = attrs.match(/class="([^"]+)"/i);
      const className = classAttr ? classAttr[1] : '';
      
      if (className.includes('fig')) {
        // Extract img tag inside fig
        const imgMatch = content.match(/<img([^>]+)>/i);
        if (imgMatch) {
          const imgAttrs = imgMatch[1];
          const srcMatch = imgAttrs.match(/src="([^"]+)"/i);
          const altMatch = imgAttrs.match(/alt="([^"]+)"/i);
          const zoomSrcMatch = imgAttrs.match(/data-zoom-src="([^"]+)"/i);
          
          if (srcMatch) {
            const src = srcMatch[1];
            const alt = altMatch ? altMatch[1] : '';
            const zoomSrc = zoomSrcMatch ? zoomSrcMatch[1] : null;
            
            blocks.push({
              kind: 'figure',
              id: blockId,
              styles: [{
                id: 'original',
                label: 'Original',
                kind: 'authentic',
                src,
                ...(zoomSrc ? { zoomSrc } : {})
              }],
              caption: alt
            });
            lastIndex = blockRegex.lastIndex;
            continue;
          }
        }
      }
      
      if (className.includes('mkii-note') || className.includes('adult-note-card')) {
        blocks.push({
          kind: 'note',
          id: blockId,
          category: className.includes('mkii') ? 'mkii' : 'debated',
          text: content.trim()
        });
      } else {
        // If it's a generic div (like a wrapper), treat it as generic html block
        blocks.push({
          kind: 'html',
          id: blockId,
          text: match[0]
        });
      }
    } else if (tagName === 'pre') {
      blocks.push({
        kind: 'html',
        id: blockId,
        text: `<pre${attrs}>${content}</pre>`
      });
    } else if (tagName === 'hr') {
      // Skip hr block or treat as spacing
    } else {
      // Fallback for tables, lists, etc.
      blocks.push({
        kind: 'html',
        id: blockId,
        text: match[0]
      });
    }
    
    lastIndex = blockRegex.lastIndex;
  }
  
  const textAfter = cleaned.substring(lastIndex).trim();
  if (textAfter) {
    blocks.push({
      kind: 'p',
      id: `${blockIdPrefix}-p-raw-end`,
      text: textAfter
    });
  }
  
  return blocks;
}

function compileBook(filePath) {
  const filename = path.basename(filePath);
  const rawHtml = fs.readFileSync(filePath, 'utf8');
  
  // Extract clean title
  const titleMatch = rawHtml.match(/<title>([\s\S]*?)<\/title>/i);
  const cleanTitle = cleanTitleString(titleMatch ? titleMatch[1] : null, filename);
  
  // Determine content type
  let type = 'book';
  const lowercaseTitle = cleanTitle.toLowerCase();
  const lowercaseFilename = filename.toLowerCase();
  
  if (lowercaseFilename.startsWith('volume-') || lowercaseTitle.includes('letter')) {
    type = 'collection';
  } else if (lowercaseFilename.includes('letter')) {
    type = 'letter';
  }
  
  // Clean up content inside <body>
  const bodyStart = rawHtml.indexOf('<body>');
  const bodyEnd = rawHtml.lastIndexOf('</body>');
  if (bodyStart === -1 || bodyEnd === -1) {
    console.log(`[Warning] No body tags found in ${filename}`);
    return;
  }
  
  let bodyContent = rawHtml.substring(bodyStart + 6, bodyEnd);
  
  // Setup manifest features
  const hasSanitization = bodyContent.includes('{var_nword') || bodyContent.includes('{var_');
  const manifest = {
    editions: ['traditional'],
    contentStates: {
      sanitized: hasSanitization,
      languages: ['en'],
      mkiiLayer: bodyContent.includes('class="mkii-note"') || bodyContent.includes('class="adult-note-card"') || filename.includes('Eves-Diary') || filename.includes('Huckleberry-Finn')
    },
    illustrationStyles: ['original'],
    features: {
      mkiiChat: true,
      quote: true,
      bookmarks: true,
      search: true,
      contents: true
    }
  };

  const doc = {
    meta: {
      id: filename.replace(/\.html$/, ''),
      type,
      title: cleanTitle,
      author: 'Mark Twain',
      language: 'en'
    },
    manifest,
    sections: []
  };

  if (type === 'collection') {
    // Split into letter segments
    const normalizedContent = bodyContent
      .replace(/(?:\s*<hr\s*\/?>\s*)*\s*(<h2[^>]*>)/gi, '\n<hr />$1')
      .replace(/(?:\s*<hr\s*\/?>\s*)*\s*(<p\b[^>]*>\s*(?:To\s+|From\s+|Fragment\s+(?:of|to)\s+a\s+letter|Part\s+of\s+a\s+letter|Letter\s+to|Letters\s+to|Telegram\s+to|Telegrams\s+to))/gi, '\n<hr />$1');
    const parts = normalizedContent.split(/<hr\s*\/?>/gi);
    
    let sectionCount = 0;
    let pendingContext = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      
      const nextIsLetter = i + 1 < parts.length && isLetterSegment(parts[i + 1]);
      let currentContent = part;
      let nextContext = '';
      
      if (nextIsLetter) {
        const preBlocks = [];
        const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
        let match;
        while ((match = preRegex.exec(part)) !== null) {
          preBlocks.push({
            index: match.index,
            length: match[0].length,
            content: match[1],
            full: match[0]
          });
        }
        if (preBlocks.length > 0) {
          const lastBlock = preBlocks[preBlocks.length - 1];
          if (!isSignatureText(lastBlock.content)) {
            nextContext = lastBlock.content;
            currentContent = part.substring(0, lastBlock.index) + part.substring(lastBlock.index + lastBlock.length);
          }
        }
      }
      
      sectionCount++;
      const sectionId = `section-${sectionCount}`;
      
      if (isLetterSegment(part)) {
        const letter = parseLetter(currentContent, pendingContext);
        const cleanRecipient = letter.recipient.replace(/<[^>]+>/g, '').trim();
        const cleanDate = letter.date.replace(/<[^>]+>/g, '').trim();
        const sectionTitle = `${cleanRecipient} — ${cleanDate}`.trim().replace(/^—\s*|\s*—$/g, '');
        
        const blocks = [];
        // Add meta block for letter card
        blocks.push({
          kind: 'meta',
          id: `${sectionId}-meta`,
          fields: {
            recipient: letter.recipient,
            date: letter.date,
            signature: letter.signature,
            context: letter.contextHtml
          }
        });
        
        // Parse the bodyHtml into blocks
        const bodyBlocks = parseHTMLToBlocks(letter.bodyHtml, sectionId);
        blocks.push(...bodyBlocks);
        
        doc.sections.push({
          id: sectionId,
          title: sectionTitle || `Letter ${sectionCount}`,
          blocks
        });
      } else {
        // HTML context block
        const blocks = parseHTMLToBlocks(currentContent, sectionId);
        doc.sections.push({
          id: sectionId,
          title: `Introductory Note ${sectionCount}`,
          blocks
        });
      }
      
      pendingContext = nextContext;
    }
  } else {
    // Normal book or essay split by chapter wrapper or h2 headings
    const hasChapterDivs = bodyContent.includes('class="chapter"');
    
    // Extract book-title-block if exists, to prevent splitting on <h2> inside it
    let titleBlockHtml = '';
    const titleBlockRegex = /<div\b[^>]*class=["']book-title-block["'][^>]*>([\s\S]*?)<\/div>/i;
    const titleBlockMatch = bodyContent.match(titleBlockRegex);
    if (titleBlockMatch) {
      titleBlockHtml = titleBlockMatch[0];
      bodyContent = bodyContent.replace(titleBlockRegex, '').trim();
    }
    
    let titleBlocks = [];
    if (titleBlockHtml) {
      titleBlocks = parseHTMLToBlocks(titleBlockHtml, 'titleblock');
    }

    if (hasChapterDivs) {
      let sectionCount = 0;
      const chapterRegex = /<div\b[^>]*class=["']chapter["'][^>]*>([\s\S]*?)<\/div>/gi;
      let match;
      
      while ((match = chapterRegex.exec(bodyContent)) !== null) {
        sectionCount++;
        const sectionId = `chapter-${sectionCount}`;
        const content = match[1];
        
        // Search for first h2 as title
        const h2Match = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
        let sectionTitle = h2Match ? h2Match[1].replace(/<[^>]+>/g, '').trim() : `Chapter ${sectionCount}`;
        
        const blocks = parseHTMLToBlocks(content, sectionId);
        
        doc.sections.push({
          id: sectionId,
          title: sectionTitle,
          blocks
        });
      }
    } else {
      // Split by <h2> tags
      const parts = bodyContent.split(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi);
      
      // The first part is prologue/intro if it doesn't start with h2
      if (parts[0].trim()) {
        const blocks = parseHTMLToBlocks(parts[0], 'prologue');
        doc.sections.push({
          id: 'prologue',
          title: 'Prologue',
          blocks
        });
      }
      
      for (let i = 1; i < parts.length; i += 2) {
        const sectionTitle = parts[i].replace(/<[^>]+>/g, '').trim();
        const content = parts[i + 1] || '';
        const sectionCount = Math.floor(i / 2) + 1;
        const sectionId = `chapter-${sectionCount}`;
        
        const blocks = parseHTMLToBlocks(content, sectionId);
        doc.sections.push({
          id: sectionId,
          title: sectionTitle,
          blocks
        });
      }
    }

    // Prepend the titleBlocks to the very first section
    if (titleBlocks.length > 0) {
      if (doc.sections.length > 0) {
        doc.sections[0].blocks.unshift(...titleBlocks);
      } else {
        doc.sections.push({
          id: 'prologue',
          title: 'Prologue',
          blocks: titleBlocks
        });
      }
    }
  }
  
  // Save compiled file
  const outPath = path.join(outputDir, `${filename.replace(/\.html$/, '')}.json`);
  fs.writeFileSync(outPath, JSON.stringify(doc, null, 2), 'utf8');
  console.log(`  Compiled successfully to ${path.basename(outPath)}`);
}

function compileYoungReaders() {
  const youngTextPath = path.join(__dirname, '../src/app/read/eves-diary/YoungReadersText.js');
  if (!fs.existsSync(youngTextPath)) {
    console.log(`[Warning] YoungReadersText.js not found at ${youngTextPath}`);
    return;
  }
  
  const youngText = fs.readFileSync(youngTextPath, 'utf8');
  const evaluatable = youngText.replace(/export\s+/g, '');
  const fn = new Function('', evaluatable + '\nreturn { youngReadersGlossary, youngReadersParagraphs, youngReadersNotes };');
  const { youngReadersGlossary, youngReadersParagraphs, youngReadersNotes } = fn();

  const manifest = {
    editions: ['traditional'],
    contentStates: {
      sanitized: false,
      languages: ['en'],
      mkiiLayer: false
    },
    illustrationStyles: ['original'],
    features: {
      mkiiChat: true,
      quote: true,
      bookmarks: true,
      search: true,
      contents: true
    }
  };

  const doc = {
    meta: {
      id: 'Eves-Diary-young-readers',
      type: 'book',
      title: "Eve's Diary (Young Readers Edition)",
      author: 'Mark Twain',
      language: 'en'
    },
    manifest,
    sections: []
  };

  let currentSection = null;
  let sectionIndex = 0;
  let blockIndex = 0;

  youngReadersParagraphs.forEach((item) => {
    if (item.type === 'section') {
      sectionIndex++;
      currentSection = {
        id: `section-${sectionIndex}`,
        title: item.text,
        blocks: []
      };
      doc.sections.push(currentSection);
    } else {
      if (!currentSection) {
        sectionIndex++;
        currentSection = {
          id: `section-${sectionIndex}`,
          title: "Introduction",
          blocks: []
        };
        doc.sections.push(currentSection);
      }

      if (item.type === 'title') {
        currentSection.blocks.push({
          kind: 'heading',
          id: `young-title-${blockIndex++}`,
          level: 1,
          text: item.text
        });
      } else if (item.type === 'subtitle') {
        currentSection.blocks.push({
          kind: 'heading',
          id: `young-subtitle-${blockIndex++}`,
          level: 2,
          text: item.text
        });
      } else if (item.type === 'illustrator') {
        currentSection.blocks.push({
          kind: 'heading',
          id: `young-illustrator-${blockIndex++}`,
          level: 3,
          text: item.text
        });
      } else if (item.type === 'paragraph') {
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

        currentSection.blocks.push({
          kind: 'p',
          id: `young-p-${blockIndex++}`,
          text: html
        });
      }
    }
  });

  // Append adult notes block at the end of the last section
  if (currentSection) {
    const adultNotesHtml = `
<div class="adult-note-card">
  <h4 class="font-serif font-bold text-base mb-2 text-[var(--primary)]">${youngReadersNotes.title}</h4>
  <p class="text-xs mb-3 italic opacity-75">${youngReadersNotes.intro}</p>
  <ul class="text-xs space-y-2 pl-4 list-disc">
    ${youngReadersNotes.items.map(item => `
      <li>
        <strong>${item.term}</strong> &mdash; ${item.desc}
      </li>
    `).join('')}
  </ul>
</div>
    `;
    currentSection.blocks.push({
      kind: 'p',
      id: `young-adult-notes`,
      text: adultNotesHtml
    });
  }

  const outPath = path.join(outputDir, 'Eves-Diary-young-readers.json');
  fs.writeFileSync(outPath, JSON.stringify(doc, null, 2), 'utf8');
  console.log(`  Compiled Young Readers Edition successfully to ${path.basename(outPath)}`);
}

// Run compilation on all html files in src/data/books
function runCompilation() {
  const files = fs.readdirSync(booksDir);
  let compiledCount = 0;
  
  files.forEach(file => {
    const fullPath = path.join(booksDir, file);
    if (fs.statSync(fullPath).isFile() && file.endsWith('.html')) {
      compileBook(fullPath);
      compiledCount++;
    }
  });
  
  // Also compile the Young Readers Edition of Eve's Diary
  compileYoungReaders();
  
  console.log(`Successfully compiled ${compiledCount} books and Young Readers Edition to static JSON format!`);
}

runCompilation();

