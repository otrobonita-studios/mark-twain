const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');
const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(booksDir, file), 'utf8');
  
  // Look for <h2>ILLUSTRATIONS</h2> (with optional dots/whitespace) followed by a <table>
  const regex = /<h2[^>]*>\s*(ILLUSTRATIONS|List of Illustrations)[^<]*<\/h2>\s*(<div[^>]*>)?\s*<table/i;
  const match = content.match(regex);
  if (match) {
    console.log(`Found LOI table in: ${file}`);
  }
  
  // Also look for summary='LOI' or summary="LOI"
  if (content.includes("summary='LOI'") || content.includes('summary="LOI"')) {
    console.log(`Found summary='LOI' in: ${file}`);
  }
});
