const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');
const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(booksDir, file), 'utf8');
  
  // Find all <h2> elements and see what tag follows them (excluding whitespace)
  const regex = /<h2([^>]*)>([\s\S]*?)<\/h2>(\s*|<a[^>]*><\/a>)*<table/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const headingText = match[2].replace(/<[^>]+>/g, '').trim();
    console.log(`File: ${file} | Heading: "${headingText}" | Matches h2 + table`);
  }
});
