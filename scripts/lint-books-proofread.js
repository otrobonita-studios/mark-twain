// scripts/lint-books-proofread.js
const fs = require('fs');
const path = require('path');

const booksDir = path.join(__dirname, '../src/data/books');

// Valid acronyms, abbreviations, and Roman numerals to exclude from ALL-CAPS check
const exclusions = new Set([
  'US', 'USA', 'AD', 'BC', 'AM', 'PM', 'LS', 'PS', 'NB', 'OK', 'MS', 'NY', 'PA', 'KY', 'CT', 'MD', 'VA',
  'A.D.', 'B.C.', 'A.M.', 'P.M.', 'L.S.', 'P.S.', 'N.B.', 'U.S.', 'U.S.A.',
  'N.Y.', 'P.S.', 'N.B.', 'L.S.', 'O.K.'
]);

// Weekdays to ignore in Eve's Diary and general texts
const weekdays = new Set([
  'SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY',
  'SATURDAY.', 'SUNDAY.', 'MONDAY.', 'TUESDAY.', 'WEDNESDAY.', 'THURSDAY.', 'FRIDAY.'
]);

// Known dialogue prefix names to ignore
const dialoguePrefixes = new Set([
  'ADAM', 'EVE', 'THE QUEEN', 'QUEEN', 'KING', 'CONRAD', 'CONSTANCE', 'AUNT RACHEL'
]);

function getLineNumber(text, index) {
  return text.substring(0, index).split('\n').length;
}

function cleanTitleString(rawTitle, filename) {
  let title = rawTitle || filename.replace(/\.(html|txt)$/, '');
  title = title
    .replace(/\s*\|\s*Project Gutenberg/gi, '')
    .replace(/\s*,\s*by Mark Twain/gi, '')
    .replace(/\s*by Mark Twain/gi, '')
    .replace(/\s*,\s*By\s*Twain/gi, '')
    .replace(/\s*By\s*Twain/gi, '')
    .replace(/\s*,\s*by\s*Mark\s*Twain\s*\(Samuel\s*Clemens\)/gi, '')
    .replace(/\s*by\s*Mark\s*Twain\s*\(Samuel\s*Clemens\)/gi, '')
    .trim();
  return title;
}

function isLetterSegment(segment) {
  const recipientMatch = segment.match(/^\s*(?:<a[^>]*>[\s\S]*?<\/a>)?\s*(?:<div[^>]*>[\s\S]*?<\/div>)?\s*(?:<br\s*\/?>)?\s*(?:<p\b[^>]*>)?\s*(To\s+|From\s+|Fragment\s+(?:of|to)\s+a\s+letter\s+|Part\s+of\s+a\s+letter\s+|Letter\s+to\s+|Letters\s+to\s+|Telegram\s+to\s+|Telegrams\s+to\s+)/i);
  return !!recipientMatch;
}

function isSignatureText(text) {
  const cleanText = text.replace(/<[^>]+>/g, '').trim();
  const collapsedText = cleanText.replace(/\s+/g, ' ');
  if (collapsedText.length > 120) return false;
  const signaturePatterns = [
    /yours/i, /brother/i, /friend/i, /mark/i, /sam/i, /clemens/i, /ever/i, 
    /affectionately/i, /sinceres/i, /respectfully/i, /obedient/i, /devotedly/i, 
    /signing/i
  ];
  return signaturePatterns.some(pat => pat.test(collapsedText)) || collapsedText.length < 50;
}

