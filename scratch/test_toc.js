const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Tag H2 headings
let sectionCount = 0;
content = content.replace(/<h2>\s*([\s\S]*?)\s*<\/h2>/gi, (match, title) => {
  sectionCount++;
  const id = `section-${sectionCount}`;
  return `<h2 id="${id}">${title}</h2>`;
});

// 2. Tag weekdays
let dayCount = 0;
content = content.replace(
  /(<p>\s*)(SATURDAY|SUNDAY|NEXT WEEK SUNDAY|WEDNESDAY|THURSDAY|MONDAY|TUESDAY|FRIDAY)(\.&mdash;|&mdash;|—)/gi,
  (match, pStart, dayText, delimiter) => {
    dayCount++;
    const id = `day-${dayCount}`;
    return `${pStart}<span id="${id}" class="diary-day-anchor">${dayText}</span>${delimiter}`;
  }
);

// 3. Extract ToC items in order
const tocItems = [];
const idRegex = /id="(day-\d+|section-\d+)"[^>]*>([\s\S]*?)<\/(?:span|h2)>/gi;
let m;
while ((m = idRegex.exec(content)) !== null) {
  const id = m[1];
  const text = m[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  const label = id.startsWith('day-') 
    ? text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    : text;
  tocItems.push({ id, label, type: id.startsWith('day-') ? 'day' : 'section' });
}

console.log("Extracted ToC Items in Order:");
tocItems.forEach((item, idx) => {
  console.log(`${idx + 1}. [${item.type.toUpperCase()}] id="${item.id}" label="${item.label}"`);
});
