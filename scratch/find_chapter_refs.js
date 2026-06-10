const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('chapter-')) {
        console.log(`Found "chapter-" in: ${fullPath}`);
      }
    }
  });
}

searchDir('e:/development/mark-twain/src');
