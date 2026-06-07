import { Suspense } from 'react';
import RebuildClient from './RebuildClient';

export const metadata = {
  title: "The Rebuild Process — Mark Twain Reappears",
  description: "Discover how we are building Mark Twain's digital reappearance, utilizing standard digital libraries, vector search, and custom pipelines.",
};

export default function RebuildProcessPage() {
  return (
    <Suspense fallback={<div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>Loading...</div>}>
      <RebuildClient />
    </Suspense>
  );
}
