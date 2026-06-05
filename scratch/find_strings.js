const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../src/app/globals.css');
const content = fs.readFileSync(cssPath, 'utf8');
const lines = content.split('\n');

console.log("Searching for 'experience-card' in globals.css:");
lines.forEach((line, idx) => {
  if (line.includes('experience-card')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
