import { useCallback } from 'react';
import { Cpu, TrendingUp, ShieldAlert } from 'lucide-react';
import { useApiData } from '../hooks/useApiData';
import { getRiskPrediction } from '../services/api';
import { mockDashboardData } from '../data/mockData';
import RiskTrendChart from '../components/charts/RiskTrendChart';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { getRiskColor, getRiskBg, formatPercentage } from '../utils/helpers';
import type { RiskPrediction as RiskPredictionType } from '../types/api';

const riskSlots = [
  { key: 'current' as const, label: 'Current Risk', icon: ShieldAlert },
  { key: 'sixHour' as const, label: 'Next 6 Hours', icon: TrendingUp },
  { key: 'twelveHour' as const, label: 'Next 12 Hours', icon: TrendingUp },
  { key: 'twentyFourHour' as const, label: 'Next 24 Hours', icon: TrendingUp },
];

export default function RiskPrediction() {
  const fetchFn = useCallback(() => getRiskPrediction(), []);
  const { data, loading, error, refetch } = useApiData<RiskPredictionType>({
    fetchFn,
    mockData: mockDashboardData.risk,
  });

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LoadingState type="card" count={4} />
        </div>
        <LoadingState type="chart" count={1} />
      </div>
    );
  }

  if (error && !data) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">AI Risk Prediction</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Predicted water quality risk levels
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] text-xs text-slate-400">
          <Cpu className="w-3.5 h-3.5" />
          <span>Prediction Model: <span className="text-slate-300">Random Forest</span></span>
        </div>
      </div>

      {/* ─── Risk Level Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {riskSlots.map(({ key, label, icon: Icon }) => {
          const level = data[key];
          const isAvailable = level !== null && level !== undefined;
          return (
            <div key={key} className={`glass-card p-5 border ${isAvailable ? getRiskBg(level) : 'border-white/5'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${isAvailable ? getRiskColor(level) : 'text-slate-600'}`} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
              {isAvailable ? (
                <p className={`text-2xl font-bold ${getRiskColor(level)}`}>
                  {level!.toUpperCase()}
                </p>
              ) : (
                <div>
                  <p className="text-base font-medium text-slate-600">N/A</p>
                  <p className="text-[10px] text-slate-700 mt-1">
                    Future prediction unavailable
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Prediction Confidence ────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-300">Prediction Confidence</p>
            <p className="text-xs text-slate-500 mt-0.5">Based on Random Forest model output</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{formatPercentage(data.confidence)}</p>
          </div>
        </div>
        <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${data.confidence * 100}%` }}
          />
        </div>
      </div>

      {/* ─── Risk Trend Chart ─────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300">Risk Trend</h3>
          <div className="flex items-center gap-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <div className="w-6 h-[2px] bg-emerald-400 rounded" />
              Low (&lt;25%)
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-6 h-[2px] bg-amber-400 rounded" />
              Moderate (25-50%)
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-6 h-[2px] bg-red-400 rounded" />
              High (&gt;75%)
            </span>
          </div>
        </div>
        <RiskTrendChart data={data.trend} height={320} />
      </div>

      {/* ─── Risk Factors ─────────────────────────────────── */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Risk Factors</h3>
        {data.factors && data.factors.length > 0 ? (
          <div className="space-y-3">
            {data.factors.map((factor, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/[0.02] rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{factor.parameter}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{factor.description}</p>
                </div>
                <StatusBadge status={factor.contribution} size="sm" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4">
            Feature importance data not available. Connect the backend to see contributing parameters.
          </p>
        )}
        <p className="text-[10px] text-slate-600 mt-4">
          Risk factors and their contributions are computed by the backend Random Forest model. The frontend displays backend-provided results only.
        </p>
      </div>
    </div>
  );
}
