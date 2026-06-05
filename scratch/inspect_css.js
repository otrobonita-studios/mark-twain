const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../src/app/globals.css');
const content = fs.readFileSync(cssPath, 'utf8');
const lines = content.split('\n');

console.log("Searching for '@import' in globals.css:");
lines.forEach((line, idx) => {
  if (line.includes('@import')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
