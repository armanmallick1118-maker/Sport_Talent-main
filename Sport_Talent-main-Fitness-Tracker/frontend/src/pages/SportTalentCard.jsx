import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Star } from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

const metrics = [
  { metric: 'Speed', value: 90 },
  { metric: 'Agility', value: 84 },
  { metric: 'Endurance', value: 78 },
  { metric: 'Strength', value: 82 },
  { metric: 'Technique', value: 88 },
];

export default function SportTalentCard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('athleteProfile');
    if (savedProfile) setProfile(JSON.parse(savedProfile));
  }, []);

  const athleteName = profile?.name || 'Arman Mallick';
  const primarySport = profile?.primarySport || 'Football';
  const position = profile?.position || 'Midfielder';
  const location = profile?.location || 'Kolkata, West Bengal';
  const overall = Number(localStorage.getItem('overallAIScore')) || 87.4;
  const initial = athleteName.charAt(0).toUpperCase();

  const handleShare = async () => {
    const text = `${athleteName} · ${primarySport} · Overall ${overall}/100`;
    if (navigator.share) {
      await navigator.share({ title: 'SportTalent Card', text });
    } else {
      await navigator.clipboard.writeText(text);
      alert('Talent card summary copied.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold text-slate-900">Talent Card</h1>
        <button
          type="button"
          onClick={handleShare}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700"
          aria-label="Share"
        >
          <Share2 size={18} />
        </button>
      </div>

      <section className="mb-5 overflow-hidden rounded-3xl bg-[#0f2744] p-6 text-white shadow-[0_16px_40px_rgba(15,39,68,0.28)]">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-2xl font-semibold">
            {initial}
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{athleteName}</h2>
            <p className="mt-0.5 text-sm text-slate-300">
              {primarySport} • {position}
            </p>
            <p className="text-xs text-slate-400">{location}</p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Verified Athlete
        </div>
      </section>

      <section className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Overall Score</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{overall} / 100</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-amber-300">
          <Star size={12} fill="currentColor" />
          Highly Potential
        </span>
      </section>

      <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Performance Overview</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={metrics} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="value"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.18}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 grid grid-cols-5 gap-2 text-center">
          {metrics.map((item) => (
            <div key={item.metric}>
              <p className="text-sm font-semibold text-slate-900">{item.value}</p>
              <p className="text-[10px] text-slate-500">{item.metric}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Recent Assessments</h3>
        <div className="space-y-2">
          {[
            { name: '10m Sprint', score: '8.7', label: 'Excellent' },
            { name: 'Vertical Jump', score: '8.2', label: 'Strong' },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5"
            >
              <p className="text-sm font-medium text-slate-800">{item.name}</p>
              <p className="text-sm font-semibold text-emerald-600">
                {item.score} <span className="font-medium">{item.label}</span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
