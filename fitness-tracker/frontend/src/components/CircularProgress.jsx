import React, { useEffect, useState } from 'react';

export default function CircularProgress({ score, size = 120, strokeWidth = 10 }) {
  const [offset, setOffset] = useState(283);
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  let color = 'var(--score-d)';
  if (score >= 90) color = 'var(--score-a)';
  else if (score >= 75) color = 'var(--score-b)';
  else if (score >= 60) color = 'var(--score-c)';

  useEffect(() => {
    const targetOffset = circumference - (score / 100) * circumference;
    setTimeout(() => setOffset(targetOffset), 100);
  }, [score, circumference]);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth}
        />
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: '24px', fontWeight: 800, color: 'white' }}>{score}</span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/ 100</span>
      </div>
    </div>
  );
}
