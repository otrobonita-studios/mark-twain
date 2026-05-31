const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
const content = fs.readFileSync(filePath, 'utf8');

const headings = [];
// Find all h1, h2, h3, h4 headings in the content
content.replace(/<(h[1-4])[^>]*>([\s\S]*?)<\/\1>/gi, (match, tag, text) => {
  const cleanText = text.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  headings.push({ tag, text: cleanText });
});

console.log("All headings in Eve's Diary:");
headings.forEach((h, idx) => {
  console.log(`${idx + 1}. [${h.tag.toUpperCase()}]: ${h.text}`);
});
