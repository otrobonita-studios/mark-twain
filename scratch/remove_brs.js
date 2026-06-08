const fs = require('fs');
const path = require('path');

const filePath = 'e:/development/mark-twain/src/data/books/Life-on-the-Mississippi.html';
let content = fs.readFileSync(filePath, 'utf8');

// Regex to match <br> or <br /> followed by any whitespace/newlines and another <br> or <br />
const brRegex = /<br\s*\/?>\s*<br\s*\/?>/gi;

// Let's count matches
const matches = content.match(brRegex);
const count = matches ? matches.length : 0;
console.log(`Found ${count} occurrences of double <br> tags.`);

if (count > 0) {
  // Replace all of them with empty string
  content = content.replace(brRegex, '');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully removed all double <br> tags.');
}
