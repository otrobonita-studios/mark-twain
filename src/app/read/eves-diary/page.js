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

  // Inject "Ask Mark" interactive link next to "Translated from the Original" heading
  extractedContent = extractedContent.replace(
    /<h3>\s*Translated from the Original\s*<\/h3>/gi,
    `<h3>
      Translated from the Original <small style="margin-left: 10px; font-size: 0.65em; font-family: var(--font-mono), monospace;"><a href="/chat?query=Eve's Diary was 'Translated from the Original'. What original language did you translate Eve's Diary from, and is it a joke?" style="color: #d9a34a; text-decoration: none; cursor: pointer;">Ask Mark</a></small>
    </h3>`
  );

  return <BookReader htmlContent={extractedContent} />;
}
