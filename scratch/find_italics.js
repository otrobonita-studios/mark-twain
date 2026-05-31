const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('<i>') || line.includes('</i>')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
