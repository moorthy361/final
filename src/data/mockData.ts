// =============================================================================
// AquaSentinel AI — Development Mock Data
// =============================================================================
// TEMPORARY: This file provides placeholder data for UI development only.
// Replace with real API data by connecting the Python backend.
//
// TO REMOVE:
// 1. Connect the Python backend API
// 2. Set VITE_API_BASE_URL in .env
// 3. Remove the useMockFallback flag in useApiData hook
// 4. Delete this file
// =============================================================================

import type {
  DashboardData,
  AnomalyRecord,
  HistoricalRecord,
  EarlyWarning,
} from '../types/api';

const now = new Date().toISOString();

function timeAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

function generateSparkline(base: number, variance: number, points = 24): { timestamp: string; value: number }[] {
  return Array.from({ length: points }, (_, i) => ({
    timestamp: timeAgo((points - i) * 30),
    value: +(base + (Math.random() - 0.5) * variance).toFixed(2),
  }));
}

// ─── Dashboard ──────────────────────────────────────────────────────────────────

export const mockDashboardData: DashboardData = {
  timestamp: now,
  waterQuality: {
    status: 'Good',
    score: 87,
    confidence: 0.94,
    lastUpdated: timeAgo(2),
  },
  parameters: {
    ph: {
      value: 7.2,
      unit: 'pH',
      status: 'Normal',
      trend: 1.4,
      trendDirection: 'up',
      min: 6.8,
      max: 7.6,
      average: 7.15,
      lastUpdated: timeAgo(1),
      history: generateSparkline(7.2, 0.4),
      sensorHealth: 98,
    },
    turbidity: {
      value: 4.8,
      unit: 'NTU',
      status: 'Normal',
      trend: -2.1,
      trendDirection: 'down',
      min: 2.1,
      max: 8.5,
      average: 4.6,
      lastUpdated: timeAgo(1),
      history: generateSparkline(4.8, 2),
      sensorHealth: 91,
    },
    temperature: {
      value: 22.5,
      unit: '°C',
      status: 'Normal',
      trend: 0.3,
      trendDirection: 'stable',
      min: 20.1,
      max: 25.8,
      average: 22.3,
      lastUpdated: timeAgo(1),
      history: generateSparkline(22.5, 2),
      sensorHealth: 99,
    },
    tds: {
      value: 320,
      unit: 'ppm',
      status: 'Normal',
      trend: 0.8,
      trendDirection: 'up',
      min: 280,
      max: 410,
      average: 315,
      lastUpdated: timeAgo(1),
      history: generateSparkline(320, 40),
      sensorHealth: 96,
    },
    conductivity: {
      value: 485,
      unit: 'µS/cm',
      status: 'Normal',
      trend: -0.5,
      trendDirection: 'down',
      min: 420,
      max: 550,
      average: 478,
      lastUpdated: timeAgo(1),
      history: generateSparkline(485, 50),
      sensorHealth: 97,
    },
  },
  anomaly: {
    detected: false,
    score: 0.12,
    severity: 'normal',
    totalCount: 12,
    criticalCount: 2,
    warningCount: 5,
    latestAnomaly: 'Turbidity spike',
    anomalyRate: 3.2,
  },
  risk: {
    current: 'Low',
    sixHour: 'Moderate',
    twelveHour: 'Moderate',
    twentyFourHour: 'High',
    confidence: 0.91,
    trend: Array.from({ length: 48 }, (_, i) => ({
      timestamp: timeAgo((48 - i) * 30),
      value: +(20 + Math.random() * 30 + (i > 36 ? (i - 36) * 3 : 0)).toFixed(1),
    })),
    factors: [
      { parameter: 'Turbidity trend', contribution: 'High', description: 'Rising turbidity levels over the past 6 hours' },
      { parameter: 'pH variation', contribution: 'Moderate', description: 'Increased pH fluctuation observed' },
      { parameter: 'Conductivity change', contribution: 'Low', description: 'Minor conductivity drift detected' },
    ],
  },
  earlyWarnings: [
    {
      id: 'w1',
      severity: 'critical',
      title: 'Rapid Turbidity Increase',
      parameter: 'turbidity',
      currentValue: 8.5,
      normalRange: '1.0 – 5.0 NTU',
      detectedTime: timeAgo(28),
      reason: 'Turbidity increased significantly over the recent observation window.',
      recommendedAction: 'Inspect the water source and verify sensor condition.',
      status: 'active',
    },
    {
      id: 'w2',
      severity: 'warning',
      title: 'pH Level Approaching Threshold',
      parameter: 'ph',
      currentValue: 7.8,
      normalRange: '6.5 – 7.5 pH',
      detectedTime: timeAgo(45),
      reason: 'pH level trending upward and approaching upper normal limit.',
      recommendedAction: 'Monitor pH readings and check recent calibration.',
      status: 'active',
    },
    {
      id: 'w3',
      severity: 'advisory',
      title: 'TDS Gradual Rise',
      parameter: 'tds',
      currentValue: 395,
      normalRange: '200 – 380 ppm',
      detectedTime: timeAgo(120),
      reason: 'Total Dissolved Solids showing gradual increasing trend.',
      recommendedAction: 'Review TDS trend data and assess potential contamination sources.',
      status: 'acknowledged',
      acknowledgedBy: 'Operator',
      acknowledgedAt: timeAgo(60),
    },
  ],
  sensorHealth: {
    ph: {
      health: 98,
      reliabilityScore: 97,
      status: 'Healthy',
      missingReadings: 0,
      invalidReadings: 1,
      spikeCount: 0,
      driftDetected: false,
      stuckValueDetected: false,
      lastCommunication: timeAgo(1),
      history: generateSparkline(98, 3),
    },
    turbidity: {
      health: 91,
      reliabilityScore: 89,
      status: 'Warning',
      missingReadings: 3,
      invalidReadings: 2,
      spikeCount: 4,
      driftDetected: true,
      stuckValueDetected: false,
      lastCommunication: timeAgo(1),
      history: generateSparkline(91, 5),
    },
    temperature: {
      health: 99,
      reliabilityScore: 99,
      status: 'Healthy',
      missingReadings: 0,
      invalidReadings: 0,
      spikeCount: 0,
      driftDetected: false,
      stuckValueDetected: false,
      lastCommunication: timeAgo(1),
      history: generateSparkline(99, 1),
    },
    tds: {
      health: 96,
      reliabilityScore: 95,
      status: 'Healthy',
      missingReadings: 1,
      invalidReadings: 0,
      spikeCount: 1,
      driftDetected: false,
      stuckValueDetected: false,
      lastCommunication: timeAgo(1),
      history: generateSparkline(96, 3),
    },
    conductivity: {
      health: 97,
      reliabilityScore: 96,
      status: 'Healthy',
      missingReadings: 0,
      invalidReadings: 1,
      spikeCount: 0,
      driftDetected: false,
      stuckValueDetected: false,
      lastCommunication: timeAgo(2),
      history: generateSparkline(97, 2),
    },
  },
};

