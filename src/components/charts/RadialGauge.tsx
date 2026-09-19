import { getScoreColor } from '../../utils/helpers';

interface RadialGaugeProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function RadialGauge({
  score,
  maxScore = 100,
  size = 160,
  strokeWidth = 10,
  label,
}: RadialGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(score / maxScore, 1);
  const offset = circumference * (1 - percent);
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        {label && <span className="text-xs text-slate-400 mt-0.5">{label}</span>}
      </div>
    </div>
  );
}
