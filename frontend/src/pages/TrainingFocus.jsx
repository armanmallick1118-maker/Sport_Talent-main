import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function TrainingFocus() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('athleteProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }

    const fetchSuggestions = async () => {
      try {
        const response = await API.get('/api/v1/ai-suggestions/me');
        setAiSuggestion(response.data.data);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
          return;
        }
        setError(err.response?.data?.error || 'Network error. Ensure backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [navigate]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-purple-500/10 border border-purple-500/30 text-purple-600 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
              ✨ AI Powered Analysis
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">
            Your Training Focus
          </h1>
          <p className="text-slate-500 text-sm">
            AI-optimized training roadmap customized for {profile?.name || 'Athlete'}.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center min-w-[220px]">
          <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Status</span>
          <span className="text-xl font-bold text-emerald-600">
             {loading ? 'Analyzing...' : 'Ready to Train'}
          </span>
        </div>
      </div>

      {loading && (
        <div className="text-center py-20 text-slate-500 animate-pulse">
          Generating personalized AI insights based on your metrics...
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-6 mb-8">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {!loading && aiSuggestion && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          
          {/* Best Sport Recommendation */}
          <div className="bg-white border rounded-2xl p-8 shadow-sm border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Recommended Sport</h2>
            <p className="text-slate-500 text-sm mb-6">Based on your physical metrics, you show high potential in this field.</p>
            
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-4xl">🏆</div>
              <div>
                <h3 className="text-2xl font-bold text-blue-600">{aiSuggestion.recommended_sport}</h3>
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Perfect Match</span>
              </div>
            </div>
          </div>

          {/* Improvement Tips */}
          <div className="bg-white border rounded-2xl p-8 shadow-sm border-slate-200 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10 opacity-50"></div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">How to Improve</h2>
            <p className="text-slate-500 text-sm mb-6">Actionable advice from your AI Coach.</p>
            
            <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100/50">
              <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
                {aiSuggestion.improvement_tips}
              </p>
            </div>
          </div>

        </div>
      )}

      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate('/analytics')}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium px-6 py-3 rounded-xl transition-all cursor-pointer"
        >
          ← Back to Analytics
        </button>
        <button
          onClick={() => navigate('/athlete/dashboard')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-all cursor-pointer"
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  );
}