function lintFile(filePath) {
  const filename = path.basename(filePath);
  const rawHtml = fs.readFileSync(filePath, 'utf8');
  const findings = [];

  // Determine classification
  const titleMatch = rawHtml.match(/<title>([\s\S]*?)<\/title>/i);
  const cleanTitle = cleanTitleString(titleMatch ? titleMatch[1] : null, filename);
  
  let classification = 'book';
  const lowercaseTitle = cleanTitle.toLowerCase();
  const lowercaseFilename = filename.toLowerCase();
  
  if (lowercaseFilename.startsWith('volume-') || lowercaseTitle.includes('letters')) {
    classification = 'collection';
  } else if (lowercaseFilename.includes('letter')) {
    classification = 'letter';
  }

  // 1. Check title & title block provenance
  checkTitleAndProvenance(rawHtml, filename, cleanTitle, classification, findings);

  // 2. Check typography and spelling conventions (today/tomorrow, contractions, hyphens)
  checkTypographyAndOCR(rawHtml, filename, classification, findings);

  // 3. Check for Gutenberg ALL-CAPS markup leakage (emphasis)
  checkAllCapsEmphasis(rawHtml, filename, cleanTitle, findings);

  // 4. Check structural formatting for letters/collections
  if (classification === 'collection' || classification === 'letter') {
    checkLettersStructure(rawHtml, filename, findings);
  }

  return { filename, cleanTitle, classification, findings };
}

function checkTitleAndProvenance(html, filename, cleanTitle, classification, findings) {
  // Check title tag contents
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    const rawTitle = titleMatch[1];
    if (rawTitle.includes('Project Gutenberg') || rawTitle.includes('by Mark Twain') || rawTitle.includes('By Twain')) {
      findings.push({
        line: getLineNumber(html, titleMatch.index),
        type: 'Provenance',
        severity: 'Warning',
        message: `Title tag contains Gutenberg/author boilerplate: "${rawTitle}"`,
        suggestion: `Clean it to: "${cleanTitle}"`
      });
    }
  }

  // Find book title block H1
  const titleBlockRegex = /<div\b[^>]*class=["']book-title-block["'][^>]*>([\s\S]*?)<\/div>/gi;
  let blockMatch = titleBlockRegex.exec(html);
  if (blockMatch) {
    const blockContent = blockMatch[1];
    const h1Match = blockContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
      const h1Text = h1Match[1].replace(/<[^>]+>/g, '').trim();
      const cleanH1 = h1Text.replace(/\s+/g, ' ').toLowerCase();
      const cleanTitleLower = cleanTitle.toLowerCase();
      
      // Allow minor differences in spacing, punctuation, but flag mismatch
      if (cleanH1 !== cleanTitleLower && !cleanTitleLower.includes(cleanH1) && !cleanH1.includes(cleanTitleLower)) {
        findings.push({
          line: getLineNumber(html, blockMatch.index + h1Match.index),
          type: 'Provenance',
          severity: 'Warning',
          message: `Title tag ("${cleanTitle}") and H1 Title Block ("${h1Text}") do not match.`,
          suggestion: `Verify titles match.`
        });
      }
    }
  } else if (classification !== 'collection' && classification !== 'letter') {
    // Books/Stories/Essays should have title blocks
    findings.push({
      line: 1,
      type: 'Provenance',
      severity: 'Warning',
      message: `Missing <div class="book-title-block"> at the start of the body.`,
      suggestion: `Add standardized title block to the file.`
    });
  }

  // Check for editorial bracketed subtitles or annotations in headings
  const headingRegex = /<(h1|h2|h3|h4)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let headingMatch;
  while ((headingMatch = headingRegex.exec(html)) !== null) {
    const headingText = headingMatch[3];
    if (/\[Written\s+about\s+\d{4}\]/i.test(headingText) || /\[Compiled\s+.*?\]/i.test(headingText)) {
      findings.push({
        line: getLineNumber(html, headingMatch.index),
        type: 'Provenance',
        severity: 'Warning',
        message: `Heading contains modern editorial bracketed date: "${headingText}"`,
        suggestion: `Remove bracketed text (e.g. "[Written about 1876]") from reader view.`
      });
    }
    // Site-invented title subtitle check
    if (headingText.includes('AWFUL, TERRIBLE MEDIEVAL ROMANCE')) {
      findings.push({
        line: getLineNumber(html, headingMatch.index),
        type: 'Provenance',
        severity: 'Error',
        message: `Invented/spurious title found in heading: "${headingText}"`,
        suggestion: `Restore to canonical title: "A Mediaeval Romance".`
      });
    }
  }

  // Check for site-inserted editorial note / epigraph in Eve's Diary
  if (filename.toLowerCase().includes('eve')) {
    const matchNote = html.match(/This book is the first reworked version of many to come/i);
    if (matchNote) {
      findings.push({
        line: getLineNumber(html, matchNote.index),
        type: 'Provenance',
        severity: 'Warning',
        message: `Contains site-inserted modern editorial note: "${matchNote[0]}"`,
        suggestion: `Remove or move out of the Reader text body.`
      });
    }
  }

  // Check for Meine scholarly apparatus in 1601
  if (filename.startsWith('1601')) {
    const matchIntroduction = html.match(/FRANKLIN J. MEINE/i);
    if (matchIntroduction) {
      findings.push({
        line: getLineNumber(html, matchIntroduction.index),
        type: 'Provenance',
        severity: 'Warning',
        message: `Franklin J. Meine's 1939 scholarly Introduction is embedded in the body.`,
        suggestion: `Remove or relocate Introduction from Traditional Read.`
      });
    }
    const matchFootnotes = html.match(/FOOTNOTES To Frivolity/i);
    if (matchFootnotes) {
      findings.push({
        line: getLineNumber(html, matchFootnotes.index),
        type: 'Provenance',
        severity: 'Warning',
        message: `Meine's "Footnotes to Frivolity" scholarly appendix is appended to the text.`,
        suggestion: `Remove or relocate scholarly notes from the reader body.`
      });
    }
  }

  // Check for A Burlesque Autobiography modern intro
  if (filename.includes('Burlesque-Autobiography')) {
    const matchTwainII = html.match(/EXPLAINED BY MARK TWAIN II/i);
    if (matchTwainII) {
      findings.push({
        line: getLineNumber(html, matchTwainII.index),
        type: 'Provenance',
        severity: 'Warning',
        message: `Spurious modern note by "Mark Twain II" is embedded in the text.`,
        suggestion: `Remove the ~2,300-char modern composition from the body.`
      });
    }
  }
}

