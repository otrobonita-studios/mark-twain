const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('tuesday') && !line.includes('TUESDAY')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
