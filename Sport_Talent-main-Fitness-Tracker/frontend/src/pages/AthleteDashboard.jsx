import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  IdCard,
  Users,
} from 'lucide-react';
import { getAssessmentHistory } from '../utils/assessmentStorage';

function profileCompletion(profile) {
  if (!profile) return 20;
  const keys = ['name', 'age', 'height', 'weight', 'location', 'primarySport', 'position'];
  const filled = keys.filter((key) => Boolean(profile[key])).length;
  return Math.round((filled / keys.length) * 100);
}

function ratingLabel(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return { text: 'Pending', color: 'text-slate-500' };
  if (n >= 85) return { text: 'Excellent', color: 'text-emerald-600' };
  if (n >= 70) return { text: 'Strong', color: 'text-amber-600' };
  return { text: 'Developing', color: 'text-slate-500' };
}

export default function AthleteDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [profileVisibility, setProfileVisibility] = useState('private');
  const [guardianConsent, setGuardianConsent] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('athleteProfile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfile(parsedProfile);
      setGuardianConsent(localStorage.getItem('guardianConsent') === 'true');
    }
    setHistory(getAssessmentHistory());
    setProfileVisibility(localStorage.getItem('profileVisibility') || 'private');
  }, []);

  const athleteAge = Number(profile?.age);
  const isMinor = Number.isFinite(athleteAge) && athleteAge > 0 && athleteAge < 18;
  const completion = profileCompletion(profile);
  const firstName = (profile?.name || 'Athlete').split(' ')[0];

  const handleVisibilityChange = (value) => {
    if (value === 'discoverable' && isMinor && !guardianConsent) {
      alert(
        'Guardian consent is required before a minor athlete can make their profile discoverable to scouts.'
      );
      return;
    }
    setProfileVisibility(value);
    localStorage.setItem('profileVisibility', value);
  };

  const actions = [
    { label: 'Assessment', icon: Activity, to: '/sports' },
    { label: 'My Results', icon: BarChart3, to: '/analytics' },
    { label: 'Talent Card', icon: IdCard, to: '/talent-card' },
    { label: 'Find Scouts', icon: Users, to: '/leaderboard' },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-slate-900">
            Hello, {profile?.name || firstName}! 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {profile?.primarySport || 'Athlete'} · {profile?.location || 'Complete your profile to get discovered'}
          </p>
        </div>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>
      </div>

      <section className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Profile progress</p>
            <p className="text-xs text-slate-500">{completion}% completed</p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check size={16} strokeWidth={2.4} />
          </span>
        </div>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          View Profile
        </button>
      </section>

      <section className="mb-8 grid grid-cols-2 gap-3">
        {actions.map(({ label, icon: Icon, to }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(to)}
            className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-[0_10px_40px_rgba(15,23,42,0.04)] transition hover:border-blue-200"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon size={18} strokeWidth={1.8} />
            </span>
            <span className="text-sm font-semibold text-slate-800">{label}</span>
          </button>
        ))}
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent Assessments</h2>
          <Link to="/analytics" className="text-sm font-medium text-blue-600">
            View All
          </Link>
        </div>

        {history.length > 0 ? (
          <div className="space-y-2">
            {history.slice(0, 4).map((item) => {
              const rating = ratingLabel(item.score);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Activity size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.testName}</p>
                      <p className="text-xs text-slate-500">{item.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${rating.color}`}>
                      {item.score}
                    </p>
                    <p className={`text-[11px] ${rating.color}`}>{rating.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
            <p className="text-sm text-slate-500">No assessments yet.</p>
            <button
              type="button"
              onClick={() => navigate('/sports')}
              className="mt-3 text-sm font-semibold text-blue-600"
            >
              Take your first test
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Scout visibility</h2>
            <p className="text-xs text-slate-500">
              {profileVisibility === 'discoverable' ? 'Visible to scouts' : 'Hidden from discovery'}
            </p>
          </div>
          <Link to="/privacy-consent" className="text-xs font-medium text-blue-600">
            Manage
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {['private', 'discoverable'].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleVisibilityChange(value)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium capitalize ${
                profileVisibility === value
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-500'
              }`}
            >
              {value === 'discoverable' ? 'Discoverable' : 'Private'}
            </button>
          ))}
        </div>
        {isMinor && !guardianConsent && (
          <p className="mt-3 text-xs text-amber-700">
            Guardian consent is required before this profile can be discoverable.
          </p>
        )}
      </section>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => navigate('/training-focus')}
          className="flex flex-1 items-center justify-between rounded-xl px-1 py-3 text-sm font-medium text-slate-600"
        >
          Training focus
          <ChevronRight size={16} />
        </button>
        <button
          type="button"
          onClick={() => navigate('/profile-match')}
          className="flex flex-1 items-center justify-between rounded-xl px-1 py-3 text-sm font-medium text-slate-600"
        >
          Profile match
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
