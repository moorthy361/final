import {
  Area, AreaChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceDot,
} from 'recharts';
import { formatTimeOnly } from '../../utils/helpers';
import type { DataPoint } from '../../types/api';

interface TimeSeriesChartProps {
  data: DataPoint[];
  anomalies?: DataPoint[];
  color?: string;
  unit?: string;
  height?: number;
  showGrid?: boolean;
  label?: string;
}

export default function TimeSeriesChart({
  data,
  anomalies = [],
  color = '#22d3ee',
  unit = '',
  height = 300,
  showGrid = true,
  label,
}: TimeSeriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id={`ts-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
        )}
        <XAxis
          dataKey="timestamp"
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickFormatter={(v) => formatTimeOnly(v)}
          axisLine={{ stroke: 'rgba(148,163,184,0.1)' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}${unit ? ` ${unit}` : ''}`}
          width={55}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(15, 22, 41, 0.95)',
            border: '1px solid rgba(34, 211, 238, 0.15)',
            borderRadius: '0.5rem',
            fontSize: '12px',
            color: '#e2e8f0',
          }}
          labelFormatter={(v) => formatTimeOnly(v as string)}
          formatter={(value) => [`${value ?? ''} ${unit}`, label || 'Value']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#ts-grad-${color.replace('#', '')})`}
          dot={false}
        />
        {anomalies.map((a, i) => (
          <ReferenceDot
            key={i}
            x={a.timestamp}
            y={a.value}
            r={5}
            fill="#f87171"
            stroke="#991b1b"
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
