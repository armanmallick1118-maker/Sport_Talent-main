import React from 'react';

export default function BrandMark({ light = false, compact = false }) {
  return (
    <div className={`flex items-center gap-2.5 ${compact ? '' : ''}`}>
      <span
        className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl"
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 55%, #ec4899 100%)',
        }}
      >
        <svg viewBox="0 0 32 32" className="h-6 w-6 text-white" fill="currentColor" aria-hidden>
          <path d="M8.2 24.2c1.4-3.6 2.8-7.1 3.1-9.4.2-1.6-.3-2.4-1.3-3.1 1.9.2 3.3 1.4 3.9 3.4.7 2.3.3 5.4-.6 8.4l-5.1.7z" />
          <path d="M16 23.8c.6-3.8 1.4-7.4 1.2-9.8-.1-1.8-1-2.7-2.2-3.2 2.2.1 3.8 1.6 4.2 3.8.5 2.6-.2 6.1-1.2 9.2H16z" />
          <path d="M23.4 24.1c.2-3.4.2-6.8-.6-9.1-.6-1.8-1.8-2.7-3.2-3 2.4.4 4.2 2.1 4.7 4.4.5 2.4.1 5.3-.4 7.7h-.5z" />
        </svg>
      </span>
      <span className="text-left leading-tight">
        <span className={`block font-semibold tracking-tight ${light ? 'text-white' : 'text-slate-900'} ${compact ? 'text-base' : 'text-lg'}`}>
          SportTalent
        </span>
        {!compact && (
          <span className={`block text-[11px] ${light ? 'text-slate-400' : 'text-slate-500'}`}>
            Measure. Prove. Get Discovered.
          </span>
        )}
      </span>
    </div>
  );
}
