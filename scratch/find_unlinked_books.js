const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../src/components/TheCompleteWorksPage.tsx');
const booksDir = path.join(__dirname, '../src/data/books');

const content = fs.readFileSync(pagePath, 'utf8');

// Find all slug values
const slugRegex = /slug:\s*["']([^"']*?)["']/g;
const slugs = new Set();
let match;
while ((match = slugRegex.exec(content)) !== null) {
  slugs.add(match[1]);
}

// Find all href values
const hrefRegex = /href:\s*["']([^"']*?)["']/g;
while ((match = hrefRegex.exec(content)) !== null) {
  const parts = match[1].split('/');
  const lastPart = parts[parts.length - 1];
  if (lastPart) {
    slugs.add(lastPart);
  }
}

// Read HTML files in books directory
const files = fs.readdirSync(booksDir);
const htmlFiles = files.filter(f => f.endsWith('.html'));

console.log(`Total HTML files found: ${htmlFiles.length}`);
console.log(`Total slugs linked on page: ${slugs.size}`);

console.log('\nHTML files NOT linked on TheCompleteWorksPage:');
let unlinkedCount = 0;
htmlFiles.forEach(file => {
  const slug = file.replace(/\.html$/, '');
  if (!slugs.has(slug)) {
    console.log(`- ${file} (slug: ${slug})`);
    unlinkedCount++;
  }
});

console.log(`\nTotal unlinked files: ${unlinkedCount}`);
