const fs = require('fs');
const path = require('path');

function cleanTitleString(rawTitle, filename) {
  let title = rawTitle || filename.replace(/\.(html|txt)$/, '');
  title = title
    .replace(/\s*\|\s*Project Gutenberg/gi, '')
    .replace(/\s*,\s*by Mark Twain/gi, '')
    .replace(/\s*by Mark Twain/gi, '')
    .trim();
  return title;
}

function simulate() {
  const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/converted/Volume-1.html');
  const filename = path.basename(filePath);
  let html = fs.readFileSync(filePath, 'utf8');
  
  console.log('Original html length:', html.length);

  // 1. Clean Gutenberg pre/div blocks
  html = html.replace(/<pre[^>]*>[\s\S]*?PROJECT GUTENBERG[\s\S]*?<\/pre>/gi, '');
  html = html.replace(/<pre[^>]*>[\s\S]*?gutenberg\.org[\s\S]*?<\/pre>/gi, '');
  html = html.replace(/<div[^>]*>\s*\*\*\*\s*START OF[\s\S]*?\*\*\*\s*<\/div>/gi, '');
  html = html.replace(/<div[^>]*>\s*\*\*\*\s*END OF[\s\S]*?\*\*\*\s*<\/div>/gi, '');
  html = html.replace(/\*\*\*\s*START OF THE PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');
  html = html.replace(/\*\*\*\s*END OF THE PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');
  html = html.replace(/\*\*\*\s*START OF THIS PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');
  html = html.replace(/\*\*\*\s*END OF THIS PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');

  console.log('After Gutenberg clean length:', html.length);

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const cleanTitle = cleanTitleString(titleMatch ? titleMatch[1] : null, filename);

  const bodyStart = html.indexOf('<body>');
  const bodyEnd = html.lastIndexOf('</body>');
  if (bodyStart === -1 || bodyEnd === -1) {
    console.log('Body start/end not found');
    return;
  }

  let bodyContent = html.substring(bodyStart + 6, bodyEnd);
  console.log('Initial bodyContent length:', bodyContent.length);

  // 2. Remove duplicate H1/H2 header blocks
  let headerSection = bodyContent.substring(0, 3000);
  const titleRegexPart = cleanTitle.replace(/['’]/g, '.').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const oldTitleRegex = new RegExp(`<h1[^>]*>\\s*${titleRegexPart}\\s*<\/h1>`, 'i');
  headerSection = headerSection.replace(oldTitleRegex, '');
  headerSection = headerSection.replace(/<h2>\s*By\s*Mark\s*Twain\s*<\/h2>/gi, '');
  headerSection = headerSection.replace(/<h2>\s*by\s*Mark\s*Twain\s*<\/h2>/gi, '');
  headerSection = headerSection.replace(/<h2>\s*By\s*Mark\s*Twain\s*\(Samuel\s*Clemens\)\s*<\/h2>/gi, '');
  headerSection = headerSection.replace(/<div class=['"]ph2['"]>[\s\S]*?<\/div>/gi, '');
  headerSection = headerSection.replace(/<div class=['"]ph3['"]>[\s\S]*?<\/div>/gi, '');

  bodyContent = headerSection + bodyContent.substring(3000);
  console.log('After header section clean length:', bodyContent.length);

  // 3. Table of Contents Collapsing
  bodyContent = bodyContent.replace(
    /(<h2[^>]*>\s*(?:CONTENTS|Contents|INDEX|Index)\s*<\/h2>)([\s\S]{0,150}?)(<table[^>]*>[\s\S]*?<\/table>)/gi,
    (match, heading, spacing, table) => {
      return `${heading}${spacing}\n<div class="book-toc-collapsed-wrapper">\n<div class="book-toc-content-inside">\n${table}\n</div>\n<div class="book-toc-fade-overlay"></div>\n<button class="book-toc-expand-btn">Expand Table of Contents</button>\n</div>`;
    }
  );

  bodyContent = bodyContent.replace(
    /(<h2[^>]*>\s*(?:CONTENTS|Contents|INDEX|Index)\s*<\/h2>)([\s\S]{0,250}?)((?:<p\s+class="toc">[\s\S]*?<\/p>\s*)+)/gi,
    (match, heading, spacing, tocItems) => {
      return `${heading}${spacing}\n<div class="book-toc-collapsed-wrapper">\n<div class="book-toc-content-inside">\n${tocItems}\n</div>\n<div class="book-toc-fade-overlay"></div>\n<button class="book-toc-expand-btn">Expand Table of Contents</button>\n</div>`;
    }
  );

  bodyContent = bodyContent.replace(
    /(<h2[^>]*>\s*(?:CONTENTS|Contents|INDEX|Index)\s*<\/h2>)([\s\S]{0,250}?)((?:<h3>\s*<a\s+href="#ch\d+">[\s\S]*?<\/a>\s*<\/h3>\s*)+)/gi,
    (match, heading, spacing, chapters) => {
      return `${heading}${spacing}\n<div class="book-toc-collapsed-wrapper">\n<div class="book-toc-content-inside">\n${chapters}\n</div>\n<div class="book-toc-fade-overlay"></div>\n<button class="book-toc-expand-btn">Expand Table of Contents</button>\n</div>`;
    }
  );

  console.log('After TOC wrap length:', bodyContent.length);

  // 4. Illustrations section grid at bottom (if listed in first 4000 characters)
  const figures = [];
  const hasIllustrationList = /illustrations/i.test(bodyContent.substring(0, 4000));
  console.log('hasIllustrationList:', hasIllustrationList);
  if (hasIllustrationList) {
    bodyContent = bodyContent.replace(/<div class="fig"[^>]*>([\s\S]*?)<\/div>/gi, (match) => {
      figures.push(match);
      return '';
    });
  }
  console.log('Figures count:', figures.length);
  console.log('After figures extract length:', bodyContent.length);

  // 5. Dialogue Conversation Styling
  bodyContent = bodyContent.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs, content) => {
    return match;
  });

  console.log('Final simulated body content length:', bodyContent.length);
}

simulate();
