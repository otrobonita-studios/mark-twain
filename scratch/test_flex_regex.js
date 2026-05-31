const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
const content = fs.readFileSync(filePath, 'utf8');

// Run the replacement
const regex = /<div class="fig"[^>]*>\s*<img([^>]+src="([^"]+)"[^>]*)>\s*(?:<br\s*\/?>)?\s*<\/div>\s*(?:<p>\s*(?:<br\s*\/?>\s*)*<\/p>\s*)*<p>([\s\S]*?)<\/p>/gi;
let matchCount = 0;
const modified = content.replace(regex, (match, imgAttrs, src, pContent) => {
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

console.log(`Total paragraph-with-image wraps created: ${matchCount}`);
// Print first match
const matchIndex = modified.indexOf('paragraph-with-image');
if (matchIndex !== -1) {
  console.log("\nFirst match sample:");
  console.log(modified.substring(matchIndex - 10, matchIndex + 400));
}
