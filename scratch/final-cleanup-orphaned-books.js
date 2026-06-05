const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');

// All orphaned files needing final cleanup
const allOrphanedFiles = [
  '1911-Encyclopædia-Britannica.html',
  'Appletons\'-Cyclopædia-of-American-Biography.html',
  'Cartoon-portraits-and-biographical-sketches-of-men-of-the-day.html',
  'Collier\'s-New-Encyclopedia-1921.html',
  'The-American-Cyclopædia-1879.html',
  'The-Encyclopedia-Americana-1920.html',
  'The-New-International-Encyclopædia.html',
  'The-New-Student\'s-Reference-Work.html',
  'The-American-Novel.html',
  'Following-The-Equator.html',
  'Eves-Diary.html'
];

function finalCleanupHTML(content) {
  let cleaned = content;

  // === Remove orphaned/broken markup ===

  // Remove orphaned closing span tags
  cleaned = cleaned.replace(/<\/span>\s*<\/span>/gi, '');
  cleaned = cleaned.replace(/<span>\s*<\/span>/gi, '');
  cleaned = cleaned.replace(/<span><\/span>/gi, '');

  // Remove empty or nearly-empty spans
  cleaned = cleaned.replace(/<span>\s*<\/span>/gi, '');
  cleaned = cleaned.replace(/<span[^>]*>\s*<\/span>/gi, '');

  // Remove blackletter and other wiki-specific span classes
  cleaned = cleaned.replace(/<span class="blackletter[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  cleaned = cleaned.replace(/<span class="smallcaps"[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  cleaned = cleaned.replace(/<span lang="[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '$1');

  // Remove remaining wiki-specific inline elements
  cleaned = cleaned.replace(/<span class="nowrap"[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  cleaned = cleaned.replace(/<span class="imageRight"[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  cleaned = cleaned.replace(/<span class="mw-default-size"[^>]*>([\s\S]*?)<\/span>/gi, '$1');

  // Remove trailing wiki link markup
  cleaned = cleaned.replace(/\s+<span><\/span>\s*$/gm, '');

  // Clean up wst-rule class
  cleaned = cleaned.replace(/\s+class="wst-rule[^"]*"/gi, '');

  // Remove inline smallcaps style - the text alone is fine
  cleaned = cleaned.replace(/style="font-variant:small-caps;"/gi, '');

  // === Clean up bad nesting ===

  // Fix multiple closing divs
  cleaned = cleaned.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gi, '</div>');
  cleaned = cleaned.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gi, '</div>');
  cleaned = cleaned.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gi, '</div>');
  cleaned = cleaned.replace(/<\/div>\s*<\/div>\s*<\/div>/gi, '</div>');

  // === Final passes ===

  // Remove multiple consecutive blank lines
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

  // Remove trailing whitespace on lines
  cleaned = cleaned.replace(/[ \t]+\n/g, '\n');

  return cleaned;
}

// Process files
console.log('Running final cleanup pass...\n');

allOrphanedFiles.forEach(filename => {
  const filePath = path.join(booksDir, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleaned = finalCleanupHTML(content);

    if (cleaned !== content) {
      fs.writeFileSync(filePath, cleaned, 'utf8');
      console.log(`✓ Final cleanup: ${filename}`);
    } else {
      console.log(`→ Clean: ${filename}`);
    }
  } catch (err) {
    console.error(`✗ Error processing ${filename}:`, err.message);
  }
});

console.log('\n✅ Final cleanup complete.');
