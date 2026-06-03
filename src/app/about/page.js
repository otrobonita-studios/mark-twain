import fs from 'fs';
import path from 'path';
import AboutPageClient from './AboutPageClient';

export const metadata = {
  title: "About Me — Mark Twain",
  description: "An introduction by Mark Twain, against his better judgment.",
};

export default async function AboutPage() {
  const baseDir = process.cwd();
  const twainBioPath = path.join(baseDir, 'src/data/about.html');
  const albertBioPath = path.join(baseDir, 'src/data/albert_bio.html');
  
  let twainHtml = '';
  let albertHtml = '';

  try {
    twainHtml = fs.readFileSync(twainBioPath, 'utf8');
  } catch (e) {
    twainHtml = '<p>Error loading Twain introduction.</p>';
  }

  try {
    albertHtml = fs.readFileSync(albertBioPath, 'utf8');
  } catch (e) {
    albertHtml = '<p>Error loading biographical summary.</p>';
  }

  return (
    <AboutPageClient 
      twainHtml={twainHtml} 
      albertHtml={albertHtml} 
    />
  );
}
