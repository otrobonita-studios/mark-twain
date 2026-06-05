const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');

// These files need cleanup (encyclopedia variants and miscellaneous entries)
const filesToClean = [
  '1911-Encyclopædia-Britannica.html',
  'Appletons\'-Cyclopædia-of-American-Biography.html',
  'Cartoon-portraits-and-biographical-sketches-of-men-of-the-day.html',
  'Collier\'s-New-Encyclopedia-1921.html',
  'The-American-Cyclopædia-1879.html',
  'The-Encyclopedia-Americana-1920.html',
  'The-New-International-Encyclopædia.html',
  'The-New-Student\'s-Reference-Work.html'
];

function cleanupHTML(content) {
  let cleaned = content;

  // Extract body content
  const bodyMatch = cleaned.match(/<body>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return content;

  let bodyContent = bodyMatch[1];

  // Remove Wikisource metadata boxes and navigation
  bodyContent = bodyContent.replace(/<div[^>]*class="[^"]*similar[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  bodyContent = bodyContent.replace(/<table[^>]*class="[^"]*metadata[^"]*"[^>]*>[\s\S]*?<\/table>/gi, '');
  bodyContent = bodyContent.replace(/<div[^>]*class="[^"]*navbox[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  bodyContent = bodyContent.replace(/<link[^>]*href="mw-data[^"]*"[^>]*>/gi, '');

  // Remove Wikisource parser output wrappers
  bodyContent = bodyContent.replace(/<div[^>]*class="mw-content-ltr[^"]*"[^>]*>/gi, '<div class="book-text-content">');

  // Remove prp-pages-output divs but keep content
  bodyContent = bodyContent.replace(/<div[^>]*class="prp-pages-output"[^>]*>/gi, '');
  bodyContent = bodyContent.replace(/<\/div>\s*<\/div>\s*<div[^>]*class="prp-pages-output"[^>]*>/gi, '');

  // Remove page number spans
  bodyContent = bodyContent.replace(/<span[^>]*class="pagenum[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
  bodyContent = bodyContent.replace(/<span[^>]*class="pagenum-inner[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');

  // Clean up wst-center and wst-block-center divs - convert to semantic structure
  bodyContent = bodyContent.replace(/<div[^>]*class="wst-center[^"]*"[^>]*>/gi, '<div class="text-center">');
  bodyContent = bodyContent.replace(/<div[^>]*class="wst-block-center[^"]*"[^>]*>/gi, '<div class="block-center">');

  // Remove external wiki links but keep the text
  bodyContent = bodyContent.replace(/<a[^>]*class="extiw"[^>]*href="[^"]*"[^>]*>([^<]*)<\/a>/gi, '$1');

  // Clean up multiple consecutive <br/> tags (keep max 1)
  bodyContent = bodyContent.replace(/(?:<br\s*\/?>\s*)+/gi, (match) => {
    return match.match(/<br/gi).length > 2 ? '<br/>' : match;
  });

  // Remove inline style attributes except where essential
  bodyContent = bodyContent.replace(/\s+style="[^"]*font-size:\s*\d+%[^"]*"([^>]*>)/gi, '$1');
  bodyContent = bodyContent.replace(/\s+style="[^"]*text-align:\s*center[^"]*"([^>]*>)/gi, ' class="text-align-center"$1');

  // Clean up empty divs
  bodyContent = bodyContent.replace(/<div[^>]*class="[^"]*ws-noexport[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  bodyContent = bodyContent.replace(/<div[^>]*>\s*<\/div>/gi, '');

  // Remove duplicate/nested book-text-content divs
  bodyContent = bodyContent.replace(/<div class="book-text-content">\s*<div class="book-text-content">/gi, '<div class="book-text-content">');
  bodyContent = bodyContent.replace(/<\/div>\s*<\/div>\s*<\/div>/gi, '</div>');

  // Wrap leftover content in book-text-content if not already wrapped
  if (!bodyContent.includes('class="book-text-content"')) {
    bodyContent = `<div class="book-text-content">${bodyContent}</div>`;
  }

  // Reconstruct HTML
  cleaned = cleaned.replace(/<body>[\s\S]*?<\/body>/i, `<body>\n${bodyContent}\n</body>`);

  return cleaned;
}

// Process files
filesToClean.forEach(filename => {
  const filePath = path.join(booksDir, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleaned = cleanupHTML(content);
    fs.writeFileSync(filePath, cleaned, 'utf8');
    console.log(`✓ Cleaned: ${filename}`);
  } catch (err) {
    console.error(`✗ Error processing ${filename}:`, err.message);
  }
});

console.log('\nCleanup complete.');
