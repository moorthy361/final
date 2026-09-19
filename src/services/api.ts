// =============================================================================
// AquaSentinel AI — API Service Layer
// =============================================================================
// Centralized API service.
// ALL frontend -> backend communication should go through this module.
//
// Backend:
// https://aquasentinel-backend-1qiv.onrender.com
//
// API Base:
// https://aquasentinel-backend-1qiv.onrender.com/api
//
// Environment variable:
// VITE_API_BASE_URL
//
// IMPORTANT:
// - Do not put fetch() calls directly inside components.
// - Do not generate or fabricate sensor data.
// - All data must come from the real FastAPI backend.
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
} from "../types/api";

// =============================================================================
// API CONFIGURATION
// =============================================================================

// VITE_API_BASE_URL should be:
// https://aquasentinel-backend-1qiv.onrender.com/api

const configuredBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

// Remove trailing slash
const BASE_URL = configuredBaseUrl.replace(/\/+$/, "");

// Root backend URL without /api
const ROOT_URL = BASE_URL.replace(/\/api$/, "");


// =============================================================================
// ACCESS TOKEN
// =============================================================================

let accessToken: string | null = null;

/**
 * Store the temporary access token in memory.
 *
 * Production authentication can later be migrated
 * to an HttpOnly + Secure cookie/session mechanism.
 */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * Get the currently stored access token.
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Clear the current access token.
 */
export function clearAccessToken(): void {
  accessToken = null;
}


// =============================================================================
// HTTP REQUEST HELPER
// =============================================================================

export async function requestApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {

  // Make sure endpoint begins with /
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const url = `${BASE_URL}${normalizedEndpoint}`;

  const controller = new AbortController();

  // 30 second timeout
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 30000);

  try {

    const headers = new Headers(options.headers);

    // Add JSON content type when not already specified
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Add authorization token if available
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    // -------------------------------------------------------------------------
    // Handle HTTP errors
    // -------------------------------------------------------------------------

    if (!response.ok) {

      let detail = `HTTP ${response.status} ${response.statusText}`;

      try {

        const body = await response.json();

        if (body?.detail?.error) {
          detail = body.detail.error;
        } else if (typeof body?.detail === "string") {
          detail = body.detail;
        } else if (typeof body?.message === "string") {
          detail = body.message;
        }

      } catch {
        // Response wasn't JSON.
        // Keep the HTTP error message.
      }

      throw new Error(detail);
    }

    // -------------------------------------------------------------------------
    // Handle 204 No Content
    // -------------------------------------------------------------------------

    if (response.status === 204) {
      return undefined as T;
    }

    // -------------------------------------------------------------------------
    // Handle empty response
    // -------------------------------------------------------------------------

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {

      const text = await response.text();

      return text as T;
    }

    // -------------------------------------------------------------------------
    // Return JSON
    // -------------------------------------------------------------------------

    return (await response.json()) as T;

  } catch (error) {

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "Request timed out. The AquaSentinel backend may be starting or unavailable."
      );
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to the AquaSentinel backend. Check the backend URL and CORS configuration."
      );
    }

    throw error;

  } finally {

    clearTimeout(timeoutId);

  }
}


// =============================================================================
// API RESPONSE HELPER
// =============================================================================

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {

  return requestApi<ApiResponse<T>>(endpoint, options);
}


// =============================================================================
// HEALTH CHECK
// =============================================================================
// Backend endpoint:
// GET /health
//
// Full URL:
// https://aquasentinel-backend-1qiv.onrender.com/health
// =============================================================================

