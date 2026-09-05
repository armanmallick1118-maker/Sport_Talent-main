import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfileMatch() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('athleteProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  const strongestAttributes = [
    {
      id: 1,
      title: 'Speed',
      icon: '⚡',
      score: '96 / 100',
      description: 'Exceptional linear acceleration and high max velocity ratings measured via AI tracking.',
    },
    {
      id: 2,
      title: 'Agility',
      icon: '🔄',
      score: '92 / 100',
      description: 'Rapid directional changes, low deceleration times, and superior multi-directional footwork.',
    },
    {
      id: 3,
      title: 'Explosiveness',
      icon: '💥',
      score: '90 / 100',
      description: 'High vertical leap and powerful first-step reaction speed out of stationary positions.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
              Phase 17 Match Profile
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">
            Profile Match
          </h1>
          <p className="text-slate-500 text-sm">
            AI-verified performance breakdown and strongest physiological traits for {profile?.name || 'Athlete'}.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center min-w-[220px]">
          <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Overall Tier</span>
          <span className="text-xl font-bold text-amber-400">Elite Talent 👑</span>
        </div>
      </div>

      {/* Strongest Attributes Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Strongest Attributes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {strongestAttributes.map((attr, index) => (
            <div
              key={attr.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/40 transition-all"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-3xl bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {attr.icon}
                  </span>
                  <span className="text-blue-400 font-semibold text-lg">
                    {attr.score}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Attribute 0{index + 1}
                </span>
                <h3 className="text-xl font-semibold text-slate-900 mt-0.5 mb-2">{attr.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{attr.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate('/training-focus')}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium px-6 py-3 rounded-xl transition-all cursor-pointer"
        >
          ← Back to Training Focus
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