interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

function getColors(status: string): string {
  const s = status.toLowerCase();
  if (['good', 'normal', 'healthy', 'low', 'resolved', 'connected'].includes(s))
    return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
  if (['moderate', 'warning', 'acknowledged'].includes(s))
    return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
  if (['poor', 'faulty', 'high', 'investigating'].includes(s))
    return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
  if (['critical', 'offline', 'detected', 'active', 'disconnected'].includes(s))
    return 'bg-red-400/10 text-red-400 border-red-400/20';
  if (['advisory'].includes(s))
    return 'bg-sky-400/10 text-sky-400 border-sky-400/20';
  return 'bg-slate-400/10 text-slate-400 border-slate-400/20';
}

const sizes = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-semibold uppercase tracking-wider rounded-full border
        ${getColors(status)} ${sizes[size]}
      `}
      role="status"
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  );
}
