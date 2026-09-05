import React, { useEffect, useState } from 'react';
import API from '../services/api';
import ScoutFilters from '../components/scout-directory/ScoutFilters';
import ScoutCard from '../components/scout-directory/ScoutCard';

export default function ScoutDirectory() {
  const [scouts, setScouts] = useState([]); 
  const [filters, setFilters] = useState({ search: '', sport: '', region: '', organization_type: '' }); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState('');

  useEffect(() => { 
    const timer = setTimeout(async () => { 
      try { 
        setLoading(true); 
        const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value)); 
        
        // Fetch real scouts
        let dbScouts = [];
        try {
          const response = await API.get('/api/v1/scouts', { params }); 
          dbScouts = Array.isArray(response.data) ? response.data : [];
        } catch (e) {
          console.error("DB fetch failed:", e);
        }

        // Fetch mock scouts
        let mockScouts = [];
        try {
          const geoResponse = await API.get('/api/v1/plugins/geospatial/data');
          const coaches = geoResponse.data.items.filter(item => item.role === 'coach');
          
          mockScouts = coaches.map(item => ({
            id: item.id,
            user: {
              profile: {
                full_name: item.name,
                avatar_url: item.avatar
              }
            },
            organization: item.organization,
            organization_type: 'Academy',
            region: item.region,
            specialization: item.specialization ? item.specialization.split('&').map(s => s.trim()) : [],
            mockData: {
              id: item.id,
              email: `contact_${item.id}@example.com`,
              user: {
                profile: {
                  full_name: item.name,
                  avatar_url: item.avatar
                }
              },
              organization: item.organization,
              organization_type: 'Academy',
              region: item.region,
              specialization: item.specialization ? item.specialization.split('&').map(s => s.trim()) : []
            }
          }));
        } catch (e) {
          console.error("Mock fetch failed:", e);
        }
        
        setScouts([...dbScouts, ...mockScouts]); 
      } catch { 
        setError('Unable to load scouts right now.'); 
      } finally { 
        setLoading(false); 
      } 
    }, 250); 
    return () => clearTimeout(timer); 
  }, [filters]);

  const change = (event) => setFilters({ ...filters, [event.target.name]: event.target.value });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-7">
        <p className="text-sm font-semibold text-blue-600">Verified professionals</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Find a Scout</h1>
        <p className="mt-2 text-slate-500">Discover approved talent scouts and request an evaluation of your results.</p>
      </div>

      <ScoutFilters filters={filters} onChange={change} />

      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading verified scouts?</p>
      ) : scouts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No verified scouts match those filters yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scouts.map((scout) => (
            <ScoutCard key={scout.id} scout={scout} />
          ))}
        </div>
      )}
    </main>
  );
}
