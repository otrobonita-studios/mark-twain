const fs = require('fs');
const path = require('path');

const originalPath = path.join(__dirname, '../rag/data-collection/TwainCorpus/converted/Volume-1.html');
const content = fs.readFileSync(originalPath, 'utf8');

console.log('Original content character length:', content.length);
console.log('Original line count:', content.split('\n').length);

console.log('\n--- HEADINGS IN ORIGINAL ---');
const headings = content.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi);
if (headings) {
  headings.forEach(h => console.log(h.replace(/\s+/g, ' ').trim()));
} else {
  console.log('No headings found');
}

console.log('\n--- FIRST 1000 CHARS OF BODY ---');
const bodyStart = content.indexOf('<body>');
if (bodyStart !== -1) {
  console.log(content.substring(bodyStart + 6, bodyStart + 1000).replace(/\s+/g, ' ').trim());
} else {
  console.log('No body start tag found');
}
