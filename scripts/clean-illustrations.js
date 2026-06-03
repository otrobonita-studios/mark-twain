const fs = require('fs');
const path = require('path');

const baseDir = process.cwd();
const booksDir = path.join(baseDir, 'src/data/books');
const assetsDir = path.join(baseDir, 'public/images/book-illustrations');

// 1. Rename files on disk to strip curly braces and delete enlarge.jpg
function cleanDiskAssets(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanDiskAssets(fullPath);
    } else if (entry.isFile()) {
      if (entry.name === 'enlarge.jpg') {
        fs.unlinkSync(fullPath);
        console.log(`Deleted: ${path.relative(baseDir, fullPath)}`);
      } else if (entry.name.includes('{') || entry.name.includes('}')) {
        const newName = entry.name.replace(/[{}]/g, '');
        const newPath = path.join(dir, newName);
        fs.renameSync(fullPath, newPath);
        console.log(`Renamed: ${path.relative(baseDir, fullPath)} -> ${newName}`);
      }
    }
  }
}

// 2. Clean HTML files
function cleanHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Remove enlarge.jpg anchor blocks wrapped in h5
  content = content.replace(/<h5[^>]*>\s*<a[^>]*href=["'][^"']*["'][^>]*>\s*<img[^>]*src=["'][^"']*enlarge\.jpg["'][^>]*>\s*<\/a>\s*<\/h5>/gi, '');
  
  // Remove enlarge.jpg anchor blocks (unwrapped)
  content = content.replace(/<a[^>]*href=["'][^"']*["'][^>]*>\s*<img[^>]*src=["'][^"']*enlarge\.jpg["'][^>]*>\s*<\/a>/gi, '');

  // Strip curly braces from src, href, and alt attributes
  let prevContent;
  do {
    prevContent = content;
    content = content.replace(/(src|href|alt)=["']([^"']*?)\{([^"']*?)\}([^"']*?)["']/gi, '$1="$2$3$4"');
  } while (content !== prevContent);

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned HTML references in: ${path.relative(baseDir, filePath)}`);
  }
}

console.log('Starting Illustration Layout & Curly Braces Cleanup...');

// Run disk assets cleanup
cleanDiskAssets(assetsDir);

// Run HTML files cleanup
if (fs.existsSync(booksDir)) {
  const files = fs.readdirSync(booksDir);
  for (const file of files) {
    if (file.endsWith('.html')) {
      cleanHtmlFile(path.join(booksDir, file));
    }
  }
}

console.log('Illustration cleanup completed successfully!');
