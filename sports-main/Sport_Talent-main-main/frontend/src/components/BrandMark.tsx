import React from 'react';

interface BrandMarkProps {
  light?: boolean;
  compact?: boolean;
}

export default function BrandMark({ light = false, compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/prana-logo.jpg"
        alt="PRANA Logo"
        className={`object-cover rounded-xl border border-cyan-500/30 shadow-md shadow-cyan-950/50 ${
          compact ? "h-8 w-8" : "h-11 w-11"
        }`}
      />
      <span className="text-left leading-tight">
        <span className={`block font-bold tracking-wider ${light ? 'text-white' : 'text-slate-900'} ${compact ? 'text-base' : 'text-xl font-mono'}`}>
          PRANA
        </span>
        {!compact && (
          <span className={`block text-[10px] ${light ? 'text-slate-400' : 'text-slate-500'} lowercase font-medium tracking-tight leading-tight mt-0.5`}>
            personal responsive adaptive network &amp; analytics
          </span>
        )}
      </span>
    </div>
  );
}
