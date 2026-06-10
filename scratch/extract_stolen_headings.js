// scratch/extract_stolen_headings.js
const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '../src/data/books/The-Stolen-White-Elephant.html');
if (!fs.existsSync(filepath)) {
  console.log("File does not exist!");
  process.exit(0);
}
const content = fs.readFileSync(filepath, 'utf8');

const regex = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
let match;
const headings = [];

while ((match = regex.exec(content)) !== null) {
  headings.push(match[1].replace(/<[^>]+>/g, '').trim());
}

console.log("Headings in Stolen White Elephant:", headings);
