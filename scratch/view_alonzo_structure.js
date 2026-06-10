// scratch/view_alonzo_structure.js
const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '../src/data/books/The-Loves-of-Alonzo-Fitz.html');
const content = fs.readFileSync(filepath, 'utf8');

// Print 200 characters around the index of first H2 headings
const headings = [
  'THE LOVES OF ALONZO FITZ CLARENCE AND ROSANNAH ETHELTON',
  'ON THE DECAY OF THE ART OF LYING'
];

headings.forEach(heading => {
  const idx = content.indexOf(heading);
  if (idx !== -1) {
    console.log(`=== ${heading} ===`);
    console.log(content.substring(idx - 100, idx + 400));
  }
});
