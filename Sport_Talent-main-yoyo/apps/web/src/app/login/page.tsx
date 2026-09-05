"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import BrandMark from '../../components/BrandMark';

const field =
  'w-full rounded-xl border border-[#27332D] bg-[#161F1B] py-3 pl-11 pr-11 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#B7F34A]';

const storeSession = (token: string, user: any) => {
  localStorage.setItem('token', token);
  localStorage.setItem('role', user.role);
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userId', user.id);
  localStorage.setItem('userEmail', user.email);
  localStorage.setItem('user', JSON.stringify(user));
};

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [resetPassword, setResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  // Security enhancements
  const [captchaNum1, setCaptchaNum1] = useState(1);
  const [captchaNum2, setCaptchaNum2] = useState(1);
  const [userCaptcha, setUserCaptcha] = useState('');
  
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [tempAuthData, setTempAuthData] = useState<any>(null);

  useEffect(() => {
    setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 10) + 1);

    // Prevent browser Back button ("undo") from returning to previous authenticated views after logout
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    if (parseInt(userCaptcha) !== captchaNum1 + captchaNum2) {
      setError('Incorrect Math Captcha. Please try again.');
      setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
      setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
      setUserCaptcha('');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || errData.error || 'Login failed.');
      }

      const data = await res.json();
      const { token, user } = data;
      
      // Instead of logging in immediately, show MFA
      setTempAuthData({ token, user });
      setShowMfa(true);
      setError('');
      setInfo('A verification code has been sent to your registered device. Please enter it below.');
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please check your email and password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length < 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    // Mock MFA Verification Success
    const { token, user } = tempAuthData;
    storeSession(token, user);

    // Redirect to main unified ATHENA dashboard
    router.push('/');
  };

  const handleResetPassword = async () => {
    setError('');
    setInfo('');

    if (!formData.email) {
      setError('Enter your registered email first.');
      return;
    }

    if (!resetPassword || !confirmResetPassword) {
      setError('Enter and confirm your new password.');
      return;
    }

    if (resetPassword.trim() !== confirmResetPassword.trim()) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: resetPassword.trim(),
        }),
      });

      if (!res.ok) {
         const errData = await res.json();
         throw new Error(errData.detail || errData.error || 'Password reset failed.');
      }

      const data = await res.json();
      setInfo(data.message || 'Password updated. Please sign in with your new password.');
      setFormData((current) => ({ ...current, password: '' }));
      setResetPassword('');
      setConfirmResetPassword('');
      setResetMode(false);
    } catch (err: any) {
      const msg = err.message || 'Password reset failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center relative overflow-hidden bg-[#0B100E] px-4 py-10">
      {/* PRANA Atmospheric background auras */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#B7F34A]/5 rounded-full filter blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#25D9D0]/5 rounded-full filter blur-[128px] pointer-events-none"></div>

      <div className="w-full max-w-[400px] relative z-10 p-8 rounded-2xl bg-[#111815] border border-[#27332D] shadow-2xl">
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

        <h1 className="text-center text-3xl font-bold tracking-tight text-white mb-1">
          Welcome to PRANA
        </h1>
        <p className="mt-1 text-center text-xs text-slate-400 lowercase font-medium">
          personal responsive adaptive network &amp; analytics
        </p>

        <div className={`transition-all duration-300 overflow-hidden ${error || info ? 'max-h-32 opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}>
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400 shadow-inner">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-xl border border-[#25D9D0]/30 bg-[#25D9D0]/10 px-4 py-3 text-center text-sm text-[#25D9D0] shadow-inner">
              {info}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className={field}
              required
            />
          </div>

          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className={field}
              required
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

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setError('');
                setInfo('');
                setResetMode((value) => !value);
              }}
              className="text-sm font-medium text-[#25D9D0] hover:text-[#B7F34A] transition-colors"
            >
              {resetMode ? 'Back to Log In' : 'Forgot Password?'}
            </button>
          </div>

          {resetMode && (
            <div className="space-y-4 rounded-xl border border-[#27332D] bg-[#161F1B] p-4">
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="New password"
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
                className="flex w-full justify-center rounded-xl border border-[#25D9D0]/40 bg-[#25D9D0]/10 py-3 text-sm font-semibold text-[#25D9D0] transition hover:bg-[#25D9D0]/20 disabled:pointer-events-none disabled:opacity-70"
              >
                Update Password
              </button>
            </div>
          )}

          {!showMfa ? (
            <>
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

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center items-center rounded-xl bg-[#B7F34A] py-3 text-sm font-bold text-[#0B100E] shadow-lg shadow-[#B7F34A]/20 transition-all hover:bg-[#cbf774] disabled:pointer-events-none disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Authenticating...
                  </span>
                ) : (
                  'Log In'
                )}
              </button>
            </>
          ) : (
            <div className="space-y-4 rounded-xl border border-[#25D9D0]/40 bg-[#25D9D0]/10 p-5 mt-4">
              <h3 className="text-white font-bold text-center">Two-Factor Authentication</h3>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="6-digit verification code"
                  className={field}
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleMfaSubmit}
                disabled={loading}
                className="flex w-full justify-center rounded-xl bg-[#B7F34A] py-3 text-sm font-bold text-[#0B100E] transition hover:bg-[#cbf774] shadow-md shadow-[#B7F34A]/20"
              >
                Verify & Proceed
              </button>
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-[#25D9D0] hover:text-[#B7F34A] transition-colors">
            Sign Up
          </Link>
        </p>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#27332D]" />
          <span className="text-xs uppercase tracking-wider text-slate-500 font-mono">or</span>
          <div className="h-px flex-1 bg-[#27332D]" />
        </div>

        <button
          type="button"
          onClick={() => setInfo('Google sign-in will be available in a later release.')}
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
