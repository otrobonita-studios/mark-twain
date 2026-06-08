const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');

function cleanTitleString(rawTitle, filename) {
  let title = rawTitle || filename.replace(/\.(html|txt)$/, '');
  title = title
    .replace(/\s*\|\s*Project Gutenberg/gi, '')
    .replace(/\s*,\s*by Mark Twain/gi, '')
    .replace(/\s*by Mark Twain/gi, '')
    .replace(/\s*,\s*By\s*Twain/gi, '')
    .replace(/\s*By\s*Twain/gi, '')
    .replace(/\s*,\s*by\s*Mark\s*Twain\s*\(Samuel\s*Clemens\)/gi, '')
    .replace(/\s*by\s*Mark\s*Twain\s*\(Samuel\s*Clemens\)/gi, '')
    .trim();
  return title;
}

function modernizeBook(filePath) {
  const filename = path.basename(filePath);
  console.log(`Processing: ${filename}`);
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Clean Gutenberg pre/div blocks containing boilerplate or license safely
  html = html.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, content) => {
    if (content.length < 20000 && /project\s*gutenberg|gutenberg\.org|legal\s*notice/i.test(content)) {
      return '';
    }
    return match;
  });

  html = html.replace(/<div([^>]*)>([\s\S]*?)<\/div>/gi, (match, attrs, content) => {
    if (content.length < 2000 && !content.includes('<div') && (/\*\*\*\s*(START|END)\s+OF/i.test(content) || /project\s*gutenberg|gutenberg\.org/i.test(content))) {
      return '';
    }
    return match;
  });

  html = html.replace(/\*\*\*\s*START OF THE PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');
  html = html.replace(/\*\*\*\s*END OF THE PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');
  html = html.replace(/\*\*\*\s*START OF THIS PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');
  html = html.replace(/\*\*\*\s*END OF THIS PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');

  // Extract clean title
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const cleanTitle = cleanTitleString(titleMatch ? titleMatch[1] : null, filename);

  const bodyStart = html.indexOf('<body>');
  const bodyEnd = html.lastIndexOf('</body>');
  if (bodyStart === -1 || bodyEnd === -1) {
    console.log(`  [Warning] Body tags not found in ${filename}, skipping...`);
    return;
  }

  let bodyContent = html.substring(bodyStart + 6, bodyEnd);

  // 2. Remove duplicate H1/H2 header blocks at the start of the body
  let headerSection = bodyContent.substring(0, 3000);
  const titleRegexPart = cleanTitle.replace(/['’]/g, '.').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const oldTitleRegex = new RegExp(`<h1[^>]*>\\s*${titleRegexPart}\\s*<\/h1>`, 'i');
  headerSection = headerSection.replace(oldTitleRegex, '');
  headerSection = headerSection.replace(/<h2>\s*By\s*Mark\s*Twain\s*<\/h2>/gi, '');
  headerSection = headerSection.replace(/<h2>\s*by\s*Mark\s*Twain\s*<\/h2>/gi, '');
  headerSection = headerSection.replace(/<h2>\s*By\s*Mark\s*Twain\s*\(Samuel\s*Clemens\)\s*<\/h2>/gi, '');
  headerSection = headerSection.replace(/<div class=['"]ph2['"]>[\s\S]*?<\/div>/gi, '');
  headerSection = headerSection.replace(/<div class=['"]ph3['"]>[\s\S]*?<\/div>/gi, '');

  bodyContent = headerSection + bodyContent.substring(3000);

  // Prepend standardized Title Block
  const titleBlockHtml = `
<div class="book-title-block">
  <h1>${cleanTitle.toUpperCase()}</h1>
  <h2>BY MARK TWAIN</h2>
  
</div>
<hr />
`;
  bodyContent = titleBlockHtml + bodyContent;

  // 3. Table of Contents Collapsing
  // Table-based TOC
  bodyContent = bodyContent.replace(
    /(<h2[^>]*>\s*(?:CONTENTS|Contents|INDEX|Index)\s*<\/h2>)([\s\S]{0,150}?)(<table[^>]*>[\s\S]*?<\/table>)/gi,
    (match, heading, spacing, table) => {
      console.log('  Wrapped table-based TOC');
      return `${heading}${spacing}
<div class="book-toc-collapsed-wrapper">
  <div class="book-toc-content-inside">
    ${table}
  </div>
  <div class="book-toc-fade-overlay"></div>
  <button class="book-toc-expand-btn">Expand Table of Contents</button>
</div>`;
    }
  );

  // Paragraph-based TOC
  bodyContent = bodyContent.replace(
    /(<h2[^>]*>\s*(?:CONTENTS|Contents|INDEX|Index)\s*<\/h2>)([\s\S]{0,250}?)((?:<p\s+class="toc">[\s\S]*?<\/p>\s*)+)/gi,
    (match, heading, spacing, tocItems) => {
      if (match.includes('book-toc-collapsed-wrapper')) {
        return match;
      }
      console.log('  Wrapped paragraph-based TOC');
      return `${heading}${spacing}
<div class="book-toc-collapsed-wrapper">
  <div class="book-toc-content-inside">
    ${tocItems}
  </div>
  <div class="book-toc-fade-overlay"></div>
  <button class="book-toc-expand-btn">Expand Table of Contents</button>
</div>`;
    }
  );

  // H3-based chapter links list TOC
  bodyContent = bodyContent.replace(
    /(<h2[^>]*>\s*(?:CONTENTS|Contents|INDEX|Index)\s*<\/h2>)([\s\S]{0,250}?)((?:<h3>\s*<a\s+href="#ch\d+">[\s\S]*?<\/a>\s*<\/h3>\s*)+)/gi,
    (match, heading, spacing, chapters) => {
      if (match.includes('book-toc-collapsed-wrapper')) {
        return match;
      }
      console.log('  Wrapped h3 chapter list TOC');
      return `${heading}${spacing}
<div class="book-toc-collapsed-wrapper">
  <div class="book-toc-content-inside">
    ${chapters}
  </div>
  <div class="book-toc-fade-overlay"></div>
  <button class="book-toc-expand-btn">Expand Table of Contents</button>
</div>`;
    }
  );

  // 4. Illustrations section grid at bottom (if listed in first 4000 characters)
  const figures = [];
  const hasIllustrationList = /illustrations/i.test(bodyContent.substring(0, 4000));
  if (hasIllustrationList) {
    // Extract all figures
    bodyContent = bodyContent.replace(/<div class="fig"[^>]*>([\s\S]*?)<\/div>/gi, (match) => {
      figures.push(match);
      return ''; // remove inline
    });

    if (figures.length > 0) {
      console.log(`  Moved ${figures.length} figures to bottom illustrations grid gallery`);

      // Remove original List of Illustrations block to avoid duplication
      bodyContent = bodyContent.replace(
        /(<h2>\s*(?:LIST OF ILLUSTRATIONS|Illustrations|ILLUSTRATIONS)\s*<\/h2>|LIST OF ILLUSTRATIONS|ILLUSTRATIONS)([\s\S]{0,100}?)(<table[^>]*>[\s\S]*?<\/table>)/gi,
        ''
      );
      bodyContent = bodyContent.replace(
        /(<h2>\s*(?:LIST OF ILLUSTRATIONS|Illustrations|ILLUSTRATIONS)\s*<\/h2>|LIST OF ILLUSTRATIONS|ILLUSTRATIONS)([\s\S]{0,150}?)((?:<p\s+class="toc">[\s\S]*?<\/p>\s*)+)/gi,
        ''
      );

      // Construct gallery at the very end
      const galleryHtml = `
<hr />
<h2 id="illustrations-gallery-header">ILLUSTRATIONS</h2>
<div class="illustrations-gallery-grid">
  ${figures.join('\n  ')}
</div>
`;
      bodyContent = bodyContent + '\n' + galleryHtml;
    }
  }

  // 5. Dialogue Conversation Styling
  let dialogueCount = 0;
  bodyContent = bodyContent.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs, content) => {
    const trimmed = content.trim();

    // Strip tags first to get pure text content for checking quotes
    const textContent = trimmed.replace(/<[^>]+>/g, '').trim();

    const startsWithQuote = /^(“|&ldquo;|&#8220;|"|&quot;|&#34;|‘|&lsquo;|&#8216;)/.test(textContent);
    const endsWithQuote = /(”|&rdquo;|&#8221;|"|&quot;|&#34;|’|&rsquo;|&#8217;|”[\.\!\?]|&rdquo;[\.\!\?]|"[\.\!\?]|’[\.\!\?]|&rsquo;[\.\!\?])\s*$/.test(textContent);

    if (attrs.includes('conversation-line')) {
      return match;
    }

    if (startsWithQuote && endsWithQuote) {
      dialogueCount++;
      let newAttrs = attrs;
      if (attrs.includes('class=')) {
        newAttrs = attrs.replace(/class="([^"]*)"/i, 'class="$1 conversation-line"');
      } else {
        newAttrs = attrs + ' class="conversation-line"';
      }
      return `<p${newAttrs}>${content}</p>`;
    }
    return match;
  });
  console.log(`  Tagged dialogue paragraphs: ${dialogueCount}`);

  // Clean up any empty spacing paragraphs left behind
  bodyContent = bodyContent.replace(/<p>\s*(?:<br\s*\/?>\s*)*<\/p>/gi, '');

  // Re-write file
  const updatedHtml = html.substring(0, bodyStart + 6) + bodyContent + html.substring(bodyEnd);
  fs.writeFileSync(filePath, updatedHtml, 'utf8');
}

function main() {
  const files = fs.readdirSync(booksDir);
  let count = 0;
  for (const file of files) {
    if (file.endsWith('.html')) {
      const lower = file.toLowerCase();
      // Skip Eve's Diary as it has its own customized layout page
      if (lower === 'eves-diary.html' || lower === 'evesdiary.html') {
        console.log(`Skipping specialized Eve's Diary file: ${file}`);
        continue;
      }

      const fullPath = path.join(booksDir, file);
      modernizeBook(fullPath);
      count++;
    }
  }
  console.log(`\nSuccessfully modernized ${count} books!`);
}

main();
