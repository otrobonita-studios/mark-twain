const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');

function cleanClemensHeaders() {
  const files = fs.readdirSync(booksDir);
  let processedCount = 0;
  let changedCount = 0;

  files.forEach(file => {
    const filePath = path.join(booksDir, file);
    if (fs.statSync(filePath).isFile() && file.endsWith('.html')) {
      processedCount++;
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Regex to match <h2>(Samuel Langhorne Clemens)</h2> or variations with spacing, casing, or middle initials
      const regex = /<h2[^>]*>\s*\(\s*Samuel\s+(?:Langhorne\s+)?Clemens\s*\)\s*<\/h2>\s*/gi;
      
      if (regex.test(content)) {
        content = content.replace(regex, '');
        fs.writeFileSync(filePath, content, 'utf8');
        changedCount++;
        console.log(`Cleaned Clemens header in: ${file}`);
      }
    }
  });

  console.log(`Finished checking ${processedCount} HTML files. Cleaned ${changedCount} files.`);
}

cleanClemensHeaders();
