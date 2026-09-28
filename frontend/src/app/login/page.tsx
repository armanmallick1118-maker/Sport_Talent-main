"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, Loader2, ShieldCheck, CheckCircle2, UserPlus, AlertCircle, RotateCcw } from 'lucide-react';
import BrandMark from '../../components/BrandMark';

const field =
  'w-full rounded-xl border border-[#27332D] bg-[#161F1B] py-3 pl-11 pr-11 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#B7F34A]';

const storeSession = (token: string, user: any) => {
  try {
    localStorage.setItem('token', token);
    localStorage.setItem('role', user?.role || 'athlete');
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userId', user?.id || 'usr_' + Date.now());
    localStorage.setItem('userEmail', user?.email || '');
    localStorage.setItem('userName', user?.fullName || user?.profile?.full_name || 'PRANA Athlete');
    localStorage.setItem('user', JSON.stringify(user || {}));
    
    // Track whether profile is complete or needs attention
    if (user?.profileComplete === false) {
      localStorage.setItem('prana_profile_incomplete', 'true');
    } else {
      localStorage.removeItem('prana_profile_incomplete');
    }

    // Store auth token in cookie for SSR and Next.js middleware verification
    document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Lax`;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('prana_auth_change'));
    }
  } catch (err) {
    console.error('Failed to store session:', err);
  }
};

const fetchAuth = async (endpoint: string, options: RequestInit) => {
  const hosts = [
    '', // Priority 1: Next.js rewrite proxy
    process.env.NEXT_PUBLIC_API_URL || '',
    'https://sporttalent-production.up.railway.app',
    typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : '',
    'http://127.0.0.1:8000',
    'http://localhost:8000',
  ];
  const uniqueHosts = Array.from(new Set(hosts.filter(Boolean)));

  let lastErr: any = null;
  try {
    const res = await fetch(endpoint, options);
    return res;
  } catch (err) {
    lastErr = err;
  }

  for (const host of uniqueHosts) {
    try {
      const cleanHost = host.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
      const fullUrl = `${cleanHost}${endpoint}`;
      const res = await fetch(fullUrl, options);
      return res;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Backend connection refused. Please ensure the backend server is running.');
};

export default function Login({ onLoginSuccess }: { onLoginSuccess?: () => void } = {}) {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [resetPassword, setResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [unregisteredEmail, setUnregisteredEmail] = useState<string | null>(null);

  // Security Captcha Challenge State
  const [captchaNum1, setCaptchaNum1] = useState(3);
  const [captchaNum2, setCaptchaNum2] = useState(5);
  const [userCaptcha, setUserCaptcha] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 8) + 2; // 2 to 9
    const n2 = Math.floor(Math.random() * 8) + 1; // 1 to 8
    setCaptchaNum1(n1);
    setCaptchaNum2(n2);
    setUserCaptcha('');
    setCaptchaVerified(false);
  };

  useEffect(() => {
    generateCaptcha();

    // Handle explicit logout request via ?logout=true
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isLogout = urlParams?.get('logout') === 'true';

    if (isLogout) {
      try {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie = 'token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        fetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
        window.dispatchEvent(new Event('prana_auth_change'));
      } catch {}
    } else {
      // If already logged in, enter PRANA immediately
      try {
        const existingToken = localStorage.getItem('token');
        if (existingToken && existingToken.length > 20) {
          window.location.replace('/');
          return;
        }
      } catch {}
    }

    // Check if email was passed in URL query
    if (urlParams) {
      const emailParam = urlParams.get('email');
      if (emailParam) {
        setFormData((prev) => ({ ...prev, email: emailParam }));
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCaptchaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserCaptcha(val);
    const parsed = parseInt(val.trim(), 10);
    if (!isNaN(parsed) && parsed === captchaNum1 + captchaNum2) {
      setCaptchaVerified(true);
      if (error && (error.includes('captcha') || error.includes('Captcha') || error.includes('Security'))) {
        setError('');
      }
    } else {
      setCaptchaVerified(false);
    }
  };

  const handleLoginSuccess = (token: string, user: any) => {
    storeSession(token, user);
    setInfo('Authentication verified! Entering PRANA...');

    if (onLoginSuccess) {
      setTimeout(() => {
        onLoginSuccess();
      }, 100);
    } else {
      setTimeout(() => {
        window.location.replace('/');
      }, 150);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setUnregisteredEmail(null);

    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please provide both email and password.');
      return;
    }

    // Security Captcha Verification
    const expectedSum = captchaNum1 + captchaNum2;
    const parsedUserCaptcha = parseInt(userCaptcha.trim(), 10);

    if (!userCaptcha.trim() || isNaN(parsedUserCaptcha) || parsedUserCaptcha !== expectedSum) {
      setError(`Security Verification Failed: Please enter the correct sum for ${captchaNum1} + ${captchaNum2}.`);
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      const res = await fetchAuth('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      // Check if account does NOT exist (new Gmail / email address)
      if (res.status === 404 || data.notFound) {
        setUnregisteredEmail(cleanEmail);
        setError(`No account found for "${cleanEmail}". New accounts must sign up first.`);
        setInfo('Redirecting you to the Sign Up page in 2 seconds...');
        setTimeout(() => {
          router.push(`/register?email=${encodeURIComponent(cleanEmail)}`);
        }, 2200);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || data.detail || 'Login failed. Please verify your credentials.');
      }

      const { token, user } = data;
      handleLoginSuccess(token, user);
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please check your credentials and connection.';
      setError(msg);
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setInfo('');

    if (!formData.email) {
      setError('Enter your registered email address first.');
      return;
    }

    if (!resetPassword || !confirmResetPassword) {
      setError('Enter and confirm your new password.');
      return;
    }

    if (resetPassword.trim().length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (resetPassword.trim() !== confirmResetPassword.trim()) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchAuth('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: resetPassword.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }

      setInfo('Password updated successfully! You can now sign in.');
      setResetMode(false);
      setFormData((prev) => ({ ...prev, password: resetPassword.trim() }));
      setResetPassword('');
      setConfirmResetPassword('');
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Please verify your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0B100E] flex items-center justify-center p-4 selection:bg-[#B7F34A]/30 overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#B7F34A]/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute -bottom-40 right-10 w-[500px] h-[500px] bg-[#25D9D0]/10 blur-[130px] rounded-full" />

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#27332D] bg-[#121915]/90 p-8 shadow-2xl backdrop-blur-xl transition-all">
        {/* Logo and Brand Mark */}
        <div className="flex flex-col items-center justify-center space-y-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#B7F34A]/20 blur-md" />
            <img
              src="/prana-logo.jpg"
              alt="PRANA Official Logo"
              className="relative w-20 h-20 rounded-full object-cover border-2 border-[#B7F34A]/60 shadow-xl"
            />
          </div>
          <BrandMark light />
        </div>

        <h1 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1 font-sans">
          Sign In to PRANA
        </h1>
        <p className="mt-1 text-center text-xs text-slate-400 lowercase font-medium">
          personal responsive adaptive network &amp; analytics
        </p>

        {/* Dynamic Alerts */}
        <div className={`transition-all duration-300 overflow-hidden ${error || info ? 'max-h-48 opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'}`}>
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400 shadow-inner space-y-2">
              <div className="flex items-center justify-center gap-1.5 font-medium">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
              {unregisteredEmail && (
                <div className="pt-2 border-t border-red-500/20">
                  <Link
                    href={`/register?email=${encodeURIComponent(unregisteredEmail)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B7F34A] underline hover:text-white transition-colors"
                  >
                    <UserPlus size={13} />
                    <span>Create PRANA Account for {unregisteredEmail} →</span>
                  </Link>
                </div>
              )}
            </div>
          )}
          {info && (
            <div className="rounded-xl border border-[#25D9D0]/30 bg-[#25D9D0]/10 px-4 py-3 text-center text-sm text-[#25D9D0] shadow-inner flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{info}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Email field */}
          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className={field}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setInfo('');
                  setResetMode((value) => !value);
                }}
                className="text-xs font-medium text-[#25D9D0] hover:text-[#B7F34A] transition-colors"
              >
                {resetMode ? 'Back to Sign In' : 'Forgot?'}
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                className={field}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Password Reset Sub-panel */}
          {resetMode && (
            <div className="space-y-3 rounded-xl border border-[#27332D] bg-[#161F1B] p-4">
              <span className="text-xs font-mono font-bold text-[#25D9D0]">Reset Account Password</span>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className={field}
                  minLength={6}
                />
              </div>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmResetPassword}
                  onChange={(e) => setConfirmResetPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={field}
                  minLength={6}
                />
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handleResetPassword}
                className="flex w-full justify-center rounded-xl border border-[#25D9D0]/40 bg-[#25D9D0]/10 py-2.5 text-xs font-semibold text-[#25D9D0] transition hover:bg-[#25D9D0]/20 disabled:pointer-events-none disabled:opacity-70"
              >
                Update Password
              </button>
            </div>
          )}

          {/* Security Captcha Challenge */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={14} className={captchaVerified ? "text-[#B7F34A]" : "text-[#25D9D0]"} />
                <span>Security Verification</span>
                {captchaVerified && (
                  <span className="flex items-center gap-1 text-[11px] text-[#B7F34A] font-sans font-bold bg-[#B7F34A]/10 px-2 py-0.5 rounded-full border border-[#B7F34A]/30">
                    <CheckCircle2 size={11} />
                    Verified
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={generateCaptcha}
                title="Get a new math challenge"
                className="flex items-center gap-1 text-xs text-[#A4AEA8] hover:text-[#B7F34A] transition-colors cursor-pointer select-none"
              >
                <RotateCcw size={12} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl border border-[#27332D] bg-[#161F1B] px-4 py-3 text-center text-sm font-bold tracking-wider text-slate-100 font-mono select-none shadow-inner">
                {captchaNum1} + {captchaNum2} = ?
              </div>
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={userCaptcha}
                  onChange={handleCaptchaChange}
                  placeholder="Enter sum"
                  className={`w-full rounded-xl border py-3 px-4 text-center text-sm text-slate-100 placeholder:text-slate-500 outline-none transition font-mono ${
                    captchaVerified
                      ? "border-[#B7F34A] bg-[#B7F34A]/5 text-[#B7F34A] shadow-[0_0_15px_rgba(183,243,74,0.15)]"
                      : "border-[#27332D] bg-[#161F1B] focus:border-[#B7F34A]"
                  }`}
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center items-center rounded-xl bg-[#B7F34A] py-3 text-sm font-bold text-[#0B100E] shadow-lg shadow-[#B7F34A]/20 transition-all hover:bg-[#cbf774] disabled:pointer-events-none disabled:opacity-70 cursor-pointer mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                Signing In to PRANA...
              </span>
            ) : (
              'Sign In to PRANA'
            )}
          </button>
        </form>

        {/* Direct Link to Sign Up */}
        <div className="mt-6 pt-5 border-t border-[#27332D]/80 text-center">
          <p className="text-sm text-slate-400">
            Don&apos;t have a PRANA account yet?{' '}
            <Link
              href={formData.email ? `/register?email=${encodeURIComponent(formData.email)}` : '/register'}
              className="font-bold text-[#25D9D0] hover:text-[#B7F34A] transition-colors"
            >
              Sign Up Now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
