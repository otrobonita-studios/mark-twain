const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');

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

function shouldRemoveHeading(text, cleanTitle) {
  const t = text.toLowerCase().trim();
  if (t === '') return true;
  
  // Skip TOC, chapter, illustration headers
  if (t.includes('contents') || t.includes('table of contents') || t.includes('index')) return false;
  if (/^(chapter|chap\.|ch\.)\s+/i.test(t)) return false;
  if (/^part\s+\d+/i.test(t) || /^part\s+[ivxldcm]+/i.test(t)) return false;
  if (t.includes('illustrations') || t.includes('list of illustrations')) return false;
  if (t === 'introduction' || t === 'foreword' || t === 'preface' || t === 'prefatory' || t === 'acknowledgements') return false;
  
  // Matches "by"
  if (t === 'by') return true;
  
  // Matches author/editor/translator/summarizer names
  if (t.includes('mark twain') || t.includes('samuel l. clemens') || t.includes('samuel clemens') || t.includes('samuel langhorne clemens')) return true;
  if (t.includes('charles dudley warner') || t.includes('albert bigelow paine') || t.includes('sieur louis de conte')) return true;
  
  // Matches publication locations
  if (t.includes('hartford') || t.includes('connecticut') || t.includes('london') || t.includes('new york') || t.includes('boston') || t.includes('chicago')) return true;
  
  // Matches publication words
  if (t.includes('published by') || t.includes('first published') || t.includes('illustrations taken from') || t.includes('project gutenberg') || t.includes('in two volumes')) return true;
  
  // Matches volume info
  if (/^volume\s+\d+/i.test(t) || /^volume\s+[ivxldcm]+/i.test(t)) return true;
  
  // Matches year/date alone (e.g. "1871" or "1853-1910")
  if (/^\d{4}$/.test(t) || /^\d{4}-\d{4}$/.test(t)) return true;
  
  // Matches title or title words
  const cleanTitleLower = cleanTitle.toLowerCase();
  
  // If the heading text is exactly the title (or title without complete)
  if (t === cleanTitleLower || t === cleanTitleLower.replace(', complete', '')) return true;
  
  const titleWords = cleanTitleLower.replace(/,/g, '').split(/\s+/).filter(w => w.length > 2 && w !== 'the' && w !== 'and' && w !== 'complete');
  if (titleWords.length > 0) {
    const matchCount = titleWords.filter(w => t.includes(w)).length;
    if (matchCount >= Math.min(2, titleWords.length)) {
      return true;
    }
  }
  
  // Subtitle/Alternative check
  if (t.includes('journey around the world') || t.includes('tale of today') || t.includes('conversation as it was') || t.includes('burlesque autobiography') || t.includes('personal recollections of')) {
    return true;
  }
  
  return false;
}

function shouldRemoveBlock(text) {
  const t = text.toLowerCase().trim();
  if (t === '') return true;
  
  // Gutenberg license / header phrases matched individually
  if (t.includes('project gutenberg') || 
      t.includes('this ebook is for the use') || 
      t.includes('gutenberg.org') || 
      t.includes('release date:') || 
      t.includes('produced by:') || 
      t.includes('character set encoding:') || 
      t.startsWith('title:') || 
      t.startsWith('author:') || 
      t.startsWith('language:') || 
      t.includes('most recently updated:')) {
    return true;
  }
  
  return false;
}

