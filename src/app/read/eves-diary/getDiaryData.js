import fs from 'fs';
import path from 'path';

export function getDiaryData() {
  const filePath = path.join(process.cwd(), 'rag/data-collection/TwainCorpus/HTML/Eves-Diary.html');
  const htmlContent = fs.readFileSync(filePath, 'utf8');

  // Extract from line 96 to 1329 (0-indexed line numbers 95 to 1328)
  const lines = htmlContent.split('\n');
  let extractedContent = lines.slice(95, 1329).join('\n');

  // Clean up empty Project Gutenberg spacing paragraphs (e.g. <p><br><br></p>)
  extractedContent = extractedContent.replace(/<p>\s*(?:<br\s*\/?>\s*)*<\/p>/gi, '');

  // Remove the second redundant title block completely
  extractedContent = extractedContent.replace(
    /<h1>\s*Eve's Diary\s*<\/h1>\s*<h3>\s*Translated from the Original\s*<\/h3>/gi,
    ''
  );

  // Rearrange the first title block to group Title, 'Translated from the Original' (with Ask Mark tooltip), Author, and Illustrator
  extractedContent = extractedContent.replace(
    /<h1>\s*EVE'S DIARY\s*<\/h1>\s*<h2>\s*By Mark Twain\s*<\/h2>\s*<h3>\s*Illustrated by Lester Ralph\s*<\/h3>/gi,
    `<h1>EVE'S DIARY</h1>
    <h2>
      &ldquo;Translated from the Original&rdquo;<span class="ask-mark-tooltip-container" title="Ask Mark"><a href="/chat?query=When the title page says 'Translated from the Original', what do you actually mean by that?&amp;excerpt=Translated from the Original" style="color: inherit; text-decoration: none;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ask-mark-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></a></span>
    </h2>
    <h2>By Mark Twain</h2>
    <h3>Illustrated by Lester Ralph</h3>`
  );

  // Group the first three figures (cover, frontispiece, title page) into a 3-column layout
  extractedContent = extractedContent.replace(
    /<div class="fig"[^>]*>\s*<img[^>]+cover\.jpg[^>]*>\s*(?:<br\s*\/?>)?\s*<\/div>\s*<div class="fig"[^>]*>\s*<img[^>]+front\.jpg[^>]*>\s*(?:<br\s*\/?>)?\s*<\/div>\s*<div class="fig"[^>]*>\s*<img[^>]+title\.jpg[^>]*>\s*(?:<br\s*\/?>)?\s*<\/div>/gi,
    `<div class="book-cover-trio">
      <div class="fig-trio-item"><img alt="cover.jpg" src="/images/eves-diary/cover.jpg" /></div>
      <div class="fig-trio-item"><img alt="front.jpg" src="/images/eves-diary/front.jpg" /></div>
      <div class="fig-trio-item"><img alt="title.jpg" src="/images/eves-diary/title.jpg" /></div>
    </div>`
  );
  // Tag H2 headings with section-N IDs for ToC mapping
  let sectionCount = 0;
  extractedContent = extractedContent.replace(
    /<h2>\s*([\s\S]*?)\s*<\/h2>/gi,
    (match, title) => {
      sectionCount++;
      const id = `section-${sectionCount}`;
      return `<h2 id="${id}">${title}</h2>`;
    }
  );

  // Move inline illustrations into the following paragraph and wrap in flex containers
  let imgCount = 0;
  const imgParagraphRegex = /<div class="fig"[^>]*>\s*<img([^>]+src="([^"]+)"[^>]*)>\s*(?:<br\s*\/?>)?\s*<\/div>\s*(?:<p>\s*(?:<br\s*\/?>\s*)*<\/p>\s*)*<p>([\s\S]*?)<\/p>/gi;

  extractedContent = extractedContent.replace(
    imgParagraphRegex,
    (match, imgAttrs, src, pContent) => {
      const altMatch = imgAttrs.match(/alt="([^"]+)"/i);
      const alt = altMatch ? altMatch[1] : '';
      const floatClass = imgCount % 2 === 0 ? 'right' : 'left';
      imgCount++;
      
      return `<div class="paragraph-with-image layout-${floatClass}">
        <div class="circle-img-wrapper">
          <img src="${src}" alt="${alt}" class="in-paragraph-img" />
          <span class="zoom-hover-overlay"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path></svg></span>
        </div>
        <p class="image-paragraph-text">${pContent}</p>
      </div>`;
    }
  );

  extractedContent = extractedContent.replace(
    /FIRE!/g,
    `FIRE!<span class="ask-mark-tooltip-container" title="Ask Mark"><a href="/chat?query=When Eve exclaims 'FIRE!', why does she recognize fire without ever having seen it?&amp;excerpt=FIRE!" style="color: inherit; text-decoration: none;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ask-mark-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></a></span>`
  );

  extractedContent = extractedContent.replace(
    /my first sorrow/i,
    (match) => `${match}<span class="ask-mark-tooltip-container" title="Ask Mark"><a href="/chat?query=When you write 'my first sorrow', what was happening in your life when you wrote this?&amp;excerpt=my first sorrow" style="color: inherit; text-decoration: none;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ask-mark-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></a></span>`
  );

  extractedContent = extractedContent.replace(
    /ADAM:\s*Wheresoever she was, THERE was Eden/gi,
    `ADAM: Wheresoever she was, THERE was Eden<span class="ask-mark-tooltip-container" title="Ask Mark"><a href="/chat?query=When you write 'ADAM: Wheresoever she was, THERE was Eden' what do you actually mean?&amp;excerpt=ADAM: Wheresoever she was, THERE was Eden" style="color: inherit; text-decoration: none;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ask-mark-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></a></span>`
  );

  // Clean up transcription conventions and typos
  extractedContent = extractedContent.replace(/make \[it\] out/gi, 'make it out');
  extractedContent = extractedContent.replace(/he is as God make him/gi, 'he is as God made him');

  // Strip long italic blocks from Adam's Diary section
  extractedContent = extractedContent.replace(/<\/?i>/gi, '');

  // Mark pure dialogue lines as conversation lines
  extractedContent = extractedContent.replace(
    /<p>\s*&ldquo;([\s\S]*?)&rdquo;\s*<\/p>/gi,
    '<p class="conversation-line">&ldquo;$1&rdquo;</p>'
  );

  // Tag weekdays inside paragraphs with day-N IDs
  let dayCount = 0;
  let sundayCount = 0;
  let fridayCount = 0;
  extractedContent = extractedContent.replace(
    /(<p[^>]*>\s*)(SATURDAY|SUNDAY|NEXT WEEK SUNDAY|WEDNESDAY|THURSDAY|MONDAY|TUESDAY|FRIDAY)(\.&mdash;|&mdash;|—)/gi,
    (match, pStart, dayText, delimiter) => {
      dayCount++;
      const id = `day-${dayCount}`;
      let displayText = dayText;
      const upperDay = dayText.toUpperCase();
      if (upperDay === 'SUNDAY') {
        sundayCount++;
        if (sundayCount === 2) {
          displayText = `${dayText} (the second)`;
        }
      } else if (upperDay === 'FRIDAY') {
        fridayCount++;
        if (fridayCount === 2) {
          displayText = `${dayText} (the second)`;
        }
      }
      
      const hasDot = delimiter.startsWith('.');
      const finalDayText = hasDot ? `${displayText}. ` : `${displayText} `;
      const finalDelimiter = ' — ';

      return `${pStart}<span id="${id}" class="diary-day-anchor">${finalDayText}</span>${finalDelimiter}`;
    }
  );

  // Extract ToC items in document order
  const tocItems = [];
  const idRegex = /id="(day-\d+|section-\d+)"[^>]*>([\s\S]*?)<\/(?:span|h2)>/gi;
  let m;
  while ((m = idRegex.exec(extractedContent)) !== null) {
    const id = m[1];
    let text = m[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    if (text.endsWith('.')) {
      text = text.slice(0, -1).trim();
    }
    if (text === 'By Mark Twain' || text.includes('Illustrated by') || text.includes('Translated from the Original')) continue;

    let label = text;
    if (id.startsWith('day-')) {
      if (id === 'day-10') {
        label = 'Four Days Alone';
      } else {
        const cleanText = text.toLowerCase();
        if (cleanText.includes('(the second)')) {
          const baseDay = cleanText.replace(' (the second)', '');
          const capitalizedBase = baseDay.charAt(0).toUpperCase() + baseDay.slice(1);
          label = `${capitalizedBase} (the second)`;
        } else {
          label = cleanText.replace(/\b\w/g, c => c.toUpperCase());
        }
      }
    }
    tocItems.push({ id, label, type: id.startsWith('day-') ? 'day' : 'section' });
  }

  // Look for cropped files and custom name mappings in the eves-diary folder.
  const croppedMappings = {
    '067.jpg': ["extract-from-adams", "extract_from_adams", "extract from adam", "extractfromadams"],
    '093.jpg': ["after-the-fall", "after_the_fall", "after the fall", "afterthefall"],
    '105.jpg': ["forty-years-later", "forty_years_later", "forty years later", "fortyyearslater"],
    '109.jpg': ["atthegrave", "at-the-grave", "at_the_grave", "at eve's grave", "attevesgrave"]
  };

  const evesDiaryDir = path.join(process.cwd(), 'public/images/eves-diary');
  try {
    if (fs.existsSync(evesDiaryDir)) {
      const files = fs.readdirSync(evesDiaryDir);
      
      // 1. Map explicit custom prefixes
      Object.entries(croppedMappings).forEach(([original, prefixes]) => {
        const croppedFile = files.find(f => {
          const normalisedFile = f.toLowerCase().replace(/\.[^/.]+$/, ""); // strip extension
          return prefixes.some(p => normalisedFile.startsWith(p.toLowerCase()) || p.toLowerCase().startsWith(normalisedFile));
        });
        if (croppedFile) {
          const originalEscaped = original.replace(/\./g, '\\.');
          const regex = new RegExp(`src="\\/images\\/eves-diary\\/${originalEscaped}"`, 'g');
          extractedContent = extractedContent.replace(
            regex,
            `src="/images/eves-diary/${croppedFile}" data-zoom-src="/images/eves-diary/${original}"`
          );
        }
      });

      // 2. Map automatic "XXX-cropped.ext" or "XXX_cropped.ext" patterns
      const croppedPatternRegex = /^(\d{3})[-_]cropped\.(jpg|jpeg|png|webp|gif)$/i;
      files.forEach(file => {
        const match = file.match(croppedPatternRegex);
        if (match) {
          const originalNum = match[1];
          const original = `${originalNum}.jpg`;
          const regex = new RegExp(`src="\\/images\\/eves-diary\\/${originalNum}\\.jpg"`, 'g');
          extractedContent = extractedContent.replace(
            regex,
            `src="/images/eves-diary/${file}" data-zoom-src="/images/eves-diary/${original}"`
          );
        }
      });
    }
  } catch (e) {
    console.error("Error mapping cropped images in getDiaryData.js:", e);
  }

  return { htmlContent: extractedContent, tocItems };
}

