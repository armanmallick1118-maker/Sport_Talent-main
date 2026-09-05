import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function AlertBanner({ alerts = [] }) {
  if (alerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
      {alerts.map((alert, i) => {
        let Icon = Info;
        let color = 'var(--accent-blue)';
        let bg = 'rgba(59,130,246,0.1)';
        
        if (alert.severity === 'critical') {
          Icon = AlertTriangle;
          color = 'var(--accent-red)';
          bg = 'rgba(239,68,68,0.1)';
        } else if (alert.severity === 'warning') {
          Icon = AlertCircle;
          color = 'var(--accent-yellow)';
          bg = 'rgba(245,158,11,0.1)';
        }

        const text = typeof alert === 'string' ? alert : alert.message;
        const prefix = typeof alert === 'string' ? 'Insight' : alert.type;

        return (
          <div key={i} style={{
            display: 'flex', gap: '12px', alignItems: 'center',
            padding: '12px', borderRadius: '12px',
            background: bg, border: `1px solid ${color}40`
          }} className={alert.severity === 'critical' ? 'animate-pulse' : ''}>
            <Icon color={color} size={20} />
            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              <strong>{prefix}:</strong> {text}
            </div>
          </div>
        );
      })}
    </div>
  );
}
