import fs from 'fs';
import path from 'path';
import GenericBookReader from '@/components/GenericBookReader';

function findBookFile(slug) {
  const baseDir = process.cwd();
  const decodedSlug = decodeURIComponent(slug);
  
  // Only check in src/data/books/
  let htmlPath = path.join(baseDir, 'src/data/books', `${decodedSlug}.html`);
  if (fs.existsSync(htmlPath)) return { path: htmlPath, type: 'html' };
  
  let txtPath = path.join(baseDir, 'src/data/books', `${decodedSlug}.txt`);
  if (fs.existsSync(txtPath)) return { path: txtPath, type: 'txt' };

  return null;
}

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), 'src/data/books');
  const slugs = new Set();
  
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file.endsWith('.html') || file.endsWith('.txt')) {
        slugs.add(file.replace(/\.(html|txt)$/, ''));
      }
    }
  }
  
  // Exclude Eves-Diary as it is served by the custom /read/eves-diary path
  slugs.delete('Eves-Diary');
  slugs.delete('eves-diary');
  
  return Array.from(slugs).map(slug => ({
    bookSlug: slug
  }));
}

function formatTxtToHtml(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const paragraphs = [];
  const tocItems = [];
  let currentParagraph = [];
  let headerCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if it looks like a chapter header (e.g., CHAPTER I, CHAPTER 1, etc.)
    if (/^(CHAPTER|CHAP\.)\s+[IVXLCDM\d]+/i.test(line)) {
      // Flush current paragraph
      if (currentParagraph.length > 0) {
        paragraphs.push(`<p>${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
      
      headerCount++;
      const id = `chapter-${headerCount}`;
      paragraphs.push(`<h2 id="${id}">${line}</h2>`);
      tocItems.push({ id, label: line, type: 'section' });
    } else if (line === '') {
      if (currentParagraph.length > 0) {
        paragraphs.push(`<p>${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
    } else {
      currentParagraph.push(line);
    }
  }
  
  if (currentParagraph.length > 0) {
    paragraphs.push(`<p>${currentParagraph.join(' ')}</p>`);
  }

  return {
    htmlContent: paragraphs.join('\n'),
    tocItems
  };
}

export async function generateMetadata({ params }) {
  const { bookSlug } = await params;
  const decodedSlug = decodeURIComponent(bookSlug);
  const fileInfo = findBookFile(decodedSlug);
  
  if (!fileInfo) {
    return {
      title: "Book Not Found",
      description: "The requested book was not found."
    };
  }

  let cleanTitle = decodedSlug.replace(/-/g, ' ');

  try {
    const rawContent = fs.readFileSync(fileInfo.path, 'utf8');
    if (fileInfo.type === 'html') {
      const titleMatch = rawContent.match(/<title>([\s\S]*?)<\/title>/i);
      if (titleMatch) {
        cleanTitle = titleMatch[1]
          .replace(/\s*\|\s*Project Gutenberg/gi, '')
          .replace(/\s*,\s*by Mark Twain/gi, '')
          .replace(/\s*by Mark Twain/gi, '')
          .trim();
      }
    } else {
      // For txt file, clean the slug
      cleanTitle = decodedSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    
    // Remove "COMPLETE" suffix for cleaner titles
    const titleClean = cleanTitle.replace(/,?\s*COMPLETE\s*$/i, '').trim();

    return {
      title: `The Mark Twain Experience: ${titleClean} — Multimedia Editions from Otrobonita Labs`,
      description: `Read ${cleanTitle} by Mark Twain in the complete Mark Twain Reappears archive.`
    };
  } catch (e) {
    return {
      title: "Read Book"
    };
  }
}

export default async function ReadPage({ params }) {
  const { bookSlug } = await params;
  const decodedSlug = decodeURIComponent(bookSlug);

  // Check if compiled JSON document exists
  const jsonPath = path.join(process.cwd(), 'src/data/books/json', `${decodedSlug}.json`);
  let doc = null;
  if (fs.existsSync(jsonPath)) {
    try {
      doc = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
      console.error(`Failed to load compiled JSON for ${decodedSlug}:`, e);
    }
  }

  if (doc) {
    return (
      <GenericBookReader 
        document={doc}
        bookSlug={decodedSlug}
      />
    );
  }

  const fileInfo = findBookFile(decodedSlug);

  if (!fileInfo) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#ff5555', backgroundColor: '#15110d', minHeight: '100vh' }}>
        Error: Book &ldquo;{decodedSlug}&rdquo; not found.
      </div>
    );
  }

  const rawContent = fs.readFileSync(fileInfo.path, 'utf8');
  let processedHtmlContent = '';
  let tocItems = [];
  let cleanTitle = decodedSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const titleMatch = rawContent.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    cleanTitle = titleMatch[1]
      .replace(/\s*\|\s*Project Gutenberg/gi, '')
      .replace(/\s*,\s*by Mark Twain/gi, '')
      .replace(/\s*by Mark Twain/gi, '')
      .trim();
  }
  const isLetters = cleanTitle.toLowerCase().includes('letter');

  if (fileInfo.type === 'html') {
    // Extract body content
    const bodyStart = rawContent.indexOf('<body>');
    const bodyEnd = rawContent.lastIndexOf('</body>');
    let bodyContent = '';
    
    if (bodyStart !== -1 && bodyEnd !== -1) {
      bodyContent = rawContent.substring(bodyStart + 6, bodyEnd);
    } else {
      bodyContent = rawContent;
    }

    let cleanContent = bodyContent.trim();
    
    // Extract title block to avoid matching its h2 elements as chapters/TOC items
    let titleBlock = '';
    const titleBlockMatch = cleanContent.match(/^\s*<div class=["']book-title-block["']>([\s\S]*?)<\/div>\s*(?:<hr\s*\/?>)?/i);
    if (titleBlockMatch) {
      titleBlock = titleBlockMatch[0];
      cleanContent = cleanContent.substring(titleBlockMatch[0].length).trim();
    }

    // Strip outer book-text-content div wrapper
    if ((cleanContent.startsWith('<div class="book-text-content">') || cleanContent.startsWith("<div class='book-text-content'>")) && cleanContent.endsWith('</div>')) {
      const firstClose = cleanContent.indexOf('>');
      cleanContent = cleanContent.substring(firstClose + 1, cleanContent.length - 6).trim();
    }

    // Clean legacy enlarge zoom buttons and curly braces from illustrations
    cleanContent = cleanContent
      .replace(/<h5[^>]*>\s*<a[^>]*href=["'][^"']*["'][^>]*>\s*<img[^>]*src=["'][^"']*enlarge\.jpg["'][^>]*>\s*<\/a>\s*<\/h5>/gi, '')
      .replace(/<a[^>]*href=["'][^"']*["'][^>]*>\s*<img[^>]*src=["'][^"']*enlarge\.jpg["'][^>]*>\s*<\/a>/gi, '');

    let prevContent;
    do {
      prevContent = cleanContent;
      cleanContent = cleanContent.replace(/(src|href|alt)=["']([^"']*?)\{([^"']*?)\}([^"']*?)["']/gi, '$1="$2$3$4"');
    } while (cleanContent !== prevContent);

    // Remove internal Table of Contents (redundant with sidebar TOC)
    cleanContent = cleanContent.replace(
      /<h2[^>]*>\s*(?:<[^>]+>\s*)*(?:TABLE OF\s+)?CONTENTS\.?\s*(?:<\/[^>]+>\s*)*<\/h2>\s*(?:<table[^>]*>[\s\S]*?<\/table>|<ul[^>]*>[\s\S]*?<\/ul>)/gi,
      ''
    );

    // Remove all <hr> elements (visual rules disrupt reading flow) except for letters
    if (!isLetters) {
      cleanContent = cleanContent.replace(/<hr[^>]*\/?>/gi, '');
    }

    // Remove Gutenberg navigation anchors — standalone and paragraph-wrapped
    // (link2H_, link2HCH_ etc. were used by the in-book TOC, now stripped)
    cleanContent = cleanContent.replace(
      /<p[^>]*>\s*(?:<br\s*\/?>\s*)*<a[^>]*(?:name|id)="link2H[^"]*"[^>]*>\s*(?:<!--[\s\S]*?-->\s*)*<\/a>\s*(?:<br\s*\/?>\s*)*<\/p>/gi,
      ''
    );
    cleanContent = cleanContent.replace(
      /<a[^>]*(?:name|id)="link2H[^"]*"[^>]*>\s*(?:<!--[\s\S]*?-->\s*)*<\/a>/gi,
      ''
    );

    // Remove Gutenberg page-number anchors (p001, p019, etc.) — paragraph-wrapped and standalone
    cleanContent = cleanContent.replace(
      /<p[^>]*>\s*(?:<br\s*\/?>\s*)*<a[^>]*(?:name|id)="p\d+"[^>]*>\s*<\/a>\s*(?:<br\s*\/?>\s*)*<\/p>/gi,
      ''
    );
    cleanContent = cleanContent.replace(
      /<a[^>]*(?:name|id)="p\d+"[^>]*>\s*<\/a>/gi,
      ''
    );

    // Parse H2 elements
    let headerIndex = 0;
    
    processedHtmlContent = cleanContent.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (match, attrs, innerContent) => {
      headerIndex++;
      let id = '';
      const idMatch = attrs.match(/id="([^"]+)"/i);
      if (idMatch) {
        id = idMatch[1];
      } else {
        const nameMatch = innerContent.match(/<a\s+name="([^"]+)"/i) || innerContent.match(/id="([^"]+)"/i);
        if (nameMatch) {
          id = nameMatch[1];
        }
      }
      
      if (!id) {
        id = `chapter-${headerIndex}`;
      }

      const cleanLabel = innerContent.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
      const isBanned = ['contents', 'illustrations', 'loi', 'toc', 'index'].some(b => cleanLabel.toLowerCase().includes(b));
      
      if (cleanLabel && !isBanned) {
        let finalLabel = cleanLabel;
        let shouldPush = true;

        if (/^Volume-[1-6]$/i.test(decodedSlug)) {
          if (cleanLabel.toLowerCase() === 'by mark twain') {
            finalLabel = 'Top';
          } else if (cleanLabel.toLowerCase() === '(samuel langhorne clemens)') {
            shouldPush = false;
          }
        }

        if (shouldPush) {
          tocItems.push({
            id,
            label: finalLabel,
            type: 'section'
          });
        }
      }

      if (!attrs.includes('id=')) {
        return `<h2 id="${id}"${attrs}>${innerContent}</h2>`;
      }
      return match;
    });


    if (titleBlock) {
      processedHtmlContent = titleBlock + '\n' + processedHtmlContent;
    }
  } else {
    // Convert text to HTML paragraphs and extract TOC items
    const parsed = formatTxtToHtml(rawContent);
    processedHtmlContent = parsed.htmlContent;
    tocItems = parsed.tocItems;
  }

  // Remove list of illustrations entirely (Gutenberg source files preserved)
  processedHtmlContent = processedHtmlContent.replace(
    /<h2[^>]*>(?:LIST OF\s+)?ILLUSTRATIONS\.?<\/h2>\s*(?:<\/div>\s*)?(?:<table[^>]*>[\s\S]*?<\/table>|<ul[^>]*>[\s\S]*?<\/ul>)/gi,
    ''
  );

  // Remove book-toc-collapsed-wrapper — match to the expand button (unique sentinel at end of structure)
  // Using button as anchor avoids the nested-div problem with non-greedy </div> matching
  processedHtmlContent = processedHtmlContent.replace(
    /<blockquote[^>]*>\s*(?:<h2[^>]*>\s*(?:TABLE OF\s+)?CONTENTS\.?\s*<\/h2>\s*)?<div[^>]*book-toc-collapsed-wrapper[^>]*>[\s\S]*?<\/button>\s*<\/div>\s*<\/blockquote>/gi,
    ''
  );
  // Also catch standalone wrappers (not in blockquote)
  processedHtmlContent = processedHtmlContent.replace(
    /<div[^>]*book-toc-collapsed-wrapper[^>]*>[\s\S]*?<\/button>\s*<\/div>/gi,
    ''
  );
  // Clean up any orphaned CONTENTS h2 left behind
  processedHtmlContent = processedHtmlContent.replace(
    /<h2[^>]*>\s*(?:TABLE OF\s+)?CONTENTS\.?\s*<\/h2>/gi,
    ''
  );

  // Remove orphaned CONTENTS blockquotes with only empty toc paragraphs
  // Matches: <blockquote> -> <p class="toc"> -> <big><b>CONTENTS</b></big> -> empty paragraphs -> </blockquote>
  processedHtmlContent = processedHtmlContent.replace(
    /<blockquote[^>]*>\s*<p[^>]*class="toc"[^>]*>\s*<big[^>]*><b[^>]*>CONTENTS<\/b><\/big>[^<]*<\/p>\s*(?:<p[^>]*>\s*(?:<br\s*\/?>\s*)*<\/p>\s*)*(?:<p[^>]*class="toc"[^>]*>\s*<\/p>\s*)*<\/blockquote>/gi,
    ''
  );

  // Also catch blockquotes with just the CONTENTS in simple structure
  processedHtmlContent = processedHtmlContent.replace(
    /<blockquote[^>]*>\s*<p[^>]*class="toc"[^>]*>\s*<big[^>]*>[^<]*<b[^>]*>CONTENTS<\/b>[^<]*<\/big>\s*<\/p>\s*[\s\S]*?<\/blockquote>/gi,
    ''
  );

  // Remove any remaining empty CONTENTS sections (various container types)
  processedHtmlContent = processedHtmlContent.replace(
    /<(?:blockquote|div)[^>]*>\s*<p[^>]*>\s*<(?:big|span)[^>]*>(?:TABLE OF\s+)?CONTENTS<\/(?:big|span)>[^<]*<\/p>\s*(?:<p[^>]*>\s*<br\s*\/?>\s*<\/p>\s*)*<\/(?:blockquote|div)>/gi,
    ''
  );

  // Final pass: strip all remaining <hr> (including any from prepended title block) except for letters
  if (!isLetters) {
    processedHtmlContent = processedHtmlContent.replace(/<hr[^>]*\/?>/gi, '');
  }

  // Strip remaining link2H href links (from TOC structures not caught above)
  processedHtmlContent = processedHtmlContent.replace(
    /<a[^>]*href=["']#link2H[^"']*["'][^>]*>[\s\S]*?<\/a>/gi,
    ''
  );

  // Remove inner duplicate book-toc-collapsed-wrapper structures inside table cells (<td>)
  processedHtmlContent = processedHtmlContent.replace(
    /<td>\s*<div class=["']book-toc-collapsed-wrapper["']>\s*<div class=["']book-toc-content-inside["']>/gi,
    '<td>'
  );
  processedHtmlContent = processedHtmlContent.replace(
    /<\/div>\s*(?:<div class=["']book-toc-fade-overlay["']><\/div>\s*)?<button class=["']book-toc-expand-btn["']>[^<]*<\/button>\s*<\/div>\s*<\/td>/gi,
    '</td>'
  );

  return (
    <GenericBookReader 
      htmlContent={processedHtmlContent} 
      tocItems={tocItems} 
      bookTitle={cleanTitle} 
      bookSlug={decodedSlug}
    />
  );
}
