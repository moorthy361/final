import { Cpu } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { getRiskColor, formatPercentage } from '../utils/helpers';
import type { RiskPrediction } from '../types/api';

interface RiskOverviewProps {
  data: RiskPrediction;
}

const timeSlots = [
  { key: 'current' as const, label: 'Current' },
  { key: 'sixHour' as const, label: '6 Hours' },
  { key: 'twelveHour' as const, label: '12 Hours' },
  { key: 'twentyFourHour' as const, label: '24 Hours' },
];

export default function RiskOverview({ data }: RiskOverviewProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-300">Predicted Risk</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Cpu className="w-3 h-3" />
          <span>Random Forest</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {timeSlots.map(({ key, label }) => {
          const level = data[key];
          const displayLevel = level ?? 'Unavailable';
          return (
            <div key={key} className="bg-white/[0.03] rounded-lg p-3 text-center">
              <p className="text-[10px] text-slate-500 mb-1.5">{label}</p>
              <p className={`text-sm font-bold ${level ? getRiskColor(level) : 'text-slate-500'}`}>{displayLevel.toUpperCase()}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">
          Confidence: <span className="text-slate-300">{formatPercentage(data.confidence)}</span>
        </span>
        <StatusBadge status={data.current} size="sm" />
      </div>
    </div>
  );
}
