const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/data/books');
const files = fs.readdirSync(dir);

let modifiedCount = 0;

files.forEach(file => {
  if (!file.endsWith('.html')) return;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Clean Title Tag (supports optional comma before 'by')
  content = content.replace(/<title>The Project Gutenberg eBook of (.*?),?\s*by\s*(.*?)<\/title>/gi, '<title>$1, by $2</title>');
  content = content.replace(/<title>The Project Gutenberg Book of (.*?),?\s*by\s*(.*?)<\/title>/gi, '<title>$1, by $2</title>');
  content = content.replace(/<title>(.*?)\s*\|\s*Project Gutenberg<\/title>/gi, '<title>$1</title>');
  content = content.replace(/<title>Project Gutenberg's\s*(.*?)<\/title>/gi, '<title>$1</title>');

  // 2. Clean JSON-LD metadata dynamically
  content = content.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi, (match, jsonText) => {
    try {
      const data = JSON.parse(jsonText.trim());
      
      const cleanObject = (obj) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            let val = obj[key];
            
            // Remove Gutenberg prefixes
            val = val.replace(/The Project Gutenberg eBook of (.*?),?\s*by\s*(.*?)/gi, '$1, by $2');
            val = val.replace(/The Project Gutenberg Book of (.*?),?\s*by\s*(.*?)/gi, '$1, by $2');
            val = val.replace(/(.*?)\s*\|\s*Project Gutenberg/gi, '$1');
            val = val.replace(/Project Gutenberg's\s*(.*?)/gi, '$1');
            
            // Clean large boilerplate notices (e.g. illustrator names containing Gutenberg licenses)
            if (val.includes('Project Gutenberg License') || val.includes('www.gutenberg.org') || val.includes('PROJECT GUTENBERG EBOOK')) {
              const lines = val.split('\n');
              if (lines.length > 0) {
                // Keep the first line if it looks like a clean name/info, otherwise empty it
                const firstLine = lines[0].trim();
                if (firstLine && !firstLine.toLowerCase().includes('gutenberg') && !firstLine.toLowerCase().includes('ebook')) {
                  val = firstLine;
                } else {
                  val = '';
                }
              } else {
                val = '';
              }
            }
            obj[key] = val;
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            cleanObject(obj[key]);
          }
        }
      };
      
      cleanObject(data);
      return `<script type="application/ld+json">\n${JSON.stringify(data, null, 4)}\n</script>`;
    } catch (err) {
      return match;
    }
  });

  // 3. Clean body header div (with or without trailing <hr />)
  content = content.replace(/<div style=['"]text-align:\s*center;\s*font-size:\s*1\.2em;\s*font-weight:\s*bold['"]>The Project Gutenberg eBook of (.*?),?\s*by\s*(.*?)<\/div>(\s*<hr\s*\/?>)?/gi, '');

  // 4. Clean start-of-book headers (like in Eves-Diary.html)
  content = content.replace(/<pre xml:space="preserve">\s*Project Gutenberg's[\s\S]*?\*\*\* START OF THIS PROJECT GUTENBERG EBOOK[\s\S]*?<\/pre>(\s*<p>\s*<\/p>\s*<hr\s*\/?>)?/gi, '');

  // 5. Clean transcribed by paragraphs containing Gutenberg email/references (like in Captain-Stormfield's-Vist-to-Heaven.html)
  content = content.replace(/<p>Transcribed by[\s\S]*?pglaf\.org<\/p>/gi, '');
  content = content.replace(/<p>Transcribed by[\s\S]*?gutenberg\.org<\/p>/gi, '');

  // 6. Clean Gutenberg license / footer sections
  
  // Pattern A: Tragedy of Pudd'nhead Wilson (Transcriber's Notes)
  const puddnheadMatchIdx = content.search(/<hr\s*\/?>\s*<div class="chapterhead">\s*<br\s*\/?>\s*<br\s*\/?>\s*<br\s*\/?>\s*<br\s*\/?>\s*<h2><a href="#Contents">Transcriber's Notes<\/a><\/h2>/i);
  if (puddnheadMatchIdx !== -1) {
    const before = content.substring(0, puddnheadMatchIdx);
    const bodyEndIdx = content.lastIndexOf('</body>');
    const after = bodyEndIdx !== -1 ? content.substring(bodyEndIdx) : '</body></html>';
    content = before + '\n' + after;
  }

  // Pattern B: Eves Diary (pre block at end)
  const evesDiaryMatchIdx = content.search(/<pre xml:space="preserve">\s*End of the Project Gutenberg EBook/i);
  if (evesDiaryMatchIdx !== -1) {
    const before = content.substring(0, evesDiaryMatchIdx);
    const bodyEndIdx = content.lastIndexOf('</body>');
    const after = bodyEndIdx !== -1 ? content.substring(bodyEndIdx) : '</body></html>';
    content = before + '\n' + after;
  }

  // Pattern C: Standard Gutenberg footer block (<div style='text-align:left'> ... Updated editions will replace)
  const startDivIdxs = [];
  let index = 0;
  while (true) {
    const idx = content.indexOf('<div style=', index);
    if (idx === -1) break;
    if (content.substring(idx, idx + 50).includes('text-align:left')) {
      startDivIdxs.push(idx);
    }
    index = idx + 11;
  }

  if (startDivIdxs.length > 0) {
    const footerDivIdx = startDivIdxs.find(idx => {
      const block = content.substring(idx, idx + 2000);
      return block.includes('Updated editions will replace') || block.includes('Project Gutenberg') || block.includes('royalty fee');
    });

    if (footerDivIdx !== undefined) {
      const before = content.substring(0, footerDivIdx);
      const bodyEndIdx = content.lastIndexOf('</body>');
      const after = bodyEndIdx !== -1 ? content.substring(bodyEndIdx) : '</body></html>';
      content = before + '\n' + after;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[Cleaned Gutenberg] ${file}`);
    modifiedCount++;
  }
});

console.log(`\nCleanup complete. Modified ${modifiedCount} files.`);
