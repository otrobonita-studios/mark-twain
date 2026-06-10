const fs = require('fs');
const doc = JSON.parse(fs.readFileSync('e:/development/mark-twain/src/data/books/json/Hadleyberg-Stories-et-al.json', 'utf8'));
const section = doc.sections.find(s => s.id === 'chapter-2');
console.log('Section title:', JSON.stringify(section.title));
const block = section.blocks[0];
console.log('Block text:', JSON.stringify(block.text));

const cleanBlockText = (block.text || '').replace(/[.\s]/g, '').toLowerCase();
const cleanSectionTitle = (section.title || '').replace(/[.\s]/g, '').toLowerCase();
console.log('cleanBlockText:', JSON.stringify(cleanBlockText));
console.log('cleanSectionTitle:', JSON.stringify(cleanSectionTitle));
console.log('Match:', cleanBlockText === cleanSectionTitle);
