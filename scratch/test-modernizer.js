const fs = require('fs');
const path = require('path');

const bookPath = path.join(__dirname, '../src/data/books/A-Dog\'s-Tale.html');
let html = fs.readFileSync(bookPath, 'utf8');

console.log('Original Length:', html.length);

// 1. Clean Gutenberg Pre/Post Boilerplate
const originalHtml = html;
let cleaned = html;

// Remove <pre> blocks that contain Gutenberg
cleaned = cleaned.replace(/<pre[^>]*>[\s\S]*?PROJECT GUTENBERG[\s\S]*?<\/pre>/gi, '');
cleaned = cleaned.replace(/<pre[^>]*>[\s\S]*?gutenberg\.org[\s\S]*?<\/pre>/gi, '');

// Remove standard Gutenberg start/end markers in div blocks
cleaned = cleaned.replace(/<div[^>]*>\s*\*\*\*\s*START OF[\s\S]*?\*\*\*\s*<\/div>/gi, '');
cleaned = cleaned.replace(/<div[^>]*>\s*\*\*\*\s*END OF[\s\S]*?\*\*\*\s*<\/div>/gi, '');
cleaned = cleaned.replace(/\*\*\*\s*START OF THE PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');
cleaned = cleaned.replace(/\*\*\*\s*END OF THE PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');
cleaned = cleaned.replace(/\*\*\*\s*START OF THIS PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');
cleaned = cleaned.replace(/\*\*\*\s*END OF THIS PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');

console.log('After Gutenberg Clean Length:', cleaned.length);

// 2. Extract and format Title Block
const titleMatch = originalHtml.match(/<title>([\s\S]*?)<\/title>/i);
let cleanTitle = 'Read Book';
if (titleMatch) {
  cleanTitle = titleMatch[1]
    .replace(/\s*\|\s*Project Gutenberg/gi, '')
    .replace(/\s*,\s*by Mark Twain/gi, '')
    .replace(/\s*by Mark Twain/gi, '')
    .trim();
}
console.log('Clean Title:', cleanTitle);

const titleBlockHtml = `
<div class="book-title-block">
  <h1>${cleanTitle.toUpperCase()}</h1>
  <h2>BY MARK TWAIN</h2>
  <h2>(Samuel Langhorne Clemens)</h2>
</div>
<hr />
`;

// Remove original title tags (h1, h2) at the top of the body
// E.g. <h1>A DOG'S TALE</h1> and <h2>By Mark Twain</h2>
// We'll replace the top portion of the body (before first chapter or contents) with the new title block
const bodyStart = cleaned.indexOf('<body>');
const bodyEnd = cleaned.lastIndexOf('</body>');
if (bodyStart !== -1 && bodyEnd !== -1) {
  let bodyContent = cleaned.substring(bodyStart + 6, bodyEnd);
  
  // Strip out old duplicate title/author/illustrated headers near the top (before chapter 1 or TOC)
  // Let's strip h1, h2, h3 that contain title or by mark twain
  const titleRegexPart = cleanTitle.replace(/['’]/g, '.');
  const oldTitleRegex = new RegExp(`<h1>\\s*${titleRegexPart}\\s*</h1>`, 'i');
  bodyContent = bodyContent.replace(oldTitleRegex, '');
  bodyContent = bodyContent.replace(/<h2>\s*By\s*Mark\s*Twain\s*<\/h2>/gi, '');
  bodyContent = bodyContent.replace(/<h2>\s*by\s*Mark\s*Twain\s*<\/h2>/gi, '');
  bodyContent = bodyContent.replace(/<h2>\s*A\s*DOG'S\s*TALE,\s*By\s*Mark\s*Twain\s*<\/h2>/gi, '');
  
  // Reconstruct body
  cleaned = cleaned.substring(0, bodyStart + 6) + '\n' + titleBlockHtml + bodyContent + cleaned.substring(bodyEnd);
}

// 3. Table of Contents Collapsing
// Look for <h2>Contents</h2> or similar, then wrap its following content in collapsible wrapper
let bodyContent = cleaned.substring(cleaned.indexOf('<body>') + 6, cleaned.lastIndexOf('</body>'));
const tocMatch = bodyContent.match(/(<h2>\s*CONTENTS\s*<\/h2>|<h2>\s*Contents\s*<\/h2>|<h2>\s*INDEX\s*<\/h2>|<p\s+class="toc">\s*<big><b>\s*LIST OF ILLUSTRATIONS[\s\S]*?<\/p>)/i);
if (tocMatch) {
  console.log('Found TOC/LOI header:', tocMatch[0]);
}

// Let's implement a robust way to wrap the table of contents in a collapsible div
// Find TOC table or list
bodyContent = bodyContent.replace(
  /(<h2>\s*CONTENTS\s*<\/h2>|<h2>\s*Contents\s*<\/h2>|<h2>\s*INDEX\s*<\/h2>|<h2>\s*Illustrations\s*<\/h2>|<h2>\s*ILLUSTRATIONS\s*<\/h2>)([\s\S]*?)(<table[^>]*summary=['"](?:TOC|LOI)['"][^>]*>[\s\S]*?<\/table>)/gi,
  (match, heading, spacing, table) => {
    console.log('Wrapping table TOC in collapsible wrapper');
    return `${heading}${spacing}
<div class="book-toc-collapsed-wrapper">
  <div class="book-toc-content-inside">
    ${table}
  </div>
  <div class="book-toc-fade-overlay"></div>
  <button class="book-toc-expand-btn">Expand Table of Contents</button>
</div>`;
  }
);

// Fallback: If TOC links are just <h3><a>Chapter</a></h3> or <p><a>Chapter</a></p> instead of tables
// E.g. A-Dog's-Tale has:
// <h3><a href="#ch1">Chapter I.</a></h3>
// <h3><a href="#ch2">Chapter II.</a></h3>
// <h3><a href="#ch3">Chapter III.</a></h3>
// We can wrap these consecutive links in a collapsible div!
bodyContent = bodyContent.replace(
  /(<hr\s*\/?>\s*<p>\s*<br\s*\/?>\s*<br\s*\/?>\s*<\/p>\s*)((?:<h3>\s*<a\s+href="#ch\d+">[\s\S]*?<\/a>\s*<\/h3>\s*)+)/gi,
  (match, separator, chapters) => {
    console.log('Wrapping consecutive h3 chapters in collapsible wrapper');
    return `${separator}
<div class="book-toc-collapsed-wrapper">
  <div class="book-toc-content-inside">
    ${chapters}
  </div>
  <div class="book-toc-fade-overlay"></div>
  <button class="book-toc-expand-btn">Expand Table of Contents</button>
</div>`;
  }
);

// 4. Illustrations Section Grid at Bottom
// Let's check if there are figures inside bodyContent
const figureRegex = /<div class="fig"[^>]*>[\s\S]*?<\/div>/gi;
const figures = [];
let figMatch;
while ((figMatch = figureRegex.exec(bodyContent)) !== null) {
  figures.push(figMatch[0]);
}
console.log('Total Figures found:', figures.length);

if (figures.length > 0) {
  // If list of illustrations is found, move figures to the bottom!
  const hasIllustrationList = /illustrations/i.test(bodyContent.substring(0, 3000));
  if (hasIllustrationList) {
    console.log('Illustrations specifically listed! Moving figures to the bottom gallery...');
    
    // Remove all figures from bodyContent
    bodyContent = bodyContent.replace(figureRegex, '');
    
    // Clean up empty lines/spacing left behind by figures
    bodyContent = bodyContent.replace(/<p>\s*(?:<br\s*\/?>\s*)*<\/p>/gi, '');
    
    // Construct the gallery
    const galleryHtml = `
<hr />
<h2 id="illustrations-gallery-header">ILLUSTRATIONS</h2>
<div class="illustrations-gallery-grid">
  ${figures.join('\n  ')}
</div>
`;
    bodyContent = bodyContent + '\n' + galleryHtml;
  }
}

// 5. Dialogue Conversation Styling
let dialogueCount = 0;
bodyContent = bodyContent.replace(/<p>([\s\S]*?)<\/p>/gi, (match, pContent) => {
  const trimmed = pContent.trim();
  const startsWithQuote = /^(“|&ldquo;|&#8220;|"|&quot;|&#34;)/.test(trimmed);
  const endsWithQuote = /(”|&rdquo;|&#8221;|"|&quot;|&#34;|”[\.\!\?]|&rdquo;[\.\!\?]|"[\.\!\?])\s*$/.test(trimmed);
  
  if (startsWithQuote && endsWithQuote) {
    dialogueCount++;
    return `<p class="conversation-line">${pContent}</p>`;
  }
  return match;
});
console.log('Dialogue paragraphs tagged:', dialogueCount);

cleaned = cleaned.substring(0, cleaned.indexOf('<body>') + 6) + bodyContent + cleaned.substring(cleaned.lastIndexOf('</body>'));

console.log('Final length:', cleaned.length);
fs.writeFileSync(path.join(__dirname, 'A-Dog\'s-Tale-modernized.html'), cleaned);
console.log('Written scratch/A-Dog\'s-Tale-modernized.html');
