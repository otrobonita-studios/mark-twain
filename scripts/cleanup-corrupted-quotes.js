const fs = require('fs');
const path = require('path');

const booksDir = 'e:/development/mark-twain/src/data/books';
const htmlFile = 'Hadleyberg-Stories-et-al.html';
const jsonFile = 'json/Hadleyberg-Stories-et-al.json';

const htmlPath = path.join(booksDir, htmlFile);
const jsonPath = path.join(booksDir, jsonFile);

// Fix HTML
if (fs.existsSync(htmlPath)) {
  console.log(`Cleaning up corrupted quotes/dashes in ${htmlFile}...`);
  const content = fs.readFileSync(htmlPath, 'utf8');
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

  fs.writeFileSync(htmlPath, newContent, 'utf8');

  console.log('HTML cleanup complete!');
  console.log(`- Replaced ${count1} instances of '"™' with '’'`);
  console.log(`- Replaced ${count2} instances of '"”' with '—'`);
  console.log(`- Replaced ${count3} instances of '"\\x9D' with '”'`);
  console.log(`- Replaced ${count4} instances of '"˜' with '‘'`);
} else {
  console.error(`HTML File not found: ${htmlPath}`);
}

// Fix JSON
if (fs.existsSync(jsonPath)) {
  console.log(`\nCleaning up corrupted quotes/dashes in ${jsonFile}...`);
  const content = fs.readFileSync(jsonPath, 'utf8');
  let newContent = content;

  const count1 = (newContent.split('\\"™').length - 1);
  newContent = newContent.replace(/\\\"™/g, '’');

  const count2 = (newContent.split('\\"”').length - 1);
  newContent = newContent.replace(/\\\"”/g, '—');

  const char157 = String.fromCharCode(157);
  const count3 = (newContent.split('\\"' + char157).length - 1);
  newContent = newContent.replace(new RegExp('\\\\"' + char157, 'g'), '”');

  const count4 = (newContent.split('\\"˜').length - 1);
  newContent = newContent.replace(/\\\"˜/g, '‘');

  fs.writeFileSync(jsonPath, newContent, 'utf8');

  console.log('JSON cleanup complete!');
  console.log(`- Replaced ${count1} instances of '\\"™' with '’'`);
  console.log(`- Replaced ${count2} instances of '\\"”' with '—'`);
  console.log(`- Replaced ${count3} instances of '\\"\\x9D' with '”'`);
  console.log(`- Replaced ${count4} instances of '\\"˜' with '‘'`);
} else {
  console.error(`JSON File not found: ${jsonPath}`);
}

