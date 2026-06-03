const fs = require('fs');
const path = require('path');

const originalPath = path.join(__dirname, '../rag/data-collection/TwainCorpus/converted/Is-Shakespeare-Dead.html');
const activePath = path.join(__dirname, '../src/data/books/Is-Shakespeare-Dead.html');

console.log('Original size:', fs.existsSync(originalPath) ? fs.statSync(originalPath).size : 'does not exist');
console.log('Active size:', fs.existsSync(activePath) ? fs.statSync(activePath).size : 'does not exist');

if (fs.existsSync(activePath)) {
  const content = fs.readFileSync(activePath, 'utf8');
  console.log('\n--- ACTIVE CONTENT ---');
  console.log(content);
}
