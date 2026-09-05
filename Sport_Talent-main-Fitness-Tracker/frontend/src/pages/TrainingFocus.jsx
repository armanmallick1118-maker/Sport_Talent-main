import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TrainingFocus() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('athleteProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  const trainingFocusList = [
    {
      id: 1,
      title: 'Agility',
      description: 'Enhance rapid directional changes, footwork speed, and dynamic balance on the field.',
      icon: '⚡',
      color: 'from-amber-500/20 border-amber-500/30 text-amber-400',
    },
    {
      id: 2,
      title: 'Endurance',
      description: 'Build high-intensity stamina to maintain peak performance throughout match halves.',
      icon: '🔥',
      color: 'from-blue-500/20 border-blue-500/30 text-blue-400',
    },
  ];

  const recommendations = [
    {
      category: 'Cone drills',
      desc: 'Improves sharp cutting angles, acceleration, and deceleration mechanics.',
      duration: '15 mins / session',
    },
    {
      category: 'Shuttle runs',
      desc: 'Boosts explosive anaerobic capacity and multi-directional recovery speed.',
      duration: '4 sets of 5 reps',
    },
    {
      category: 'Interval training',
      desc: 'Maximizes VO2 max and trains your heart to recover rapidly under fatigue.',
      duration: '20 mins high-intensity',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
              Phase 16 Recommendations
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">
            Your Training Focus
          </h1>
          <p className="text-slate-500 text-sm">
            AI-optimized training roadmap customized for {profile?.name || 'Athlete'} ({profile?.primarySport || 'Football'}).
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center min-w-[220px]">
          <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Status</span>
          <span className="text-xl font-bold text-emerald-400">Ready to Train</span>
        </div>
      </div>

      {/* Focus Area Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Core Performance Priorities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trainingFocusList.map((item, index) => (
            <div
              key={item.id}
              className={`bg-white border rounded-2xl p-6 shadow-sm relative overflow-hidden flex items-start gap-4 border-slate-200`}
            >
              <div className="text-3xl bg-slate-50 p-3 rounded-xl border border-slate-200">
                {item.icon}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  Priority 0{index + 1}
                </span>
                <h3 className="text-2xl font-semibold text-slate-900 mt-0.5 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Drills Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Recommended Routine</h2>
          <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
            Tailored for Agility & Endurance
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded">
                    Recommended
                  </span>
                  <span className="text-slate-500 text-xs font-semibold">0{idx + 1}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{rec.category}</h3>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">{rec.desc}</p>
              </div>

              <div className="border-t border-slate-200 pt-3 mt-auto flex justify-between items-center text-xs text-slate-600 font-medium">
                <span>Suggested Duration:</span>
                <span className="text-blue-400">{rec.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

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