import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, MapPin } from 'lucide-react';

export default function ScoutCard({ scout }) {
  return (
    <Link 
      to={`/scouts/${scout.id}`} 
      state={{ mockData: scout.mockData }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300"
    >
      <div className="flex items-start justify-between">
        {scout.user.profile?.avatar_url ? (
          <img 
            src={scout.user.profile.avatar_url} 
            alt={scout.user.profile?.full_name || 'Scout'} 
            className="h-11 w-11 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
            {(scout.user.profile?.full_name || 'S').slice(0, 1)}
          </div>
        )}
        <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
          <BadgeCheck size={16} /> Verified
        </span>
      </div>
      <h2 className="mt-4 font-semibold text-slate-900">
        {scout.user.profile?.full_name || 'Scout'}
      </h2>
      <p className="text-sm text-slate-500">
        {scout.organization} A {scout.organization_type}
      </p>
      <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
        <MapPin size={14} />
        {scout.region}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {scout.specialization?.map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
