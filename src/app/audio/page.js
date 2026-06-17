import { Suspense } from 'react';
import AudioClient from './AudioClient';

export const metadata = {
  title: "Audio Desk — Mark Twain Reappears",
  description: "Listen to the Mark Twain podcasts and songs related to the digital double's reappearance.",
};

export default function AudioPage() {
  return (
    <Suspense fallback={<div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>Loading...</div>}>
      <AudioClient />
    </Suspense>
  );
}
