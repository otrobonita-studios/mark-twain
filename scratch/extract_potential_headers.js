const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');
const volumes = ['Volume-1.html', 'Volume-2.html', 'Volume-3.html', 'Volume-4.html', 'Volume-5.html', 'Volume-6.html'];

volumes.forEach(volFile => {
  const filePath = path.join(booksDir, volFile);
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all <p> tags
  const pRegex = /<p([^>]*)>([\s\S]*?)<\/p>/gi;
  let match;
  
  const letterRegex = /^(?:To\s+|From\s+|Fragment\s+|Part\s+|Letter\s+)/i;
  
  console.log(`\n--- Potential Headers in ${volFile} ---`);
  while ((match = pRegex.exec(content)) !== null) {
    const rawText = match[2].replace(/<[^>]+>/g, '').trim();
    if (rawText.length < 150 && rawText.endsWith(':')) {
      const isMatchedByRegex = letterRegex.test(rawText);
      if (!isMatchedByRegex) {
        console.log(`[UNMATCHED COLON] Line ~${content.substring(0, match.index).split('\n').length}: "${rawText}"`);
      }
    }
  }
});
