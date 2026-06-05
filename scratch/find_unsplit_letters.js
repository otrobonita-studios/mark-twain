const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');
const volumes = ['Volume-1.html', 'Volume-2.html', 'Volume-3.html', 'Volume-4.html', 'Volume-5.html', 'Volume-6.html'];

volumes.forEach(volFile => {
  const filePath = path.join(booksDir, volFile);
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  const letterPatterns = [
    /^To\s+/i,
    /^From\s+/i,
    /^Fragment\s+(?:of|to)\s+a\s+letter/i,
    /^Part\s+of\s+a\s+letter/i,
    /^Letter\s+to/i,
    /^Letters\s+to/i,
    /^Telegram\s+to/i,
    /^Telegrams\s+to/i
  ];
  
  // Let's run the actual split logic from the app first
  const normalizedContent = content
    .replace(/(?:\s*<hr\s*\/?>\s*)*\s*(<h2[^>]*>)/gi, '\n<hr />$1')
    .replace(/(?:\s*<hr\s*\/?>\s*)*\s*(<p\b[^>]*>\s*(?:To\s+|From\s+|Fragment\s+(?:of|to)\s+a\s+letter|Part\s+of\s+a\s+letter|Letter\s+to|Letters\s+to|Telegram\s+to|Telegrams\s+to))/gi, '\n<hr />$1');
  const parts = normalizedContent.split(/<hr\s*\/?>/gi);
  
  parts.forEach((part, partIdx) => {
    // Search for any <p> tags inside this part that match our letter patterns but are NOT at the start
    const partPRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
    let pMatch;
    let isFirst = true;
    while ((pMatch = partPRegex.exec(part)) !== null) {
      const pText = pMatch[2].replace(/<[^>]+>/g, '').trim();
      const matchesPattern = letterPatterns.some(pat => pat.test(pText));
      
      if (matchesPattern) {
        if (isFirst) {
          // Check if it's actually at the start of the part (ignoring leading empty tags/spaces/anchors)
          const leadingText = part.substring(0, pMatch.index).replace(/<[^>]+>/g, '').trim();
          if (leadingText.length > 0) {
            console.log(`[ALERT] ${volFile} Part ${partIdx}: Letter header "${pText}" is preceded by content: "${leadingText.substring(0, 100)}..."`);
          }
        } else {
          console.log(`[ALERT] ${volFile} Part ${partIdx}: Letter header "${pText}" is NOT the first paragraph in the segment (index ${pMatch.index})`);
        }
      }
      isFirst = false;
    }
  });
});
