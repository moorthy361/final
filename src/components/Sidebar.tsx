import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Droplets,
  AlertTriangle,
  TrendingUp,
  Bell,
  Activity,
  Clock,
  Settings,
  Wifi,
  WifiOff,
  User,
  X,
  Waves,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isConnected: boolean;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/water-quality', label: 'Water Quality', icon: Droplets },
  { path: '/anomaly-detection', label: 'Anomaly Detection', icon: AlertTriangle },
  { path: '/risk-prediction', label: 'Risk Prediction', icon: TrendingUp },
  { path: '/early-warnings', label: 'Early Warnings', icon: Bell },
  { path: '/sensor-health', label: 'Sensor Health', icon: Activity },
  { path: '/historical-data', label: 'Historical Data', icon: Clock },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose, isConnected }: SidebarProps) {
  const location = useLocation();
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
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 flex flex-col
          bg-navy-900/95 backdrop-blur-xl border-r border-white/5
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">AquaSentinel AI</h1>
            <p className="text-[10px] text-slate-400 leading-tight">Water Quality Monitor</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden p-1 text-slate-400 hover:text-white rounded transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${isActive
                    ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{label}</span>
                {label === 'Early Warnings' && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center justify-center">
                    3
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/5 p-4 space-y-3">
          {/* System status */}
          <div className="flex items-center gap-2 text-xs">
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">System Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400">Using Cached Data</span>
              </>
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => void handleLogout()} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-red-300"><LogOut className="h-3.5 w-3.5" />Log out</button>
        </div>
      </aside>
    </>
  );
}
