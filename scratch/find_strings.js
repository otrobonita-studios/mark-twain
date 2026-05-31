const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const targets = ['fire', 'sorrow', 'eden', 'make him', 'make [it] out'];
targets.forEach(target => {
  console.log(`=== Matches for: "${target}" ===`);
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes(target)) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
});
