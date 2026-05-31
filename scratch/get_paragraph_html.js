const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let idx = 860; idx < 1120; idx++) {
  console.log(`Line ${idx + 1}: ${lines[idx]}`);
}
