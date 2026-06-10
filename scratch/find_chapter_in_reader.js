const fs = require('fs');
const content = fs.readFileSync('e:/development/mark-twain/src/components/GenericBookReader.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('chapter-')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
