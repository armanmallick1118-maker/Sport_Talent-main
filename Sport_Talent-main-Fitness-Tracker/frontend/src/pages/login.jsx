import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import BrandMark from '../components/BrandMark';
import API from '../services/api';

const field =
  'w-full rounded-xl border border-slate-700/80 bg-[#111827] py-3 pl-11 pr-11 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/api/v1/auth/login', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      const { token, user } = res.data;

      // Store real JWT token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userEmail', user.email);

      if (user.role === 'scout') {
        navigate('/scout/dashboard');
      } else {
        navigate('/athlete/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#0b1220] px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-24 items-end justify-center gap-1">
            <span className="h-10 w-6 rounded-t-full bg-gradient-to-b from-fuchsia-400 to-blue-500 opacity-90" />
            <span className="h-14 w-6 rounded-t-full bg-gradient-to-b from-violet-400 to-blue-600" />
            <span className="h-11 w-6 rounded-t-full bg-gradient-to-b from-pink-400 to-indigo-500 opacity-90" />
          </div>
          <BrandMark light />
        </div>

        <h1 className="text-center text-3xl font-semibold tracking-tight text-white">
          Welcome Back!
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Login to continue your journey
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}
        {info && (
          <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-center text-sm text-blue-200">
            {info}
          </div>
        )}

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
              onClick={() => setInfo('Password reset will be sent to your registered email.')}
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300">
            Sign Up
          </Link>
        </p>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-xs uppercase tracking-wider text-slate-500">or</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <button
          type="button"
          onClick={() => setInfo('Google sign-in will be available in a later release.')}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#0b1220] py-3 text-sm font-medium text-white transition hover:bg-slate-900"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
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
