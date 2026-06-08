import fs from 'fs';
import path from 'path';
import GenericBookReader from '@/components/GenericBookReader';

export const metadata = {
  title: "Eve's Diary — Read Book",
  description: "Read Eve's Diary by Mark Twain with original illustrations and melancholic soundtrack.",
};

export default async function ReadPage() {
  const jsonPath = path.join(process.cwd(), 'src/data/books/json/Eves-Diary.json');
  const doc = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  return (
    <GenericBookReader 
      document={doc} 
      bookSlug="eves-diary" 
    />
  );
}
