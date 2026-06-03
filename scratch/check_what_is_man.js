const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/books/What-Is-Man-And-Others.html');
const html = fs.readFileSync(filePath, 'utf8');

const pRegex = /<p([^>]*)>([\s\S]*?)<\/p>/gi;
let totalP = 0;
let dialogP = 0;
let untaggedOM = [];

let match;
while ((match = pRegex.exec(html)) !== null) {
  totalP++;
  const attrs = match[1];
  const content = match[2];
  const trimmedText = content.replace(/<[^>]+>/g, '').trim();
  
  const isOM = /^(?:O\.M\.|Old\s+Man\.)/i.test(trimmedText);
  const isYM = /^(?:Y\.M\.|Young\s+Man\.)/i.test(trimmedText);
  
  if (isOM || isYM) {
    dialogP++;
    if (!attrs.includes('conversation-line')) {
      untaggedOM.push({
        text: trimmedText.substring(0, 80),
        attrs: attrs
      });
    }
  }
}

console.log(`Total paragraphs checked: ${totalP}`);
console.log(`Dialogue paragraphs (starting with OM/YM): ${dialogP}`);
console.log(`Untagged dialogue paragraphs: ${untaggedOM.length}`);
if (untaggedOM.length > 0) {
  console.log("Samples of untagged paragraphs:");
  untaggedOM.slice(0, 10).forEach((item, idx) => {
    console.log(`${idx + 1}: [attrs: ${item.attrs}] -> ${item.text}`);
  });
}
