const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
const content = fs.readFileSync(filePath, 'utf8');

// Run the replacement
const regex = /<p>\s*&ldquo;([\s\S]*?)&rdquo;\s*<\/p>/gi;
let matchCount = 0;
const modified = content.replace(regex, (match, pText) => {
  matchCount++;
  console.log(`Match ${matchCount}: ${match.trim()} => <p class="conversation-line">&ldquo;${pText.trim()}&rdquo;</p>`);
  return `<p class="conversation-line">&ldquo;${pText.trim()}&rdquo;</p>`;
});

console.log(`\nTotal matches made: ${matchCount}`);
