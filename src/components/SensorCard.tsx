import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import SparklineChart from './charts/SparklineChart';
import StatusBadge from './StatusBadge';
import { formatRelativeTime, parameterLabels } from '../utils/helpers';
import type { SensorReading, ParameterKey } from '../types/api';

interface SensorCardProps {
  paramKey: ParameterKey;
  data: SensorReading;
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const paramColors: Record<ParameterKey, string> = {
  ph: '#8b5cf6',
  turbidity: '#22d3ee',
  temperature: '#f59e0b',
  tds: '#10b981',
  conductivity: '#3b82f6',
};

export default function SensorCard({ paramKey, data }: SensorCardProps) {
  const TrendIcon = trendIcons[data.trendDirection];
  const color = paramColors[paramKey];
  const trendColor = data.trendDirection === 'up' ? 'text-emerald-400' : data.trendDirection === 'down' ? 'text-red-400' : 'text-slate-400';

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <h4 className="text-xs font-medium text-slate-400">{parameterLabels[paramKey]}</h4>
        </div>
        <StatusBadge status={data.status} size="sm" />
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">{data.value}</span>
        <span className="text-xs text-slate-500 pb-1">{data.unit}</span>
        <div className={`flex items-center gap-0.5 ml-auto text-xs ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{Math.abs(data.trend)}%</span>
        </div>
      </div>

      {/* Sparkline */}
      <SparklineChart data={data.history} color={color} height={36} />

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-slate-600">
        <span>Health: {data.sensorHealth}%</span>
        <span>{formatRelativeTime(data.lastUpdated)}</span>
      </div>
    </div>
  );
}
