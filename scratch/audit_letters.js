const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');
const volumes = ['Volume-1.html', 'Volume-2.html', 'Volume-3.html', 'Volume-4.html', 'Volume-5.html', 'Volume-6.html'];

function isLetterSegment(segment) {
  const recipientMatch = segment.match(/^\s*(?:<a[^>]*>[\s\S]*?<\/a>)?\s*(?:<div[^>]*>[\s\S]*?<\/div>)?\s*(?:<br\s*\/?>)?\s*(?:<p[^>]*>)?\s*(To\s+|From\s+|Fragment\s+(?:of|to)\s+a\s+letter\s+|Part\s+of\s+a\s+letter\s+|Letter\s+to\s+)/i);
  return !!recipientMatch;
}

volumes.forEach(volFile => {
  const filePath = path.join(booksDir, volFile);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${volFile}`);
    return;
  }
  const htmlContent = fs.readFileSync(filePath, 'utf8');
  
  // Ensure all h2 headers and letter starting paragraphs start on their own segment by prefixing them with a virtual <hr />
  const normalizedContent = htmlContent
    .replace(/(?:\s*<hr\s*\/?>\s*)*\s*(<h2[^>]*>)/gi, '\n<hr />$1')
    .replace(/(?:\s*<hr\s*\/?>\s*)*\s*(<p[^>]*>\s*(?:To\s+|From\s+|Fragment\s+(?:of|to)\s+a\s+letter|Part\s+of\s+a\s+letter|Letter\s+to))/gi, '\n<hr />$1');
  const parts = normalizedContent.split(/<hr\s*\/?>/gi);
  
  console.log(`\n=================== AUDITING ${volFile} ===================`);
  console.log(`Total split parts: ${parts.length}`);
  
  let lettersCount = 0;
  let htmlCount = 0;
  
  parts.forEach((part, index) => {
    const isLetter = isLetterSegment(part);
    if (isLetter) {
      lettersCount++;
    } else {
      htmlCount++;
      // Check if this HTML segment contains something that looks like a letter start
      // e.g. a paragraph starting with "To ", "From ", "Part of a letter", "Fragment of a letter", "Letter to"
      const pMatches = part.matchAll(/<p[^>]*>\s*(To\s+|From\s+|Fragment\s+(?:of|to)\s+a\s+letter|Part\s+of\s+a\s+letter|Letter\s+to)/gi);
      for (const m of pMatches) {
        console.log(`[WARNING] In part ${index}, found potential letter header not at start: "${m[0].substring(0, 100)}..."`);
      }
      
      // Let's also check if the segment starts with a paragraph that should have been split but wasn't
      const firstPTag = part.match(/^\s*(?:<a[^>]*>[\s\S]*?<\/a>)?\s*(?:<div[^>]*>[\s\S]*?<\/div>)?\s*(?:<br\s*\/?>)?\s*<p[^>]*>([\s\S]*?)<\/p>/i);
      if (firstPTag) {
        const text = firstPTag[1].trim();
        if (text.match(/^(To\s+|From\s+|Fragment\s+(?:of|to)\s+a\s+letter|Part\s+of\s+a\s+letter|Letter\s+to)/i)) {
          console.log(`[CRITICAL] Part ${index} starts with letter-like pattern but isLetterSegment returned FALSE:`);
          console.log(`  Content: "${text.substring(0, 120)}..."`);
        }
      }
    }
  });
  
  console.log(`Summary: ${lettersCount} letters parsed, ${htmlCount} HTML segments.`);
});
