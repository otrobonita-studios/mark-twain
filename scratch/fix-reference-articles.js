const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');

// [filename, clean-h1 (strip after last /), optional h2 (year if not in title)]
const refArticles = [
  ["Collier's-New-Encyclopedia-1921-Clemens-Samuel-Langhorne.html",
    "COLLIER'S NEW ENCYCLOPEDIA (1921)", null],
  ["The-Encyclopedia-Americana-1920-Clemens-Samuel-Langhorne.html",
    "THE ENCYCLOPEDIA AMERICANA (1920)", null],
  ["The-New-Student's-Reference-Work-Clemens-Samuel-Langhorne.html",
    "THE NEW STUDENT'S REFERENCE WORK", "1914"],
  ["1911-Encyclopædia-Britannica-Twain-Mark.html",
    "1911 ENCYCLOPÆDIA BRITANNICA", null],
  ["The-New-International-Encyclopædia-Clemens-Samuel-Langhorne.html",
    "THE NEW INTERNATIONAL ENCYCLOPÆDIA", "1902"],
  ["Appletons'-Cyclopædia-of-American-Biography-Clemens-Samuel-Langhorne.html",
    "APPLETONS' CYCLOPÆDIA OF AMERICAN BIOGRAPHY", "1887"],
  ["The-American-Cyclopædia-1879-Clemens-Samuel-Langhorne.html",
    "THE AMERICAN CYCLOPÆDIA (1879)", null],
  ["Cartoon-portraits-and-biographical-sketches-of-men-of-the-day-Mark-Twain.html",
    "CARTOON PORTRAITS AND BIOGRAPHICAL SKETCHES OF MEN OF THE DAY", "1873"],
];

refArticles.forEach(([filename, newH1, yearH2]) => {
  const filePath = path.join(booksDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Not found: ${filename}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Fix title block: replace the whole BY MARK TWAIN block
  // Match the h1 with path-contaminated title + the two wrong h2s
  const titleBlockRe = /<div class=["']book-title-block["']>\s*<h1>[^<]*<\/h1>\s*<h2>BY MARK TWAIN<\/h2>\s*<h2>\(Samuel Langhorne Clemens\)<\/h2>\s*<\/div>/i;

  const h2Line = yearH2 ? `\n  <h2>${yearH2}</h2>` : '';
  const newTitleBlock = `<div class="book-title-block">
  <h1>${newH1}</h1>${h2Line}
</div>`;

  if (titleBlockRe.test(content)) {
    content = content.replace(titleBlockRe, newTitleBlock);
    console.log(`✓ ${filename}`);
  } else {
    console.log(`⚠️  Pattern not matched in: ${filename}`);
    // Try a more lenient match
    console.log('  Attempting lenient match...');
    const lenientRe = /<h1>[^<]*<\/h1>\s*<h2>BY MARK TWAIN<\/h2>\s*<h2>\(Samuel Langhorne Clemens\)<\/h2>/i;
    if (lenientRe.test(content)) {
      content = content.replace(lenientRe, `<h1>${newH1}</h1>${h2Line}`);
      console.log(`  ✓ Lenient match succeeded`);
    } else {
      console.log('  ✗ No match found');
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('\nDone.');
