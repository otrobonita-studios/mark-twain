import fs from 'fs';
import path from 'path';
import GenericBookReader from '@/components/GenericBookReader';

export const metadata = {
  title: "About Me — Mark Twain",
  description: "An introduction by Mark Twain, against his better judgment.",
};

export default async function AboutPage() {
  const baseDir = process.cwd();
  const bioPath = path.join(baseDir, 'src/data/about.html');
  
  let htmlContent = '';
  try {
    htmlContent = fs.readFileSync(bioPath, 'utf8');
  } catch (e) {
    htmlContent = '<p>Error loading biography.</p>';
  }

  // Define a simple Table of Contents item for the page
  const tocItems = [
    {
      id: 'intro-title',
      label: 'An Introduction',
      type: 'section'
    }
  ];

  // Make sure the title element inside htmlContent has id="intro-title"
  if (htmlContent.includes('<h2>')) {
    htmlContent = htmlContent.replace('<h2>', '<h2 id="intro-title">');
  }

  // Prepend the premium book title block
  const titleBlock = `
    <div class="book-title-block">
      <h1>MARK TWAIN</h1>
      <h2>An Introduction</h2>
      <h2>Against My Better Judgment</h2>
    </div>
    <hr />
  `;

  const fullContent = titleBlock + htmlContent;

  return (
    <GenericBookReader 
      htmlContent={fullContent} 
      tocItems={tocItems} 
      bookTitle="About Me" 
      showExperienceSelector={false}
    />
  );
}
