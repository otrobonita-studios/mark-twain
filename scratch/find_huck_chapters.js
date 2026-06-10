const fs = require('fs');
const content = fs.readFileSync('e:/development/mark-twain/src/data/books/Huckleberry-Finn.html', 'utf8');

// Find all <h2> tags
const matches = [...content.matchAll(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi)];
console.log(`Found ${matches.length} <h2> headings:`);
matches.forEach((m, idx) => {
  console.log(`[${idx}] Attrs: ${JSON.stringify(m[1].trim())} | Content: ${JSON.stringify(m[2].trim())}`);
});
