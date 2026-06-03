const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  path.join(__dirname, '../src/data/books/Eves-Diary.html'),
  path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eves-Diary.html')
];

filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = content.replace(/\/images\/eves-diary\//g, '/images/book-illustrations/eves-diary/');
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Successfully updated image paths in ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
