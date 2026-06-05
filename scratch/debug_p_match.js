const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/data/books/Volume-1.html');
const content = fs.readFileSync(file, 'utf8');

const pRegex = /<p([^>]*)>([\s\S]*?)<\/p>/gi;
let match;
while ((match = pRegex.exec(content)) !== null) {
  if (match[0].includes('To Mrs. Jane Clemens and Mrs. Moffett, in St. Louis:')) {
    console.log('\n--- MATCH ---');
    console.log(match[0]);
  }
}
