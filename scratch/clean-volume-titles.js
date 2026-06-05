const fs = require('fs');
const path = require('path');

const dir = 'e:/development/mark-twain/src/data/books';

for (let i = 1; i <= 6; i++) {
  const filename = `Volume-${i}.html`;
  const filePath = path.join(dir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File ${filename} not found.`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  const titleBlockPattern = /<div class="book-title-block">([\s\S]*?)<\/div>/i;
  const match = content.match(titleBlockPattern);
  
  if (match) {
    const originalBlock = match[0];
    console.log(`\n--- ${filename} Original Title Block ---`);
    console.log(originalBlock);
    
    // Clean it up: find the h1 tag, keep it, and discard h2 tags inside book-title-block
    const h1Match = originalBlock.match(/<h1>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
      const h1Text = h1Match[1].trim();
      const newBlock = `<div class="book-title-block">\n  <h1>${h1Text}</h1>\n</div>`;
      
      console.log(`--- ${filename} New Title Block ---`);
      console.log(newBlock);
      
      content = content.replace(originalBlock, newBlock);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filename}!`);
    } else {
      console.error(`Could not find h1 tag in title block of ${filename}`);
    }
  } else {
    console.error(`Could not find book-title-block in ${filename}`);
  }
}
