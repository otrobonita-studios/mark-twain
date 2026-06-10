const fs = require('fs');
const doc = JSON.parse(fs.readFileSync('e:/development/mark-twain/src/data/books/json/Huckleberry-Finn.json', 'utf8'));
console.log('Total sections:', doc.sections.length);
doc.sections.slice(0, 10).forEach((sec, idx) => {
  console.log(`Section [${idx}]: id=${sec.id} | title=${JSON.stringify(sec.title)}`);
});
