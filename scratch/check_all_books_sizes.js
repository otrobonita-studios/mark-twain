const fs = require('fs');
const path = require('path');

const originalDir = path.join(__dirname, '../rag/data-collection/TwainCorpus/converted');
const activeDir = path.join(__dirname, '../src/data/books');

const files = fs.readdirSync(originalDir);
const report = [];

files.forEach(file => {
  if (file.endsWith('.html')) {
    const origPath = path.join(originalDir, file);
    const actPath = path.join(activeDir, file);
    
    if (fs.existsSync(actPath)) {
      const origSize = fs.statSync(origPath).size;
      const actSize = fs.statSync(actPath).size;
      const ratio = actSize / origSize;
      
      if (ratio < 0.8) { // If the active file is less than 80% of the original size
        report.push({
          file,
          origSize,
          actSize,
          ratio: (ratio * 100).toFixed(1) + '%'
        });
      }
    }
  }
});

console.log(`Checked ${files.length} files.`);
console.log(`Found ${report.length} files that are significantly smaller in active directory:`);
console.table(report);
