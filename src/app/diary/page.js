import { Suspense } from 'react';
import DiaryClient from './DiaryClient';

export const metadata = {
  title: "Extracts from my Diary — Mark Twain Reappears",
  description: "Read the diary log entries of the digital double of Mark Twain as he documents his resurrection, AI models, and thoughts on modern society.",
};

export default function DiaryPage() {
  return (
    <Suspense fallback={<div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>Loading...</div>}>
      <DiaryClient />
    </Suspense>
  );
}