function getBoundaryIndex(bodyContent) {
  const tagRegex = /<(h1|h2|h3|h4|h5|h6|p|div)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match;
  let earliestIndex = bodyContent.length;

  while ((match = tagRegex.exec(bodyContent)) !== null) {
    if (match.index > 5000) break;
    
    const text = match[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    
    const isToc = text === 'contents' || text === 'index' || text === 'table of contents' || text === 'illustrations' || text === 'list of illustrations';
    const isChapter = /^(chapter|chap\.|ch\.)\s+(?:[ivxlcdm\d]+|\d+|one|two|three)\b/i.test(text);
    const isIntro = text === 'introduction' || text === 'foreword' || text === 'preface' || text === 'prefatory' || text === 'acknowledgements';
    
    if (isToc || isChapter || isIntro) {
      if (match.index < earliestIndex) {
        earliestIndex = match.index;
      }
    }
  }
  
  if (earliestIndex === bodyContent.length) {
    const linkMatch = bodyContent.match(/<a\s+[^>]*href=["']#(?:ch1|chapter-1|chapter1|ch01|ch_1|link2HCH0001|link2H_4_0001)["']/i);
    if (linkMatch && linkMatch.index < 10000) {
      earliestIndex = linkMatch.index;
    }
  }
  
  // Fallback to a sensible scan limit (e.g. 8000 characters) if no boundary index found
  if (earliestIndex === bodyContent.length) {
    return Math.min(8000, bodyContent.length);
  }
  
  return earliestIndex;
}

function cleanBookFile(filePath) {
  const filename = path.basename(filePath);
  let html = fs.readFileSync(filePath, 'utf8');
  
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const cleanTitle = cleanTitleString(titleMatch ? titleMatch[1] : null, filename);
  
  const bodyStart = html.indexOf('<body>');
  const bodyEnd = html.lastIndexOf('</body>');
  if (bodyStart === -1 || bodyEnd === -1) {
    return false;
  }
  
  let bodyContent = html.substring(bodyStart + 6, bodyEnd);
  
  // Find where the title block ends
  let titleBlockEndIndex = -1;
  const titleBlockMatch = bodyContent.match(/<div class="book-title-block">[\s\S]*?<\/div>\s*<hr[^>]*>/i);
  if (titleBlockMatch) {
    titleBlockEndIndex = titleBlockMatch.index + titleBlockMatch[0].length;
  }
  
  const beforeTitleBlock = titleBlockEndIndex !== -1 ? bodyContent.substring(0, titleBlockEndIndex) : '';
  let restContent = titleBlockEndIndex !== -1 ? bodyContent.substring(titleBlockEndIndex) : bodyContent;
  
  const boundaryIndex = getBoundaryIndex(restContent);
  let scanSection = restContent.substring(0, boundaryIndex);
  const afterScan = restContent.substring(boundaryIndex);
  
  let removedAny = false;
  
  // 1. Scan and remove Gutenberg metadata divs/paragraphs/blocks in the scan section
  // Specifically match any p or div or pre block
  const blockRegex = /<(p|div|pre)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let blockMatch;
  const blocks = [];
  while ((blockMatch = blockRegex.exec(scanSection)) !== null) {
    const tag = blockMatch[1].toLowerCase();
    const attrs = blockMatch[2];
    const content = blockMatch[3];
    
    // Check if the block is NOT a book-toc wrapper or something we want to preserve
    if (attrs.includes('book-toc-collapsed-wrapper') || attrs.includes('book-toc-content-inside') || attrs.includes('book-text-content')) continue;
    
    if (tag === 'div') {
      if (content.length > 2000 || content.includes('<div')) {
        continue;
      }
    }
    if (tag === 'pre') {
      if (content.length > 20000 || content.includes('<pre')) {
        continue;
      }
    }
    
    blocks.push({
      full: blockMatch[0],
      tag: blockMatch[1],
      content: content,
      text: content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
      index: blockMatch.index
    });
  }
  
  // Remove matched blocks in reverse
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    if (shouldRemoveBlock(b.text)) {
      console.log(`  [Block Removed] "${b.text.substring(0, 60)}..."`);
      scanSection = scanSection.substring(0, b.index) + 
                    ' '.repeat(b.full.length) + 
                    scanSection.substring(b.index + b.full.length);
      removedAny = true;
    }
  }
  
  // 2. Scan and remove redundant headings (h1, h2, h3, h4) in the scan section
  const headings = [];
  const headingRegex = /<(h1|h2|h3|h4)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let headingMatch;
  while ((headingMatch = headingRegex.exec(scanSection)) !== null) {
    headings.push({
      full: headingMatch[0],
      tag: headingMatch[1],
      text: headingMatch[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
      index: headingMatch.index
    });
  }
  
  for (let i = headings.length - 1; i >= 0; i--) {
    const h = headings[i];
    if (shouldRemoveHeading(h.text, cleanTitle)) {
      console.log(`  [Heading Removed] [${h.tag.toUpperCase()}] "${h.text}"`);
      scanSection = scanSection.substring(0, h.index) + 
                    ' '.repeat(h.full.length) + 
                    scanSection.substring(h.index + h.full.length);
      removedAny = true;
    }
  }
  
  if (removedAny) {
    // Compress spaces
    scanSection = scanSection.replace(/\s{2,}/g, ' ');
    
    // Clean up empty paragraphs and redundant hr tags
    scanSection = scanSection.replace(/<p>\s*(?:<br\s*\/?>\s*)*<\/p>/gi, '');
    scanSection = scanSection.replace(/<hr[^>]*>\s*<hr[^>]*>/gi, '<hr />');
    
    // If the section starts/ends with <hr>, clean it up
    scanSection = scanSection.trim();
    if (scanSection.startsWith('<hr') || scanSection.startsWith('<hr />') || scanSection.startsWith('<hr>')) {
      const hrEnd = scanSection.indexOf('>') + 1;
      scanSection = scanSection.substring(hrEnd).trim();
    }
    
    restContent = scanSection + afterScan;
    restContent = restContent.trim().replace(/^(?:\s*<br\s*\/?>\s*)+/i, '').trim();
    
    const updatedBodyContent = beforeTitleBlock + '\n' + restContent;
    const updatedHtml = html.substring(0, bodyStart + 6) + updatedBodyContent + html.substring(bodyEnd);
    
    fs.writeFileSync(filePath, updatedHtml, 'utf8');
    return true;
  }
  
  return false;
}

function main() {
  const files = fs.readdirSync(booksDir);
  let count = 0;
  for (const file of files) {
    if (file.endsWith('.html')) {
      const lower = file.toLowerCase();
      if (lower === 'eves-diary.html' || lower === 'evesdiary.html') continue;
      
      const fullPath = path.join(booksDir, file);
      console.log(`Processing: ${file}`);
      const updated = cleanBookFile(fullPath);
      if (updated) {
        count++;
        console.log(`  -> SUCCESS: Cleaned up headers/boilerplate in ${file}`);
      }
    }
  }
  console.log(`\nSuccessfully cleaned up repeated titles and Gutenberg boilerplate in ${count} books!`);
}

main();
