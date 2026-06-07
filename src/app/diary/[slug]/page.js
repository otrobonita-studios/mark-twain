import { notFound } from 'next/navigation';
import { diaryCopy } from '@/data/copy_i18n';
import DiaryEntryClient from './DiaryEntryClient';

export async function generateStaticParams() {
  return diaryCopy.en.entries.map((entry) => ({
    slug: entry.slug
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = diaryCopy.en.entries.find((e) => e.slug === slug);
  if (!entry) return {};
  
  return {
    title: `${entry.title} — The Diary of Mark Twain`,
    description: entry.content.substring(0, 160) + "...",
  };
}

export default async function DiaryEntryPage({ params }) {
  const { slug } = await params;
  const entry = diaryCopy.en.entries.find((e) => e.slug === slug);
  
  if (!entry) {
    notFound();
  }

  return <DiaryEntryClient entry={entry} />;
}
