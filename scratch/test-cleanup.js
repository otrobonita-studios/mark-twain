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
  
  // Matches author names
  if (t.includes('mark twain') || t.includes('samuel l. clemens') || t.includes('samuel clemens') || t.includes('samuel langhorne clemens')) return true;
  if (t.includes('charles dudley warner') || t.includes('albert bigelow paine')) return true;
  
  // Matches publication locations
  if (t.includes('hartford') || t.includes('connecticut') || t.includes('london') || t.includes('new york')) return true;
  
  // Matches publication words
  if (t.includes('published by') || t.includes('first published') || t.includes('illustrations taken from') || t.includes('project gutenberg')) return true;
  
  // Matches year/date alone (e.g. "1871" or "1853-1910")
  if (/^\d{4}$/.test(t) || /^\d{4}-\d{4}$/.test(t)) return true;
  
  // Matches title or title words
  const cleanTitleLower = cleanTitle.toLowerCase();
  // Strip common words to check similarity
  const titleWords = cleanTitleLower.replace(/,/g, '').split(/\s+/).filter(w => w.length > 2 && w !== 'the' && w !== 'and' && w !== 'complete');
  
  // If the heading text is exactly the title (or title without complete)
  if (t === cleanTitleLower || t === cleanTitleLower.replace(', complete', '')) return true;
  
  // If the heading contains multiple words from the title
  if (titleWords.length > 0) {
    const matchCount = titleWords.filter(w => t.includes(w)).length;
    if (matchCount >= Math.min(2, titleWords.length)) {
      return true;
    }
  }
  
  return false;
}

function processFile(filename, dryRun = true) {
  const filePath = path.join(booksDir, filename);
  let html = fs.readFileSync(filePath, 'utf8');
  
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const cleanTitle = cleanTitleString(titleMatch ? titleMatch[1] : null, filename);
  
  const bodyStart = html.indexOf('<body>');
  const bodyEnd = html.lastIndexOf('</body>');
  if (bodyStart === -1 || bodyEnd === -1) {
    console.log(`[Warning] Body tags not found in ${filename}`);
    return;
  }
  
  let bodyContent = html.substring(bodyStart + 6, bodyEnd);
  
  // Find where the title block is
  let titleBlockEndIndex = -1;
  const titleBlockMatch = bodyContent.match(/<div class="book-title-block">[\s\S]*?<\/div>\s*<hr[^>]*>/i);
  if (titleBlockMatch) {
    titleBlockEndIndex = titleBlockMatch.index + titleBlockMatch[0].length;
  }
  
  const beforeTitleBlock = titleBlockEndIndex !== -1 ? bodyContent.substring(0, titleBlockEndIndex) : '';
  let restContent = titleBlockEndIndex !== -1 ? bodyContent.substring(titleBlockEndIndex) : bodyContent;
  
  // Scan the first 4000 characters of restContent
  const scanLength = Math.min(restContent.length, 4000);
  let scanSection = restContent.substring(0, scanLength);
  const afterScan = restContent.substring(scanLength);
  
  // Find all headings
  const headings = [];
  const headingRegex = /<(h1|h2|h3|h4)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = headingRegex.exec(scanSection)) !== null) {
    headings.push({
      full: match[0],
      tag: match[1],
      attrs: match[2],
      content: match[3],
      text: match[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
      index: match.index
    });
  }
  
  // Determine which headings to remove
  let removedAny = false;
  let newScanSection = scanSection;
  
  // Keep track of the first heading we do NOT remove that represents a chapter or TOC
  let boundaryIndex = scanLength;
  for (const h of headings) {
    const isRedundant = shouldRemoveHeading(h.text, cleanTitle);
    if (!isRedundant) {
      // If it's a TOC, chapter, or illustration list, it's our boundary
      const t = h.text.toLowerCase();
      if (t.includes('contents') || /^(chapter|chap\.|ch\.)\s+/i.test(t) || t.includes('illustrations') || t === 'introduction' || t === 'foreword' || t === 'preface') {
        boundaryIndex = h.index;
        break;
      }
    }
  }
  
  // Remove redundant headings that appear before the boundaryIndex
  // Iterate in reverse order so indexes don't shift
  for (let i = headings.length - 1; i >= 0; i--) {
    const h = headings[i];
    if (h.index < boundaryIndex) {
      if (shouldRemoveHeading(h.text, cleanTitle)) {
        console.log(`  Removing [${h.tag.toUpperCase()}] "${h.text}"`);
        // Replace this heading in newScanSection
        newScanSection = newScanSection.substring(0, h.index) + 
                         ' '.repeat(h.full.length) + // Replace with spaces to keep index offsets for prior matches
                         newScanSection.substring(h.index + h.full.length);
        removedAny = true;
      }
    }
  }
  
  if (removedAny) {
    // Compress spaces
    newScanSection = newScanSection.replace(/\s{2,}/g, ' ');
    
    // Clean up empty paragraphs and redundant hr tags
    newScanSection = newScanSection.replace(/<p>\s*(?:<br\s*\/?>\s*)*<\/p>/gi, '');
    newScanSection = newScanSection.replace(/<hr[^>]*>\s*<hr[^>]*>/gi, '<hr />');
    
    // If the section starts with <hr>, remove it
    newScanSection = newScanSection.trim();
    if (newScanSection.startsWith('<hr') || newScanSection.startsWith('<hr />') || newScanSection.startsWith('<hr>')) {
      const hrEnd = newScanSection.indexOf('>') + 1;
      newScanSection = newScanSection.substring(hrEnd).trim();
    }
    
    restContent = newScanSection + afterScan;
    
    // Extra cleanup for multiple blank paragraphs or spaces at start
    restContent = restContent.trim().replace(/^(?:\s*<br\s*\/?>\s*)+/i, '').trim();
    
    const updatedBodyContent = beforeTitleBlock + '\n' + restContent;
    const updatedHtml = html.substring(0, bodyStart + 6) + updatedBodyContent + html.substring(bodyEnd);
    
    if (!dryRun) {
      fs.writeFileSync(filePath, updatedHtml, 'utf8');
      console.log(`  Updated ${filename}`);
    } else {
      console.log(`  [Dry-Run] Would update ${filename}`);
    }
  } else {
    console.log(`  No redundant headings found in ${filename}`);
  }
}

// Test on Following-The-Equator.html
processFile('Following-The-Equator.html', true);
processFile('A-Dog\'s-Tale.html', true);
processFile('A-Tramp-Abroad.html', true);
processFile('A-Gilded-Age.html', true);
