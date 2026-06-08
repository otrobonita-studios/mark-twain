import fs from 'fs';
import path from 'path';
import GenericBookReader from '@/components/GenericBookReader';

export const metadata = {
  title: "Eve's Diary (Young Readers Edition) — Read Book",
  description: "Read the Young Readers Edition of Eve's Diary by Mark Twain, ages 7-9, with interactive glossary and illustrations.",
};

export default async function YoungReadersPage() {
  const jsonPath = path.join(process.cwd(), 'src/data/books/json/Eves-Diary-young-readers.json');
  const doc = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  return (
    <GenericBookReader 
      document={doc} 
      bookSlug="Eves-Diary-young-readers" 
      defaultExperience="child" 
    />
  );
}
