import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell, Field } from './Login';

export default function Signup() {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [message, setMessage] = useState('');
  function submit(event: FormEvent) { event.preventDefault(); if (!name.trim() || !email || !password || !confirmPassword) return setMessage('Complete all fields to continue.'); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMessage('Enter a valid email address.'); if (password.length < 12) return setMessage('Use at least 12 characters for your password.'); if (password !== confirmPassword) return setMessage('Passwords do not match.'); setMessage('Account creation requires the authentication database to be connected.'); }
  return <AuthShell title="Create Account" subtitle="Set up access to AquaSentinel AI."><form onSubmit={submit} className="space-y-4" noValidate>{message && <div role="status" className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">{message}</div>}<Field label="Full Name" type="text" value={name} onChange={setName} autoComplete="name" /><Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" /><Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" /><Field label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" /><button className="auth-submit" type="submit">Create Account</button></form><p className="mt-6 text-center text-sm text-slate-400">Already have an account? <Link to="/login" className="font-medium text-cyan-400">Sign in</Link></p></AuthShell>;
}
