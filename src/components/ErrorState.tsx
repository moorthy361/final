import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = 'Unable to retrieve current water-quality data.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-red-400/10 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <div>
        <p className="text-sm text-slate-300 font-medium">{message}</p>
        <p className="text-xs text-slate-500 mt-1">Please check your connection and try again.</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-lg hover:bg-cyan-400/20 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
}
