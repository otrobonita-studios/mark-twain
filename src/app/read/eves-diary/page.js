import { getDiaryData } from './getDiaryData';
import BookReader from './BookReader';

export const metadata = {
  title: "Eve's Diary — Read Book",
  description: "Read Eve's Diary by Mark Twain with original illustrations and melancholic soundtrack.",
};

export default async function ReadPage() {
  const { htmlContent, tocItems } = getDiaryData();
  return <BookReader htmlContent={htmlContent} tocItems={tocItems} />;
}
