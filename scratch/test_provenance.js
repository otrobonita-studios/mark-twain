// scratch/test_provenance.js
const fs = require('fs');
const path = require('path');
const { storyProvenance } = require('../src/data/provenance.js');

const jsonPath = path.join(__dirname, '../src/data/books/json/A-Telephonic-Conversation.json');
const doc = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const normalizeTitle = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/['’"““”.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const title = doc.meta.title;
const normalized = normalizeTitle(title);
const match = storyProvenance[normalized];

console.log("Original Title:", JSON.stringify(title));
console.log("Normalized:", JSON.stringify(normalized));
console.log("Registry Keys:", Object.keys(storyProvenance));
console.log("Match Found:", !!match);
if (match) {
  console.log("Match Details:", JSON.stringify(match, null, 2));
}
