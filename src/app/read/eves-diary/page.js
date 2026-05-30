import fs from 'fs';
import path from 'path';
import BookReader from './BookReader';

export const metadata = {
  title: "Eve's Diary — Read Book",
  description: "Read Eve's Diary by Mark Twain with original illustrations and melancholic soundtrack.",
};

export default async function ReadPage() {
  const filePath = path.join(process.cwd(), 'rag/data-collection/TwainCorpus/HTML/Eve\'s-Diary.html');
  const htmlContent = fs.readFileSync(filePath, 'utf8');

  // Extract from line 96 to 1329 (0-indexed line numbers 95 to 1328)
  const lines = htmlContent.split('\n');
  let extractedContent = lines.slice(95, 1329).join('\n');

  // Clean up empty Project Gutenberg spacing paragraphs (e.g. <p><br><br></p>)
  extractedContent = extractedContent.replace(/<p>\s*(?:<br\s*\/?>\s*)*<\/p>/gi, '');

  // Group the first three figures (cover, frontispiece, title page) into a 3-column layout
  extractedContent = extractedContent.replace(
    /<div class="fig"[^>]*>\s*<img[^>]+cover\.jpg[^>]*>\s*(?:<br\s*\/?>)?\s*<\/div>\s*<div class="fig"[^>]*>\s*<img[^>]+front\.jpg[^>]*>\s*(?:<br\s*\/?>)?\s*<\/div>\s*<div class="fig"[^>]*>\s*<img[^>]+title\.jpg[^>]*>\s*(?:<br\s*\/?>)?\s*<\/div>/gi,
    `<div class="book-cover-trio">
      <div class="fig-trio-item"><img alt="cover.jpg" src="/images/eves-diary/cover.jpg" /></div>
      <div class="fig-trio-item"><img alt="front.jpg" src="/images/eves-diary/front.jpg" /></div>
      <div class="fig-trio-item"><img alt="title.jpg" src="/images/eves-diary/title.jpg" /></div>
    </div>`
  );

  // Move inline illustrations into the following paragraph with alternating floats
  let imgCount = 0;
  extractedContent = extractedContent.replace(
    /<div class="fig"[^>]*>\s*<img([^>]+src="([^"]+)"[^>]*)>\s*(?:<br\s*\/?>)?\s*<\/div>\s*(?:<p>\s*(?:<br\s*\/?>\s*)*<\/p>\s*)*<p>/gi,
    (match, imgAttrs, src) => {
      const altMatch = imgAttrs.match(/alt="([^"]+)"/i);
      const alt = altMatch ? altMatch[1] : '';
      const floatClass = imgCount % 2 === 0 ? 'img-float-right' : 'img-float-left';
      imgCount++;
      return `<p><span class="circle-img-wrapper ${floatClass}"><img src="${src}" alt="${alt}" class="in-paragraph-img" /><span class="zoom-hover-overlay"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path></svg></span></span>`;
    }
  );

  // Inject "Ask Mark" interactive link next to "Translated from the Original" heading
  extractedContent = extractedContent.replace(
    /<h3>\s*Translated from the Original\s*<\/h3>/gi,
    `<h3>
      Translated from the Original <small style="margin-left: 10px; font-size: 0.65em; font-family: var(--font-mono), monospace;"><a href="/chat?query=Can you explain 'Translated from the Original' in the context of Eve's Diary?" style="color: #d9a34a; text-decoration: none; cursor: pointer;">Ask Mark</a></small>
    </h3>`
  );

  return <BookReader htmlContent={extractedContent} />;
}
