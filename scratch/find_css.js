const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../src/app/globals.css');
const css = fs.readFileSync(cssPath, 'utf8');

const lines = css.split('\n');
console.log("Searching for 'in-paragraph-img' in globals.css:");
lines.forEach((line, index) => {
  if (line.includes('in-paragraph-img')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});

console.log("\nSearching for 'circle-img-wrapper' in globals.css:");
lines.forEach((line, index) => {
  if (line.includes('circle-img-wrapper')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
