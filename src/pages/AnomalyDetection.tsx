import { useState, useCallback } from 'react';
import { Cpu, Search } from 'lucide-react';
import { useApiData } from '../hooks/useApiData';
import { getAnomalies, getWaterQuality } from '../services/api';
import { mockDashboardData, mockAnomalyRecords } from '../data/mockData';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { parameterLabels, formatTimestamp } from '../utils/helpers';
import type { AnomalyResult, AnomalyRecord, ParameterKey, SensorParameters } from '../types/api';

const paramKeys: ParameterKey[] = ['ph', 'turbidity', 'temperature', 'tds', 'conductivity'];

const paramColors: Record<ParameterKey, string> = {
  ph: '#8b5cf6',
  turbidity: '#22d3ee',
  temperature: '#f59e0b',
  tds: '#10b981',
  conductivity: '#3b82f6',
};

export default function AnomalyDetection() {
  const [filterParam, setFilterParam] = useState<string>('all');
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyRecord | null>(null);

  // ── Anomaly records ────────────────────────────────────────────────────────
  const anomalyFetchFn = useCallback(
    () => getAnomalies({ parameter: filterParam === 'all' ? undefined : filterParam }),
    [filterParam]
  );

  const mockSummary = mockDashboardData.anomaly;
  const mockData = {
    summary: mockSummary,
    records: {
      data: mockAnomalyRecords,
      total: mockAnomalyRecords.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    },
  };

  const { data, loading, error, refetch } = useApiData<{ summary: AnomalyResult; records: { data: AnomalyRecord[] } }>({
    fetchFn: anomalyFetchFn,
    mockData,
  });

  // ── Water quality parameters for the chart ─────────────────────────────────
  // Fetch the parameter history so the chart can display a real sensor series.
  const wqFetchFn = useCallback(() => getWaterQuality(), []);
  const { data: wqData } = useApiData<SensorParameters>({
    fetchFn: wqFetchFn,
    mockData: mockDashboardData.parameters,
  });

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LoadingState type="card" count={4} />
        </div>
        <LoadingState type="chart" count={1} />
        <LoadingState type="table" count={1} />
      </div>
    );
  }

  if (error && !data) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const { summary, records } = data;
  const filteredRecords = filterParam === 'all'
    ? records.data
    : records.data.filter((r) => r.parameter === filterParam);

  // Build anomaly points for chart overlay
  const anomalyPoints = filteredRecords.map((r) => ({
    timestamp: r.timestamp,
    value: r.value,
  }));

  // Use backend parameter history for chart; fall back to mock if not yet loaded
  const chartParam = filterParam === 'all' ? 'turbidity' : filterParam as ParameterKey;
  const chartHistory = wqData?.[chartParam]?.history ?? [];
  const chartUnit = wqData?.[chartParam]?.unit ?? '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Anomaly Detection</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Isolation Forest anomaly analysis
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] text-xs text-slate-400">
          <Cpu className="w-3.5 h-3.5" />
          <span>Algorithm: <span className="text-slate-300">Isolation Forest</span></span>
        </div>
      </div>

      {/* ─── A. Summary Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-[10px] text-slate-500 mb-1">Total Anomalies</p>
          <p className="text-2xl font-bold text-white">{summary.totalCount}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-[10px] text-slate-500 mb-1">Critical</p>
          <p className="text-2xl font-bold text-red-400">{summary.criticalCount}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-[10px] text-slate-500 mb-1">Warning</p>
          <p className="text-2xl font-bold text-amber-400">{summary.warningCount}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-[10px] text-slate-500 mb-1">Latest</p>
          <p className="text-sm font-semibold text-white truncate">{summary.latestAnomaly}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-[10px] text-slate-500 mb-1">Anomaly Rate</p>
          <p className="text-2xl font-bold text-amber-400">{summary.anomalyRate}%</p>
        </div>
      </div>

      {/* ─── Filter ───────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterParam('all')}
          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
            filterParam === 'all'
              ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          All
        </button>
        {paramKeys.map((key) => (
          <button
            key={key}
            onClick={() => setFilterParam(key)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              filterParam === key
                ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {parameterLabels[key]}
          </button>
        ))}
      </div>

      {/* ─── B. Timeline Chart ────────────────────────────── */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Anomaly Timeline</h3>
        {chartHistory.length > 0 ? (
          <>
            <TimeSeriesChart
              data={chartHistory}
              anomalies={anomalyPoints}
              color={paramColors[chartParam]}
              unit={chartUnit}
              label={parameterLabels[chartParam]}
              height={300}
            />
            <p className="text-[10px] text-slate-600 mt-2">
              Red dots indicate anomalies detected by the backend Isolation Forest model.
            </p>
          </>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-xs text-slate-500">
              No sensor history available. Send readings via <code className="text-slate-400">POST /api/sensors/data</code> to populate the chart.
            </p>
          </div>
        )}
      </div>

      {/* ─── C. Anomaly Table ─────────────────────────────── */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Anomaly Records</h3>
        {filteredRecords.length === 0 ? (
          <EmptyState message="No anomalies detected" description="No anomalies found for the selected filter." />
        ) : (
          <div className="overflow-x-auto table-scroll">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Timestamp</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Parameter</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Value</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Anomaly Score</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Severity</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Sensor Health</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Status</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedAnomaly(record)}
                  >
                    <td className="py-3 px-3 text-slate-300">{formatTimestamp(record.timestamp)}</td>
                    <td className="py-3 px-3 text-slate-300">{parameterLabels[record.parameter]}</td>
                    <td className="py-3 px-3 text-white font-medium">{record.value ?? 'N/A'}</td>
                    <td className="py-3 px-3">
                      <span className={`font-medium ${record.anomalyScore > 0.8 ? 'text-red-400' : record.anomalyScore > 0.6 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {record.anomalyScore.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-3"><StatusBadge status={record.severity} size="sm" /></td>
                    <td className="py-3 px-3 text-slate-300">{record.sensorHealth}%</td>
                    <td className="py-3 px-3"><StatusBadge status={record.status} size="sm" /></td>
                    <td className="py-3 px-3">
                      <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── D. Anomaly Explanation ───────────────────────── */}
      {selectedAnomaly && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-300">Anomaly Explanation</h3>
            <button
              onClick={() => setSelectedAnomaly(null)}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-slate-500 mb-0.5">Detected Anomaly</p>
                <p className="text-sm font-medium text-white">{parameterLabels[selectedAnomaly.parameter]}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-0.5">Reason</p>
                <p className="text-xs text-slate-300">{selectedAnomaly.reason}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-slate-500 mb-0.5">Anomaly Score</p>
                <p className="text-lg font-bold text-amber-400">{selectedAnomaly.anomalyScore.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-0.5">Sensor Health</p>
                <p className="text-sm text-white">{selectedAnomaly.sensorHealth}%</p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Note: A low sensor health may affect anomaly accuracy. This reading reflects sensor reliability, not water condition.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
