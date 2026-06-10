// scratch/view_bequest_sections.js
const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '../src/data/books/json/The-30000-Bequest-and-Others.json');
const doc = JSON.parse(fs.readFileSync(filepath, 'utf8'));

const sections = doc.sections.map(s => ({ id: s.id, title: s.title }));
console.log("Sections in Bequest JSON:", sections);
