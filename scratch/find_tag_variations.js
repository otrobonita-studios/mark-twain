const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');
const volumes = ['Volume-1.html', 'Volume-2.html', 'Volume-3.html', 'Volume-4.html', 'Volume-5.html', 'Volume-6.html'];

volumes.forEach(volFile => {
  const filePath = path.join(booksDir, volFile);
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const pRegex = /<p([^>]*)>([\s\S]*?)<\/p>/gi;
  let match;
  
  const letterRegex = /^\s*(?:To\s+|From\s+|Fragment\s+(?:of|to)\s+a\s+letter|Part\s+of\s+a\s+letter|Letter\s+to)/i;
  // This is the regex used in GenericBookReader.js (without the <p> prefix, just checking what's inside <p>)
  const appInsideRegex = /^\s*(?:To\s+|From\s+|Fragment\s+(?:of|to)\s+a\s+letter|Part\s+of\s+a\s+letter|Letter\s+to)/i;
  
  console.log(`\n--- Tag variations in ${volFile} ---`);
  while ((match = pRegex.exec(content)) !== null) {
    const rawContentInside = match[2];
    const textContentInside = rawContentInside.replace(/<[^>]+>/g, '').trim();
    
    // Does the text content look like a letter start?
    if (letterRegex.test(textContentInside)) {
      // Does the raw content inside NOT match the appInsideRegex?
      // which means there is some tag (e.g. <b>) before the text
      const cleanRaw = rawContentInside.trim();
      const matchesRaw = appInsideRegex.test(cleanRaw);
      if (!matchesRaw) {
        console.log(`[MISSED BY REGEX] Line ~${content.substring(0, match.index).split('\n').length}:`);
        console.log(`  Raw inside:  "${rawContentInside}"`);
        console.log(`  Text inside: "${textContentInside}"`);
      }
    }
  }
});
