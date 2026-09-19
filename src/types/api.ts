// =============================================================================
// AquaSentinel AI — API Type Definitions
// =============================================================================
// These interfaces define the expected shape of backend API responses.
// When connecting to the Python backend, update these types to match
// the actual response schema if it differs.
// =============================================================================

// ─── Water Quality ──────────────────────────────────────────────────────────────

export type WaterQualityStatus = 'Good' | 'Moderate' | 'Poor' | 'Critical';
export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
export type SeverityLevel = 'normal' | 'warning' | 'critical';
export type AlertSeverity = 'advisory' | 'warning' | 'critical';
export type SensorStatus = 'Healthy' | 'Warning' | 'Faulty' | 'Offline';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface WaterQuality {
  status: WaterQualityStatus;
  score: number;        // 0–100
  confidence: number;   // 0–1
  lastUpdated: string;  // ISO timestamp
}

// ─── Sensor Parameters ──────────────────────────────────────────────────────────

export interface SensorReading {
  value: number;
  unit: string;
  status: 'Normal' | 'Warning' | 'Critical';
  trend: number;          // percentage change
  trendDirection: 'up' | 'down' | 'stable';
  min: number;
  max: number;
  average: number;
  lastUpdated: string;
  history: DataPoint[];   // sparkline data
  sensorHealth: number;   // 0–100
}

export interface DataPoint {
  timestamp: string;
  value: number;
}

export interface SensorParameters {
  ph: SensorReading;
  turbidity: SensorReading;
  temperature: SensorReading;
  tds: SensorReading;
  conductivity: SensorReading;
}

export type ParameterKey = keyof SensorParameters;

// ─── Anomaly Detection ──────────────────────────────────────────────────────────

export interface AnomalyResult {
  detected: boolean;
  score: number;         // 0–1
  severity: SeverityLevel;
  totalCount: number;
  criticalCount: number;
  warningCount: number;
  latestAnomaly: string;
  anomalyRate: number;   // percentage
}

export interface AnomalyRecord {
  id: string;
  timestamp: string;
  parameter: ParameterKey;
  value: number;
  anomalyScore: number;
  severity: SeverityLevel;
  sensorHealth: number;
  status: 'detected' | 'investigating' | 'resolved';
  reason: string;
}

// ─── Risk Prediction ────────────────────────────────────────────────────────────

export interface RiskPrediction {
  current: RiskLevel;
  sixHour: RiskLevel | null;       // null when model lacks time-lagged training data
  twelveHour: RiskLevel | null;    // null when model lacks time-lagged training data
  twentyFourHour: RiskLevel | null;// null when model lacks time-lagged training data
  confidence: number;    // 0–1
  trend: DataPoint[];
  factors: RiskFactor[];
}

export interface RiskFactor {
  parameter: string;
  contribution: 'High' | 'Moderate' | 'Low';
  description: string;
}

// ─── Sensor Data Input ──────────────────────────────────────────────────────────

export interface SensorDataInput {
  timestamp?: string;        // ISO timestamp; backend assigns current time if omitted
  ph?: number | null;
  turbidity?: number | null;
  temperature?: number | null;
  tds?: number | null;
  conductivity?: number | null;
  dissolved_oxygen?: number | null;
}

// ─── Early Warnings ─────────────────────────────────────────────────────────────

export interface EarlyWarning {
  id: string;
  severity: AlertSeverity;
  title: string;
  parameter: ParameterKey;
  currentValue: number;
  normalRange?: string;
  detectedTime: string;
  reason: string;
  recommendedAction: string;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

// ─── Sensor Health ──────────────────────────────────────────────────────────────

export interface SensorHealthData {
  health: number;         // 0–100
  reliabilityScore: number;
  status: SensorStatus;
  missingReadings: number;
  invalidReadings: number;
  spikeCount: number;
  driftDetected: boolean;
  stuckValueDetected: boolean;
  lastCommunication: string;
  history: DataPoint[];
}

export interface AllSensorHealth {
  ph: SensorHealthData;
  turbidity: SensorHealthData;
  temperature: SensorHealthData;
  tds: SensorHealthData;
  conductivity: SensorHealthData;
}

// ─── Historical Data ────────────────────────────────────────────────────────────

export interface HistoricalRecord {
  timestamp: string;
  ph: number;
  turbidity: number;
  temperature: number;
  tds: number;
  conductivity: number;
  waterStatus: WaterQualityStatus;
  anomaly: boolean;
  riskLevel: RiskLevel;
  sensorHealth: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Dashboard Aggregate ────────────────────────────────────────────────────────

export interface DashboardData {
  timestamp: string;
  waterQuality: WaterQuality;
  parameters: SensorParameters;
  anomaly: AnomalyResult;
  risk: RiskPrediction;
  earlyWarnings: EarlyWarning[];
  sensorHealth: AllSensorHealth;
}

// ─── API Response Wrapper ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// ─── Connection Status ──────────────────────────────────────────────────────────

export interface ConnectionStatus {
  api: boolean;
  database: boolean;
  lastSuccessfulUpdate: string;
}

// ─── Settings ───────────────────────────────────────────────────────────────────

export interface SystemSettings {
  refreshInterval: number;   // seconds
  notifications: {
    email: boolean;
    browser: boolean;
    critical: boolean;
    warning: boolean;
    advisory: boolean;
  };
  dashboard: {
    autoRefresh: boolean;
    theme: 'dark' | 'light';
    chartAnimations: boolean;
  };
  connection: ConnectionStatus;
}
