import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail, Lock, Phone, User, Eye, EyeOff,
  ChevronRight, AlertCircle, Info, ArrowLeft,
} from 'lucide-react';
import { authService } from '@backend/services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Mode = 'login' | 'signup';

const CustomerLogin: React.FC = () => {
  const navigate = useNavigate();
  const { session, role } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Signup fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Redirect if already logged in as customer
  useEffect(() => {
    if (session && role === 'customer') {
      const pending = localStorage.getItem('greenwash_pending_order');
      if (pending) {
        navigate('/customer/new-order', { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
    }
  }, [session, role, navigate]);

  const resetForm = () => {
    setError('');
    setIdentifier('');
    setPassword('');
    setName('');
    setPhone('');
    setEmail('');
    setSignupPassword('');
    setConfirmPassword('');
  };

  const switchMode = (m: Mode) => {
    resetForm();
    setMode(m);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter your phone / email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await authService.customerSignIn(identifier.trim(), password);
      if (err) {
        setError(err.message || 'Invalid credentials. Please try again.');
      } else if (data) {
        const pending = localStorage.getItem('greenwash_pending_order');
        if (pending) {
          navigate('/customer/new-order', { replace: true });
        } else {
          navigate('/customer/dashboard', { replace: true });
        }
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!phone.trim()) { setError('Please enter your phone number.'); return; }
    if (!/^[0-9+\-()\s]{7,15}$/.test(phone.trim())) { setError('Please enter a valid phone number.'); return; }
    if (!signupPassword) { setError('Please create a password.'); return; }
    if (signupPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (signupPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await authService.customerSignUp({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password: signupPassword,
      });
      if (err) {
        setError(err.message || 'Sign up failed. Please try again.');
      } else if (data) {
        const pending = localStorage.getItem('greenwash_pending_order');
        if (pending) {
          navigate('/customer/new-order', { replace: true });
        } else {
          navigate('/customer/dashboard', { replace: true });
        }
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      {/* Minimal navbar */}
      <nav className="w-full px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors text-sm font-semibold">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
        <img src="/assets/logo.jpeg" alt="Green Wash Co" className="h-14 w-auto object-contain" />
      </nav>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">

            {/* Tab switcher */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => switchMode('login')}
                className={cn(
                  'flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors',
                  mode === 'login'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/40'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode('signup')}
                className={cn(
                  'flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors',
                  mode === 'signup'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/40'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                Sign Up
              </button>
            </div>

            <div className="p-8">
              {/* Heading */}
              <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-900">
                  {mode === 'login' ? 'Welcome back!' : 'Create account'}
                </h1>
                <p className="text-slate-400 text-sm font-medium mt-1">
                  {mode === 'login'
                    ? 'Sign in to track & manage your laundry orders.'
                    : 'Join Green Wash Co and simplify your laundry.'}
                </p>
              </div>

              {/* Important notice banner */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6">
                <Info size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-amber-700 text-xs font-semibold leading-relaxed">
                  {mode === 'signup'
                    ? 'Please fill your details carefully. Your name and phone number will be used for order pickup, delivery, and communication — they cannot be changed later.'
                    : 'Enter the phone number or email you registered with, along with your password.'}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-5 text-sm font-semibold">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* ── LOGIN FORM ── */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <Field label="Phone number or Email" icon={<Phone size={17} />}>
                    <input
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="9876543210 or you@email.com"
                      className={inputCls}
                      autoComplete="username"
                    />
                  </Field>

                  <Field label="Password" icon={<Lock size={17} />} rightSlot={
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="text-slate-400 hover:text-emerald-500 transition-colors pr-4">
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  }>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputCls}
                      autoComplete="current-password"
                    />
                  </Field>

                  <SubmitBtn loading={loading} label="Sign In" />
                </form>
              )}

              {/* ── SIGNUP FORM ── */}
              {mode === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <Field label="Full Name *" icon={<User size={17} />}>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Rahul Sharma"
                      className={inputCls}
                      autoComplete="name"
                    />
                  </Field>

                  <Field label="Phone Number *" icon={<Phone size={17} />}>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className={inputCls}
                      autoComplete="tel"
                    />
                  </Field>

                  <Field label="Email (optional)" icon={<Mail size={17} />}>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className={inputCls}
                      autoComplete="email"
                    />
                  </Field>

                  <Field label="Create Password *" icon={<Lock size={17} />} rightSlot={
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="text-slate-400 hover:text-emerald-500 transition-colors pr-4">
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  }>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className={inputCls}
                      autoComplete="new-password"
                    />
                  </Field>

                  <Field label="Confirm Password *" icon={<Lock size={17} />} rightSlot={
                    <button type="button" onClick={() => setShowConfirm(p => !p)} className="text-slate-400 hover:text-emerald-500 transition-colors pr-4">
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  }>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={inputCls}
                      autoComplete="new-password"
                    />
                  </Field>

                  <SubmitBtn loading={loading} label="Create Account" />
                </form>
              )}

              {/* Switch hint */}
              <p className="text-center text-xs text-slate-400 font-semibold mt-6">
                {mode === 'login' ? (
                  <>New here?{' '}
                    <button onClick={() => switchMode('signup')} className="text-emerald-600 font-black hover:underline">
                      Create an account
                    </button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button onClick={() => switchMode('login')} className="text-emerald-600 font-black hover:underline">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Small sub-components ───────────────────────────────────────────────────

const inputCls = 'w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-medium placeholder:text-slate-300';

const Field: React.FC<{
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}> = ({ label, icon, children, rightSlot }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative flex items-center group">
      <div className="absolute left-0 pl-3.5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
        {icon}
      </div>
      {children}
      {rightSlot && (
        <div className="absolute right-0 flex items-center">{rightSlot}</div>
      )}
    </div>
  </div>
);

const SubmitBtn: React.FC<{ loading: boolean; label: string }> = ({ loading, label }) => (
  <button
    type="submit"
    disabled={loading}
    className="w-full h-12 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
  >
    {loading ? (
      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    ) : (
      <>
        {label}
        <ChevronRight size={18} />
      </>
    )}
  </button>
);

export default CustomerLogin;
