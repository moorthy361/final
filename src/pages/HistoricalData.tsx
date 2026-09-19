import { useState, useCallback, useMemo } from 'react';
import { Download, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { useApiData } from '../hooks/useApiData';
import { getHistoricalData } from '../services/api';
import { mockHistoricalData } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { formatTimestamp, downloadCsv } from '../utils/helpers';
import type { HistoricalRecord, PaginatedResponse } from '../types/api';

const PAGE_SIZE = 15;

export default function HistoricalData() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<string>('7d');

  const fetchFn = useCallback(
    () =>
      getHistoricalData({
        page,
        pageSize: PAGE_SIZE,
        sortBy,
        sortOrder,
        search: searchQuery || undefined,
      }),
    [page, sortBy, sortOrder, searchQuery]
  );

  // Build mock paginated response
  const mockPaginated: PaginatedResponse<HistoricalRecord> = useMemo(() => ({
    data: mockHistoricalData,
    total: mockHistoricalData.length,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(mockHistoricalData.length / PAGE_SIZE),
  }), []);

  const { data: rawData, loading, error, refetch } = useApiData<PaginatedResponse<HistoricalRecord>>({
    fetchFn,
    mockData: mockPaginated,
  });

  if (loading && !rawData) return <LoadingState type="table" count={1} />;
  if (error && !rawData) return <ErrorState message={error} onRetry={refetch} />;
  if (!rawData) return null;

  // Backend handles sorting and pagination — use the response directly
  const records = rawData.data;
  const totalPages = rawData.totalPages ?? Math.ceil(rawData.total / PAGE_SIZE);
  const paginatedRecords = records;

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleExport = () => {
    downloadCsv(
      records.map((r) => ({ ...r })) as unknown as Record<string, unknown>[],
      `aquasentinel_data_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const SortHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <th
      className="text-left py-3 px-3 text-slate-500 font-medium cursor-pointer hover:text-white transition-colors select-none"
      onClick={() => handleSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortBy === column ? 'text-cyan-400' : 'text-slate-600'}`} />
      </span>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Historical Data</h1>
          <p className="text-xs text-slate-500 mt-0.5">Explore and export water quality measurements</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-lg hover:bg-cyan-400/20 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* ─── Filters ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date range */}
        <div className="flex items-center gap-2">
          {['1h', '6h', '24h', '7d', 'custom'].map((r) => (
            <button
              key={r}
              onClick={() => { setDateRange(r); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                dateRange === r
                  ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {r === 'custom' ? 'Custom' : r === '1h' ? '1 Hour' : r === '6h' ? '6 Hours' : r === '24h' ? '24 Hours' : '7 Days'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search records..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/[0.03] border border-white/5 rounded-lg text-white placeholder-slate-500 focus:border-cyan-400/30 focus:outline-none transition-colors"
            aria-label="Search historical records"
          />
        </div>
      </div>

      {/* ─── Data Table ───────────────────────────────────── */}
      <div className="glass-card p-5">
        {paginatedRecords.length === 0 ? (
          <EmptyState message="No data found" description="No water-quality data available for the selected period." />
        ) : (
          <>
            <div className="overflow-x-auto table-scroll">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5">
                    <SortHeader column="timestamp">Timestamp</SortHeader>
                    <SortHeader column="ph">pH</SortHeader>
                    <SortHeader column="turbidity">Turbidity</SortHeader>
                    <SortHeader column="temperature">Temp (°C)</SortHeader>
                    <SortHeader column="tds">TDS (ppm)</SortHeader>
                    <SortHeader column="conductivity">Cond. (µS/cm)</SortHeader>
                    <th className="text-left py-3 px-3 text-slate-500 font-medium">Status</th>
                    <th className="text-left py-3 px-3 text-slate-500 font-medium">Anomaly</th>
                    <th className="text-left py-3 px-3 text-slate-500 font-medium">Risk</th>
                    <SortHeader column="sensorHealth">Health</SortHeader>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((record, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">{formatTimestamp(record.timestamp)}</td>
                      <td className="py-3 px-3 text-white">{record.ph}</td>
                      <td className="py-3 px-3 text-white">{record.turbidity}</td>
                      <td className="py-3 px-3 text-white">{record.temperature}</td>
                      <td className="py-3 px-3 text-white">{record.tds}</td>
                      <td className="py-3 px-3 text-white">{record.conductivity}</td>
                      <td className="py-3 px-3"><StatusBadge status={record.waterStatus} size="sm" /></td>
                      <td className="py-3 px-3">
                        {record.anomaly ? (
                          <span className="text-red-400 font-medium">Yes</span>
                        ) : (
                          <span className="text-slate-500">No</span>
                        )}
                      </td>
                      <td className="py-3 px-3"><StatusBadge status={record.riskLevel} size="sm" /></td>
                      <td className="py-3 px-3 text-slate-300">{record.sensorHealth}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rawData.total)} of {rawData.total} records
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                        page === p
                          ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="text-slate-500 px-1">...</span>}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
