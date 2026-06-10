const fs = require('fs');
const content = fs.readFileSync('e:/development/mark-twain/src/data/books/Huckleberry-Finn.html', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('NOTICE') || line.includes('EXPLANATORY')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});
