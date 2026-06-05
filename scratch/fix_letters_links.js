const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '../src/data/books/Letters.html');
let content = fs.readFileSync(filepath, 'utf8');

// Replace Gutenberg URLs with local paths
content = content.replace(/https:\/\/www\.gutenberg\.org\/files\/3194\/3194-h\/3194-h\.htm#/g, '/read/Volume-2#');
content = content.replace(/https:\/\/www\.gutenberg\.org\/files\/3195\/3195-h\/3195-h\.htm#/g, '/read/Volume-3#');
content = content.replace(/https:\/\/www\.gutenberg\.org\/files\/3196\/3196-h\/3196-h\.htm#/g, '/read/Volume-4#');
content = content.replace(/https:\/\/www\.gutenberg\.org\/files\/3197\/3197-h\/3197-h\.htm#/g, '/read/Volume-5#');
content = content.replace(/https:\/\/www\.gutenberg\.org\/files\/3198\/3198-h\/3198-h\.htm#/g, '/read/Volume-6#');

fs.writeFileSync(filepath, content, 'utf8');
console.log("Successfully converted Gutenberg links in Letters.html to local routes!");
