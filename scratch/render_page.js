const fs = require('fs');
const path = require('path');

// We will simulate the page.js rendering
const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
const htmlContent = fs.readFileSync(filePath, 'utf8');

const lines = htmlContent.split('\n');
let extractedContent = lines.slice(95, 1329).join('\n');

// Clean up empty Project Gutenberg spacing paragraphs
extractedContent = extractedContent.replace(/<p>\s*(?:<br\s*\/?>\s*)*<\/p>/gi, '');

// Group the first three figures (cover, frontispiece, title page) into a 3-column layout
extractedContent = extractedContent.replace(
  /<div class="fig"[^>]*>\s*<img[^>]+cover\.jpg[^>]*>\s*(?:<br\s*\/?>)?\s*<\/div>\s*<div class="fig"[^>]*>\s*<img[^>]+front\.jpg[^>]*>\s*(?:<br\s*\/?>)?\s*<\/div>\s*<div class="fig"[^>]*>\s*<img[^>]+title\.jpg[^>]*>\s*(?:<br\s*\/?>)?\s*<\/div>/gi,
  `<div class="book-cover-trio">
    <div class="fig-trio-item"><img alt="cover.jpg" src="/images/eves-diary/cover.jpg" /></div>
    <div class="fig-trio-item"><img alt="front.jpg" src="/images/eves-diary/front.jpg" /></div>
    <div class="fig-trio-item"><img alt="title.jpg" src="/images/eves-diary/title.jpg" /></div>
  </div>`
);

// Move inline illustrations into the following paragraph with alternating floats
let imgCount = 0;
extractedContent = extractedContent.replace(
  /<div class="fig"[^>]*>\s*<img([^>]+src="([^"]+)"[^>]*)>\s*(?:<br\s*\/?>)?\s*<\/div>\s*(?:<p>\s*(?:<br\s*\/?>\s*)*<\/p>\s*)*<p>/gi,
  (match, imgAttrs, src) => {
    const altMatch = imgAttrs.match(/alt="([^"]+)"/i);
    const alt = altMatch ? altMatch[1] : '';
    const floatClass = imgCount % 2 === 0 ? 'img-float-right' : 'img-float-left';
    imgCount++;
    return `<p><span class="circle-img-wrapper ${floatClass}"><img src="${src}" alt="${alt}" class="in-paragraph-img" /><span class="zoom-hover-overlay">SVG</span></span>`;
  }
);

// Mark pure dialogue lines as conversation lines
extractedContent = extractedContent.replace(
  /<p>\s*&ldquo;([\s\S]*?)&rdquo;\s*<\/p>/gi,
  '<p class="conversation-line">&ldquo;$1&rdquo;</p>'
);

const idx = extractedContent.indexOf("Extract from Adam's Diary");
if (idx !== -1) {
  console.log("HTML around Extract from Adam's Diary:");
  console.log(extractedContent.substring(idx - 200, idx + 600));
}
