const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');

// All orphaned files that need cleanup
const allOrphanedFiles = [
  '1911-Encyclopædia-Britannica.html',
  'Appletons\'-Cyclopædia-of-American-Biography.html',
  'Cartoon-portraits-and-biographical-sketches-of-men-of-the-day.html',
  'Collier\'s-New-Encyclopedia-1921.html',
  'The-American-Cyclopædia-1879.html',
  'The-Encyclopedia-Americana-1920.html',
  'The-New-International-Encyclopædia.html',
  'The-New-Student\'s-Reference-Work.html',
  // Additional variants without author suffixes
  'The-American-Novel.html',
  'Following-The-Equator.html',
  'Eves-Diary.html'
];

function deepCleanHTML(content) {
  let cleaned = content;

  // Extract body content
  const bodyMatch = cleaned.match(/<body>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return content;

  let bodyContent = bodyMatch[1];

  // === Remove Wikisource structural elements ===

  // Remove metadata/info boxes
  bodyContent = bodyContent.replace(/<div[^>]*class="[^"]*similar[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  bodyContent = bodyContent.replace(/<table[^>]*class="[^"]*metadata[^"]*"[^>]*>[\s\S]*?<\/table>/gi, '');
  bodyContent = bodyContent.replace(/<div[^>]*class="[^"]*navbox[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  bodyContent = bodyContent.replace(/<div[^>]*class="[^"]*authority[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

  // Remove noexport sections
  bodyContent = bodyContent.replace(/<[^>]*class="[^"]*ws-noexport[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, '');

  // Remove mw-deduplicated styles
  bodyContent = bodyContent.replace(/<link[^>]*href="mw-data[^"]*"[^>]*>/gi, '');

  // === Clean up wrapper divs ===

  // Simplify mw-content-ltr wrappers
  bodyContent = bodyContent.replace(/<div[^>]*class="mw-content-ltr[^"]*"[^>]*>/gi, '');
  bodyContent = bodyContent.replace(/<div[^>]*class="mw-parser-output"[^>]*>/gi, '');

  // Remove prp-pages-output divs but try to keep structure
  bodyContent = bodyContent.replace(/<div[^>]*class="prp-pages-output"[^>]*>/gi, '');
  bodyContent = bodyContent.replace(/<\/div>\s*<\/div>\s*<div[^>]*class="prp-pages-output"[^>]*>/gi, '');

  // Remove page number markup
  bodyContent = bodyContent.replace(/<span[^>]*class="pagenum[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
  bodyContent = bodyContent.replace(/<span[^>]*class="pagenum-inner[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
  bodyContent = bodyContent.replace(/<span[^>]*id="pageindex_\d+"[^>]*>[\s\S]*?<\/span>/gi, '');

  // Clean up centered divs
  bodyContent = bodyContent.replace(/<div[^>]*class="wst-center[^"]*"[^>]*>/gi, '<div class="text-center">');
  bodyContent = bodyContent.replace(/<div[^>]*class="wst-block-center[^"]*"[^>]*>/gi, '<div class="block-center">');

  // Remove complex Wikisource style attributes, keep simple text formatting
  bodyContent = bodyContent.replace(/\s+style="[^"]*-webkit-font-feature[^"]*"/gi, '');
  bodyContent = bodyContent.replace(/\s+style="[^"]*-ms-font-feature[^"]*"/gi, '');
  bodyContent = bodyContent.replace(/\s+typeof="mw:File"[^>]*/gi, '');
  bodyContent = bodyContent.replace(/\s+data-file-[^=]*="[^"]*"/gi, '');

  // Remove external wiki links but keep text
  bodyContent = bodyContent.replace(/<a[^>]*class="extiw"[^>]*href="[^"]*"[^>]*>([^<]*)<\/a>/gi, '$1');

  // Clean up mw-redirect classes
  bodyContent = bodyContent.replace(/\s+class="mw-redirect"/gi, '');

  // === Fix spacing/line breaks ===

  // Remove excessive <br/> tags (more than 2 in a row = keep 1)
  bodyContent = bodyContent.replace(/(<br\s*\/?>\s*){3,}/gi, '<br/>');

  // Remove <br/> right before closing tags
  bodyContent = bodyContent.replace(/<br\s*\/?>\s*(<\/)/gi, '$1');

  // Remove <br/> right after opening tags
  bodyContent = bodyContent.replace(/>\s*<br\s*\/?>/gi, '>');

  // === Clean up remaining wrapper divs ===

  // Remove empty divs
  bodyContent = bodyContent.replace(/<div[^>]*>\s*<\/div>/gi, '');

  // Consolidate nested book-text-content
  bodyContent = bodyContent.replace(/<div class="book-text-content">\s*<div class="book-text-content">/gi, '<div class="book-text-content">');

  // Clean up deeply nested closing tags
  bodyContent = bodyContent.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gi, '</div>');
  bodyContent = bodyContent.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gi, '</div>');
  bodyContent = bodyContent.replace(/<\/div>\s*<\/div>\s*<\/div>/gi, '</div>');

  // Ensure content is wrapped in book-text-content
  if (!bodyContent.includes('class="book-text-content"')) {
    bodyContent = `<div class="book-text-content">\n${bodyContent.trim()}\n</div>`;
  }

  // === Final cleanup ===

  // Remove multiple consecutive blank lines
  bodyContent = bodyContent.replace(/\n\s*\n\s*\n/g, '\n\n');

  // Trim excessive whitespace
  bodyContent = bodyContent.trim();

  // Reconstruct the HTML
  cleaned = cleaned.replace(/<body>[\s\S]*?<\/body>/i, `<body>\n${bodyContent}\n</body>`);

  return cleaned;
}

// Process files
console.log('Cleaning up orphaned book files...\n');

allOrphanedFiles.forEach(filename => {
  const filePath = path.join(booksDir, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleaned = deepCleanHTML(content);

    // Only write if there were actual changes
    if (cleaned !== content) {
      fs.writeFileSync(filePath, cleaned, 'utf8');
      console.log(`✓ Cleaned: ${filename}`);
    } else {
      console.log(`→ No changes needed: ${filename}`);
    }
  } catch (err) {
    console.error(`✗ Error processing ${filename}:`, err.message);
  }
});

console.log('\n✅ Cleanup complete.');
