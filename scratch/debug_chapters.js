const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../rag/data-collection/TwainCorpus/HTML/What-Is-Man-And-Others.html');
const content = fs.readFileSync(filePath, 'utf8');

const targetIdx = 166992;
console.log('--- BEFORE chap02 ---');
console.log(content.substring(targetIdx - 300, targetIdx));
console.log('--- AFTER chap02 ---');
console.log(content.substring(targetIdx, targetIdx + 500));
