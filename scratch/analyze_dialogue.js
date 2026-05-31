const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let inP = false;
let pIndex = 0;
let paragraphs = [];
let currentP = "";

// Simple parser to extract paragraphs
content.replace(/<p>([\s\S]*?)<\/p>/gi, (match, pText) => {
  paragraphs.push(pText.trim());
});

console.log(`Total paragraphs: ${paragraphs.length}`);

const dialoguePs = [];
paragraphs.forEach((p, idx) => {
  if (p.includes('&ldquo;')) {
    dialoguePs.push({ index: idx, text: p });
  }
});

console.log(`Paragraphs containing dialogue: ${dialoguePs.length}`);
console.log("\nFirst 15 dialogue paragraphs:");
dialoguePs.slice(0, 15).forEach(dp => {
  console.log(`[P #${dp.index}]: ${dp.text.substring(0, 100)}...`);
});
