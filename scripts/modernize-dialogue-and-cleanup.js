const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');

// Add class="conversation-line" safely to paragraph attributes
function addConversationClass(attrs) {
  if (!attrs) {
    return ' class="conversation-line"';
  }
  if (attrs.includes('class=')) {
    if (attrs.includes('conversation-line')) {
      return attrs;
    }
    return attrs.replace(/class=["']([^"']*)["']/i, 'class="$1 conversation-line"');
  } else {
    return attrs + ' class="conversation-line"';
  }
}

// Robust single-to-double curly quote converter
function processParagraphQuotes(html) {
  // Tokenize HTML into tags and text content
  const tokens = [];
  let tagRegex = /<[^>]+>/g;
  let lastIndex = 0;
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: html.substring(lastIndex, match.index) });
    }
    tokens.push({ type: 'tag', content: match[0] });
    lastIndex = tagRegex.lastIndex;
  }
  if (lastIndex < html.length) {
    tokens.push({ type: 'text', content: html.substring(lastIndex) });
  }

  // Extract full text content and record mappings
  let fullText = '';
  const mappings = []; // mappings[charIndex] = { tokenIndex, charIndexInToken }
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'text') {
      const content = tokens[i].content;
      for (let j = 0; j < content.length; j++) {
        mappings.push({ tokenIndex: i, charIndexInToken: j });
        fullText += content[j];
      }
    }
  }

  const trimmedText = fullText.trim();
  const startsWithQuote = /^['‘’]/.test(trimmedText);
  const quoteMatches = fullText.match(/['‘’]/g);
  const totalQuotes = quoteMatches ? quoteMatches.length : 0;

  // We only run this on paragraphs that start with a single quote and contain at least one other single quote
  if (!startsWithQuote || totalQuotes < 2) {
    return { modified: false, html };
  }

  // Replace quotes in fullText
  let chars = fullText.split('');
  let isFirstQuote = true;
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === "'" || chars[i] === '‘' || chars[i] === '’') {
      if (isFirstQuote) {
        chars[i] = '“';
        isFirstQuote = false;
        continue;
      }

      const prevChar = i > 0 ? chars[i - 1] : '';
      const nextChar = i < chars.length - 1 ? chars[i + 1] : '';

      // Check context to see if it is an opening quote, closing quote, or apostrophe
      // An opening quote is preceded by space, or punctuation-space
      const isPrecededByPuncSpace = i === 0 || 
                                   (i > 1 && chars[i - 1] === ' ' && /[,\.\?!\-;:]/.test(chars[i - 2])) || 
                                   (i > 0 && /[,\.\?!\-;:]/.test(chars[i - 1]));
      const isFollowedByWordChar = i < chars.length - 1 && /\w/.test(nextChar);

      if (isPrecededByPuncSpace && isFollowedByWordChar) {
        chars[i] = '“';
      } else {
        // Check if closing quote
        const isFollowedBySpaceOrEnd = i === chars.length - 1 || /\s/.test(nextChar) || /^[,\.\?!\-;:]/.test(nextChar);
        if (isFollowedBySpaceOrEnd) {
          chars[i] = '”';
        }
        // Otherwise, it is treated as an apostrophe/contraction and left unchanged
      }
    }
  }

  const newFullText = chars.join('');

  // Re-distribute newFullText back to tokens
  for (let i = 0; i < mappings.length; i++) {
    const map = mappings[i];
    const tok = tokens[map.tokenIndex];
    if (!tok.newContent) {
      tok.newContent = new Array(tok.content.length);
    }
    tok.newContent[map.charIndexInToken] = newFullText[i];
  }

  // Rebuild HTML
  let newHtml = '';
  for (const tok of tokens) {
    if (tok.type === 'tag') {
      newHtml += tok.content;
    } else {
      newHtml += tok.newContent ? tok.newContent.join('') : tok.content;
    }
  }

  return { modified: true, html: newHtml };
}

