const fs = require('fs');
const path = require('path');

const booksDir = 'e:/development/mark-twain/src/data/books';
const file = 'Hadleyberg-Stories-et-al.html';
const filePath = path.join(booksDir, file);

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

console.log(`Cleaning up corrupted quotes/dashes in ${file}...`);
const content = fs.readFileSync(filePath, 'utf8');

// Replacements:
// 1. "™ -> ’ (\u2019)
// 2. "” -> — (\u2014)
// 3. "\x9D -> ” (\u201d)
// 4. "˜ -> ‘ (\u2018)

let newContent = content;

const count1 = (newContent.split('"™').length - 1);
newContent = newContent.replace(/"™/g, '’');

const count2 = (newContent.split('"”').length - 1);
newContent = newContent.replace(/"”/g, '—');

const char157 = String.fromCharCode(157);
const count3 = (newContent.split('"' + char157).length - 1);
newContent = newContent.replace(new RegExp('"' + char157, 'g'), '”');

const count4 = (newContent.split('"˜').length - 1);
newContent = newContent.replace(/"˜/g, '‘');

fs.writeFileSync(filePath, newContent, 'utf8');

console.log('Cleanup complete!');
console.log(`- Replaced ${count1} instances of '"™' with '’'`);
console.log(`- Replaced ${count2} instances of '"”' with '—'`);
console.log(`- Replaced ${count3} instances of '"\\x9D' with '”'`);
console.log(`- Replaced ${count4} instances of '"˜' with '‘'`);
