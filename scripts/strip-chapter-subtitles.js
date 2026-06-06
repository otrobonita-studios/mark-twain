const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');

let filesProcessed = 0;
let removedCount = 0;

if (fs.existsSync(booksDir)) {
  const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.html'));

  files.forEach(file => {
    const filePath = path.join(booksDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Remove chapter subtitle lines (e.g., "The Party—Across America to Vancouver—On Board the Warrimo...")
    // Pattern: Line starting with chapter-like content followed by em-dashes with multiple topics
    // These appear between chapter headers and actual content
    content = content.replace(
      /^[A-Za-z\s\-–—]+(?:—[A-Za-z\s\-–—]+){2,}\s*\n/gm,
      ''
    );

    // Also remove lines that are pure "CHAPTER X.\nDescription—of—topics"
    content = content.replace(
      /CHAPTER\s+[IVXLC0-9]+\.\s*\n\s*[A-Za-z\s\-–—]+(?:—[A-Za-z\s\-–—]+){2,}\s*\n/g,
      'CHAPTER $& '
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesProcessed++;
      console.log(`✓ Processed: ${file}`);
    }
  });
}

console.log(`\n✓ Files processed: ${filesProcessed}`);
console.log('Note: Manual review may be needed for complex TOC patterns');
