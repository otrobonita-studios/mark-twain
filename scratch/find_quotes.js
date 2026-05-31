const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
const content = fs.readFileSync(filePath, 'utf8');

const regex = /"|“|”|&ldquo;|&rdquo;/g;
const matches = content.match(regex);
console.log(`Total quote marks found in file: ${matches ? matches.length : 0}`);

const lines = content.split('\n');
let count = 0;
lines.forEach((line, index) => {
  if (line.match(regex)) {
    count++;
    if (count <= 30) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  }
});
console.log(`Total matching lines: ${count}`);
