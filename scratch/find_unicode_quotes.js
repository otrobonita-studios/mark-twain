const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
const content = fs.readFileSync(filePath, 'utf8');

const paragraphs = [];
content.replace(/<p>([\s\S]*?)<\/p>/gi, (match, pText) => {
  paragraphs.push(pText.trim());
});

let unicodeQuotesCount = 0;
paragraphs.forEach((p, idx) => {
  if (p.includes('“') || p.includes('”')) {
    unicodeQuotesCount++;
    console.log(`[P #${idx}]:\n${p}\n----------------------------------`);
  }
});
console.log(`Paragraphs with Unicode quotes: ${unicodeQuotesCount}`);
