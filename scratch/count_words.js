const fs = require('fs');
const path = require('path');

const filePath = 'e:/development/mark-twain/src/data/books/Huckleberry-Finn.html';
const content = fs.readFileSync(filePath, 'utf8');

// Strip styles, scripts, and HTML tags
let text = content
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<[^>]+>/g, ' ');

// Remove common HTML entities
text = text
  .replace(/&nbsp;/gi, ' ')
  .replace(/&[a-z0-9#]+;/gi, ' ');

// Tokenize words, allowing hyphens and apostrophes
const words = text.match(/[a-zA-Z'-]+/g) || [];
const matchingWords = words.filter(word => word.toLowerCase().startsWith('nigg'));

console.log('Total matching words starting with "nigg":', matchingWords.length);
console.log('Counts per case-sensitive word:');
const counts = matchingWords.reduce((acc, word) => {
  acc[word] = (acc[word] || 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify(counts, null, 2));
