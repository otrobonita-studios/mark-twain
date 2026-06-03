const fs = require('fs');
const path = require('path');

// We reproduce the exact logic of clean-book-headers.js
function cleanTitleString(rawTitle, filename) {
  let title = rawTitle || filename.replace(/\.(html|txt)$/, '');
  title = title
    .replace(/\s*\|\s*Project Gutenberg/gi, '')
    .replace(/\s*,\s*by Mark Twain/gi, '')
    .replace(/\s*by Mark Twain/gi, '')
    .trim();
  return title;
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
    if (linkMatch) {
      earliestIndex = linkMatch.index;
    }
  }
  
  return earliestIndex;
}

function simulate() {
  const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/converted/Volume-1.html');
  const filename = path.basename(filePath);
  let html = fs.readFileSync(filePath, 'utf8');
  
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const cleanTitle = cleanTitleString(titleMatch ? titleMatch[1] : null, filename);
  
  const bodyStart = html.indexOf('<body>');
  const bodyEnd = html.lastIndexOf('</body>');
  
  let bodyContent = html.substring(bodyStart + 6, bodyEnd);
  console.log('Original body content length:', bodyContent.length);

  // Find where the title block ends
  let titleBlockEndIndex = -1;
  const titleBlockMatch = bodyContent.match(/<div class="book-title-block">[\s\S]*?<\/div>\s*<hr[^>]*>/i);
  if (titleBlockMatch) {
    titleBlockEndIndex = titleBlockMatch.index + titleBlockMatch[0].length;
  }
  console.log('titleBlockEndIndex:', titleBlockEndIndex);
  
  const beforeTitleBlock = titleBlockEndIndex !== -1 ? bodyContent.substring(0, titleBlockEndIndex) : '';
  let restContent = titleBlockEndIndex !== -1 ? bodyContent.substring(titleBlockEndIndex) : bodyContent;
  console.log('beforeTitleBlock length:', beforeTitleBlock.length);
  console.log('restContent length:', restContent.length);
  
  const boundaryIndex = getBoundaryIndex(restContent);
  console.log('boundaryIndex:', boundaryIndex);
  
  let scanSection = restContent.substring(0, boundaryIndex);
  const afterScan = restContent.substring(boundaryIndex);
  console.log('scanSection length:', scanSection.length);
  console.log('afterScan length:', afterScan.length);
}

simulate();
