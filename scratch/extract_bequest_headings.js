// scratch/extract_bequest_headings.js
const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '../src/data/books/The-30000-Bequest-and-Others.html');
const content = fs.readFileSync(filepath, 'utf8');

const regex = /<h2>([\s\S]*?)<\/h2>/gi;
let match;
const headings = [];

while ((match = regex.exec(content)) !== null) {
  headings.push(match[1].replace(/<[^>]+>/g, '').trim());
}

console.log("Headings in Bequest:", headings);
