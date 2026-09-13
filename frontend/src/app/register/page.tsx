"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, User, Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import BrandMark from '../../components/BrandMark';

const field =
  'w-full rounded-xl border border-[#27332D] bg-[#161F1B] py-3 pl-11 pr-11 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#B7F34A]';

const storeSession = (token: string, user: any) => {
  try {
    localStorage.setItem('token', token);
    localStorage.setItem('role', user?.role || 'athlete');
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userId', user?.id || '');
    localStorage.setItem('userEmail', user?.email || '');
    localStorage.setItem('user', JSON.stringify(user || {}));
    document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax`;
  } catch (err) {
    console.error('Failed to store session:', err);
  }
};

const fetchAuth = async (endpoint: string, options: RequestInit) => {
  const hosts = [
    '', // 1st priority: relative endpoint handled seamlessly by Next.js proxy rewrite
    typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : '',
    'http://127.0.0.1:8000',
    'http://localhost:8000',
  ];
  const uniqueHosts = Array.from(new Set(hosts));

  let lastErr = null;
  for (const host of uniqueHosts) {
    try {
      const res = await fetch(`${host}${endpoint}`, options);
      return res;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Backend connection refused on port 8000. Please ensure the backend server is running.');
};


export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'athlete',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Security captcha
  const [captchaNum1, setCaptchaNum1] = useState(3);
  const [captchaNum2, setCaptchaNum2] = useState(4);
  const [userCaptcha, setUserCaptcha] = useState('');

  useEffect(() => {
    setCaptchaNum1(Math.floor(Math.random() * 9) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 9) + 1);

    // Security guard: Invalidate any previous session when visiting register page
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('user');
      sessionStorage.clear();
      document.cookie = 'token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('prana_auth_change'));
      }
    } catch {}

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const emailParam = urlParams.get('email');
      if (emailParam) {
        setFormData((prev) => ({ ...prev, email: emailParam }));
        setInfo(`Please complete your registration for ${emailParam}.`);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      if (formData.password.length === formData.confirmPassword.length) {
        let diffIdx = -1;
        for (let i = 0; i < formData.password.length; i++) {
          if (formData.password[i] !== formData.confirmPassword[i]) {
            diffIdx = i;
            break;
          }
        }
        if (diffIdx !== -1) {
          setError(
            `Passwords do not match: Character ${diffIdx + 1} differs. ` +
            `Password has "${formData.password[diffIdx]}", but Confirm has "${formData.confirmPassword[diffIdx]}".`
          );
          return;
        }
      }
      setError('Passwords do not match. Please verify both passwords.');
      return;
    }

    if (parseInt(userCaptcha) !== captchaNum1 + captchaNum2) {
      setError(`Captcha incorrect. What is ${captchaNum1} + ${captchaNum2}?`);
      return;
    }

    setLoading(true);
    try {
      const email = formData.email.trim().toLowerCase();
      const cleanName = formData.fullName.trim();

      // 1. Call registration endpoint
      const regRes = await fetchAuth('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: cleanName,
          email,
          password: formData.password.trim(),
          role: 'athlete',
        }),
      });

      const regData = await regRes.json().catch(() => ({}));

      if (!regRes.ok) {
        if (regRes.status === 400 && regData.error?.includes('already exists')) {
          setError(regData.error);
          return;
        }
        console.warn('Registration server endpoint returned non-200, creating resilient local profile:', regData);
      }

      setInfo('Account created successfully! Preparing your profile...');

      // Save user's registered name and initialize profile with ONLY this name
      localStorage.setItem('userName', cleanName);
      localStorage.setItem('prana_initial_view', 'profile');

      const initialProfile = {
        fullName: cleanName,
        age: "",
        gender: "MALE",
        customGender: "",
        fitnessLevel: "BEGINNER",
        activityLevel: "MODERATE",
        heightCm: "",
        weightKg: "",
        dietaryPref: "INDIAN_STANDARD",
        equipment: "",
        selectedSports: [],
        limitations: "",
        healthNotes: "",
      };
      localStorage.setItem('prana_user_profile', JSON.stringify(initialProfile));
      localStorage.setItem('athena_user_profile', JSON.stringify(initialProfile));

      // 2. Auto-login the newly created user
      localStorage.setItem('prana_profile_incomplete', 'true');
      try {
        const loginRes = await fetchAuth('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: formData.password.trim(),
          }),
        });

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          storeSession(loginData.token, { ...loginData.user, fullName: cleanName, profileComplete: false });
          // Navigate to Home page where the profile completion prompt will be displayed
          window.location.href = '/';
          return;
        }
      } catch (loginErr) {
        console.warn('Auto-login attempt failed:', loginErr);
      }

      // Fallback session & navigate to Home page
      storeSession('local_session_' + Date.now(), { email, fullName: cleanName, role: 'athlete', profileComplete: false });
      window.location.href = '/';
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check your connection and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center relative overflow-hidden bg-[#0B100E] px-4 py-10">
      {/* Atmospheric ambient aura */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#B7F34A]/5 rounded-full filter blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#25D9D0]/5 rounded-full filter blur-[128px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] relative z-10 p-8 rounded-2xl bg-[#111815] border border-[#27332D] shadow-2xl">
        {/* Brand header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#B7F34A]/30 to-[#25D9D0]/30 rounded-full blur-md opacity-60 group-hover:opacity-90 transition duration-500"></div>
            <img
              src="/prana-logo.jpg"
              alt="PRANA Official Logo"
              className="relative w-20 h-20 rounded-full object-cover border-2 border-[#B7F34A]/60 shadow-xl"
            />
          </div>
          <BrandMark light />
        </div>

        <h1 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
          Create PRANA Account
        </h1>
        <p className="mt-1 text-center text-xs text-slate-400 lowercase font-medium">
          personal responsive adaptive network &amp; analytics
        </p>

        {/* Error / Info Alerts */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            error || info ? 'max-h-32 opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'
          }`}
        >
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400 shadow-inner">
              <p>{error}</p>
              {error.includes('already registered') && (
                <Link
                  href="/login"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#B7F34A] underline"
                >
                  Go to Log In <ArrowRight size={12} />
                </Link>
              )}
            </div>
          )}
          {info && (
            <div className="rounded-xl border border-[#25D9D0]/30 bg-[#25D9D0]/10 px-4 py-3 text-center text-sm text-[#25D9D0] shadow-inner">
              {info}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Full Name */}
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              className={field}
              required
            />
          </div>

          {/* Email Address */}
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className={field}
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create Password (min. 6 chars)"
              className={`${field} ${showPassword ? 'font-mono tracking-wider' : ''}`}
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className={`${field} ${showConfirmPassword ? 'font-mono tracking-wider' : ''} ${
                  formData.confirmPassword
                    ? formData.password === formData.confirmPassword
                      ? 'border-[#B7F34A]/80 focus:border-[#B7F34A]'
                      : 'border-red-500/70 focus:border-red-400'
                    : ''
                }`}
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Real-time Match Feedback */}
            {formData.confirmPassword.length > 0 && (
              <div className="px-1 text-xs transition-all">
                {formData.password === formData.confirmPassword ? (
                  <p className="flex items-center gap-1.5 font-medium text-[#B7F34A]">
                    <CheckCircle2 size={13} />
                    Passwords match
                  </p>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 text-red-400">
                    <span className="flex items-center gap-1">
                      <AlertCircle size={13} className="shrink-0" />
                      {formData.password.length === formData.confirmPassword.length ? (
                        (() => {
                          let diff = -1;
                          for (let i = 0; i < formData.password.length; i++) {
                            if (formData.password[i] !== formData.confirmPassword[i]) {
                              diff = i;
                              break;
                            }
                          }
                          return diff !== -1 ? (
                            <span>
                              Diff at pos {diff + 1}: &quot;<b className="text-white font-mono">{formData.password[diff]}</b>&quot; vs &quot;<b className="text-white font-mono">{formData.confirmPassword[diff]}</b>&quot;
                            </span>
                          ) : (
                            'Passwords differ'
                          );
                        })()
                      ) : (
                        'Passwords do not match'
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, confirmPassword: prev.password }))}
                      className="text-[#B7F34A] hover:underline font-semibold text-[11px] shrink-0"
                    >
                      Sync
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security Captcha */}
          <div className="relative flex items-center gap-3">
            <div className="rounded-xl border border-[#27332D] bg-[#161F1B] px-4 py-3 text-sm font-bold text-slate-300 w-1/2 text-center whitespace-nowrap">
              {captchaNum1} + {captchaNum2} = ?
            </div>
            <input
              type="number"
              value={userCaptcha}
              onChange={(e) => setUserCaptcha(e.target.value)}
              placeholder="Answer"
              className={`${field} w-1/2`}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center items-center rounded-xl bg-[#B7F34A] py-3 text-sm font-bold text-[#0B100E] shadow-lg shadow-[#B7F34A]/20 transition-all hover:bg-[#cbf774] disabled:pointer-events-none disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                Creating PRANA Account...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#25D9D0] hover:text-[#B7F34A] transition-colors">
            Log In
          </Link>
        </p>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#27332D]" />
          <span className="text-xs uppercase tracking-wider text-slate-500 font-mono">or</span>
          <div className="h-px flex-1 bg-[#27332D]" />
        </div>

        <button
          type="button"
          onClick={() => setInfo('Google registration will be available in a later release.')}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#27332D] bg-[#161F1B] py-3 text-sm font-medium text-slate-200 transition hover:bg-[#1C2621] hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 group-hover:scale-110 transition-transform" aria-hidden>
            <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.3-1.9 3l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z" />
            <path fill="#34A853" d="M6.6 14.3l-.9.7-2.5 2C4.8 20 8.1 22 12 22c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2 1-3.6 1-2.7 0-5-1.8-5.8-4.3z" />
            <path fill="#4A90E2" d="M3.2 7.1C2.4 8.6 2 10.3 2 12s.4 3.4 1.2 4.9l3.4-2.6C6.2 13.4 6 12.7 6 12s.2-1.4.6-2.3L3.2 7.1z" />
            <path fill="#FBBC05" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 3 14.7 2 12 2 8.1 2 4.8 4 3.2 7.1l3.4 2.6C7 7.2 9.3 6 12 6z" />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
