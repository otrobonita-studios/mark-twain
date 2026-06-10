const fs = require('fs');
const doc = JSON.parse(fs.readFileSync('e:/development/mark-twain/src/data/books/json/Adventures-of-Tom-Sawyer.json', 'utf8'));
doc.sections.slice(0, 10).forEach((sec, idx) => {
  console.log(`Tom Sawyer Section [${idx}]: id=${sec.id} | title=${JSON.stringify(sec.title)}`);
});
