const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../out/read');
const booksDir = path.join(__dirname, '../src/data/books');

let strippedCount = 0;
let bytesRemoved = 0;

// Strip from out/read directory if it exists
if (fs.existsSync(outDir)) {
  const files = fs.readdirSync(outDir);

  files.forEach(file => {
    if (file.endsWith('.html')) {
      const filePath = path.join(outDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      const originalSize = content.length;

      // Remove all script tags
      content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
      // Remove script preloads
      content = content.replace(/<link[^>]*?as="script"[^>]*?>/gi, '');

      const newSize = content.length;
      if (originalSize !== newSize) {
        fs.writeFileSync(filePath, content, 'utf8');
        bytesRemoved += (originalSize - newSize);
        strippedCount++;
      }
    }
  });
}

console.log(`✓ Book pages stripped of scripts: ${strippedCount}`);
console.log(`✓ Total bytes removed: ${(bytesRemoved / 1024).toFixed(2)} KB`);
