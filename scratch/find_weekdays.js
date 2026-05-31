const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
const content = fs.readFileSync(filePath, 'utf8');

const paragraphs = [];
content.replace(/<p>([\s\S]*?)<\/p>/gi, (match, pText) => {
  paragraphs.push(pText.trim());
});

const weekdayRegex = /^([A-Z\s]+)(?:\.|&mdash;|\mdash;|—|-)/;
const foundWeekdays = [];

paragraphs.forEach((p, idx) => {
  const match = p.match(weekdayRegex);
  if (match) {
    const day = match[1].trim();
    // Filter out long sentences that might start with uppercase
    if (day.split(' ').length <= 4) {
      foundWeekdays.push({ index: idx, day, text: p.substring(0, 100) });
    }
  }
});

console.log(`Found ${foundWeekdays.length} weekday entries:`);
foundWeekdays.forEach(wd => {
  console.log(`- [P #${wd.index}]: "${wd.day}" -> "${wd.text}..."`);
});
