import { AlertTriangle, Search, Cpu } from 'lucide-react';
import type { AnomalyResult } from '../types/api';

interface AnomalySummaryProps {
  data: AnomalyResult;
}

export default function AnomalySummary({ data }: AnomalySummaryProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-300">Anomaly Detection</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Cpu className="w-3 h-3" />
          <span>Isolation Forest</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Total */}
        <div className="bg-white/[0.03] rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-lg font-bold text-white">{data.totalCount}</p>
          <p className="text-[10px] text-slate-500">Detected</p>
        </div>

        {/* Latest */}
        <div className="bg-white/[0.03] rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-sm font-semibold text-white truncate" title={data.latestAnomaly}>
            {data.latestAnomaly}
          </p>
          <p className="text-[10px] text-slate-500">Latest</p>
        </div>

        {/* Score */}
        <div className="bg-white/[0.03] rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400" />
          </div>
          <p className="text-lg font-bold text-white">{data.score.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500">Anomaly Score</p>
        </div>
      </div>
    </div>
  );
}
