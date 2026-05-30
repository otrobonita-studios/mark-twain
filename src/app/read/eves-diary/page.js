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

  return <BookReader htmlContent={extractedContent} />;
}
