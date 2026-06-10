// scratch/extract_alonzo_headings.js
const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '../src/data/books/The-Loves-of-Alonzo-Fitz.html');
const content = fs.readFileSync(filepath, 'utf8');

const regex = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
let match;
const headings = [];

while ((match = regex.exec(content)) !== null) {
  headings.push(match[1].replace(/<[^>]+>/g, '').trim());
}

console.log("Headings in Alonzo Fitz:", headings);
