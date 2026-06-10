// scratch/find_headings_lines.js
const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '../src/data/books/The-30000-Bequest-and-Others.html');
const lines = fs.readFileSync(filepath, 'utf8').split('\n');

const targets = [
  "A DOG'S TALE",
  "A TELEPHONIC CONVERSATION",
  "EVE'S DIARY",
  "A BURLESQUE BIOGRAPHY",
  "HOW TO TELL A STORY"
];

targets.forEach(target => {
  console.log(`=== Searching for: ${target} ===`);
  lines.forEach((line, index) => {
    if (line.toUpperCase().includes(target)) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
});
