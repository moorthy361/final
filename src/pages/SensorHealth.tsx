import { useCallback } from 'react';
import { Cpu, AlertCircle, CheckCircle, WifiOff } from 'lucide-react';
import { useApiData } from '../hooks/useApiData';
import { getSensorHealth } from '../services/api';
import { mockDashboardData } from '../data/mockData';
import SparklineChart from '../components/charts/SparklineChart';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { parameterLabels, formatRelativeTime, getSensorStatusColor } from '../utils/helpers';
import type { AllSensorHealth, ParameterKey } from '../types/api';

const paramKeys: ParameterKey[] = ['ph', 'turbidity', 'temperature', 'tds', 'conductivity'];

const statusIcons = {
  Healthy: CheckCircle,
  Warning: AlertCircle,
  Faulty: AlertCircle,
  Offline: WifiOff,
};

export default function SensorHealth() {
  const fetchFn = useCallback(() => getSensorHealth(), []);
  const { data, loading, error, refetch } = useApiData<AllSensorHealth>({
    fetchFn,
    mockData: mockDashboardData.sensorHealth,
  });

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingState type="card" count={5} />
        </div>
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
          <h1 className="text-xl font-bold text-white">Sensor Health Status</h1>
          <p className="text-xs text-slate-500 mt-0.5">Sensor reliability and diagnostic analysis</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] text-xs text-slate-400">
          <Cpu className="w-3.5 h-3.5" />
          <span>Analysis: <span className="text-slate-300">Rule-Based + Statistical</span></span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-3 bg-sky-400/5 border border-sky-400/10 rounded-lg">
        <p className="text-xs text-sky-300">
          <strong>Note:</strong> Sensor health reflects the reliability of the sensor hardware, not the quality of water being measured. A faulty sensor does not necessarily indicate poor water quality.
        </p>
      </div>

      {/* ─── Sensor Detail Cards ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paramKeys.map((key) => {
          const sensor = data[key];
          const StatusIcon = statusIcons[sensor.status];
          return (
            <div key={key} className="glass-card p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-4 h-4 ${getSensorStatusColor(sensor.status)}`} />
                  <h3 className="text-sm font-semibold text-white">{parameterLabels[key]} Sensor</h3>
                </div>
                <StatusBadge status={sensor.status} size="sm" />
              </div>

              {/* Health Score */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="5" />
                    <circle
                      cx="32" cy="32" r="28" fill="none"
                      stroke={sensor.health >= 90 ? '#34d399' : sensor.health >= 70 ? '#fbbf24' : '#f87171'}
                      strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - sensor.health / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-sm font-bold text-white">{sensor.health}%</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-slate-500">Reliability</span>
                    <span className="text-white">{sensor.reliabilityScore}%</span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-slate-500">Last Comm.</span>
                    <span className="text-slate-300">{formatRelativeTime(sensor.lastCommunication)}</span>
                  </div>
                </div>
              </div>

              {/* Health Sparkline */}
              <SparklineChart
                data={sensor.history}
                color={sensor.health >= 90 ? '#34d399' : sensor.health >= 70 ? '#fbbf24' : '#f87171'}
                height={32}
              />

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/[0.03] rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-slate-500">Missing</span>
                  <span className={`font-medium ${sensor.missingReadings > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {sensor.missingReadings}
                  </span>
                </div>
                <div className="bg-white/[0.03] rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-slate-500">Invalid</span>
                  <span className={`font-medium ${sensor.invalidReadings > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {sensor.invalidReadings}
                  </span>
                </div>
                <div className="bg-white/[0.03] rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-slate-500">Spikes</span>
                  <span className={`font-medium ${sensor.spikeCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {sensor.spikeCount}
                  </span>
                </div>
                <div className="bg-white/[0.03] rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-slate-500">Drift</span>
                  <span className={`font-medium ${sensor.driftDetected ? 'text-red-400' : 'text-emerald-400'}`}>
                    {sensor.driftDetected ? 'Detected' : 'None'}
                  </span>
                </div>
                <div className="col-span-2 bg-white/[0.03] rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-slate-500">Stuck Value</span>
                  <span className={`font-medium ${sensor.stuckValueDetected ? 'text-red-400' : 'text-emerald-400'}`}>
                    {sensor.stuckValueDetected ? 'Detected' : 'None'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Summary Table ────────────────────────────────── */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Sensor Health Summary</h3>
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-3 text-slate-500 font-medium">Sensor</th>
                <th className="text-left py-3 px-3 text-slate-500 font-medium">Health</th>
                <th className="text-left py-3 px-3 text-slate-500 font-medium">Missing</th>
                <th className="text-left py-3 px-3 text-slate-500 font-medium">Drift</th>
                <th className="text-left py-3 px-3 text-slate-500 font-medium">Spikes</th>
                <th className="text-left py-3 px-3 text-slate-500 font-medium">Status</th>
                <th className="text-left py-3 px-3 text-slate-500 font-medium">Last Update</th>
              </tr>
            </thead>
            <tbody>
              {paramKeys.map((key) => {
                const sensor = data[key];
                return (
                  <tr key={key} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-white font-medium">{parameterLabels[key]} Sensor</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${sensor.health}%`,
                              backgroundColor: sensor.health >= 90 ? '#34d399' : sensor.health >= 70 ? '#fbbf24' : '#f87171',
                            }}
                          />
                        </div>
                        <span className="text-white">{sensor.health}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{sensor.missingReadings}</td>
                    <td className="py-3 px-3">
                      <span className={sensor.driftDetected ? 'text-red-400' : 'text-emerald-400'}>
                        {sensor.driftDetected ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{sensor.spikeCount}</td>
                    <td className="py-3 px-3"><StatusBadge status={sensor.status} size="sm" /></td>
                    <td className="py-3 px-3 text-slate-400">{formatRelativeTime(sensor.lastCommunication)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
