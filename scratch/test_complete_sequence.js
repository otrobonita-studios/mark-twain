const fs = require('fs');
const path = require('path');

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

// Match the rest of the inline illustrations
let matchCount = 0;
const regex = /<div class="fig"[^>]*>\s*<img([^>]+src="([^"]+)"[^>]*)>\s*(?:<br\s*\/?>)?\s*<\/div>\s*(?:<p>\s*(?:<br\s*\/?>\s*)*<\/p>\s*)*<p>([\s\S]*?)<\/p>/gi;

extractedContent = extractedContent.replace(regex, (match, imgAttrs, src, pContent) => {
  matchCount++;
  const altMatch = imgAttrs.match(/alt="([^"]+)"/i);
  const alt = altMatch ? altMatch[1] : '';
  const floatClass = matchCount % 2 === 0 ? 'img-float-left' : 'img-float-right';
  
  return `<div class="paragraph-with-image layout-${floatClass === 'img-float-right' ? 'right' : 'left'}">
    <div class="circle-img-wrapper">
      <img src="${src}" alt="${alt}" class="in-paragraph-img" />
      <span class="zoom-hover-overlay">SVG</span>
    </div>
    <p class="image-paragraph-text">${pContent.trim()}</p>
  </div>`;
});

console.log(`Total inline illustrations wrapped: ${matchCount}`);

// Find the first occurrence of paragraph-with-image in the result
const idx = extractedContent.indexOf('paragraph-with-image');
if (idx !== -1) {
  console.log("\nSample output:");
  console.log(extractedContent.substring(idx - 20, idx + 400));
}
