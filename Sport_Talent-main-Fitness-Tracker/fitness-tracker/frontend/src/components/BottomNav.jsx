import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Activity, Apple, ActivitySquare, Bot, LogOut } from 'lucide-react';

export default function BottomNav() {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/workout', icon: Activity, label: 'Workout' },
    { to: '/nutrition', icon: Apple, label: 'Food' },
    { to: '/lab-reports', icon: ActivitySquare, label: 'Labs' },
    { to: '/ai-report', icon: Bot, label: 'AI Score' }
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      width: '100%',
      maxWidth: 480,
      background: 'rgba(17, 24, 39, 0.9)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '12px 0 20px 0',
      zIndex: 50
    }}>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'none',
            color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)',
            transition: 'color 0.2s'
          })}
        >
          {({ isActive }) => (
            <>
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 500 }}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
      <button 
        onClick={() => { localStorage.removeItem('healthUserId'); window.location.href = '/setup'; }} 
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--accent-red)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8 }}
      >
        <LogOut size={24} strokeWidth={2} />
        <span style={{ fontSize: '10px', fontWeight: 500 }}>Logout</span>
      </button>
    </nav>
  );
}
