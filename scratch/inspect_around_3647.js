const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/data/books/Volume-1.html');
const content = fs.readFileSync(file, 'utf8');

const pos = 204695;
console.log('HTML from 1500 chars before to 300 chars after position 204695:');
console.log(content.substring(pos - 1500, pos + 300));