function checkTypographyAndOCR(html, filename, classification, findings) {
  const textLines = html.split('\n');

  // Search line-by-line for simple spelling anomalies
  textLines.forEach((lineText, index) => {
    const lineNum = index + 1;

    // Skip markup lines
    if (lineText.trim().startsWith('<style') || lineText.trim().startsWith('<script') || lineText.trim().startsWith('</style') || lineText.trim().startsWith('</script')) {
      return;
    }

    // Strip HTML tags to inspect text content
    const textOnly = lineText.replace(/<[^>]+>/g, ' ');

    // Check today -> to-day
    if (/\btoday\b/i.test(textOnly)) {
      findings.push({
        line: lineNum,
        type: 'Typographic',
        severity: 'Info',
        message: `Unhyphenated spelling: "today"`,
        suggestion: `Replace with period spelling: "to-day"`
      });
    }

    // Check tomorrow -> to-morrow
    if (/\btomorrow\b/i.test(textOnly)) {
      findings.push({
        line: lineNum,
        type: 'Typographic',
        severity: 'Info',
        message: `Unhyphenated spelling: "tomorrow"`,
        suggestion: `Replace with period spelling: "to-morrow"`
      });
    }

    // Check tonight -> to-night
    if (/\btonight\b/i.test(textOnly)) {
      findings.push({
        line: lineNum,
        type: 'Typographic',
        severity: 'Info',
        message: `Unhyphenated spelling: "tonight"`,
        suggestion: `Replace with period spelling: "to-night"`
      });
    }

    // Check farmhouse -> farm-house
    if (/\bfarmhouse\b/i.test(textOnly)) {
      findings.push({
        line: lineNum,
        type: 'Typographic',
        severity: 'Info',
        message: `Unhyphenated spelling: "farmhouse"`,
        suggestion: `Replace with period spelling: "farm-house"`
      });
    }

    // Check A-True-Story specific OCR/dialect errors
    if (filename.includes('A-True-Story')) {
      if (/\bplatoon\b/i.test(textOnly)) {
        findings.push({
          line: lineNum,
          type: 'OCR',
          severity: 'Warning',
          message: `Modernized spelling: "platoon"`,
          suggestion: `Restore to authentic 1874 print spelling: "plattoon"`
        });
      }
      if (/\bI\s+ben\b/i.test(textOnly)) {
        findings.push({
          line: lineNum,
          type: 'OCR',
          severity: 'Warning',
          message: `OCR error/substitution: "I ben"`,
          suggestion: `Correct dialect spelling to: "I been"`
        });
      }
      if (/\bbusted\s+'is\b/i.test(textOnly) || /\bbusted\s+is\b/i.test(textOnly)) {
        findings.push({
          line: lineNum,
          type: 'OCR',
          severity: 'Warning',
          message: `OCR error: "busted 'is/is"`,
          suggestion: `Correct to: "busted his"`
        });
      }
      if (/\bridgment\s+da\b/i.test(textOnly)) {
        findings.push({
          line: lineNum,
          type: 'OCR',
          severity: 'Warning',
          message: `OCR error: "ridgment da"`,
          suggestion: `Correct to: "ridgment dat"`
        });
      }
      // Check for unspaced contractions in A True Story
      const unspacedContractionRegex = /\b(wasn't|didn't|wouldn't|couldn't)\b/gi;
      let match;
      while ((match = unspacedContractionRegex.exec(textOnly)) !== null) {
        findings.push({
          line: lineNum,
          type: 'Typographic',
          severity: 'Info',
          message: `Unspaced contraction: "${match[1]}"`,
          suggestion: `Replace with spaced contraction: "${match[1].slice(0, -3)} n't" to match Atlantic Monthly print style`
        });
      }
    }

    // Check 1601 specific errors
    if (filename.startsWith('1601')) {
      if (/\bLille\b/i.test(textOnly)) {
        findings.push({
          line: lineNum,
          type: 'OCR',
          severity: 'Warning',
          message: `Substituted word/OCR error: "Lille"`,
          suggestion: `Replace with: "Lyly" (reference to Elizabethan author John Lyly)`
        });
      }
    }
  });

  // Check hyphen/dash consistency
  const doubleHyphens = (html.match(/--/g) || []).length;
  const emDashes = (html.match(/—/g) || []).length;
  if (doubleHyphens > 2 && emDashes > 2) {
    findings.push({
      line: 1,
      type: 'Typographic',
      severity: 'Info',
      message: `Inconsistent dash styles: found ${doubleHyphens} double-hyphens ("--") and ${emDashes} em-dashes ("—") in body.`,
      suggestion: `Standardize on either double-hyphens ("--") or em-dashes ("—") throughout.`
    });
  }
}

