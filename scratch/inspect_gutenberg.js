const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/data/books');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (!file.endsWith('.html')) return;
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const matches = [];
  let index = 0;
  const regex = /gutenberg/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const start = Math.max(0, match.index - 50);
    const end = Math.min(content.length, match.index + match[0].length + 50);
    const snippet = content.substring(start, end).replace(/\r?\n/g, ' ');
    matches.push({ index: match.index, snippet });
  }
  
  if (matches.length > 0) {
    console.log(`\nFile: ${file} (found ${matches.length} matches)`);
    matches.slice(0, 10).forEach((m, idx) => {
      console.log(`  Match ${idx + 1}: ...${m.snippet}...`);
    });
    if (matches.length > 10) {
      console.log(`  ... and ${matches.length - 10} more matches`);
    }
  }
});
