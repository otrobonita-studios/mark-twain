import { Suspense } from 'react';
import MLClient from './MLClient';

export const metadata = {
  title: "Machine Learning & Research API — Mark Twain Reappears",
  description: "Explore the linguistic style difference between Mark Twain's published books and private letters, analyze Huckleberry Finn slur usage, and test the embeddings search API.",
};

export default function MachineLearningPage() {
  return (
    <Suspense fallback={<div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>Loading...</div>}>
      <MLClient />
    </Suspense>
  );
}