function checkAllCapsEmphasis(html, filename, cleanTitle, findings) {
  // Regex to match paragraph blocks
  const pRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
  let pMatch;
  
  while ((pMatch = pRegex.exec(html)) !== null) {
    const attrs = pMatch[1];
    const content = pMatch[2];
    const lineNum = getLineNumber(html, pMatch.index);

    // Skip note blocks, styled placards, bibliography or illustrations grids
    if (attrs.includes('class="note"') || attrs.includes('adult-note-card') || attrs.includes('mkii-note')) {
      continue;
    }

    // Clean HTML comments and tags from content
    let cleanText = content
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/<[^>]+>/g, ' ')
      .trim();

    if (!cleanText) continue;

    // Clean salutations from the text to avoid false positives (e.g. "DEAR MOORE,—" or "MY DEAR HOWELLS,")
    cleanText = cleanText.replace(/^(?:MY\s+)?DEAR\s+[A-Z\s'.,-]+(?:[—,-]+)/i, '');
    cleanText = cleanText.replace(/^TO\s+[A-Z\s'.,-]+(?:[—,-]+)/i, '');
    cleanText = cleanText.replace(/^[A-Z\s'.,-]+ESQ\b.*?(?:[—,-]+)/i, '');

    // Scan for uppercase words (A-Z only, length >= 2)
    // We match word boundaries but account for contractions with apostrophes e.g. DOESN'T, HIS'N
    const capsRegex = /\b([A-Z]{2,}(?:'[A-Z]+)?)\b/g;
    let capsMatch;

    // Calculate ratio of capitals to total alphabet characters in the paragraph
    const alphabetChars = cleanText.replace(/[^A-Za-z]/g, '');
    const capsChars = cleanText.replace(/[^A-Z]/g, '');
    const isPlacard = alphabetChars.length > 0 && (capsChars.length / alphabetChars.length) > 0.6;

    while ((capsMatch = capsRegex.exec(cleanText)) !== null) {
      const word = capsMatch[1];
      
      // Skip if in exclusions list
      if (exclusions.has(word) || exclusions.has(word + '.')) {
        continue;
      }

      // Skip Roman numerals of any size (e.g. DCCC, LXXX, IV)
      if (/^[IVXLCDM]+$/.test(word)) {
        continue;
      }

      // Skip day headers in Eve's Diary
      if (weekdays.has(word) || weekdays.has(word + '.')) {
        continue;
      }

      // Check if it looks like a dialogue prefix at the start of paragraph (e.g., "ADAM.", "EVE.", "THE QUEEN:")
      const prefixIndex = capsMatch.index;
      const isStartOfParagraph = prefixIndex < 5;
      const textAfterWord = cleanText.substring(prefixIndex + word.length).trim();
      const followedByPunctuation = textAfterWord.startsWith('.') || textAfterWord.startsWith(':') || textAfterWord.startsWith('&mdash;') || textAfterWord.startsWith('—');
      
      if (isStartOfParagraph && (followedByPunctuation || dialoguePrefixes.has(word))) {
        continue;
      }

      // Skip words in ALL CAPS headlines / placards
      if (isPlacard) {
        continue;
      }

      // Flag single uppercase words in mixed-case sentences
      findings.push({
        line: lineNum,
        type: 'Emphasis',
        severity: 'Warning',
        message: `Potential italics markup leakage (ALL-CAPS word): "${word}"`,
        suggestion: `Verify against scan and restore to italic/roman mixed case (e.g. "*${word.toLowerCase()}*")`
      });
    }
  }
}

function checkLettersStructure(html, filename, findings) {
  // Extract body content
  const bodyStart = html.indexOf('<body>');
  const bodyEnd = html.lastIndexOf('</body>');
  if (bodyStart === -1 || bodyEnd === -1) {
    return;
  }

  const bodyContent = html.substring(bodyStart + 6, bodyEnd);
  
  // Normalise and split into letter segments by <hr />
  const normalizedContent = bodyContent
    .replace(/(?:\s*<hr\s*\/?>\s*)*\s*(<h2[^>]*>)/gi, '\n<hr />$1')
    .replace(/(?:\s*<hr\s*\/?>\s*)*\s*(<p\b[^>]*>\s*(?:To\s+|From\s+|Fragment\s+(?:of|to)\s+a\s+letter|Part\s+of\s+a\s+letter|Letter\s+to|Letters\s+to|Telegram\s+to|Telegrams\s+to))/gi, '\n<hr />$1');
  const parts = normalizedContent.split(/<hr\s*\/?>/gi);

  let segmentIndex = 0;
  let lastSearchIndex = 0;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    segmentIndex++;

    // Skip the first segment if it is a foreword, index, or preface
    if (segmentIndex === 1 && (part.includes('<h2>FOREWORD</h2>') || part.includes('<h2>INTRODUCTION</h2>') || part.includes('<h2>PREFACE</h2>'))) {
      continue;
    }

    const isLetter = isLetterSegment(part);
    
    // Find the approximate line number in the source file
    const sampleText = part.substring(0, 60).replace(/<[^>]+>/g, '').trim();
    let approximateLine = 1;
    if (sampleText) {
      const idx = html.indexOf(sampleText, lastSearchIndex);
      if (idx !== -1) {
        lastSearchIndex = idx + sampleText.length;
        approximateLine = getLineNumber(html, idx);
      } else {
        const fallbackIdx = html.indexOf(sampleText);
        if (fallbackIdx !== -1) {
          approximateLine = getLineNumber(html, fallbackIdx);
        }
      }
    }

    if (!isLetter) {
      // If inside a collection, non-letter segments should be introductory notes or pre-blocks
      // Let's warn if it looks like a letter but isn't classified as one
      if (part.includes('Dear') || part.includes('yours') || part.includes('Brother')) {
        findings.push({
          line: approximateLine,
          type: 'Structure',
          severity: 'Warning',
          message: `Segment ${segmentIndex} contains letter-like words ("Dear", "yours") but is not recognized as a letter segment by compile-books.js.`,
          suggestion: `Ensure it starts with a <p> matching: "To ...", "From ...", "Letter to ...", etc.`
        });
      }
    } else {
      // It is a letter segment. Check structure.
      
      // 1. Extract recipient
      const pMatch = part.match(/<p>([\s\S]*?)<\/p>/i);
      let recipient = '';
      let afterRecipient = part;
      if (pMatch) {
        recipient = pMatch[1].trim();
        afterRecipient = part.substring(pMatch.index + pMatch[0].length).trim();
      }

      // 2. Extract date
      const dateMatch = afterRecipient.match(/^\s*(?:<a[^>]*>[\s\S]*?<\/a>)?\s*<pre[^>]*>([\s\S]*?)<\/pre>/i);
      let date = '';
      let afterDate = afterRecipient;
      if (dateMatch) {
        date = dateMatch[1].trim();
        afterDate = afterRecipient.substring(dateMatch[0].length).trim();
      } else {
        if (filename.includes('Volume-6')) {
          console.log(`[DEBUG] Segment ${segmentIndex} in ${filename} failed date check. afterRecipient starts with:`, JSON.stringify(afterRecipient.substring(0, 100)));
        }
        findings.push({
          line: approximateLine,
          type: 'Structure',
          severity: 'Warning',
          message: `Letter segment ${segmentIndex} is missing a <pre> date block at the beginning.`,
          suggestion: `Add <pre xml:space="preserve">Date</pre> below the recipient heading.`
        });
      }

      // 3. Extract remaining pre-blocks
      const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
      const preBlocks = [];
      let matchBlock;
      while ((matchBlock = preRegex.exec(afterDate)) !== null) {
        preBlocks.push({
          index: matchBlock.index,
          length: matchBlock[0].length,
          content: matchBlock[1],
          full: matchBlock[0]
        });
      }

      // 4. Handle context lookahead for next letter (lookahead matching compile-books.js)
      let nextIsLetter = i + 1 < parts.length && isLetterSegment(parts[i + 1]);
      if (nextIsLetter && preBlocks.length > 0) {
        const lastBlock = preBlocks[preBlocks.length - 1];
        if (!isSignatureText(lastBlock.content)) {
          // This block is actually context/intro for the next letter, not the signature of this one.
          preBlocks.pop();
        }
      }

      // 5. Signature validation
      if (preBlocks.length > 0) {
        const hasSignature = preBlocks.some(block => isSignatureText(block.content));
        if (!hasSignature) {
          const sigBlock = preBlocks[preBlocks.length - 1];
          findings.push({
            line: approximateLine,
            type: 'Structure',
            severity: 'Warning',
            message: `No <pre> block in letter segment ${segmentIndex} matches typical signature text. Last block: "${sigBlock.content.trim().substring(0, 50)}..."`,
            suggestion: `Ensure one of the <pre> blocks contains the signature (e.g., "Truly your Brother, SAM.")`
          });
        }
      }

      // 6. Header exclusions inside letter body
      const internalHeadings = part.match(/<(h1|h2)\b[^>]*>([\s\S]*?)<\/\1>/gi);
      if (internalHeadings) {
        findings.push({
          line: approximateLine,
          type: 'Structure',
          severity: 'Warning',
          message: `Letter segment ${segmentIndex} contains internal headings: ${internalHeadings.join(', ')}`,
          suggestion: `Remove internal h1/h2 headings from the letter body; use p or pre blocks instead.`
        });
      }
    }
  }
}

function runLinter() {
  console.log('==================================================');
  console.log('MARK TWAIN цифровой архив: RESTORED-TEXT LINTER');
  console.log('==================================================\n');

  if (!fs.existsSync(booksDir)) {
    console.error(`Error: Books directory not found at ${booksDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.html'));
  
  let totalFiles = 0;
  let totalWarnings = 0;
  let totalErrors = 0;
  
  const report = [];

  files.forEach(file => {
    // Skip specialty templates if any
    if (file === 'cover.jpg' || file === 'images' || file === 'json') return;

    totalFiles++;
    const filePath = path.join(booksDir, file);
    
    try {
      const result = lintFile(filePath);
      if (result.findings.length > 0) {
        report.push(result);
        result.findings.forEach(f => {
          if (f.severity === 'Error') totalErrors++;
          else totalWarnings++;
        });
      }
    } catch (err) {
      console.error(`[Error] Failed to lint ${file}: ${err.message}`);
      totalErrors++;
    }
  });

  // Print results
  report.forEach(res => {
    console.log(`\n📄 File: [${res.classification.toUpperCase()}] ${res.filename} (${res.findings.length} findings)`);
    console.log(`   Title: "${res.cleanTitle}"`);
    console.log('   ------------------------------------------------');
    
    res.findings.forEach(f => {
      const icon = f.severity === 'Error' ? '❌' : (f.severity === 'Warning' ? '⚠️' : 'ℹ️');
      console.log(`   ${icon} [Line ${f.line}] [${f.type}] ${f.message}`);
      if (f.suggestion) {
        console.log(`      └─ Suggestion: ${f.suggestion}`);
      }
    });
  });

  const reportJsonPath = path.join(__dirname, '../proof-read/lint-report.json');
  const reportMdPath = path.join(__dirname, '../proof-read/lint-report.md');

  // Write structured JSON report
  const jsonOutput = {
    timestamp: new Date().toISOString(),
    summary: {
      filesScanned: totalFiles,
      totalWarnings,
      totalErrors
    },
    files: report
  };
  fs.writeFileSync(reportJsonPath, JSON.stringify(jsonOutput, null, 2), 'utf8');

  // Write Markdown report
  let mdContent = `# Restored-Text Linter Report\n\n`;
  mdContent += `* **Generated at:** ${new Date().toISOString()}\n`;
  mdContent += `* **Files scanned:** ${totalFiles}\n`;
  mdContent += `* **Total warnings:** ${totalWarnings}\n`;
  mdContent += `* **Total errors:** ${totalErrors}\n\n`;
  mdContent += `## Summary of Findings\n\n`;

  report.forEach(res => {
    mdContent += `### 📄 [${res.classification.toUpperCase()}] [${res.filename}](file:///${path.join(booksDir, res.filename).replace(/\\/g, '/')}) (${res.findings.length} findings)\n`;
    mdContent += `*Title:* "${res.cleanTitle}"\n\n`;
    res.findings.forEach(f => {
      const icon = f.severity === 'Error' ? '❌' : (f.severity === 'Warning' ? '⚠️' : 'ℹ️');
      mdContent += `- ${icon} **[Line ${f.line}]** [${f.type}] ${f.message}\n`;
      if (f.suggestion) {
        mdContent += `  - *Suggestion:* ${f.suggestion}\n`;
      }
    });
    mdContent += `\n---\n\n`;
  });

  fs.writeFileSync(reportMdPath, mdContent, 'utf8');

  console.log('\n==================================================');
  console.log('LINTER RUN SUMMARY');
  console.log('==================================================');
  console.log(`Files scanned: ${totalFiles}`);
  console.log(`Total warnings: ${totalWarnings}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log('==================================================\n');
  console.log(`Saved reports to:`);
  console.log(`  - JSON: ${reportJsonPath}`);
  console.log(`  - Markdown: ${reportMdPath}\n`);

  if (totalErrors > 0) {
    console.log('Linting completed with Errors. Verification failed.');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log('Linting completed with Warnings. Please check findings.');
    process.exit(0);
  } else {
    console.log('All scanned files clean! Validation passed.');
    process.exit(0);
  }
}

// Check if run directly
if (require.main === module) {
  runLinter();
}

module.exports = { lintFile };
