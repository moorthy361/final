import { useState, useCallback } from 'react';
import { useApiData } from '../hooks/useApiData';
import { getWaterQuality } from '../services/api';
import { mockDashboardData } from '../data/mockData';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { parameterLabels, parameterUnits, formatRelativeTime } from '../utils/helpers';
import type { SensorParameters, ParameterKey } from '../types/api';

const paramKeys: ParameterKey[] = ['ph', 'turbidity', 'temperature', 'tds', 'conductivity'];

const timeRanges = [
  { value: '1h', label: 'Last 1 Hour' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: 'custom', label: 'Custom Range' },
];

const paramColors: Record<ParameterKey, string> = {
  ph: '#8b5cf6',
  turbidity: '#22d3ee',
  temperature: '#f59e0b',
  tds: '#10b981',
  conductivity: '#3b82f6',
};

export default function WaterQuality() {
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedParam, setSelectedParam] = useState<ParameterKey | null>(null);

  const fetchFn = useCallback(() => getWaterQuality(timeRange), [timeRange]);
  const { data, loading, error, refetch } = useApiData<SensorParameters>({
    fetchFn,
    mockData: mockDashboardData.parameters,
  });

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <LoadingState type="card" count={5} />
        <LoadingState type="chart" count={1} />
      </div>
    );
  }

  if (error && !data) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const viewParams = selectedParam ? [selectedParam] : paramKeys;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Water Quality Monitoring</h1>
          <p className="text-xs text-slate-500 mt-0.5">Detailed sensor parameter analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {timeRanges.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTimeRange(value)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                timeRange === value
                  ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Parameter Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedParam(null)}
          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
            !selectedParam
              ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          All Parameters
        </button>
        {paramKeys.map((key) => (
          <button
            key={key}
            onClick={() => setSelectedParam(key)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              selectedParam === key
                ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {parameterLabels[key]}
          </button>
        ))}
      </div>

      {/* Parameter Detail Cards + Charts */}
      {viewParams.map((key) => {
        const param = data[key];
        return (
          <div key={key} className="glass-card p-5">
            {/* Summary Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: paramColors[key] }} />
                <h3 className="text-base font-semibold text-white">{parameterLabels[key]}</h3>
                <StatusBadge status={param.status} size="sm" />
              </div>
              <div className="flex items-center gap-6 text-xs sm:ml-auto">
                <div>
                  <span className="text-slate-500">Current: </span>
                  <span className="text-white font-semibold">{param.value} {param.unit}</span>
                </div>
                <div>
                  <span className="text-slate-500">Min: </span>
                  <span className="text-slate-300">{param.min}</span>
                </div>
                <div>
                  <span className="text-slate-500">Max: </span>
                  <span className="text-slate-300">{param.max}</span>
                </div>
                <div>
                  <span className="text-slate-500">Avg: </span>
                  <span className="text-slate-300">{param.average}</span>
                </div>
                <div className="hidden md:block">
                  <span className="text-slate-500">Updated: </span>
                  <span className="text-slate-300">{formatRelativeTime(param.lastUpdated)}</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <TimeSeriesChart
              data={param.history}
              color={paramColors[key]}
              unit={parameterUnits[key]}
              label={parameterLabels[key]}
              height={250}
            />
          </div>
        );
      })}
    </div>
  );
}
