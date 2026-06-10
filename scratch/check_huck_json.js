const fs = require('fs');
const doc = JSON.parse(fs.readFileSync('e:/development/mark-twain/src/data/books/json/Huckleberry-Finn.json', 'utf8'));

doc.sections.slice(0, 10).forEach(sec => {
  console.log(`ID: ${sec.id} | Title: ${sec.title} | Blocks count: ${sec.blocks.length}`);
});
