'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Root App Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#15110d] text-[#fff4df] text-center font-sans">
      <div className="max-w-md w-full border border-[rgba(217,163,74,0.15)] bg-[#1d1611] p-8 rounded-xl shadow-2xl">
        <h2 className="text-[2rem] font-bold text-[var(--primary)] mb-4">Great Scott!</h2>
        <p className="text-sm opacity-80 leading-relaxed mb-6 font-sans">
          The machinery has suffered a slight interruption. We have sent our best telegraph operators to investigate.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => reset()}
            className="btn-gold cursor-pointer px-4 py-2 text-xs typewriter uppercase tracking-wider"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="cursor-pointer border border-[rgba(255,244,223,0.12)] hover:border-[var(--primary)] px-4 py-2 text-xs typewriter uppercase tracking-wider text-[var(--primary)] hover:text-white transition-colors"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
