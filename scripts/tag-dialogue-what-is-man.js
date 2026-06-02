const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/books/What-Is-Man-And-Others.html');

function main() {
  let html = fs.readFileSync(filePath, 'utf8');
  
  let count = 0;
  
  // Match <p ...> and check its content
  const pRegex = /<p([^>]*)>([\s\S]*?)<\/p>/gi;
  
  const updatedHtml = html.replace(pRegex, (match, attrs, content) => {
    const trimmedText = content.replace(/<[^>]+>/g, '').trim();
    
    // Check if it starts with O.M., Y.M., Old Man., or Young Man.
    const isOM = /^(?:O\.M\.|Old\s+Man\.)/i.test(trimmedText);
    const isYM = /^(?:Y\.M\.|Young\s+Man\.)/i.test(trimmedText);
    
    if (isOM || isYM) {
      if (attrs.includes('conversation-line')) {
        return match; // Already tagged
      }
      
      count++;
      let newAttrs = attrs;
      if (attrs.includes('class=')) {
        newAttrs = attrs.replace(/class="([^"]*)"/i, 'class="$1 conversation-line"');
      } else {
        newAttrs = attrs + ' class="conversation-line"';
      }
      return `<p${newAttrs}>${content}</p>`;
    }
    
    return match;
  });
  
  if (count > 0) {
    fs.writeFileSync(filePath, updatedHtml, 'utf8');
    console.log(`Successfully tagged ${count} dialogue lines in What-Is-Man-And-Others.html!`);
  } else {
    console.log("No new dialogue lines to tag.");
  }
}

main();
