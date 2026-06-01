'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TxtReaderClient from '../../../components/TxtReaderClient';

function TxtViewerContent() {
  const searchParams = useSearchParams();
  const file = searchParams.get('file') || '';

  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!file) {
      setError('Error: No file specified.');
      setLoading(false);
      return;
    }

    async function loadFile() {
      try {
        const res = await fetch(`/api/txt?file=${encodeURIComponent(file)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setContent(data.content);
        } else {
          setError(data.error || 'Failed to load text file.');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while loading the file.');
      } finally {
        setLoading(false);
      }
    }

    loadFile();
  }, [file]);

  if (!file) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#ff5555' }}>
        Error: No file specified. Please provide a file parameter (e.g. ?file=Adventures-of-Tom-Sawyer.txt)
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#15110d] text-[#fff4df] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[var(--primary)] border-b-2"></div>
          <div>Loading manuscript: {file}...</div>
        </div>
      </div>
    );
  }

  return (
    <TxtReaderClient 
      filename={file} 
      initialContent={content} 
      initialError={error} 
    />
  );
}

export default function TxtViewerPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-[#15110d] text-[#fff4df] flex items-center justify-center font-mono">
        <div>Initializing Reader...</div>
      </div>
    }>
      <TxtViewerContent />
    </Suspense>
  );
}
