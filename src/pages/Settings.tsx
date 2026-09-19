import { useState } from 'react';
import { Wifi, WifiOff, Database, Bell, Monitor, Globe, Clock } from 'lucide-react';

export default function Settings() {
  // Local state for settings — these will connect to backend settings API
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [chartAnimations, setChartAnimations] = useState(true);
  const [notifBrowser, setNotifBrowser] = useState(true);
  const [notifCritical, setNotifCritical] = useState(true);
  const [notifWarning, setNotifWarning] = useState(true);
  const [notifAdvisory, setNotifAdvisory] = useState(false);

  // Connection status — populated from API when connected
  const apiConnected = false;
  const dbConnected = false;
  const lastUpdate = '—';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">System configuration and connection status</p>
      </div>

      {/* ─── API Connection Status ────────────────────────── */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          API Connection Status
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white/[0.03] rounded-lg p-3">
            <div className="flex items-center gap-3">
              {apiConnected ? (
                <Wifi className="w-4 h-4 text-emerald-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <div>
                <p className="text-sm text-white">API Server</p>
                <p className="text-[10px] text-slate-500">
                  {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              apiConnected
                ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                : 'bg-red-400/10 text-red-400 border-red-400/20'
            }`}>
              {apiConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="flex items-center justify-between bg-white/[0.03] rounded-lg p-3">
            <div className="flex items-center gap-3">
              <Database className={`w-4 h-4 ${dbConnected ? 'text-emerald-400' : 'text-red-400'}`} />
              <div>
                <p className="text-sm text-white">Database (PostgreSQL)</p>
                <p className="text-[10px] text-slate-500">Via backend API</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              dbConnected
                ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                : 'bg-red-400/10 text-red-400 border-red-400/20'
            }`}>
              {dbConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Last successful update: <span className="text-slate-300">{lastUpdate}</span></span>
          </div>
        </div>
      </div>

      {/* ─── System Settings ──────────────────────────────── */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-cyan-400" />
          Dashboard Preferences
        </h2>

        <div className="space-y-4">
          {/* Auto-refresh */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Auto-Refresh</p>
              <p className="text-[10px] text-slate-500">Automatically fetch new data at regular intervals</p>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                autoRefresh ? 'bg-cyan-400' : 'bg-slate-600'
              }`}
              role="switch"
              aria-checked={autoRefresh}
              aria-label="Toggle auto-refresh"
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                autoRefresh ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Refresh interval */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Refresh Interval</p>
              <p className="text-[10px] text-slate-500">Time between data refreshes (seconds)</p>
            </div>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-400/30 focus:outline-none"
              aria-label="Refresh interval"
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={120}>120s</option>
              <option value={300}>5 min</option>
            </select>
          </div>

          {/* Chart animations */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Chart Animations</p>
              <p className="text-[10px] text-slate-500">Enable smooth transitions in charts</p>
            </div>
            <button
              onClick={() => setChartAnimations(!chartAnimations)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                chartAnimations ? 'bg-cyan-400' : 'bg-slate-600'
              }`}
              role="switch"
              aria-checked={chartAnimations}
              aria-label="Toggle chart animations"
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                chartAnimations ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Notification Settings ────────────────────────── */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          Notification Settings
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Browser Notifications</p>
              <p className="text-[10px] text-slate-500">Show browser push notifications for alerts</p>
            </div>
            <button
              onClick={() => setNotifBrowser(!notifBrowser)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                notifBrowser ? 'bg-cyan-400' : 'bg-slate-600'
              }`}
              role="switch"
              aria-checked={notifBrowser}
              aria-label="Toggle browser notifications"
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                notifBrowser ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Critical Alerts</p>
              <p className="text-[10px] text-slate-500">Notify on critical severity events</p>
            </div>
            <button
              onClick={() => setNotifCritical(!notifCritical)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                notifCritical ? 'bg-red-400' : 'bg-slate-600'
              }`}
              role="switch"
              aria-checked={notifCritical}
              aria-label="Toggle critical notifications"
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                notifCritical ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Warning Alerts</p>
              <p className="text-[10px] text-slate-500">Notify on warning severity events</p>
            </div>
            <button
              onClick={() => setNotifWarning(!notifWarning)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                notifWarning ? 'bg-amber-400' : 'bg-slate-600'
              }`}
              role="switch"
              aria-checked={notifWarning}
              aria-label="Toggle warning notifications"
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                notifWarning ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Advisory Alerts</p>
              <p className="text-[10px] text-slate-500">Notify on advisory severity events</p>
            </div>
            <button
              onClick={() => setNotifAdvisory(!notifAdvisory)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                notifAdvisory ? 'bg-sky-400' : 'bg-slate-600'
              }`}
              role="switch"
              aria-checked={notifAdvisory}
              aria-label="Toggle advisory notifications"
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                notifAdvisory ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Tech Stack Info ──────────────────────────────── */}
    </div>
  );
}
