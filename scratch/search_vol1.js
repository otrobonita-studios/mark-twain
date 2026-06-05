const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/data/books/Volume-1.html');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('III. LETTERS') || line.includes('St. Louis:') || line.includes('Mrs. Jane Clemens')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
