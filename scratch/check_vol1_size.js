const fs = require('fs');
const path = require('path');

const originalPath = path.join(__dirname, '../rag/data-collection/TwainCorpus/converted/Volume-1.html');
const activePath = path.join(__dirname, '../src/data/books/Volume-1.html');

console.log('Original converted file size:', fs.existsSync(originalPath) ? fs.statSync(originalPath).size : 'does not exist');
console.log('Active book file size:', fs.existsSync(activePath) ? fs.statSync(activePath).size : 'does not exist');

if (fs.existsSync(originalPath)) {
  const content = fs.readFileSync(originalPath, 'utf8');
  console.log('Original line count:', content.split('\n').length);
  // check if it has letters
  console.log('Contains early letters text:', content.includes('Early Letters, 1853'));
}
