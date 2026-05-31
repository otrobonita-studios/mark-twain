const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
const content = fs.readFileSync(filePath, 'utf8');

let dayCount = 0;
const modified = content.replace(
  /(<p>\s*)(SATURDAY|SUNDAY|NEXT WEEK SUNDAY|WEDNESDAY|THURSDAY|MONDAY|TUESDAY|FRIDAY)(\.&mdash;|&mdash;)/gi,
  (match, pStart, dayText, delimiter) => {
    dayCount++;
    const id = `day-${dayCount}`;
    console.log(`Match ${dayCount}: "${dayText}" -> id="${id}"`);
    return `${pStart}<span id="${id}" class="diary-day-anchor">${dayText}</span>${delimiter}`;
  }
);

console.log(`\nTotal matched weekdays: ${dayCount}`);
