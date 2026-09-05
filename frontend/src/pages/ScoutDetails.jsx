import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Mail, MessageSquare, BadgeCheck, MapPin, Building2 } from 'lucide-react';
import API from '../services/api';

export default function ScoutDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const mockData = location.state?.mockData;
  
  const [scout, setScout] = useState(mockData || null);
  const [loading, setLoading] = useState(!mockData);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mockData) return;
    
    const fetchScout = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/api/v1/scouts/${id}`);
        setScout(response.data);
      } catch (err) {
        console.error(err);
        setError('Unable to load scout profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchScout();
  }, [id, mockData]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading scout profile...</div>;
  }

  if (error || !scout) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error || 'Scout not found'}</p>
        <button onClick={() => navigate('/scout-directory')} className="text-blue-500 underline">
          Return to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/scout-directory')}
          className="mb-6 text-slate-500 hover:text-slate-900 transition flex items-center gap-2"
        >
          ← Back to Directory
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl font-semibold text-blue-700 shrink-0">
                {(scout.user.profile?.full_name || 'S').slice(0, 1)}
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-slate-900">
                    {scout.user.profile?.full_name || 'Scout'}
                  </h1>
                  <span className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                    <BadgeCheck size={16} /> Verified
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-slate-600">
                  <p className="flex items-center gap-2">
                    <Building2 size={18} className="text-slate-400" />
                    <span className="font-medium">{scout.organization}</span> ({scout.organization_type})
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={18} className="text-slate-400" />
                    {scout.region}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {scout.specialization?.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col w-full md:w-auto gap-3 shrink-0">
              <a
                href={`mailto:${scout.email}`}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                <Mail size={18} /> Send Email
              </a>
              <button
                onClick={() => alert("Direct messaging is coming soon!")}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
              >
                <MessageSquare size={18} /> Start Chat
              </button>
            </div>
          </div>
        </div>

        <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">About the Scout</h2>
          <p className="text-slate-600 leading-relaxed">
            {scout.user.profile?.full_name || 'This scout'} is an approved talent scout on Sport Talent representing {scout.organization}. 
            They specialize in {scout.specialization?.join(', ')} and are actively looking for promising athletes in {scout.region}.
          </p>
          <p className="text-slate-600 leading-relaxed mt-4">
            If you believe your stats match their requirements, you can send them an email to introduce yourself and share your profile link.
          </p>
        </section>
      </div>
    </div>
  );
}
