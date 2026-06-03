const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');

function main() {
  const files = fs.readdirSync(booksDir);
  for (const file of files) {
    if (file.endsWith('.html')) {
      const lower = file.toLowerCase();
      if (lower === 'eves-diary.html' || lower === 'evesdiary.html') continue;
      
      const filePath = path.join(booksDir, file);
      const html = fs.readFileSync(filePath, 'utf8');
      
      const bodyStart = html.indexOf('<body>');
      const bodyEnd = html.lastIndexOf('</body>');
      if (bodyStart === -1 || bodyEnd === -1) continue;
      
      let bodyContent = html.substring(bodyStart + 6, bodyEnd).trim();
      
      // Strip book-title-block if present
      if (bodyContent.includes('class="book-title-block"')) {
        const titleBlockEnd = bodyContent.indexOf('</div >');
        const standardEnd = bodyContent.indexOf('</div>');
        const endPos = Math.max(titleBlockEnd, standardEnd);
        if (endPos !== -1) {
          const afterBlock = bodyContent.substring(endPos + 6).trim();
          if (afterBlock.startsWith('<hr') || afterBlock.startsWith('<hr />') || afterBlock.startsWith('<hr>')) {
            const hrEnd = afterBlock.indexOf('>') + 1;
            bodyContent = afterBlock.substring(hrEnd).trim();
          } else {
            bodyContent = afterBlock;
          }
        }
      }
      
      // Extract the first 3000 chars of the actual text
      const topSection = bodyContent.substring(0, 3000);
      
      // Find all heading elements: h1, h2, h3, h4
      const headings = [];
      const headingRegex = /<(h1|h2|h3|h4)[^>]*>([\s\S]*?)<\/\1>/gi;
      let match;
      while ((match = headingRegex.exec(topSection)) !== null) {
        headings.push({
          tag: match[1],
          text: match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
        });
      }
      
      if (headings.length > 0) {
        console.log(`=== Book: ${file} ===`);
        headings.forEach(h => {
          console.log(`  [${h.tag.toUpperCase()}] ${h.text}`);
        });
      }
    }
  }
}

main();