function processBook(filePath) {
  const filename = path.basename(filePath);
  let html = fs.readFileSync(filePath, 'utf8');
  let originalHtml = html;
  let hasChanges = false;

  // 1. Pudd'nhead Wilson specific cleanups
  if (filename === "Tragedy-of-Pudd'nhead-Wilson.html") {
    console.log(`Applying special cleanups for: ${filename}`);
    // Remove titlepage div and everything inside it
    const titlepageRegex = /<div class="titlepage">[\s\S]*?<\/div>/gi;
    if (titlepageRegex.test(html)) {
      html = html.replace(titlepageRegex, '');
      console.log(`  Removed copyright titlepage block.`);
      hasChanges = true;
    }
  }

  // 2. Joan of Arc specific cleanups
  if (filename === 'Recollections-of-Joan-of-Arc-I.html' || filename === 'Recollections-of-Joan-of-Arc-II.html') {
    console.log(`Applying special cleanups for: ${filename}`);
    // Remove divs containing only <br> (one or several)
    const emptyDivRegex = /<div[^>]*>\s*(?:<br\s*\/?>\s*)+\s*<\/div>/gi;
    if (emptyDivRegex.test(html)) {
      html = html.replace(emptyDivRegex, '');
      console.log(`  Removed empty spacer br-only divs.`);
      hasChanges = true;
    }

    // Convert h3 Chapter starting headers to h2 yellowish headers
    const h3ChapterRegex = /<h3>\s*(Chapter[\s\S]*?)<\/h3>/gi;
    if (h3ChapterRegex.test(html)) {
      html = html.replace(h3ChapterRegex, '<h2>$1</h2>');
      console.log(`  Converted h3 Chapter headers to h2.`);
      hasChanges = true;
    }
  }

  // 3. Connecticut Yankee specific Gutenberg cleanup
  if (filename === 'Connecticut-Yankee.html') {
    console.log(`Applying special cleanups for: ${filename}`);
    const originalCY = html;
    html = html.replace(/\*\*\*\s*START OF THE PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');
    html = html.replace(/\*\*\*\s*END OF THE PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');
    html = html.replace(/\*\*\*\s*START OF THIS PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');
    html = html.replace(/\*\*\*\s*END OF THIS PROJECT GUTENBERG[\s\S]*?\*\*\*/gi, '');
    if (html !== originalCY) {
      console.log(`  Cleaned residual Gutenberg *** markers.`);
      hasChanges = true;
    }
  }

  // 4. Clean Gutenberg prefixes in all title cards
  if (html.includes('book-title-block')) {
    const originalBlock = html;
    html = html.replace(/<h1>\s*THE PROJECT GUTENBERG EBOOK OF\s+([\s\S]*?)<\/h1>/gi, '<h1>$1</h1>');
    html = html.replace(/<h1>\s*THE PROJECT GUTENBERG BOOK OF\s+([\s\S]*?)<\/h1>/gi, '<h1>$1</h1>');
    html = html.replace(/<h1>\s*PROJECT GUTENBERG EBOOK OF\s+([\s\S]*?)<\/h1>/gi, '<h1>$1</h1>');
    html = html.replace(/<h1>\s*PROJECT GUTENBERG BOOK OF\s+([\s\S]*?)<\/h1>/gi, '<h1>$1</h1>');
    if (html !== originalBlock) {
      console.log(`  Cleaned Gutenberg prefix from title card h1.`);
      hasChanges = true;
    }
  }

  // 5. Dialogue processing for all paragraphs
  let dialogueCount = 0;
  let updatedParagraphsHtml = html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs, content) => {
    // For Mysterious-Stranger.html Q&A processing
    if (filename === 'Mysterious-Stranger.html') {
      const textContent = content.replace(/<[^>]+>/g, '').trim();
      const qaMatch = /^(QUESTION|ANSWER|Q|A)\.\s*([\s\S]*)/i.exec(textContent);
      if (qaMatch) {
        const label = qaMatch[1];
        const restOfText = qaMatch[2].trim();
        // Skip if already wrapped in quotes to prevent double wrapping
        if (!restOfText.startsWith('“') && !restOfText.startsWith('&ldquo;')) {
          dialogueCount++;
          const newAttrs = addConversationClass(attrs);
          // Preserve the original html markup inside restOfText if any existed
          const originalContentStripped = content.replace(/^\s*(QUESTION|ANSWER|Q|A)\.\s*/i, '').trim();
          return `<p${newAttrs}>${label}. “${originalContentStripped}”</p>`;
        }
      }
    }

    // Standard dialogue checks
    const trimmed = content.trim();
    const textContent = trimmed.replace(/<[^>]+>/g, '').trim();

    // Check if it starts with quote characters or entities
    const startsWithQuote = /^(“|&ldquo;|&#8220;|"|&quot;|&#34;|‘|&lsquo;|&#8216;|'|’)/.test(textContent);

    let finalAttrs = attrs;
    let finalContent = content;

    // Single-quote conversion logic
    if (startsWithQuote && (trimmed.startsWith("'") || trimmed.startsWith('‘') || trimmed.startsWith('’'))) {
      const res = processParagraphQuotes(content);
      if (res.modified) {
        finalContent = res.html;
        finalAttrs = addConversationClass(attrs);
        dialogueCount++;
      }
    }

    // General conversation class tagging if it starts with quote
    if (startsWithQuote) {
      if (!attrs.includes('conversation-line')) {
        finalAttrs = addConversationClass(finalAttrs);
        dialogueCount++;
      }
    }

    return `<p${finalAttrs}>${finalContent}</p>`;
  });

  if (updatedParagraphsHtml !== html) {
    html = updatedParagraphsHtml;
    console.log(`  Processed ${dialogueCount} dialogue lines.`);
    hasChanges = true;
  }

  // Clean up any empty spacing paragraphs or duplicate hrs that may have been left behind
  if (hasChanges) {
    html = html.replace(/<p>\s*(?:<br\s*\/?>\s*)*<\/p>/gi, '');
    html = html.replace(/<hr[^>]*>\s*<hr[^>]*>/gi, '<hr />');
    
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`  -> SUCCESS: Wrote updates to ${filename}\n`);
    return true;
  }

  return false;
}

function main() {
  const files = fs.readdirSync(booksDir);
  let updatedCount = 0;
  for (const file of files) {
    if (file.endsWith('.html')) {
      const lower = file.toLowerCase();
      // Skip Eve's Diary since it is treated specially
      if (lower === 'eves-diary.html' || lower === 'evesdiary.html') {
        continue;
      }
      const fullPath = path.join(booksDir, file);
      try {
        const updated = processBook(fullPath);
        if (updated) {
          updatedCount++;
        }
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    }
  }
  console.log(`\nDialogue processing and book cleanups finished. Updated ${updatedCount} books.`);
}

main();
