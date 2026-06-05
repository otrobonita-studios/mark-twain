const fs = require('fs');
const path = require('path');

function isLetterSegment(segment) {
  const recipientMatch = segment.match(/^\s*(?:<a[^>]*>[\s\S]*?<\/a>)?\s*(?:<div[^>]*>[\s\S]*?<\/div>)?\s*(?:<br\s*\/?>)?\s*(?:<p[^>]*>)?\s*(To\s+|Fragment\s+of\s+a\s+letter\s+|Letter\s+to\s+)/i);
  return !!recipientMatch;
}

function isSignatureText(text) {
  const cleanText = text.replace(/<[^>]+>/g, '').trim();
  if (cleanText.length > 120) return false;
  const signaturePatterns = [
    /yours/i, /brother/i, /friend/i, /mark/i, /sam/i, /clemens/i, /ever/i, 
    /affectionately/i, /sinceres/i, /respectfully/i, /obedient/i, /devotedly/i, 
    /signing/i, /signing/i
  ];
  return signaturePatterns.some(pat => pat.test(cleanText)) || cleanText.length < 50;
}

function afterDateBlock(text) {
  const match = text.match(/^\s*(?:<a[^>]*>[\s\S]*?<\/a>)?\s*<pre[^>]*>([\s\S]*?)<\/pre>/i);
  if (match) {
    return {
      content: match[1],
      length: match[0].length
    };
  }
  return null;
}

function parseLetter(content, pendingContext) {
  const pMatch = content.match(/<p>([\s\S]*?)<\/p>/i);
  let recipient = '';
  let afterRecipient = content;
  
  if (pMatch) {
    recipient = pMatch[1].trim();
    afterRecipient = content.substring(pMatch.index + pMatch[0].length).trim();
  }
  
  const preMatch = afterDateBlock(afterRecipient);
  let date = '';
  let afterDate = afterRecipient;
  
  if (preMatch) {
    date = preMatch.content.trim();
    afterDate = afterRecipient.substring(preMatch.length).trim();
  }
  
  const preBlocks = [];
  const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  let match;
  while ((match = preRegex.exec(afterDate)) !== null) {
    preBlocks.push({
      index: match.index,
      length: match[0].length,
      content: match[1],
      full: match[0]
    });
  }
  
  let signature = '';
  let bodyHtml = afterDate;
  
  if (preBlocks.length > 0) {
    const sigBlock = preBlocks[preBlocks.length - 1];
    signature = sigBlock.content;
    bodyHtml = afterDate.substring(0, sigBlock.index) + afterDate.substring(sigBlock.index + sigBlock.length);
  }
  
  return {
    type: 'letter',
    recipient,
    date,
    bodyHtml: bodyHtml.trim(),
    signature,
    contextHtml: pendingContext
  };
}

function parseHtml(htmlContent) {
  const parts = htmlContent.split(/<hr\s*\/?>/gi);
  const parsedSegments = [];
  let pendingContext = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const nextIsLetter = i + 1 < parts.length && isLetterSegment(parts[i + 1]);
    
    let currentContent = part;
    let nextContext = '';
    
    if (nextIsLetter) {
      const preBlocks = [];
      const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
      let match;
      while ((match = preRegex.exec(part)) !== null) {
        preBlocks.push({
          index: match.index,
          length: match[0].length,
          content: match[1],
          full: match[0]
        });
      }
      
      if (preBlocks.length > 0) {
        const lastBlock = preBlocks[preBlocks.length - 1];
        if (!isSignatureText(lastBlock.content)) {
          nextContext = lastBlock.content;
          currentContent = part.substring(0, lastBlock.index) + part.substring(lastBlock.index + lastBlock.length);
        }
      }
    }
    
    if (isLetterSegment(part)) {
      const letter = parseLetter(currentContent, pendingContext);
      parsedSegments.push(letter);
    } else {
      parsedSegments.push({
        type: 'html',
        content: currentContent
      });
    }
    
    pendingContext = nextContext;
  }
  
  return parsedSegments;
}

// Test against Volume 1 to 6
const booksDir = path.join(__dirname, '../src/data/books');
for (let v = 1; v <= 6; v++) {
  const filename = `Volume-${v}.html`;
  const filePath = path.join(booksDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filename}`);
    continue;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const segments = parseHtml(content);
  
  const letters = segments.filter(s => s.type === 'letter');
  const htmls = segments.filter(s => s.type === 'html');
  
  console.log(`--- ${filename} ---`);
  console.log(`Total segments: ${segments.length}`);
  console.log(`HTML segments: ${htmls.length}`);
  console.log(`Letter segments: ${letters.length}`);
  
  if (letters.length > 0) {
    console.log(`First letter sample:`);
    console.log(`  Recipient: ${letters[0].recipient}`);
    console.log(`  Date: ${letters[0].date}`);
    console.log(`  Signature: ${letters[0].signature.replace(/\n/g, ' ').substring(0, 50)}`);
    console.log(`  Context snippet: ${letters[0].contextHtml.replace(/\n/g, ' ').substring(0, 100)}...`);
    console.log(`  Body snippet: ${letters[0].bodyHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').substring(0, 100)}...`);
    console.log();
  }
}
