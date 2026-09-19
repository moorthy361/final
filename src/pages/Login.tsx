import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Waves } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  if (isAuthenticated) return <Navigate to={from} replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return setError('Email is required.');
    if (!emailPattern.test(email)) return setError('Enter a valid email address.');
    if (!password) return setError('Password is required.');
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password, remember);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return <AuthShell title="Welcome Back" subtitle="Sign in to continue monitoring your water systems.">
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && <div role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</div>}
      <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-200" htmlFor="password">Password</label>
        <div className="relative">
          <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="auth-input pr-12" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-cyan-300" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm"><label className="flex cursor-pointer items-center gap-2 text-slate-400"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-cyan-500" />Remember me</label><Link to="/forgot-password" className="text-cyan-400 hover:text-cyan-300">Forgot password?</Link></div>
      <button disabled={submitting} className="auth-submit" type="submit">{submitting ? 'Signing in…' : <><LogIn className="h-4 w-4" />Sign In</>}</button>
    </form>
    <p className="mt-6 text-center text-sm text-slate-400">Don't have an account? <Link to="/signup" className="font-medium text-cyan-400 hover:text-cyan-300">Create account</Link></p>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <main className="auth-page"><div className="auth-glow" /><section className="relative w-full max-w-md px-4"><div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/20"><Waves className="h-7 w-7 text-white" /></div><h1 className="text-2xl font-bold tracking-tight text-white">AquaSentinel AI</h1><p className="mt-1 text-sm text-slate-400">Intelligent Water Monitoring</p></div><div className="glass-card p-6 sm:p-8"><h2 className="text-xl font-semibold text-white">{title}</h2><p className="mt-1 text-sm text-slate-400">{subtitle}</p><div className="mt-6">{children}</div></div></section></main>;
}

export function Field({ label, type, value, onChange, autoComplete }: { label: string; type: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  const id = label.toLowerCase().replace(/\s/g, '-');
  return <div><label className="mb-1.5 block text-sm font-medium text-slate-200" htmlFor={id}>{label}</label><input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} className="auth-input" /></div>;
}
