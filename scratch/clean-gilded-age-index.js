const fs = require('fs');
const path = require('path');

const filePath = 'e:/development/mark-twain/src/data/books/A-Gilded-Age.html';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '<h3> Part 1. </h3>';
const endAnchor = '<a name="p017" id="p017"></a>';

const startIndex = content.indexOf(startMarker);
const anchorIndex = content.indexOf(endAnchor);

if (startIndex === -1 || anchorIndex === -1) {
  console.error('Error: Could not find markers in file.');
  process.exit(1);
}

// Find the next closing </p> tag after anchorIndex
const pCloseIndex = content.indexOf('</p>', anchorIndex);
if (pCloseIndex === -1) {
  console.error('Error: Could not find closing paragraph tag after anchor.');
  process.exit(1);
}

console.log('Found start marker at index:', startIndex);
console.log('Found anchor at index:', anchorIndex);
console.log('Found closing </p> at index:', pCloseIndex);

// We keep the startMarker and the end anchor.
const newContent = 
  content.substring(0, startIndex + startMarker.length) + 
  '\n' + 
  endAnchor + 
  content.substring(pCloseIndex + 4);

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully updated A-Gilded-Age.html without orphaned paragraph tags!');
