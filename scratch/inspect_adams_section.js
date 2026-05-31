const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
const htmlContent = fs.readFileSync(filePath, 'utf8');

const lines = htmlContent.split('\n');
let content = lines.slice(95, 1329).join('\n');

// Clean up empty Project Gutenberg spacing paragraphs
content = content.replace(/<p>\s*(?:<br\s*\/?>\s*)*<\/p>/gi, '');

// Group the first three figures (cover, frontispiece, title page) into a 3-column layout
content = content.replace(
  /<div class="fig"[^>]*>\s*<img[^>]+cover\.jpg[^>]*>\s*(?:<br\s*\/?>)?\s*<\/div>\s*<div class="fig"[^>]*>\s*<img[^>]+front\.jpg[^>]*>\s*(?:<br\s*\/?>)?\s*<\/div>\s*<div class="fig"[^>]*>\s*<img[^>]+title\.jpg[^>]*>\s*(?:<br\s*\/?>)?\s*<\/div>/gi,
  `[COVER_TRIO]`
);

// Apply old regex:
let imgCount = 0;
content = content.replace(
  /<div class="fig"[^>]*>\s*<img([^>]+src="([^"]+)"[^>]*)>\s*(?:<br\s*\/?>)?\s*<\/div>\s*(?:<p>\s*(?:<br\s*\/?>\s*)*<\/p>\s*)*<p>/gi,
  (match, imgAttrs, src) => {
    imgCount++;
    return `<p>[IMAGE_${imgCount}]`;
  }
);

console.log(`Images replaced: ${imgCount}`);

// Print the section for Extract from Adam's Diary
const idx = content.indexOf("Extract from Adam's Diary");
if (idx !== -1) {
  console.log("\nExtract from Adam's Diary section HTML:");
  console.log(content.substring(idx - 100, idx + 400));
}
