import RadialGauge from './charts/RadialGauge';
import StatusBadge from './StatusBadge';
import { formatRelativeTime, formatPercentage } from '../utils/helpers';
import type { WaterQuality } from '../types/api';

interface WaterQualityScoreProps {
  data: WaterQuality;
}

export default function WaterQualityScore({ data }: WaterQualityScoreProps) {
  return (
    <div className="glass-card p-6 flex flex-col items-center text-center">
      <h3 className="text-sm font-medium text-slate-400 mb-4">Water Quality Status</h3>
      <RadialGauge score={data.score} label={`/ 100`} size={180} strokeWidth={12} />
      <div className="mt-4">
        <StatusBadge status={data.status} size="lg" />
      </div>
      <p className="text-xs text-slate-500 mt-3">
        Confidence: <span className="text-slate-300 font-medium">{formatPercentage(data.confidence)}</span>
      </p>
      <p className="text-[10px] text-slate-600 mt-1">
        Updated {formatRelativeTime(data.lastUpdated)}
      </p>
    </div>
  );
}
