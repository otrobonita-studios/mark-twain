const fs = require('fs');
const content = fs.readFileSync('e:/development/mark-twain/src/data/books/Huckleberry-Finn.html', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('dandy') || line.includes('take it out') || line.includes('TIME AND PLACE') || line.includes('EXPLANATORY') || line.includes('NOTICE.')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});

