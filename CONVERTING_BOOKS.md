# Guide: Importing and Converting Future Books

This guide outlines the workflow for importing public domain books (specifically from Project Gutenberg) into the Mark Twain Reappears reading layout. It ensures clean rendering, correct image routing, proper heading hierarchy, and consistent typography sizing.

---

## 1. Fetching the HTML Source

Use the provided Gutenberg archiving tools to download a clean source text:
1. Locate the book ID on [Project Gutenberg](https://www.gutenberg.org).
2. Execute the downloader tool inside the `rag/data-collection/gutenberg-archive` directory:
   ```bash
   python scripts/download_pg_archive.py \
       --index-url https://www.gutenberg.org/ebooks/<BOOK-ID> \
       --output-dir ./TwainCorpus \
       --with-text --with-metadata
   ```
3. Save the resulting raw HTML file into the local repository directory:
   `rag/data-collection/TwainCorpus/HTML/<Book-Name>.html`

---

## 2. Setting Up the Route & Slicing HTML

Because Gutenberg HTML files contain heavy header/footer legal notices and transcriber notes, we slice the content dynamically or statically to display only the book body.

Create the page file under `src/app/read/[book-id]/page.js`:

```javascript
import fs from 'fs';
import path from 'path';
import BookReader from '../eves-diary/BookReader'; // or shared component path

export const metadata = {
  title: "Book Title — Read Book",
  description: "Read Book Title by Mark Twain with original illustrations.",
};

export default async function ReadPage() {
  const filePath = path.join(process.cwd(), 'rag/data-collection/TwainCorpus/HTML/Book-Name.html');
  const htmlContent = fs.readFileSync(filePath, 'utf8');

  // Slice content by matching text boundaries or line splits
  const lines = htmlContent.split('\n');
  
  // Find start/end index dynamically by looking for markers
  const startIndex = lines.findIndex(line => line.includes('<h1>') && line.includes('BOOK TITLE'));
  const endIndex = lines.findIndex(line => line.includes('*** START OF THE PROJECT GUTENBERG EBOOK') || line.includes('*** END'));

  let extractedContent = lines.slice(startIndex, endIndex).join('\n');

  // CLEANUP STEP (See Section 3)
  extractedContent = cleanGutenbergHTML(extractedContent);

  return <BookReader htmlContent={extractedContent} />;
}
```

---

## 3. Cleaning Spacing & Empty Paragraphs

Project Gutenberg files contain inline `<br>` spacing inside empty `<p>` tags for vertical margin formatting. In modern CSS, these cause uneven spacing.

Apply this regular expression check to strip empty formatting rows:

```javascript
function cleanGutenbergHTML(html) {
  let cleaned = html;

  // Strip empty paragraphs containing only <br>s, whitespace, and tabs
  cleaned = cleaned.replace(/<p>\s*(?:<br\s*\/?>\s*)*<\/p>/gi, '');

  return cleaned;
}
```

---

## 4. Asset Formatting & Image Routing

Gutenberg HTML files point to relative image assets (e.g. `src="images/cover.jpg"`). To load them in Next.js:

1. Create a dedicated folder in public assets:
   `public/images/<book-id>/`
2. Move the original book illustrations and covers into this directory.
3. Update HTML image source tags using a regex helper in your loader, or manually adjust them to use absolute routes starting with `/images/<book-id>/`:
   ```javascript
   // Example image path rewrite helper
   cleaned = cleaned.replace(/src="images\/(.*?)"/g, 'src="/images/<book-id>/$1"');
   ```

---

## 5. CSS Typography Scaling

Ensure typography variables map to the page container classes `.book-page-parchment.size-small`, `.book-page-parchment.size-normal`, and `.book-page-parchment.size-large`. The standard sizes are:

```css
.book-page-parchment.size-small {
  --book-p-font-size: 1.35rem;
  --book-h1-font-size: 2.7rem;
  --book-h2-font-size: 1.8rem;
  --book-h3-font-size: 1.38rem;
  --book-pre-font-size: 0.95rem;
}
```

These font sizes are scaled proportionally inside media queries for iPads (`max-width: 1024px`) and Mobile Phones (`max-width: 768px`) in `globals.css` to keep reading layouts highly legible across viewports.
