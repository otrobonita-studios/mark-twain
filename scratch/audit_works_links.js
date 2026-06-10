const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/TheCompleteWorksPage.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const arrays = {
  booksList: /const booksList: BookListEntry\[\] = (\[[\s\S]*?\]);/,
  lettersList: /const lettersList: LetterEntry\[\] = (\[[\s\S]*?\]);/,
  shortFiction: /const shortFiction: WorkEntry\[\] = (\[[\s\S]*?\]);/,
  essaysSpeechs: /const essaysSpeechs: WorkEntry\[\] = (\[[\s\S]*?\]);/,
  referenceBio: /const referenceBio: WorkEntry\[\] = (\[[\s\S]*?\]);/,
  newsAccounts: /const newsAccounts: WorkEntry\[\] = (\[[\s\S]*?\]);/
};

const booksDir = path.join(__dirname, '../src/data/books');

let totalCount = 0;
let brokenLinks = [];
let allEntries = [];

for (const [name, regex] of Object.entries(arrays)) {
  const match = content.match(regex);
  if (!match) {
    console.error(`Could not match array ${name}`);
    continue;
  }
  
  const arrayText = match[1];
  const objectRegex = /\{([\s\S]*?)\}/g;
  let objMatch;
  let count = 0;
  
  while ((objMatch = objectRegex.exec(arrayText)) !== null) {
    const fieldsText = objMatch[1];
    const titleMatch = fieldsText.match(/title:\s*"([^"]*?)"/) || fieldsText.match(/title:\s*'([^']*?)'/);
    const slugMatch = fieldsText.match(/slug:\s*"([^"]*?)"/) || fieldsText.match(/slug:\s*'([^']*?)'/);
    const hrefMatch = fieldsText.match(/href:\s*"([^"]*?)"/) || fieldsText.match(/href:\s*'([^']*?)'/);
    
    if (titleMatch) {
      count++;
      totalCount++;
      const title = titleMatch[1];
      const slug = slugMatch ? slugMatch[1] : null;
      const href = hrefMatch ? hrefMatch[1] : null;
      
      allEntries.push({ list: name, title, slug, href });
      
      if (slug) {
        const htmlPath = path.join(booksDir, `${slug}.html`);
        const txtPath = path.join(booksDir, `${slug}.txt`);
        const exists = fs.existsSync(htmlPath) || fs.existsSync(txtPath);
        if (!exists) {
          brokenLinks.push({ list: name, title, slug, error: 'File not found in src/data/books/' });
        }
      } else if (href) {
        // Next.js routing strips leading slash or checks subfolders
        const appPathJs = path.join(__dirname, '../src/app', href, 'page.js');
        const appPathTsx = path.join(__dirname, '../src/app', href, 'page.tsx');
        const exists = fs.existsSync(appPathJs) || fs.existsSync(appPathTsx);
        if (!exists) {
          brokenLinks.push({ list: name, title, href, error: `App page not found in src/app${href}/` });
        }
      } else {
        brokenLinks.push({ list: name, title, error: 'Has neither slug nor href' });
      }
    }
  }
  console.log(`Array ${name}: parsed ${count} items.`);
}

console.log('\n--- VERIFICATION SUMMARY ---');
console.log(`Total items in lists: ${totalCount}`);
console.log(`Broken links/Missing files: ${brokenLinks.length}`);

if (brokenLinks.length > 0) {
  console.log('\nBroken links detail:');
  brokenLinks.forEach(b => {
    console.log(`- [${b.list}] "${b.title}": ${b.error} (slug: ${b.slug || 'N/A'}, href: ${b.href || 'N/A'})`);
  });
} else {
  console.log('All links have valid destinations!');
}
