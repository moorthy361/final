// =============================================================================
// AquaSentinel AI — Utility Functions
// =============================================================================

import type { ParameterKey, WaterQualityStatus, RiskLevel, AlertSeverity, SensorStatus } from '../types/api';

// ─── Parameter Display ──────────────────────────────────────────────────────────

export const parameterLabels: Record<ParameterKey, string> = {
  ph: 'pH',
  turbidity: 'Turbidity',
  temperature: 'Temperature',
  tds: 'TDS',
  conductivity: 'Conductivity',
};

export const parameterUnits: Record<ParameterKey, string> = {
  ph: 'pH',
  turbidity: 'NTU',
  temperature: '°C',
  tds: 'ppm',
  conductivity: 'µS/cm',
};

// ─── Color Maps ─────────────────────────────────────────────────────────────────

export function getStatusColor(status: WaterQualityStatus | string): string {
  switch (status) {
    case 'Good': case 'Normal': case 'Healthy': return 'text-emerald-400';
    case 'Moderate': case 'Warning': return 'text-amber-400';
    case 'Poor': case 'Faulty': return 'text-orange-400';
    case 'Critical': case 'Offline': return 'text-red-400';
    default: return 'text-slate-400';
  }
}

export function getStatusBg(status: WaterQualityStatus | string): string {
  switch (status) {
    case 'Good': case 'Normal': case 'Healthy': return 'bg-emerald-400/10 border-emerald-400/30';
    case 'Moderate': case 'Warning': return 'bg-amber-400/10 border-amber-400/30';
    case 'Poor': case 'Faulty': return 'bg-orange-400/10 border-orange-400/30';
    case 'Critical': case 'Offline': return 'bg-red-400/10 border-red-400/30';
    default: return 'bg-slate-400/10 border-slate-400/30';
  }
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'Low': return 'text-emerald-400';
    case 'Moderate': return 'text-amber-400';
    case 'High': return 'text-orange-400';
    case 'Critical': return 'text-red-400';
  }
}

export function getRiskBg(level: RiskLevel): string {
  switch (level) {
    case 'Low': return 'bg-emerald-400/10 border-emerald-400/30';
    case 'Moderate': return 'bg-amber-400/10 border-amber-400/30';
    case 'High': return 'bg-orange-400/10 border-orange-400/30';
    case 'Critical': return 'bg-red-400/10 border-red-400/30';
  }
}

export function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'advisory': return 'text-sky-400';
    case 'warning': return 'text-amber-400';
    case 'critical': return 'text-red-400';
  }
}

export function getSeverityBg(severity: AlertSeverity): string {
  switch (severity) {
    case 'advisory': return 'bg-sky-400/10 border-sky-400/30';
    case 'warning': return 'bg-amber-400/10 border-amber-400/30';
    case 'critical': return 'bg-red-400/10 border-red-400/30';
  }
}

export function getSensorStatusColor(status: SensorStatus): string {
  switch (status) {
    case 'Healthy': return 'text-emerald-400';
    case 'Warning': return 'text-amber-400';
    case 'Faulty': return 'text-orange-400';
    case 'Offline': return 'text-red-400';
  }
}

// ─── Score Color ────────────────────────────────────────────────────────────────

export function getScoreColor(score: number): string {
  if (score >= 80) return '#34d399';  // emerald-400
  if (score >= 60) return '#fbbf24';  // amber-400
  if (score >= 40) return '#fb923c';  // orange-400
  return '#f87171';                    // red-400
}

// ─── Formatting ─────────────────────────────────────────────────────────────────

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeOnly(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

// ─── CSV Export ──────────────────────────────────────────────────────────────────

export function downloadCsv(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val);
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
