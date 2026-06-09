import fs from 'fs';
import path from 'path';
import GenericBookReader from '@/components/GenericBookReader';

export const metadata = {
  title: "Eve's Diary — Read Book",
  description: "Read Eve's Diary by Mark Twain with original illustrations and melancholic soundtrack.",
  alternates: {
    canonical: 'https://mark.otrobonita.com/read/eves-diary'
  }
};

export default async function ReadPage() {
  const jsonPath = path.join(process.cwd(), 'src/data/books/json/Eves-Diary.json');
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
            "name": doc.meta.title || "Eve's Diary",
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
        bookSlug="eves-diary" 
      />
    </>
  );
}
