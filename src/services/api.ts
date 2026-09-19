// =============================================================================
// AquaSentinel AI — API Service Layer
// =============================================================================
// Centralised API service. ALL backend communication goes through this module.
//
// Backend: Python FastAPI running at VITE_API_BASE_URL (set in .env)
// Default: http://127.0.0.1:8000/api
//
// DO NOT place fetch calls inside components.
// DO NOT fabricate data here — all data comes from the real backend.
// =============================================================================

import type {
  ApiResponse,
  DashboardData,
  SensorParameters,
  AnomalyRecord,
  AnomalyResult,
  RiskPrediction,
  EarlyWarning,
  AllSensorHealth,
  HistoricalRecord,
  PaginatedResponse,
  SensorDataInput,
} from '../types/api';

// The base URL already includes /api (e.g. http://127.0.0.1:8000/api)
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

// Derive root URL (without /api) for health endpoint
const ROOT_URL = BASE_URL.replace(/\/api$/, '');
let accessToken: string | null = null;

/**
 * Keeps the temporary development access token in memory only. A production
 * implementation should replace this with an HttpOnly, Secure cookie session.
 */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// ─── HTTP Helper ─────────────────────────────────────────────────────────────────

export async function requestApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 s timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      // Try to extract a backend error message
      let detail = `HTTP ${response.status} ${response.statusText}`;
      try {
        const body = await response.json();
        if (body?.detail?.error) detail = body.detail.error;
        else if (typeof body?.detail === 'string') detail = body.detail;
      } catch {
        // ignore parse error, use status text
      }
      throw new Error(detail);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  return requestApi<ApiResponse<T>>(endpoint, options);
}

// ─── Health Check (root endpoint, not under /api) ────────────────────────────────

export async function getHealthStatus(): Promise<{
  status: string;
  service: string;
  version: string;
  timestamp: string;
  models: Record<string, string>;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${ROOT_URL}/health`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Dashboard ───────────────────────────────────────────────────────────────────

export async function getDashboardData(): Promise<ApiResponse<DashboardData>> {
  return fetchApi<DashboardData>('/dashboard');
}

// ─── Water Quality ───────────────────────────────────────────────────────────────
// Backend returns: { success, data: { status, score, confidence, lastUpdated, parameters: {...} } }
// Frontend WaterQuality page expects: SensorParameters (the parameters object directly)

export async function getWaterQuality(
  timeRange?: string
): Promise<ApiResponse<SensorParameters>> {
  const params = timeRange ? `?time_range=${timeRange}` : '';
  const raw = await fetchApi<{ status: string; score: number; confidence: number; lastUpdated: string; parameters: SensorParameters }>(`/water-quality${params}`);

  // Normalise: extract `parameters` from the response so callers get SensorParameters directly
  return {
    success: raw.success,
    timestamp: raw.timestamp,
    data: raw.data.parameters ?? (raw.data as unknown as SensorParameters),
  };
}

// ─── Anomalies ───────────────────────────────────────────────────────────────────

export async function getAnomalies(params?: {
  parameter?: string;
  severity?: string;
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<{ summary: AnomalyResult; records: PaginatedResponse<AnomalyRecord> }>> {
  const searchParams = new URLSearchParams();
  if (params?.parameter) searchParams.set('parameter', params.parameter);
  if (params?.severity) searchParams.set('severity', params.severity);
  if (params?.page) {
    const pageSize = params.pageSize ?? 20;
    searchParams.set('page', String(params.page));
    searchParams.set('page_size', String(pageSize));
  }
  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return fetchApi(`/anomalies${query}`);
}

export async function getLatestAnomaly(): Promise<ApiResponse<AnomalyRecord | null>> {
  return fetchApi<AnomalyRecord | null>('/anomalies/latest');
}

// ─── Risk Prediction ─────────────────────────────────────────────────────────────
// Backend endpoint: GET /api/risk  (NOT /risk-prediction)

export async function getRiskPrediction(): Promise<ApiResponse<RiskPrediction>> {
  return fetchApi<RiskPrediction>('/risk');
}

// ─── Early Warnings ──────────────────────────────────────────────────────────────

export async function getWarnings(params?: {
  severity?: string;
  status?: string;
  parameter?: string;
}): Promise<ApiResponse<EarlyWarning[]>> {
  const searchParams = new URLSearchParams();
  if (params?.severity) searchParams.set('severity', params.severity);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.parameter) searchParams.set('parameter', params.parameter);
  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return fetchApi<EarlyWarning[]>(`/warnings${query}`);
}

export async function acknowledgeWarning(
  id: string,
  acknowledgedBy = 'Operator'
): Promise<ApiResponse<EarlyWarning>> {
  return fetchApi<EarlyWarning>(
    `/warnings/${id}/acknowledge?acknowledged_by=${encodeURIComponent(acknowledgedBy)}`,
    { method: 'POST' }
  );
}

// ─── Sensor Health ───────────────────────────────────────────────────────────────

export async function getSensorHealth(): Promise<ApiResponse<AllSensorHealth>> {
  return fetchApi<AllSensorHealth>('/sensor-health');
}

// ─── Historical Data ─────────────────────────────────────────────────────────────
// Backend uses: limit, offset, start_date, end_date, sort_by, sort_order (snake_case)

export async function getHistoricalData(params?: {
  startDate?: string;
  endDate?: string;
  parameter?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}): Promise<ApiResponse<PaginatedResponse<HistoricalRecord>>> {
  const pageSize = params?.pageSize ?? 15;
  const page = params?.page ?? 1;
  const offset = (page - 1) * pageSize;

  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set('start_date', params.startDate);
  if (params?.endDate) searchParams.set('end_date', params.endDate);
  if (params?.parameter) searchParams.set('parameter', params.parameter);
  searchParams.set('limit', String(pageSize));
  searchParams.set('offset', String(offset));
  if (params?.sortBy) searchParams.set('sort_by', params.sortBy);
  if (params?.sortOrder) searchParams.set('sort_order', params.sortOrder);
  if (params?.search) searchParams.set('search', params.search);

  return fetchApi<PaginatedResponse<HistoricalRecord>>(`/historical?${searchParams.toString()}`);
}

export async function exportHistoricalCsv(params?: {
  startDate?: string;
  endDate?: string;
  parameter?: string;
}): Promise<Blob> {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set('start_date', params.startDate);
  if (params?.endDate) searchParams.set('end_date', params.endDate);
  if (params?.parameter) searchParams.set('parameter', params.parameter);
  const url = `${BASE_URL}/historical/export?${searchParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Export failed');
  return response.blob();
}

// ─── Sensor Data Ingestion ───────────────────────────────────────────────────────
// POST /api/sensors/data — ingest a REAL sensor reading from a physical device.
// DO NOT use this for simulated or randomly generated data.

export async function sendSensorData(
  data: SensorDataInput
): Promise<ApiResponse<{
  success: boolean;
  message: string;
  timestamp: string;
  reading_id: string;
  analysis: {
    waterQuality: { status: string; score: number };
    anomaly: { detected: boolean; score: number; severity: string };
    risk: { current: string; confidence: number };
    activeWarnings: number;
  };
}>> {
  return fetchApi('/sensors/data', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
