const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/What-Is-Man-And-Others.html');
const content = fs.readFileSync(filePath, 'utf8');

const regex = /<div class="chapter">([\s\S]*?)<\/div>(?:\s*<!--end chapter-->)?/gi;
let count = 0;
let match;
while ((match = regex.exec(content)) !== null) {
  count++;
  if (count >= 2 && count <= 15) {
    const chContent = match[1];
    const imgCount = (chContent.match(/<img/gi) || []).length;
    console.log(`Chapter ${count}: contains ${imgCount} images.`);
    if (imgCount > 0) {
      let imgMatch;
      const imgRegex = /<img[^>]+>/gi;
      while ((imgMatch = imgRegex.exec(chContent)) !== null) {
        console.log(`  Found: ${imgMatch[0]}`);
      }
    }
  }
}
