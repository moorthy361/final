import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Waves } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth();
  const handleLogout = async () => { try { await logout(); } catch { /* local state is cleared */ } };
  return <main className="min-h-screen bg-navy-950 text-slate-200"><header className="sticky top-0 z-20 border-b border-white/5 bg-navy-950/85 backdrop-blur-xl"><nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"><Link to="/" className="flex items-center gap-2 font-bold text-white"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500"><Waves className="h-5 w-5" /></span>AquaSentinel AI</Link><div className="hidden items-center gap-5 text-sm text-slate-400 md:flex"><Link to="/features" className="hover:text-cyan-300">Features</Link><Link to="/about" className="hover:text-cyan-300">About</Link><Link to="/how-it-works" className="hover:text-cyan-300">How It Works</Link><Link to="/contact" className="hover:text-cyan-300">Contact</Link></div><div className="flex items-center gap-3 text-sm">{isAuthenticated ? <><span className="hidden text-slate-400 sm:block">{user?.name}</span><Link to="/private-dashboard" className="text-cyan-400 hover:text-cyan-300">Dashboard</Link><button onClick={() => void handleLogout()} className="text-slate-400 hover:text-white">Logout</button></> : <><Link to="/login" className="text-slate-300 hover:text-white">Login</Link><Link to="/register" className="rounded-lg bg-cyan-500 px-3 py-2 font-medium text-navy-950 hover:bg-cyan-400">Register</Link></>}</div></nav></header>{children}</main>;
}

export function PublicPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <PublicLayout><section className="mx-auto max-w-6xl px-4 py-16 sm:px-6"><p className="text-sm font-semibold uppercase tracking-[.2em] text-cyan-400">{eyebrow}</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1><div className="mt-10">{children}</div></section></PublicLayout>;
}
