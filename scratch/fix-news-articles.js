const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');

// News articles: [filename, source attribution]
const newsArticles = [
  ['The-New-York-Times-Mark-Twain.html',                        'The New York Times, 1910'],
  ['The-New-York-Times-Mark-Twain-Investigating.html',          'The New York Times, 1907'],
  ['The-New-York-Times-Mark-Twain-is-Dead-at-74.html',          'The New York Times, 1910'],
  ['San-Francisco-Call-1910-Mark-Twain-Called-by-Death.html',   'San Francisco Call, 1910'],
  ["The-Washington-Post-newspaper-1907-Mark-Twain's-Exclusive-Publisher-Tells-What-The-Humorist-Is-Paid.html",
                                                                 'The Washington Post, 1907'],
  ['Crowd-Endangers-Steamer-to-Get-Passing-Glimpse-of-Humorist-Mark-Twain.html',
                                                                 'Virginia Press, 1907'],
  ['Easy-Mark-Twain.html',                                       'Virginia Press, 1907'],
  ['Mark-Twain-at-railroad-feast.html',                         'Associated Press, 1907'],
  ['Mark-Twain-here-with-H-H-Rogers.html',                      'Virginia Press, 1907'],
  ['Marooned-Mark-Twain.html',                                   'Virginia Press, 1907'],
];

newsArticles.forEach(([filename, source]) => {
  const filePath = path.join(booksDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Not found: ${filename}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace title block: remove "BY MARK TWAIN" + "(Samuel Langhorne Clemens)"
  //    Replace with source attribution
  content = content.replace(
    /(<h1>[^<]*<\/h1>)\s*<h2>BY MARK TWAIN<\/h2>\s*<h2>\(Samuel Langhorne Clemens\)<\/h2>/i,
    `$1\n  <h2>${source}</h2>`
  );

  // 2. Remove the repeated title in body — common Gutenberg/Wikisource pattern:
  //    <p><br/> <b>ARTICLE TITLE</b> </p>  OR  <p><b>ARTICLE TITLE</b> </p>
  //    Also handles wst-center wrapper: <div class="wst-center..."><p><b>...</b></p>...</div>
  //    Only remove paragraphs where the ONLY content (besides br) is a single <b> element
  content = content.replace(
    /<p[^>]*>\s*(?:<br\s*\/?>\s*)*<b>[A-Z][^<]{3,300}<\/b>\.?\s*<\/p>\s*/g,
    (match) => {
      // Only remove if the <p> contains nothing except optional <br> + a single <b>
      // (not if there's real paragraph text outside the <b>)
      const stripped = match.replace(/<p[^>]*>|<\/p>|<br\s*\/?>|<b>|<\/b>|\s/gi, '');
      // If after stripping all tags there's only uppercase title-style text, remove it
      if (/^[^a-z]{0,}$/.test(stripped.trim())) {
        return '';
      }
      return match;
    }
  );

  // Also strip wst-center div wrappers that only contain title <b> elements
  content = content.replace(
    /<div[^>]*wst-center[^>]*>\s*(?:<p[^>]*>\s*(?:<br\s*\/?>\s*)*<b>[^<]{3,300}<\/b>\.?\s*<\/p>\s*)+<\/div>\s*/gi,
    ''
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ ${filename}`);
});

console.log('\nDone.');
