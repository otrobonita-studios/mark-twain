import fs from 'fs';
import path from 'path';
import GenericBookReader from '@/components/GenericBookReader';

function findBookFile(slug) {
  const baseDir = process.cwd();
  
  // 1. Check in src/data/books/
  let htmlPath = path.join(baseDir, 'src/data/books', `${slug}.html`);
  if (fs.existsSync(htmlPath)) return { path: htmlPath, type: 'html' };
  
  let txtPath = path.join(baseDir, 'src/data/books', `${slug}.txt`);
  if (fs.existsSync(txtPath)) return { path: txtPath, type: 'txt' };

  // 2. Check in rag/data-collection/TwainCorpus/converted/
  htmlPath = path.join(baseDir, 'rag', 'data-collection', 'TwainCorpus', 'converted', `${slug}.html`);
  if (fs.existsSync(htmlPath)) return { path: htmlPath, type: 'html' };

  // 3. Check for .txt in project-gutenberg/Works/
  txtPath = path.join(baseDir, 'rag', 'data-collection', 'TwainCorpus', 'project-gutenberg', 'Works', `${slug}.txt`);
  if (fs.existsSync(txtPath)) return { path: txtPath, type: 'txt' };

  // 4. Check in rag/data-collection/
  txtPath = path.join(baseDir, 'rag', 'data-collection', `${slug}.txt`);
  if (fs.existsSync(txtPath)) return { path: txtPath, type: 'txt' };

  return null;
}

export async function generateStaticParams() {
  const dirs = [
    path.join(process.cwd(), 'src/data/books'),
    path.join(process.cwd(), 'rag/data-collection/TwainCorpus/converted')
  ];
  const slugs = new Set();
  
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.endsWith('.html') || file.endsWith('.txt')) {
          slugs.add(file.replace(/\.(html|txt)$/, ''));
        }
      }
    }
  }
  
  // Add other known slugs from Gutenberg works if directories exist
  const worksDir = path.join(process.cwd(), 'rag/data-collection/TwainCorpus/project-gutenberg/Works');
  if (fs.existsSync(worksDir)) {
    const files = fs.readdirSync(worksDir);
    for (const file of files) {
      if (file.endsWith('.txt')) {
        slugs.add(file.replace(/\.txt$/, ''));
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
  const fileInfo = findBookFile(bookSlug);
  
  if (!fileInfo) {
    return {
      title: "Book Not Found",
      description: "The requested book was not found."
    };
  }

  let cleanTitle = bookSlug.replace(/-/g, ' ');

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
      cleanTitle = bookSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    
    return {
      title: `${cleanTitle} — Read Book`,
      description: `Read ${cleanTitle} by Mark Twain in a beautiful interactive format.`
    };
  } catch (e) {
    return {
      title: "Read Book"
    };
  }
}

export default async function ReadPage({ params }) {
  const { bookSlug } = await params;
  const fileInfo = findBookFile(bookSlug);

  if (!fileInfo) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#ff5555', backgroundColor: '#15110d', minHeight: '100vh' }}>
        Error: Book "{bookSlug}" not found.
      </div>
    );
  }

  const rawContent = fs.readFileSync(fileInfo.path, 'utf8');
  let processedHtmlContent = '';
  let tocItems = [];
  let cleanTitle = bookSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

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
    
    // Strip outer book-text-content div wrapper
    if (cleanContent.startsWith('<div class="book-text-content">') && cleanContent.endsWith('</div>')) {
      cleanContent = cleanContent.substring(31, cleanContent.length - 6);
    }

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
        tocItems.push({
          id,
          label: cleanLabel,
          type: 'section'
        });
      }

      if (!attrs.includes('id=')) {
        return `<h2 id="${id}"${attrs}>${innerContent}</h2>`;
      }
      return match;
    });

    const titleMatch = rawContent.match(/<title>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      cleanTitle = titleMatch[1]
        .replace(/\s*\|\s*Project Gutenberg/gi, '')
        .replace(/\s*,\s*by Mark Twain/gi, '')
        .replace(/\s*by Mark Twain/gi, '')
        .trim();
    }
  } else {
    // Convert text to HTML paragraphs and extract TOC items
    const parsed = formatTxtToHtml(rawContent);
    processedHtmlContent = parsed.htmlContent;
    tocItems = parsed.tocItems;
  }

  // Wrap list of illustrations in a collapsible container
  processedHtmlContent = processedHtmlContent.replace(
    /(<h2[^>]*>(?:LIST OF\s+)?ILLUSTRATIONS\.?<\/h2>\s*(?:<\/div>\s*)?)(\s*<table[^>]*>[\s\S]*?<\/table>)/gi,
    (match, heading, table) => {
      return `${heading}
<div class="book-loi-collapsed-wrapper">
  <div class="book-loi-content-inside">
    ${table}
  </div>
  <button class="book-loi-expand-btn">
    Illustrations <span class="chevron">▼</span>
  </button>
</div>`;
    }
  );

  return (
    <GenericBookReader 
      htmlContent={processedHtmlContent} 
      tocItems={tocItems} 
      bookTitle={cleanTitle} 
    />
  );
}
