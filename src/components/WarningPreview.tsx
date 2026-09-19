import { AlertTriangle, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatTimeOnly, parameterLabels, getSeverityBg } from '../utils/helpers';
import type { EarlyWarning, ParameterKey } from '../types/api';

interface WarningPreviewProps {
  warnings: EarlyWarning[];
}

export default function WarningPreview({ warnings }: WarningPreviewProps) {
  const active = warnings.filter((w) => w.status === 'active');

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-300">Early Warning Center</h3>
        {active.length > 0 && (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-400/10 text-red-400 border border-red-400/20">
            {active.length} ACTIVE
          </span>
        )}
      </div>

      {warnings.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-6">No active warnings</p>
      ) : (
        <div className="space-y-2.5">
          {warnings.slice(0, 3).map((w) => (
            <div
              key={w.id}
              className={`rounded-lg border p-3 ${getSeverityBg(w.severity)}`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  w.severity === 'critical' ? 'text-red-400 pulse-critical' :
                  w.severity === 'warning' ? 'text-amber-400' : 'text-sky-400'
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={w.severity} size="sm" />
                    <span className="text-xs font-medium text-white truncate">{w.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{w.reason}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                    <span>{parameterLabels[w.parameter as ParameterKey] || w.parameter}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeOnly(w.detectedTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
