const fs = require('fs');
const path = require('path');

const booksDir = 'e:/development/mark-twain/src/data/books';
const files = fs.readdirSync(booksDir);

files.forEach(file => {
  if (!file.endsWith('.html')) return;
  const filePath = path.join(booksDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all p tags
  const pRegex = /<p([^>]*)>([\s\S]*?)<\/p>/gi;
  const pTags = [];
  let match;
  while ((match = pRegex.exec(content)) !== null) {
    pTags.push({
      start: match.index,
      end: match.index + match[0].length,
      attrs: match[1],
      inner: match[2],
      full: match[0],
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  // Now let's scan the pTags for sequences that look like signature blocks
  for (let i = 0; i < pTags.length; i++) {
    const p1 = pTags[i];
    const text1 = p1.inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    
    // Check if p1 looks like a signature
    const isSig = /^(mark\s*twain\.?|m<small>ark<\/small>\s*t<small>wain<\/small>\.?)$/i.test(text1);
    
    if (isSig) {
      console.log(`\nFound signature in ${file} around line ${p1.line}:`);
      console.log(`  P1: ${p1.full}`);
      
      // Look at next tag
      if (i + 1 < pTags.length) {
        const p2 = pTags[i + 1];
        const text2 = p2.inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        console.log(`  P2: ${p2.full}`);
      }
    }
  }
});
