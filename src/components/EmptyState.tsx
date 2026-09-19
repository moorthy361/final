import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  description?: string;
}

export default function EmptyState({
  message = 'No Data Available',
  description = 'No water-quality data available for the selected period.',
}: EmptyStateProps) {
  return (
    <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-3">
      <div className="w-14 h-14 rounded-full bg-slate-400/10 flex items-center justify-center">
        <Inbox className="w-7 h-7 text-slate-500" />
      </div>
      <p className="text-sm text-slate-300 font-medium">{message}</p>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}
