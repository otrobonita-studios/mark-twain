import { Suspense } from 'react';
import ChatClient from './ChatClient';

export const metadata = {
  title: "Converse with Mark Twain — AI Reappearance Chat",
  description: "Discuss modern technology, the AI bubble, and Stella Studios directly with the digital reappearance of Mark Twain.",
};

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>Loading...</div>}>
      <ChatClient />
    </Suspense>
  );
}
