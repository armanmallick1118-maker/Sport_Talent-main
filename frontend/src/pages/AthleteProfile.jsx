import React, { useState, useEffect } from 'react';
import AthleteAnalytics from './AthleteAnalytics';
import API from '../services/api';

const saveProfile = async (profileData) => {
  try {
    const res = await API.post('/api/v1/athletes/profile', profileData);
    return res.data?.profile;
  } catch (error) {
    console.warn('Backend offline. Saving to local storage fallback:', error.message);
    localStorage.setItem('athleteProfile', JSON.stringify(profileData));
    return null;
  }
};

const TABS = [
  { id: 'overview',  label: '👤 Overview'  },
  { id: 'analytics', label: '📊 Analytics' },
];

const emptyProfile = {
  name: '',
  age: '',
  height: '',
  weight: '',
  location: '',
  primarySport: 'Football',
  position: '',
  experience: '',
  trainingFrequency: '3-4 days/week',
};

const parseStoredProfile = () => {
  try {
    return JSON.parse(localStorage.getItem('athleteProfile') || 'null');
  } catch {
    localStorage.removeItem('athleteProfile');
    return null;
  }
};

const normalizeProfile = (data = {}) => {
  const normalized = {
    ...emptyProfile,
    ...data,
    name: data.name || data.full_name || '',
    age: data.age ?? '',
    height: data.height ?? '',
    weight: data.weight ?? '',
    location: data.location || '',
    primarySport: data.primarySport || data.sport || 'Football',
    position: data.position || '',
    experience: data.experience ?? '',
    trainingFrequency: data.trainingFrequency || data.training_frequency || '3-4 days/week',
  };

  return Object.fromEntries(
    Object.entries(normalized).map(([key, value]) => [key, value === null ? '' : value])
  );
};

const displayValue = (value, fallback = '--') => {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
};

export default function AthleteProfile() {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(emptyProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await API.get('/api/v1/athletes/profile');
        if (res.data) setProfile(normalizeProfile(res.data));
      } catch {
        const stored = parseStoredProfile();
        const user   = JSON.parse(localStorage.getItem('user') || '{}');
        if (stored)         setProfile(normalizeProfile(stored));
        else if (user.fullName) setProfile(prev => ({ ...prev, name: user.fullName }));
      }
    }
    fetchProfile();
  }, []);

  const handleChange = e => { setProfile({ ...profile, [e.target.name]: e.target.value }); setSaved(false); };

  const handleSubmit = async e => {
    e.preventDefault();
    localStorage.setItem('athleteProfile', JSON.stringify(profile));
    const savedProfile = await saveProfile(profile);
    if (savedProfile) {
      const normalized = normalizeProfile({ ...profile, ...savedProfile });
      setProfile(normalized);
      localStorage.setItem('athleteProfile', JSON.stringify(normalized));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">

      {/* ── Tab Bar ───────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`profile-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Form Section */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Athlete Profile Settings</h2>
            <p className="text-slate-500 text-sm mb-6">
              Keep your physical metrics and sports bio updated for accurate AI scoring.
            </p>

            {saved && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-lg text-sm mb-6 text-center font-medium">
                ✓ Profile saved successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-sm mb-1 font-medium">Full Name</label>
                  <input type="text" name="name" value={profile.name} onChange={handleChange}
                    placeholder="Rahul Das" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-600 text-sm mb-1 font-medium">Age (Years)</label>
                  <input type="number" name="age" value={profile.age} onChange={handleChange}
                    placeholder="17" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-sm mb-1 font-medium">Height (cm)</label>
                  <input type="number" name="height" value={profile.height} onChange={handleChange}
                    placeholder="175" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-600 text-sm mb-1 font-medium">Weight (kg)</label>
                  <input type="number" name="weight" value={profile.weight} onChange={handleChange}
                    placeholder="68" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 text-sm mb-1 font-medium">Location</label>
                <input type="text" name="location" value={profile.location} onChange={handleChange}
                  placeholder="Kolkata, West Bengal" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-sm mb-1 font-medium">Primary Sport</label>
                  <select name="primarySport" value={profile.primarySport} onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer">
                    <option value="Football">Football</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Athletics">Athletics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 text-sm mb-1 font-medium">Playing Position</label>
                  <input type="text" name="position" value={profile.position} onChange={handleChange}
                    placeholder="Winger / Midfielder" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-sm mb-1 font-medium">Experience (Years)</label>
                  <input type="number" name="experience" value={profile.experience} onChange={handleChange}
                    placeholder="3" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-600 text-sm mb-1 font-medium">Training Frequency</label>
                  <select name="trainingFrequency" value={profile.trainingFrequency} onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer">
                    <option value="1-2 days/week">1-2 days/week</option>
                    <option value="3-4 days/week">3-4 days/week</option>
                    <option value="5-6 days/week">5-6 days/week</option>
                    <option value="Daily">Daily</option>
                  </select>
                </div>
              </div>

              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors cursor-pointer mt-4">
                Save Profile
              </button>
            </form>
          </div>

          {/* Live Athlete Card */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-600">Live Athlete Card</h3>
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg tracking-wider">
                Verified Draft
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center text-blue-400 font-bold text-2xl">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xl font-semibold text-white leading-tight break-words">{profile.name || 'Athlete Name'}</h4>
                  <p className="text-blue-400 text-sm font-medium break-words">
                    {displayValue(profile.primarySport, 'Sport')} • {displayValue(profile.position, 'Position')}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5 break-words">{displayValue(profile.location, 'Location')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
                <div><span className="block text-slate-400 text-xs">Age</span><span className="font-semibold text-white">{displayValue(profile.age)} yrs</span></div>
                <div><span className="block text-slate-400 text-xs">Height / Weight</span><span className="font-semibold text-white break-words">{displayValue(profile.height)} cm / {displayValue(profile.weight)} kg</span></div>
                <div><span className="block text-slate-400 text-xs">Experience</span><span className="font-semibold text-white">{displayValue(profile.experience)} yrs</span></div>
                <div><span className="block text-slate-400 text-xs">Training</span><span className="font-semibold text-white break-words">{displayValue(profile.trainingFrequency)}</span></div>
              </div>
              <div className="text-center pt-2">
                <span className="inline-block text-xs text-slate-300 border border-white/10 rounded-full px-3 py-1 bg-white/5">
                  Ready for AI Assessment
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Analytics Tab — Results section embedded ──────────── */}
      {activeTab === 'analytics' && (
        <AthleteAnalytics />
      )}
    </div>
  );
}
