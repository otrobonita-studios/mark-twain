// scratch/view_alonzo_end.js
const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '../src/data/books/The-Loves-of-Alonzo-Fitz.html');
const content = fs.readFileSync(filepath, 'utf8');

console.log("End of Alonzo Fitz:", content.substring(content.length - 800));
