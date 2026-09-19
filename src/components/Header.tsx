import { RefreshCw, Bell, User, Menu, Wifi, WifiOff, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../utils/helpers';

interface HeaderProps {
  onMenuClick: () => void;
  isConnected: boolean;
  isUsingMock: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading: boolean;
}

export default function Header({
  onMenuClick,
  isConnected,
  isUsingMock,
  lastUpdated,
  onRefresh,
  loading,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/', { replace: true });
    }
  };
  return (
    <header className="sticky top-0 z-30 bg-navy-950/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <h2 className="text-sm font-semibold text-white">AquaSentinel AI</h2>
            <p className="text-[10px] text-slate-500">AI-Powered Water Quality Monitoring & Early Warning</p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Connection status */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-xs">
            {isConnected && !isUsingMock ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400">{isUsingMock ? 'Demo Data' : 'Backend Offline'}</span>
              </>
            )}
          </div>

          {/* Last updated */}
          {lastUpdated && (
            <span className="hidden lg:block text-[11px] text-slate-500">
              Updated {formatRelativeTime(lastUpdated.toISOString())}
            </span>
          )}

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Notifications */}
          <button
            className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>

          <div className="hidden sm:block text-right leading-tight"><p className="max-w-28 truncate text-xs font-medium text-slate-200">{user?.name}</p><p className="max-w-28 truncate text-[10px] text-slate-500">{user?.email}</p></div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-slate-300"><User className="w-4 h-4" /></div>
          <button onClick={() => void handleLogout()} className="p-2 text-slate-400 hover:text-red-300 rounded-lg hover:bg-white/5 transition-colors" aria-label="Log out"><LogOut className="w-4 h-4" /></button>
        </div>
      </div>
    </header>
  );
}
