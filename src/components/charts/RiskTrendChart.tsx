import {
  Area, AreaChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine,
} from 'recharts';
import { formatTimeOnly } from '../../utils/helpers';
import type { DataPoint } from '../../types/api';

interface RiskTrendChartProps {
  data: DataPoint[];
  height?: number;
}

export default function RiskTrendChart({ data, height = 280 }: RiskTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
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
          domain={[0, 100]}
          width={40}
          tickFormatter={(v) => `${v}%`}
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
          formatter={(value) => [`${value ?? ''}%`, 'Risk Score']}
        />
        {/* Risk level reference lines */}
        <ReferenceLine y={25} stroke="#34d399" strokeDasharray="4 4" strokeOpacity={0.4} />
        <ReferenceLine y={50} stroke="#fbbf24" strokeDasharray="4 4" strokeOpacity={0.4} />
        <ReferenceLine y={75} stroke="#f87171" strokeDasharray="4 4" strokeOpacity={0.4} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#f59e0b"
          strokeWidth={2}
          fill="url(#riskGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
