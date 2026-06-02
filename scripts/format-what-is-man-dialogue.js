const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/books/What-Is-Man-And-Others.html');
const html = fs.readFileSync(filePath, 'utf8');

// Match <p class="conversation-line"> and extract prefix and content
const pRegex = /(<p\s+class="conversation-line">)(\s*(?:O\.M\.|Y\.M\.|Old\s+Man\.|Young\s+Man\.)\s*)([\s\S]*?)(<\/p>)/gi;

let count = 0;
const updatedHtml = html.replace(pRegex, (match, pStart, prefix, content, pEnd) => {
  const trimmedContent = content.trim();
  
  // Safety check: if the content already starts with a quote, skip it
  const startsWithQuote = /^(“|&ldquo;|&#8220;|"|&quot;|&#34;|‘|&lsquo;|&#8216;)/.test(trimmedContent);
  if (startsWithQuote) {
    return match;
  }
  
  count++;
  return `${pStart}${prefix}&ldquo;${trimmedContent}&rdquo;${pEnd}`;
});

if (count > 0) {
  fs.writeFileSync(filePath, updatedHtml, 'utf8');
  console.log(`Successfully formatted ${count} dialogue lines in What-Is-Man-And-Others.html!`);
} else {
  console.log("No dialogue lines needed formatting.");
}
