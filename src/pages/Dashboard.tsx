import { useCallback } from 'react';
import WaterQualityScore from '../components/WaterQualityScore';
import SensorCard from '../components/SensorCard';
import AnomalySummary from '../components/AnomalySummary';
import RiskOverview from '../components/RiskOverview';
import WarningPreview from '../components/WarningPreview';
import SensorHealthOverview from '../components/SensorHealthOverview';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { useApiData } from '../hooks/useApiData';
import { getDashboardData } from '../services/api';
import { mockDashboardData } from '../data/mockData';
import type { DashboardData, ParameterKey } from '../types/api';

const paramKeys: ParameterKey[] = ['ph', 'turbidity', 'temperature', 'tds', 'conductivity'];

export default function Dashboard() {
  const fetchFn = useCallback(() => getDashboardData(), []);
  const { data, loading, error, refetch } = useApiData<DashboardData>({
    fetchFn,
    mockData: mockDashboardData,
  });

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LoadingState type="card" count={1} />
          <div className="lg:col-span-2">
            <LoadingState type="chart" count={1} />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <LoadingState type="card" count={5} />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* ─── Page Title ────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time water quality monitoring overview
        </p>
      </div>

      {/* ─── 1. Water Quality Status + Anomaly Chart ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WaterQualityScore data={data.waterQuality} />
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">Sensor Trends</h3>
            <span className="text-[10px] text-slate-500">Last 12 hours</span>
          </div>
          <TimeSeriesChart
            data={data.parameters.turbidity.history}
            color="#22d3ee"
            unit="NTU"
            label="Turbidity"
            height={220}
          />
        </div>
      </div>

      {/* ─── 2. Sensor Parameter Cards ────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Current Parameters</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {paramKeys.map((key) => (
            <SensorCard key={key} paramKey={key} data={data.parameters[key]} />
          ))}
        </div>
      </div>

      {/* ─── 3. Anomaly + Risk ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnomalySummary data={data.anomaly} />
        <RiskOverview data={data.risk} />
      </div>

      {/* ─── 4. Warnings + Sensor Health ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WarningPreview warnings={data.earlyWarnings} />
        <SensorHealthOverview data={data.sensorHealth} />
      </div>

      {/* ─── Tech Stack Footer ────────────────────────────────── */}
    </div>
  );
}