// ─── Anomaly Records ────────────────────────────────────────────────────────────

export const mockAnomalyRecords: AnomalyRecord[] = [
  { id: 'a1', timestamp: timeAgo(28), parameter: 'turbidity', value: 8.5, anomalyScore: 0.92, severity: 'critical', sensorHealth: 91, status: 'detected', reason: 'Significant deviation from recent measurement pattern.' },
  { id: 'a2', timestamp: timeAgo(45), parameter: 'ph', value: 7.8, anomalyScore: 0.71, severity: 'warning', sensorHealth: 98, status: 'investigating', reason: 'pH reading above normal band for the time of day.' },
  { id: 'a3', timestamp: timeAgo(120), parameter: 'tds', value: 395, anomalyScore: 0.65, severity: 'warning', sensorHealth: 96, status: 'resolved', reason: 'TDS value higher than rolling average by 2σ.' },
  { id: 'a4', timestamp: timeAgo(180), parameter: 'conductivity', value: 560, anomalyScore: 0.58, severity: 'warning', sensorHealth: 97, status: 'resolved', reason: 'Conductivity spike detected against baseline.' },
  { id: 'a5', timestamp: timeAgo(300), parameter: 'turbidity', value: 9.1, anomalyScore: 0.95, severity: 'critical', sensorHealth: 91, status: 'resolved', reason: 'Major turbidity spike indicating possible sediment event.' },
  { id: 'a6', timestamp: timeAgo(360), parameter: 'temperature', value: 27.2, anomalyScore: 0.52, severity: 'warning', sensorHealth: 99, status: 'resolved', reason: 'Temperature reading unexpectedly high for current conditions.' },
  { id: 'a7', timestamp: timeAgo(480), parameter: 'ph', value: 6.3, anomalyScore: 0.68, severity: 'warning', sensorHealth: 98, status: 'resolved', reason: 'pH dropped below normal operating range.' },
  { id: 'a8', timestamp: timeAgo(600), parameter: 'tds', value: 415, anomalyScore: 0.73, severity: 'warning', sensorHealth: 96, status: 'resolved', reason: 'TDS elevated beyond seasonal norm.' },
];

// ─── Warning History ────────────────────────────────────────────────────────────

export const mockWarningHistory: EarlyWarning[] = [
  ...mockDashboardData.earlyWarnings,
  {
    id: 'w4', severity: 'warning', title: 'Conductivity Fluctuation', parameter: 'conductivity',
    currentValue: 560, normalRange: '400 – 520 µS/cm', detectedTime: timeAgo(360),
    reason: 'Conductivity readings showing unusual variability.', recommendedAction: 'Check sensor calibration and water source.',
    status: 'resolved',
  },
  {
    id: 'w5', severity: 'critical', title: 'Temperature Anomaly', parameter: 'temperature',
    currentValue: 27.2, normalRange: '18 – 25 °C', detectedTime: timeAgo(480),
    reason: 'Temperature exceeded normal operating range.', recommendedAction: 'Investigate thermal source near sensor.',
    status: 'resolved',
  },
  {
    id: 'w6', severity: 'advisory', title: 'pH Sensor Drift', parameter: 'ph',
    currentValue: 7.1, normalRange: '6.5 – 7.5 pH', detectedTime: timeAgo(720),
    reason: 'Gradual pH sensor drift detected by health analysis.', recommendedAction: 'Schedule sensor recalibration.',
    status: 'resolved',
  },
];

// ─── Historical Records ─────────────────────────────────────────────────────────

export const mockHistoricalData: HistoricalRecord[] = Array.from({ length: 100 }, (_, i) => ({
  timestamp: timeAgo(i * 15),
  ph: +(7.0 + Math.random() * 0.8).toFixed(2),
  turbidity: +(2 + Math.random() * 6).toFixed(2),
  temperature: +(20 + Math.random() * 5).toFixed(1),
  tds: +(280 + Math.random() * 130).toFixed(0) as unknown as number,
  conductivity: +(420 + Math.random() * 130).toFixed(0) as unknown as number,
  waterStatus: i % 15 === 0 ? 'Moderate' : 'Good',
  anomaly: i % 12 === 0,
  riskLevel: i % 20 === 0 ? 'High' : i % 8 === 0 ? 'Moderate' : 'Low',
  sensorHealth: +(90 + Math.random() * 10).toFixed(0) as unknown as number,
}));
