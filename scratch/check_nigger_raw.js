const fs = require('fs');
const path = require('path');

const filePath = 'e:/development/mark-twain/src/data/books/Huckleberry-Finn.html';
const content = fs.readFileSync(filePath, 'utf8');

// Find all matches of "nigger" (case-insensitive)
const matches = [];
const regex = /nigger/gi;
let match;
while ((match = regex.exec(content)) !== null) {
  const index = match.index;
  // Get preceding characters
  const preceding = content.substring(Math.max(0, index - 10), index);
  if (!preceding.endsWith('{var_') && !preceding.endsWith('{var_N') && !preceding.endsWith('{var_n')) {
    matches.push({
      index,
      preceding,
      match: match[0],
      context: content.substring(Math.max(0, index - 20), index + 20)
    });
  }
}

console.log('Literal matches not inside template variables:', matches.length);
if (matches.length > 0) {
  console.log(JSON.stringify(matches, null, 2));
}
