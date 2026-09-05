import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Activity, Rss, Compass, User, Bot } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const role = localStorage.getItem('role');
  const isAuth = ['/', '/login', '/register'].includes(location.pathname);

  if (isAuth || role !== 'athlete') return null;

  const items = [
    { to: '/athlete/dashboard', label: 'Home', icon: Home },
    { to: '/sports', label: 'Assess', icon: Activity },
    { to: '/feed',             label: 'Feed',    icon: Rss },
    { to: '/leaderboard', label: 'Discover', icon: Compass },
    { to: '/coach-jack',  label: 'Jack',     icon: Bot },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-w-[64px] flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
