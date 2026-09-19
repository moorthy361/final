import { useState, useCallback } from 'react';
import { AlertTriangle, Check, Clock, Filter } from 'lucide-react';
import { useApiData } from '../hooks/useApiData';
import { getWarnings } from '../services/api';
import { mockWarningHistory } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { parameterLabels, formatTimestamp, formatTimeOnly, getSeverityBg } from '../utils/helpers';
import type { EarlyWarning, ParameterKey } from '../types/api';

export default function EarlyWarnings() {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [paramFilter, setParamFilter] = useState<string>('all');
  const [, setSelectedWarning] = useState<EarlyWarning | null>(null);

  const fetchFn = useCallback(
    () => getWarnings({
      severity: severityFilter === 'all' ? undefined : severityFilter,
      parameter: paramFilter === 'all' ? undefined : paramFilter,
    }),
    [severityFilter, paramFilter]
  );

  const { data, loading, error, refetch } = useApiData<EarlyWarning[]>({
    fetchFn,
    mockData: mockWarningHistory,
  });

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <LoadingState type="card" count={3} />
        <LoadingState type="table" count={1} />
      </div>
    );
  }

  if (error && !data) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const filtered = data.filter((w) => {
    if (severityFilter !== 'all' && w.severity !== severityFilter) return false;
    if (paramFilter !== 'all' && w.parameter !== paramFilter) return false;
    return true;
  });

  const activeCount = data.filter((w) => w.status === 'active').length;
  const acknowledgedCount = data.filter((w) => w.status === 'acknowledged').length;
  const resolvedCount = data.filter((w) => w.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Early Warning Center</h1>
        <p className="text-xs text-slate-500 mt-0.5">Active alerts and warning history</p>
      </div>

      {/* ─── Statistics ───────────────────────────────────── */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center border border-red-400/10">
          <p className="text-[10px] text-slate-500 mb-1">Active Alerts</p>
          <p className="text-2xl font-bold text-red-400">{activeCount}</p>
        </div>
        <div className="glass-card p-4 text-center border border-amber-400/10">
          <p className="text-[10px] text-slate-500 mb-1">Acknowledged</p>
          <p className="text-2xl font-bold text-amber-400">{acknowledgedCount}</p>
        </div>
        <div className="glass-card p-4 text-center border border-emerald-400/10">
          <p className="text-[10px] text-slate-500 mb-1">Resolved</p>
          <p className="text-2xl font-bold text-emerald-400">{resolvedCount}</p>
        </div>
      </div>

      {/* ─── Filters ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-500">Severity:</span>
          {['all', 'critical', 'warning', 'advisory'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                severityFilter === s
                  ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Parameter:</span>
          <button
            onClick={() => setParamFilter('all')}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
              paramFilter === 'all'
                ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            All
          </button>
          {(['ph', 'turbidity', 'temperature', 'tds', 'conductivity'] as ParameterKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setParamFilter(key)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                paramFilter === key
                  ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {parameterLabels[key]}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Active Alerts ────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState message="No warnings found" description="No warnings match the selected filters." />
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <div
              key={w.id}
              className={`glass-card p-5 border cursor-pointer transition-all hover:border-opacity-50 ${getSeverityBg(w.severity)}`}
              onClick={() => setSelectedWarning(w)}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Icon + Severity */}
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                    w.severity === 'critical' ? 'text-red-400 pulse-critical' :
                    w.severity === 'warning' ? 'text-amber-400' : 'text-sky-400'
                  }`} />
                  <StatusBadge status={w.severity} size="md" />
                  <StatusBadge status={w.status} size="sm" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white mb-1">{w.title}</h4>
                  <p className="text-xs text-slate-400 mb-2">{w.reason}</p>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px]">
                    <span className="text-slate-500">
                      Parameter: <span className="text-slate-300">{parameterLabels[w.parameter as ParameterKey] || w.parameter}</span>
                    </span>
                    <span className="text-slate-500">
                      Value: <span className="text-white font-medium">{w.currentValue}</span>
                    </span>
                    {w.normalRange && (
                      <span className="text-slate-500">
                        Normal: <span className="text-slate-300">{w.normalRange}</span>
                      </span>
                    )}
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Detected: {formatTimeOnly(w.detectedTime)}
                    </span>
                  </div>

                  {w.recommendedAction && (
                    <div className="mt-3 px-3 py-2 bg-white/[0.03] rounded-lg">
                      <p className="text-[10px] text-slate-500 mb-0.5">Recommended Action</p>
                      <p className="text-xs text-slate-300">{w.recommendedAction}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {w.status === 'active' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-lg hover:bg-cyan-400/20 transition-colors flex-shrink-0"
                    aria-label={`Acknowledge warning: ${w.title}`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Alert Table ──────────────────────────────────── */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Warning History</h3>
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-3 text-slate-500 font-medium">Time</th>
                <th className="text-left py-3 px-3 text-slate-500 font-medium">Severity</th>
                <th className="text-left py-3 px-3 text-slate-500 font-medium">Parameter</th>
                <th className="text-left py-3 px-3 text-slate-500 font-medium">Event</th>
                <th className="text-left py-3 px-3 text-slate-500 font-medium">Status</th>
                <th className="text-left py-3 px-3 text-slate-500 font-medium">Acknowledged</th>
              </tr>
            </thead>
            <tbody>
              {data.map((w) => (
                <tr key={w.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 text-slate-300">{formatTimestamp(w.detectedTime)}</td>
                  <td className="py-3 px-3"><StatusBadge status={w.severity} size="sm" /></td>
                  <td className="py-3 px-3 text-slate-300">{parameterLabels[w.parameter as ParameterKey] || w.parameter}</td>
                  <td className="py-3 px-3 text-white">{w.title}</td>
                  <td className="py-3 px-3"><StatusBadge status={w.status} size="sm" /></td>
                  <td className="py-3 px-3 text-slate-400">
                    {w.acknowledgedBy ? `${w.acknowledgedBy}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
