const fs = require('fs');
const path = require('path');

const filePath = 'e:/development/mark-twain/src/data/books/Huckleberry-Finn.html';
let content = fs.readFileSync(filePath, 'utf8');

// Perform substring replacements in order of specificity
content = content
  .replace(/nigger's/g, '{var_nigger_possessive}')
  .replace(/niggers/g, '{var_niggers}')
  .replace(/Niggers/g, '{var_Niggers}')
  .replace(/nigger/g, '{var_nigger}')
  .replace(/Nigger/g, '{var_Nigger}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replacement complete.');
