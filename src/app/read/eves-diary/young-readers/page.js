import { getDiaryData } from '../getDiaryData';
import BookReader from '../BookReader';

export const metadata = {
  title: "Eve's Diary (Young Readers Edition) — Read Book",
  description: "Read the Young Readers Edition of Eve's Diary by Mark Twain, ages 7-9, with interactive glossary and illustrations.",
};

export default async function YoungReadersPage() {
  const { htmlContent, tocItems } = getDiaryData();
  return (
    <BookReader 
      htmlContent={htmlContent} 
      tocItems={tocItems} 
      initialExperience="child" 
      initialSubExperience="young" 
    />
  );
}
