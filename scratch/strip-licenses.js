const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');

function cleanFile(filePath) {
  const filename = path.basename(filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Remove the licenseContainer div
  content = content.replace(/<div class=["']licenseContainer[^"']*["']>[\s\S]*?<\/div>/gi, '');

  // 2. Remove any licensetpl div
  content = content.replace(/<div class=["']licensetpl["']>[\s\S]*?<\/div>/gi, '');

  // 2b. Remove plain/classless public domain div blocks
  content = content.replace(/<div>\s*<div>\s*<p>\s*This work is in the[\s\S]*?<\/div>\s*<\/div>/gi, '');

  // 2c. Remove "This work was published in" / "This work was published before" blocks
  content = content.replace(/<div>\s*<div>\s*<p>\s*This work was published in[\s\S]*?<\/div>\s*<\/div>/gi, '');
  content = content.replace(/<div>\s*<div>\s*<p>\s*This work was published before[\s\S]*?<\/div>\s*<\/div>/gi, '');

  // 2d. Remove US flag image blocks (often containing Flag_of_the_United_States.svg)
  content = content.replace(/<div>\s*<p>\s*<span[^>]*>(?:\s*<span[^>]*>)*\s*<img[^>]*Flag_of_the_United_States\.svg[\s\S]*?<\/div>/gi, '');

  // 3. Remove NewPP limit report comment blocks and parser stats
  content = content.replace(/<!--\s*NewPP limit report[\s\S]*?-->/gi, '');

  // 4. Remove Transclusion expansion time report comment blocks
  content = content.replace(/<!--\s*Transclusion expansion time report[\s\S]*?-->/gi, '');

  // 5. Remove Render ID comment blocks
  content = content.replace(/<!--\s*Render ID[\s\S]*?-->/gi, '');

  // 6. Remove Saved in parser cache comment blocks
  content = content.replace(/<!--\s*Saved in parser cache[\s\S]*?-->/gi, '');

  // 7. General cleanup for multiple consecutive blank spaces or lines
  content = content.trim();

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[Cleaned License/Comments] ${filename}`);
    return true;
  }
  return false;
}

function main() {
  const files = fs.readdirSync(booksDir);
  let cleanedCount = 0;
  let totalCount = 0;

  for (const file of files) {
    if (file.endsWith('.html')) {
      const fullPath = path.join(booksDir, file);
      const wasCleaned = cleanFile(fullPath);
      if (wasCleaned) cleanedCount++;
      totalCount++;
    }
  }

  console.log(`\nScan complete. Cleaned licenses/comments from ${cleanedCount} out of ${totalCount} HTML files.`);
}

main();
