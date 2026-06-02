import fs from 'fs';
import path from 'path';
import GenericBookReader from '@/components/GenericBookReader';

export const metadata = {
  title: "Mark Twain — A Biographical Summary",
  description: "A detailed biographical summary of Samuel Langhorne Clemens (Mark Twain), written by Albert Bigelow Paine.",
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
      id: 'bio-title',
      label: 'Biographical Summary',
      type: 'section'
    }
  ];

  // Make sure the title element inside htmlContent has id="bio-title"
  if (htmlContent.includes('<h2>')) {
    htmlContent = htmlContent.replace('<h2>', '<h2 id="bio-title">');
  }

  // Prepend the premium book title block
  const titleBlock = `
    <div class="book-title-block">
      <h1>MARK TWAIN</h1>
      <h2>A Biographical Summary</h2>
      <h2>By Albert Bigelow Paine</h2>
    </div>
    <hr />
  `;

  const fullContent = titleBlock + htmlContent;

  return (
    <GenericBookReader 
      htmlContent={fullContent} 
      tocItems={tocItems} 
      bookTitle="About Mark" 
    />
  );
}