export async function getHealthStatus(): Promise<{
  status: string;
  service: string;
  version: string;
  timestamp: string;
  models: Record<string, string>;
}> {

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10000);

  try {

    const response = await fetch(`${ROOT_URL}/health`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Health check failed: HTTP ${response.status}`
      );
    }

    return await response.json();

  } catch (error) {

    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw new Error("Backend health check timed out.");
    }

    throw error;

  } finally {

    clearTimeout(timeoutId);

  }
}


// =============================================================================
// DASHBOARD
// =============================================================================
// GET /api/dashboard
// =============================================================================

export async function getDashboardData(): Promise<
  ApiResponse<DashboardData>
> {

  return fetchApi<DashboardData>("/dashboard");
}


// =============================================================================
// WATER QUALITY
// =============================================================================
// GET /api/water-quality
// =============================================================================

export async function getWaterQuality(
  timeRange?: string
): Promise<ApiResponse<SensorParameters>> {

  const params = new URLSearchParams();

  if (timeRange) {
    params.set("time_range", timeRange);
  }

  const query = params.toString()
    ? `?${params.toString()}`
    : "";

  const raw = await fetchApi<{
    status: string;
    score: number;
    confidence: number;
    lastUpdated: string;
    parameters: SensorParameters;
  }>(`/water-quality${query}`);

  return {
    success: raw.success,
    timestamp: raw.timestamp,
    data:
      raw.data?.parameters ??
      (raw.data as unknown as SensorParameters),
  };
}


// =============================================================================
// ANOMALIES
// =============================================================================
// GET /api/anomalies
// =============================================================================

export async function getAnomalies(
  params?: {
    parameter?: string;
    severity?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<
  ApiResponse<{
    summary: AnomalyResult;
    records: PaginatedResponse<AnomalyRecord>;
  }>
> {

  const searchParams = new URLSearchParams();

  if (params?.parameter) {
    searchParams.set(
      "parameter",
      params.parameter
    );
  }

  if (params?.severity) {
    searchParams.set(
      "severity",
      params.severity
    );
  }

  if (params?.page) {

    const pageSize = params.pageSize ?? 20;

    searchParams.set(
      "page",
      String(params.page)
    );

    searchParams.set(
      "page_size",
      String(pageSize)
    );
  }

  const query = searchParams.toString()
    ? `?${searchParams.toString()}`
    : "";

  return fetchApi(`/anomalies${query}`);
}


// =============================================================================
// LATEST ANOMALY
// =============================================================================
// GET /api/anomalies/latest
// =============================================================================

export async function getLatestAnomaly(): Promise<
  ApiResponse<AnomalyRecord | null>
> {

  return fetchApi<AnomalyRecord | null>(
    "/anomalies/latest"
  );
}


// =============================================================================
// RISK PREDICTION
// =============================================================================
// GET /api/risk
// =============================================================================

export async function getRiskPrediction(): Promise<
  ApiResponse<RiskPrediction>
> {

  return fetchApi<RiskPrediction>("/risk");
}


// =============================================================================
// EARLY WARNINGS
// =============================================================================
// GET /api/warnings
// =============================================================================

export async function getWarnings(
  params?: {
    severity?: string;
    status?: string;
    parameter?: string;
  }
): Promise<ApiResponse<EarlyWarning[]>> {

  const searchParams = new URLSearchParams();

  if (params?.severity) {
    searchParams.set(
      "severity",
      params.severity
    );
  }

  if (params?.status) {
    searchParams.set(
      "status",
      params.status
    );
  }

  if (params?.parameter) {
    searchParams.set(
      "parameter",
      params.parameter
    );
  }

  const query = searchParams.toString()
    ? `?${searchParams.toString()}`
    : "";

  return fetchApi<EarlyWarning[]>(
    `/warnings${query}`
  );
}


// =============================================================================
// ACKNOWLEDGE WARNING
// =============================================================================
// POST /api/warnings/{id}/acknowledge
// =============================================================================

export async function acknowledgeWarning(
  id: string,
  acknowledgedBy = "Operator"
): Promise<ApiResponse<EarlyWarning>> {

  const query = new URLSearchParams({
    acknowledged_by: acknowledgedBy,
  });

  return fetchApi<EarlyWarning>(
    `/warnings/${encodeURIComponent(id)}/acknowledge?${query.toString()}`,
    {
      method: "POST",
    }
  );
}


// =============================================================================
// SENSOR HEALTH
// =============================================================================
// GET /api/sensor-health
// =============================================================================

export async function getSensorHealth(): Promise<
  ApiResponse<AllSensorHealth>
> {

  return fetchApi<AllSensorHealth>(
    "/sensor-health"
  );
}


// =============================================================================
// HISTORICAL DATA
// =============================================================================
// GET /api/historical
// =============================================================================

export async function getHistoricalData(
  params?: {
    startDate?: string;
    endDate?: string;
    parameter?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
  }
): Promise<
  ApiResponse<PaginatedResponse<HistoricalRecord>>
> {

  const pageSize = params?.pageSize ?? 15;

  const page = params?.page ?? 1;

  const offset = (page - 1) * pageSize;

  const searchParams = new URLSearchParams();

  if (params?.startDate) {
    searchParams.set(
      "start_date",
      params.startDate
    );
  }

  if (params?.endDate) {
    searchParams.set(
      "end_date",
      params.endDate
    );
  }

  if (params?.parameter) {
    searchParams.set(
      "parameter",
      params.parameter
    );
  }

  searchParams.set(
    "limit",
    String(pageSize)
  );

  searchParams.set(
    "offset",
    String(offset)
  );

  if (params?.sortBy) {
    searchParams.set(
      "sort_by",
      params.sortBy
    );
  }

  if (params?.sortOrder) {
    searchParams.set(
      "sort_order",
      params.sortOrder
    );
  }

  if (params?.search) {
    searchParams.set(
      "search",
      params.search
    );
  }

  return fetchApi<PaginatedResponse<HistoricalRecord>>(
    `/historical?${searchParams.toString()}`
  );
}


// =============================================================================
// EXPORT HISTORICAL CSV
// =============================================================================
// GET /api/historical/export
// =============================================================================

export async function exportHistoricalCsv(
  params?: {
    startDate?: string;
    endDate?: string;
    parameter?: string;
  }
): Promise<Blob> {

  const searchParams = new URLSearchParams();

  if (params?.startDate) {
    searchParams.set(
      "start_date",
      params.startDate
    );
  }

  if (params?.endDate) {
    searchParams.set(
      "end_date",
      params.endDate
    );
  }

  if (params?.parameter) {
    searchParams.set(
      "parameter",
      params.parameter
    );
  }

  const query = searchParams.toString()
    ? `?${searchParams.toString()}`
    : "";

  const response = await fetch(
    `${BASE_URL}/historical/export${query}`,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Export failed: HTTP ${response.status}`
    );
  }

  return response.blob();
}


// =============================================================================
// SENSOR DATA INGESTION
// =============================================================================
// POST /api/sensors/data
//
// IMPORTANT:
// This function sends REAL sensor data.
// It must NOT be used for random/simulated sensor values.
// =============================================================================

export async function sendSensorData(
  data: SensorDataInput
): Promise<
  ApiResponse<{
    success: boolean;
    message: string;
    timestamp: string;
    reading_id: string;

    analysis: {
      waterQuality: {
        status: string;
        score: number;
      };

      anomaly: {
        detected: boolean;
        score: number;
        severity: string;
      };

      risk: {
        current: string;
        confidence: number;
      };

      activeWarnings: number;
    };
  }>
> {

  return fetchApi("/sensors/data", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


// =============================================================================
// DEBUG / CONFIGURATION
// =============================================================================

export function getApiBaseUrl(): string {
  return BASE_URL;
}

export function getBackendRootUrl(): string {
  return ROOT_URL;
}
