import fs from 'fs';
import path from 'path';
import GenericBookReader from '@/components/GenericBookReader';

export const metadata = {
  title: "Eve's Diary (Young Readers Edition) — Read Book",
  description: "Read the Young Readers Edition of Eve's Diary by Mark Twain, ages 7-9, with interactive glossary and illustrations.",
  alternates: {
    canonical: 'https://mark.otrobonita.com/read/eves-diary'
  }
};

export default async function YoungReadersPage() {
  const jsonPath = path.join(process.cwd(), 'src/data/books/json/Eves-Diary-young-readers.json');
  const doc = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            "@id": "https://mark.otrobonita.com/read/eves-diary",
            "url": "https://mark.otrobonita.com/read/eves-diary",
            "name": doc.meta.title || "Eve's Diary (Young Readers Edition)",
            "author": {
              "@type": "Person",
              "name": "Mark Twain"
            },
            "inLanguage": "en"
          })
        }}
      />
      <GenericBookReader 
        document={doc} 
        bookSlug="Eves-Diary-young-readers" 
        defaultExperience="child" 
      />
    </>
  );
}
