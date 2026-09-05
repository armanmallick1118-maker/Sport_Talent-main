import React from 'react';
import { Search } from 'lucide-react';

export default function ScoutFilters({ filters, onChange }) {
  return (
    <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
      <label className="relative sm:col-span-2">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        <input 
          name="search" 
          value={filters.search} 
          onChange={onChange} 
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm" 
          placeholder="Search name, organisation, or specialisation" 
        />
      </label>
      <input 
        name="sport" 
        value={filters.sport} 
        onChange={onChange} 
        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" 
        placeholder="Sport" 
      />
      <input 
        name="region" 
        value={filters.region} 
        onChange={onChange} 
        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" 
        placeholder="Region" 
      />
      <select 
        name="organization_type" 
        value={filters.organization_type} 
        onChange={onChange} 
        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
      >
        <option value="">All organisation types</option>
        <option>Club</option>
        <option>National</option>
        <option>Independent</option>
        <option>Academy</option>
      </select>
    </div>
  );
}
