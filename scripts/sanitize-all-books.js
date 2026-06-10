const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');

function sanitizeFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if there are any matches of "nigger" (case-insensitive)
  if (!/nigger/i.test(content)) {
    return false; // Skip if no occurrences
  }
  
  console.log(`Processing: ${path.basename(filePath)}`);
  
  // Use intermediate unique placeholders to avoid double-replacement and order of precedence
  content = content
    .replace(/nigger's/g, '__NIGGER_POSSESSIVE__')
    .replace(/Nigger's/g, '__NIGGER_CAP_POSSESSIVE__')
    .replace(/niggers'/g, '__NIGGERS_PLURAL_POSSESSIVE__')
    .replace(/Niggers'/g, '__NIGGERS_CAP_PLURAL_POSSESSIVE__')
    .replace(/niggers/g, '__NIGGERS_PLURAL__')
    .replace(/Niggers/g, '__NIGGERS_CAP_PLURAL__')
    .replace(/nigger/g, '__NIGGER_SINGULAR__')
    .replace(/Nigger/g, '__NIGGER_CAP_SINGULAR__')
    .replace(/NIGGERS/g, '__NIGGERS_ALL_CAP__')
    .replace(/NIGGER/g, '__NIGGER_ALL_CAP__');

  // Replace intermediates with final curly brace variables
  content = content
    .replace(/__NIGGER_POSSESSIVE__/g, '{var_nword_possessive}')
    .replace(/__NIGGER_CAP_POSSESSIVE__/g, "{var_Nword}'s")
    .replace(/__NIGGERS_PLURAL_POSSESSIVE__/g, "{var_nwords}'")
    .replace(/__NIGGERS_CAP_PLURAL_POSSESSIVE__/g, "{var_Nwords}'")
    .replace(/__NIGGERS_PLURAL__/g, '{var_nwords}')
    .replace(/__NIGGERS_CAP_PLURAL__/g, '{var_Nwords}')
    .replace(/__NIGGER_SINGULAR__/g, '{var_nword}')
    .replace(/__NIGGER_CAP_SINGULAR__/g, '{var_Nword}')
    .replace(/__NIGGERS_ALL_CAP__/g, '{var_Nwords}')
    .replace(/__NIGGER_ALL_CAP__/g, '{var_Nword}');

  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function runSanitization() {
  const files = fs.readdirSync(booksDir);
  let processedCount = 0;
  
  files.forEach(file => {
    const fullPath = path.join(booksDir, file);
    if (fs.statSync(fullPath).isFile() && file.endsWith('.html')) {
      const result = sanitizeFile(fullPath);
      if (result) {
        processedCount++;
      }
    }
  });
  
  console.log(`Successfully sanitized ${processedCount} files!`);
}

runSanitization();
