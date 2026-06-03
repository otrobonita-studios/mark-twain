const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');
const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.html'));

let totalMatches = 0;
let fileMatchesCount = 0;

files.forEach(file => {
  const content = fs.readFileSync(path.join(booksDir, file), 'utf8');
  
  // Look for any two images or figures that appear without any intervening text (except whitespace, tags, anchors, comments, etc.)
  // Let's use a regex or custom parser.
  // Specifically: <div class="fig" ...> ... </div> followed by whitespace/anchors and another <div class="fig" ...>
  // Or <img> followed by <img>
  const figRegex = /<div class="fig"[^>]*>[\s\S]*?<\/div>(\s*|<a[^>]*><\/a>|<br\s*\/?>)*<div class="fig"[^>]*>/gi;
  const imgRegex = /<img[^>]*>(\s*|<a[^>]*><\/a>|<br\s*\/?>)*<img[^>]*>/gi;
  
  const figMatches = content.match(figRegex);
  const imgMatches = content.match(imgRegex);
  
  if (figMatches || imgMatches) {
    fileMatchesCount++;
    console.log(`\nFile: ${file}`);
    if (figMatches) {
      console.log(`  Adjacent .fig count: ${figMatches.length}`);
      totalMatches += figMatches.length;
      figMatches.slice(0, 3).forEach((m, i) => {
        console.log(`    [FIG Match ${i + 1}]:\n${m.substring(0, 150)}...`);
      });
    }
    if (imgMatches) {
      console.log(`  Adjacent img count: ${imgMatches.length}`);
      totalMatches += imgMatches.length;
      imgMatches.slice(0, 3).forEach((m, i) => {
        console.log(`    [IMG Match ${i + 1}]:\n${m.substring(0, 150)}...`);
      });
    }
  }
});

console.log(`\nTotal files with matches: ${fileMatchesCount}`);
console.log(`Total adjacent image sequences found: ${totalMatches}`);
