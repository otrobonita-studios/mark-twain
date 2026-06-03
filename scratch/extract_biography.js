const fs = require('fs');
const path = require('path');

const vol1Path = path.join(__dirname, '../src/data/books/Volume-1.html');
const html = fs.readFileSync(vol1Path, 'utf8');

const startRegex = /<h2>\s*MARK TWAIN&mdash;A BIOGRAPHICAL SUMMARY\s*<\/h2>/i;
const startMatch = html.match(startRegex);
const startIndex = startMatch ? startMatch.index : -1;
const endTag = '<a name="link2H_4_0003"';
const endIndex = html.indexOf(endTag);

if (startIndex === -1 || endIndex === -1) {
  console.error("Tags not found!", { startIndex, endIndex });
} else {
  const bioHtml = html.substring(startIndex, endIndex).trim();
  fs.writeFileSync(path.join(__dirname, 'extracted_bio.html'), bioHtml, 'utf8');
  console.log("Successfully extracted biography HTML!");
}
