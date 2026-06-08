const fs = require('fs');
const path = require('path');

const filePath = 'e:/development/mark-twain/src/data/books/Huckleberry-Finn.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove Table of Contents
const startTag = '  <div class="h3">(Tom Sawyer\'s Comrade)</div>';
const startIndex = content.indexOf(startTag);

const illustrationsTag = '<div class="chapter"> <h2>ILLUSTRATIONS.</h2>';
const endIndex = content.indexOf(illustrationsTag);

if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
  console.log('TOC successfully removed.');
} else {
  console.log('Error: Could not locate TOC bounds.');
}

// 2. Clean the notice line
content = content.replace(/BY ORDER OF THE AUTHORÂ Â Â Â Â Â Â Â Â Â Â Â Â Â Â Â <br>/g, 'BY ORDER OF THE AUTHOR<br>');

// 3. Centered TIME AND PLACE block (regex is immune to CRLF/LF newlines)
const oldBlockRegex = /<div class="chapter">\s*<h2>HUCKLEBERRY FINN<\/h2>\s*<p>\s*Scene: The Mississippi Valley Time: Forty to fifty years ago\s*<\/p>\s*<div class="fig" style="width:60%">\s*<img alt="" src="\/images\/book-illustrations\/Huckleberry_Finn\/images\/frontispiece2.jpg"\s*style="width:100%;">\s*<\/div>\s*<div class="fig" style="width:60%">\s*<a id="c01-02"><\/a>\s*<img alt="" src="\/images\/book-illustrations\/Huckleberry_Finn\/images\/c01-02.jpg" style="width:100%;">\s*<\/div>\s*<\/div><!--end chapter-->/i;

const newBlock = `<div class="chapter">

<h2 id="chapter-2">TIME AND PLACE</h2>

<p class="text-center">
Scene: The Mississippi Valley Time: 1830s–40s
</p>

</div><!--end chapter-->`;

if (oldBlockRegex.test(content)) {
  content = content.replace(oldBlockRegex, newBlock);
  console.log('TIME AND PLACE block successfully updated.');
} else {
  console.log('Warning: TIME AND PLACE block regex did not match.');
}

// 4. Replace the n-word forms using unique intermediate placeholders to avoid double-replacement
content = content
  .replace(/nigger's/g, '__NIGGER_POSSESSIVE__')
  .replace(/niggers/g, '__NIGGERS_PLURAL__')
  .replace(/Niggers/g, '__NIGGERS_CAP_PLURAL__')
  .replace(/nigger/g, '__NIGGER_SINGULAR__')
  .replace(/Nigger/g, '__NIGGER_CAP_SINGULAR__');

// Replace intermediates with final curly brace variables
content = content
  .replace(/__NIGGER_POSSESSIVE__/g, '{var_nigger_possessive}')
  .replace(/__NIGGERS_PLURAL__/g, '{var_niggers}')
  .replace(/__NIGGERS_CAP_PLURAL__/g, '{var_Niggers}')
  .replace(/__NIGGER_SINGULAR__/g, '{var_nigger}')
  .replace(/__NIGGER_CAP_SINGULAR__/g, '{var_Nigger}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('All replacements and fixes applied.');
