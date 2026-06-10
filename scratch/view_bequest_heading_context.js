// scratch/view_bequest_heading_context.js
const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '../src/data/books/The-30000-Bequest-and-Others.html');
const lines = fs.readFileSync(filepath, 'utf8').split('\n');

const lineNumbers = [1666, 6432, 8022, 8249, 11214];

lineNumbers.forEach(ln => {
  console.log(`=== Line ${ln} ===`);
  for (let i = ln - 3; i <= ln + 3; i++) {
    if (lines[i - 1] !== undefined) {
      console.log(`${i}: ${lines[i - 1]}`);
    }
  }
});
