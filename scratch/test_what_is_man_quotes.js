const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/books/What-Is-Man-And-Others.html');
const html = fs.readFileSync(filePath, 'utf8');

const pRegex = /(<p\s+class="conversation-line">)(\s*(?:O\.M\.|Y\.M\.|Old\s+Man\.|Young\s+Man\.)\s*)([\s\S]*?)(<\/p>)/gi;

let count = 0;
const testHtml = html.replace(pRegex, (match, pStart, prefix, content, pEnd) => {
  count++;
  if (count <= 10) {
    console.log(`Original: ${match.trim()}`);
    const trimmedContent = content.trim();
    console.log(`Replaced: ${pStart}${prefix}&ldquo;${trimmedContent}&rdquo;${pEnd}`);
    console.log("----------------");
  }
  return match;
});

console.log(`Total matches that would be replaced: ${count}`);
