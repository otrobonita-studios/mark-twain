const fs = require('fs');
const content = fs.readFileSync('e:/development/mark-twain/src/data/books/Huckleberry-Finn.html', 'utf8');

// Find the first few chapter divs
let pos = 0;
for (let i = 0; i < 8; i++) {
  const start = content.indexOf('<div class="chapter"', pos);
  if (start === -1) break;
  const end = content.indexOf('</div><!--end chapter-->', start);
  if (end === -1) break;
  console.log(`--- Chapter Div ${i} ---`);
  console.log(content.substring(start, start + 400));
  pos = end + 24;
}
