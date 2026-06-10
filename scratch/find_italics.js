const fs = require('fs');
const content = fs.readFileSync('e:/development/mark-twain/src/data/books/Huckleberry-Finn.html', 'utf8');

const matches = [...content.matchAll(/<(i|em)>([\s\S]*?)<\/\1>/gi)];
console.log(`Found ${matches.length} italicized blocks:`);
matches.forEach((m, idx) => {
  const text = m[2].trim();
  if (text.toLowerCase().includes('ain') || text.toLowerCase().includes('ll')) {
    console.log(`[${idx}] Line ${content.substring(0, m.index).split('\n').length}: ${m[0]}`);
  }
});
