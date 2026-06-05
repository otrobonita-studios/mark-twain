const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');

function cleanFile(filePath) {
  const filename = path.basename(filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Replace the inner wrapper start inside <td>
  content = content.replace(
    /<td>\s*<div class=["']book-toc-collapsed-wrapper["']>\s*<div class=["']book-toc-content-inside["']>/gi,
    '<td>'
  );

  // 2. Replace the inner wrapper end and button inside </td>
  content = content.replace(
    /<\/div>\s*(?:<div class=["']book-toc-fade-overlay["']><\/div>\s*)?<button class=["']book-toc-expand-btn["']>[^<]*<\/button>\s*<\/div>\s*<\/td>/gi,
    '</td>'
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[Fixed] ${filename}`);
    return true;
  }
  return false;
}

function main() {
  const files = fs.readdirSync(booksDir);
  let fixedCount = 0;
  let totalCount = 0;

  for (const file of files) {
    if (file.endsWith('.html')) {
      const fullPath = path.join(booksDir, file);
      const wasFixed = cleanFile(fullPath);
      if (wasFixed) fixedCount++;
      totalCount++;
    }
  }

  console.log(`\nScan complete. Fixed ${fixedCount} out of ${totalCount} HTML files.`);
}

main();
