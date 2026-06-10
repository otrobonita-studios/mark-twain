const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/What-Is-Man-And-Others.html');
const content = fs.readFileSync(filePath, 'utf8');

const regex = /<div class="chapter">([\s\S]*?)<\/div>(?:\s*<!--end chapter-->)?/gi;
let count = 0;
let match;
while ((match = regex.exec(content)) !== null) {
  count++;
  console.log(`Chapter ${count}: size ${match[1].length} chars.`);
  console.log(match[1].substring(0, 150).trim());
  console.log('---');
}
console.log('Total count:', count);
