const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/books/Volume-6.html');
const rawHtml = fs.readFileSync(filePath, 'utf8');

const bodyStart = rawHtml.indexOf('<body>');
const bodyEnd = rawHtml.lastIndexOf('</body>');
const bodyContent = rawHtml.substring(bodyStart + 6, bodyEnd);

const normalizedContent = bodyContent
  .replace(/(?:\s*<hr\s*\/?>\s*)*\s*(<h2[^>]*>)/gi, '\n<hr />$1')
  .replace(/(?:\s*<hr\s*\/?>\s*)*\s*(<p\b[^>]*>\s*(?:To\s+|From\s+|Fragment\s+(?:of|to)\s+a\s+letter|Part\s+of\s+a\s+letter|Letter\s+to\s+|Letters\s+to\s+|Telegram\s+to\s+|Telegrams\s+to\s+))/gi, '\n<hr />$1');
const parts = normalizedContent.split(/<hr\s*\/?>/gi);

function isSignatureText(text) {
  const cleanText = text.replace(/<[^>]+>/g, '').trim();
  const collapsedText = cleanText.replace(/\s+/g, ' ');
  if (collapsedText.length > 120) return false;
  const signaturePatterns = [
    /yours/i, /brother/i, /friend/i, /mark/i, /sam/i, /clemens/i, /ever/i, 
    /affectionately/i, /sinceres/i, /respectfully/i, /obedient/i, /devotedly/i, 
    /signing/i
  ];
  return signaturePatterns.some(pat => pat.test(collapsedText)) || collapsedText.length < 50;
}

let segmentIndex = 0;
for (let i = 0; i < parts.length; i++) {
  const part = parts[i].trim();
  if (!part) continue;
  segmentIndex++;
  
  if (segmentIndex === 33 || segmentIndex === 37) {
    console.log(`\n--- PART ${segmentIndex} RAW ---`);
    console.log(JSON.stringify(part.substring(0, 200)));
    
    // Extract remaining pre blocks
    const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
    const preBlocks = [];
    let matchBlock;
    while ((matchBlock = preRegex.exec(part)) !== null) {
      preBlocks.push(matchBlock[1]);
    }
    
    console.log(`Pre blocks count: ${preBlocks.length}`);
    preBlocks.forEach((c, idx) => {
      console.log(`  Pre ${idx}:`, JSON.stringify(c.substring(0, 100)), `isSignatureText: ${isSignatureText(c)}`);
    });
  }
}
