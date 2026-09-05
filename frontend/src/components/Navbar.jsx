import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import BrandMark from './BrandMark';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role') || 'athlete';
  const isAuth = ['/', '/login', '/register'].includes(location.pathname);

  if (isAuth) return null;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const athleteLinks = [
    { to: '/athlete/dashboard', label: 'Home' },
    { to: '/sports', label: 'Assessments' },
    { to: '/feed', label: 'Feed' },
    { to: '/leaderboard', label: 'Discover' },
    { to: '/coach-jack', label: 'Coach Jack' },
    { to: '/geospatial', label: 'Geo Radar' },
    { to: '/profile', label: 'Profile' },
  ];

  const scoutLinks = [
    { to: '/scout/dashboard', label: 'Dashboard' },
    { to: '/coach-jack', label: 'Coach Jack' },
    { to: '/geospatial', label: 'Geo Radar' },
  ];

  const links = role === 'scout' ? scoutLinks : athleteLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to={role === 'scout' ? '/scout/dashboard' : '/athlete/dashboard'}>
          <BrandMark compact />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
          </button>
          <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:inline">
            {role}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 items-center gap-1.5 rounded-full border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
