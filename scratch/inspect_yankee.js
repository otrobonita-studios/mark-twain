const fs = require('fs');
const path = require('path');

const filePath = 'e:/development/mark-twain/src/data/books/Connecticut-Yankee.html';
const content = fs.readFileSync(filePath, 'utf8');

function findOccurrences(pattern, isRegex = false) {
  const matches = [];
  if (isRegex) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      matches.push(match.index);
    }
  } else {
    let index = 0;
    while (true) {
      const idx = content.toLowerCase().indexOf(pattern.toLowerCase(), index);
      if (idx === -1) break;
      matches.push(idx);
      index = idx + pattern.length;
    }
  }
  return matches;
}

console.log("--- TABLE OCCURRENCES ---");
const tableIndices = findOccurrences('<table');
tableIndices.forEach((idx, i) => {
  console.log(`Table ${i+1} at index ${idx}:`);
  console.log(content.substring(idx - 100, idx + 400));
  console.log("------------------------");
});

console.log("\n--- CONTENTS OCCURRENCES ---");
const contentsIndices = findOccurrences('contents');
contentsIndices.forEach((idx, i) => {
  console.log(`Contents ${i+1} at index ${idx}:`);
  console.log(content.substring(idx - 50, idx + 200));
  console.log("------------------------");
});
