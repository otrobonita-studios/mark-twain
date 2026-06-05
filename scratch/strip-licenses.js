const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, '../src/data/books'),
  path.join(__dirname, '../rag/data-collection/TwainCorpus/converted')
];

// Helper to remove any <div> block (up to 2000 chars) that contains a target substring
function stripDivsContaining(content, substring) {
  let index = 0;
  while (true) {
    const nextDiv = content.indexOf('<div', index);
    if (nextDiv === -1) break;
    
    const closeBracket = content.indexOf('>', nextDiv);
    if (closeBracket === -1) {
      index = nextDiv + 4;
      continue;
    }
    
    // Count nested divs to find the matching closing tag
    let openTags = 1;
    let searchIndex = closeBracket + 1;
    let foundMatchingClose = false;
    
    while (searchIndex < content.length) {
      const nextOpen = content.indexOf('<div', searchIndex);
      const nextClose = content.indexOf('</div>', searchIndex);
      
      if (nextClose === -1) {
        break;
      }
      
      if (nextOpen !== -1 && nextOpen < nextClose) {
        openTags++;
        searchIndex = nextOpen + 4;
      } else {
        openTags--;
        searchIndex = nextClose + 6;
        if (openTags === 0) {
          foundMatchingClose = true;
          break;
        }
      }
    }
    
    // If matching close was not found (unbalanced divs in Wikisource source),
    // align searchIndex to the last </div> before </body> or </html> to protect them.
    if (!foundMatchingClose) {
      const bodyEnd = content.indexOf('</body>');
      const limitIndex = bodyEnd !== -1 ? bodyEnd : content.length;
      const lastClose = content.lastIndexOf('</div>', limitIndex);
      if (lastClose !== -1 && lastClose > nextDiv) {
        searchIndex = lastClose + 6;
      } else {
        index = nextDiv + 4;
        continue;
      }
    }
    
    const block = content.substring(nextDiv, searchIndex);
    if (block.includes(substring) && block.length < 2000) {
      // Remove this block
      content = content.substring(0, nextDiv) + content.substring(searchIndex);
      // Remain at nextDiv since the content shifted
      index = nextDiv;
    } else {
      index = nextDiv + 4;
    }
  }
  return content;
}

function cleanFile(filePath) {
  const filename = path.basename(filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Remove divs containing Wikisource license classes/patterns
  content = stripDivsContaining(content, 'licenseContainer');
  content = stripDivsContaining(content, 'licensetpl');
  
  // 2. Remove divs containing specific license descriptions
  content = stripDivsContaining(content, 'This work was published in');
  content = stripDivsContaining(content, 'This work was published before');
  content = stripDivsContaining(content, 'This work is in the');
  
  // 3. Remove divs containing flag images or public domain icons
  content = stripDivsContaining(content, 'Flag_of_the_United_States');
  content = stripDivsContaining(content, 'PD-icon.svg');

  // 4. Clean up comments and parser metadata
  content = content.replace(/<!--\s*NewPP limit report[\s\S]*?-->/gi, '');
  content = content.replace(/<!--\s*Transclusion expansion time report[\s\S]*?-->/gi, '');
  content = content.replace(/<!--\s*Render ID[\s\S]*?-->/gi, '');
  content = content.replace(/<!--\s*Saved in parser cache[\s\S]*?-->/gi, '');

  content = content.trim();

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[Cleaned] ${filename}`);
    return true;
  }
  return false;
}

function main() {
  let cleanedCount = 0;
  let totalCount = 0;

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`Directory does not exist: ${dir}`);
      continue;
    }
    
    console.log(`Scanning directory: ${dir}`);
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file.endsWith('.html')) {
        const fullPath = path.join(dir, file);
        const wasCleaned = cleanFile(fullPath);
        if (wasCleaned) cleanedCount++;
        totalCount++;
      }
    }
  }

  console.log(`\nScan complete. Cleaned licenses/comments from ${cleanedCount} out of ${totalCount} HTML files.`);
}

main();
