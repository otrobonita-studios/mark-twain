const fs = require('fs');
const path = require('path');

const filePath = 'e:/development/mark-twain/src/data/books/Huckleberry-Finn.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Clean the notice line
content = content.replace(/BY ORDER OF THE AUTHORÂ Â Â Â Â Â Â Â Â Â Â Â Â Â Â Â <br>/g, 'BY ORDER OF THE AUTHOR<br>');

// 2. Centered TIME AND PLACE block
const oldTimePlace = `<div class="chapter">

<h2>HUCKLEBERRY FINN</h2>

<p>
Scene: The Mississippi Valley Time: Forty to fifty years ago
</p>

<div class="fig" style="width:60%">
<img alt="" src="/images/book-illustrations/Huckleberry_Finn/images/frontispiece2.jpg"
style="width:100%;">
</div>

<div class="fig" style="width:60%">
<a id="c01-02"></a>
<img alt="" src="/images/book-illustrations/Huckleberry_Finn/images/c01-02.jpg" style="width:100%;">
</div>

</div><!--end chapter-->`;

const newTimePlace = `<div class="chapter">

<h2 id="chapter-2">TIME AND PLACE</h2>

<p class="text-center">
Scene: The Mississippi Valley Time: 1830s–40s
</p>

</div><!--end chapter-->`;

content = content.replace(oldTimePlace, newTimePlace);

// 3. Replace the n-word forms using unique intermediate placeholders to avoid double-replacement
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
console.log('Correct replacement completed successfully.');
