import { Suspense } from 'react';
import AudioClient from '../AudioClient';

export async function generateStaticParams() {
  return [
    { format: 'short' },
    { format: 'long' },
    { format: 'swedish' }
  ];
}

export async function generateMetadata({ params }) {
  const { format } = await params;
  const titles = {
    short: "Short & Tech-Focused Podcast",
    long: "In-depth Book Focus Podcast",
    swedish: "Swedish Translation Podcast"
  };
  return {
    title: `${titles[format] || "Podcast"} — Mark Twain Audio Desk`,
    description: `Listen to the ${format} version of the Debrief of a Dead Man podcast on the digital double of Mark Twain.`,
  };
}

export default async function AudioFormatPage({ params }) {
  const { format } = await params;
  
  return (
    <Suspense fallback={<div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>Loading...</div>}>
      <AudioClient initialFormat={format} />
    </Suspense>
  );
}
