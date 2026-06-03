const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/converted/Is-Shakespeare-Dead.html');
let html = fs.readFileSync(filePath, 'utf8');

console.log('Original length:', html.length);

// 1. Clean Gutenberg pre/div blocks safely
html = html.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, content) => {
  // Only remove if it's a small pre block and has Gutenberg terms
  if (content.length < 20000 && /project\s*gutenberg|gutenberg\.org|legal\s*notice/i.test(content)) {
    console.log('Removed pre block of length:', match.length);
    return '';
  }
  return match;
});

html = html.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, (match, content) => {
  // Only remove if it's a small div block (no nested divs) and contains Gutenberg start/end markers
  if (content.length < 2000 && !content.includes('<div') && /\*\*\*\s*(START|END)\s+OF/i.test(content)) {
    console.log('Removed div block of length:', match.length);
    return '';
  }
  return match;
});

const bodyStart = html.indexOf('<body>');
const bodyEnd = html.lastIndexOf('</body>');
if (bodyStart === -1 || bodyEnd === -1) {
  console.log('Body tags not found');
  process.exit(1);
}

let bodyContent = html.substring(bodyStart + 6, bodyEnd);
console.log('Body content length after Gutenberg clean:', bodyContent.length);
