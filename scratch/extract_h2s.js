const fs = require('fs');
const path = require('path');

function getHeadings(file) {
  const filePath = path.join(__dirname, '../src/data/books/', file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');

  const regex = /<h2>([\s\S]*?)<\/h2>/gi;
  let match;
  let list = [];
  while ((match = regex.exec(content)) !== null) {
    list.push(match[1].trim().replace(/\s+/g, ' '));
  }
  return list;
}

console.log('The Stolen White Elephant H2s:');
getHeadings('The-Stolen-White-Elephant.html').forEach((h, i) => console.log(`${i+1}. ${h}`));

console.log('\nThe Loves of Alonzo Fitz H2s:');
getHeadings('The-Loves-of-Alonzo-Fitz.html').forEach((h, i) => console.log(`${i+1}. ${h}`));

console.log('\nThe $30,000 Bequest and Others H2s:');
getHeadings('The-30000-Bequest-and-Others.html').forEach((h, i) => console.log(`${i+1}. ${h}`));


