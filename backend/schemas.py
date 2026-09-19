# =============================================================================
# AquaSentinel AI — Pydantic Schemas
# =============================================================================
# These schemas mirror the frontend TypeScript types in src/types/api.ts exactly.
# =============================================================================

from __future__ import annotations

from datetime import datetime
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


# ─── Generic API Response ────────────────────────────────────────────────────────


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    message: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


# ─── Data Point (sparkline) ──────────────────────────────────────────────────────


class DataPoint(BaseModel):
    timestamp: str
    value: float


# ─── Sensor Reading ──────────────────────────────────────────────────────────────


class SensorReadingSchema(BaseModel):
    value: float
    unit: str
    status: str  # Normal | Warning | Critical
    trend: float
    trendDirection: str  # up | down | stable
    min: float
    max: float
    average: float
    lastUpdated: str
    history: list[DataPoint]
    sensorHealth: float


class SensorParametersSchema(BaseModel):
    ph: SensorReadingSchema
    turbidity: SensorReadingSchema
    temperature: SensorReadingSchema
    tds: SensorReadingSchema
    conductivity: SensorReadingSchema


# ─── Water Quality ───────────────────────────────────────────────────────────────


class WaterQualitySchema(BaseModel):
    status: str  # Good | Moderate | Poor | Critical
    score: float
    confidence: float
    lastUpdated: str


class WaterQualityResponse(BaseModel):
    status: str
    score: float
    confidence: float
    lastUpdated: str
    parameters: SensorParametersSchema


# ─── Anomaly Detection ───────────────────────────────────────────────────────────


class AnomalyResultSchema(BaseModel):
    detected: bool
    score: float
    severity: str  # normal | warning | critical
    totalCount: int
    criticalCount: int
    warningCount: int
    latestAnomaly: str
    anomalyRate: float


class AnomalyRecordSchema(BaseModel):
    id: str
    timestamp: str
    parameter: str
    value: float
    anomalyScore: float
    severity: str
    sensorHealth: float
    status: str  # detected | investigating | resolved
    reason: str


# ─── Risk Prediction ─────────────────────────────────────────────────────────────


class RiskFactorSchema(BaseModel):
    parameter: str
    contribution: str  # High | Moderate | Low
    description: str


class RiskPredictionSchema(BaseModel):
    current: str  # Low | Moderate | High | Critical
    sixHour: Optional[str] = None
    twelveHour: Optional[str] = None
    twentyFourHour: Optional[str] = None
    confidence: float
    trend: list[DataPoint]
    factors: list[RiskFactorSchema]


# ─── Early Warning ───────────────────────────────────────────────────────────────


class EarlyWarningSchema(BaseModel):
    id: str
    severity: str  # advisory | warning | critical
    title: str
    parameter: str
    currentValue: float
    normalRange: Optional[str] = None
    detectedTime: str
    reason: str
    recommendedAction: str
    status: str  # active | acknowledged | resolved
    acknowledgedBy: Optional[str] = None
    acknowledgedAt: Optional[str] = None


# ─── Sensor Health ───────────────────────────────────────────────────────────────


class SensorHealthDataSchema(BaseModel):
    health: float
    reliabilityScore: float
    status: str  # Healthy | Warning | Faulty | Offline
    missingReadings: int
    invalidReadings: int
    spikeCount: int
    driftDetected: bool
    stuckValueDetected: bool
    lastCommunication: str
    history: list[DataPoint]


class AllSensorHealthSchema(BaseModel):
    ph: SensorHealthDataSchema
    turbidity: SensorHealthDataSchema
    temperature: SensorHealthDataSchema
    tds: SensorHealthDataSchema
    conductivity: SensorHealthDataSchema


# ─── Historical Data ─────────────────────────────────────────────────────────────


class HistoricalRecordSchema(BaseModel):
    timestamp: str
    ph: float
    turbidity: float
    temperature: float
    tds: float
    conductivity: float
    waterStatus: str
    anomaly: bool
    riskLevel: str
    sensorHealth: float


class PaginatedResponseSchema(BaseModel, Generic[T]):
    data: list[T]
    total: int
    page: int
    pageSize: int
    totalPages: int


# ─── Dashboard Aggregate ─────────────────────────────────────────────────────────


class DashboardDataSchema(BaseModel):
    timestamp: str
    waterQuality: WaterQualitySchema
    parameters: SensorParametersSchema
    anomaly: AnomalyResultSchema
    risk: RiskPredictionSchema
    earlyWarnings: list[EarlyWarningSchema]
    sensorHealth: AllSensorHealthSchema


# ─── Auth ─────────────────────────────────────────────────────────────────────────


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthUserSchema(BaseModel):
    id: str
    email: str
    name: str
    avatarUrl: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserSchema


# ─── Sensor Data Input ───────────────────────────────────────────────────────────


class SensorDataInput(BaseModel):
    timestamp: Optional[str] = None
    ph: Optional[float] = None
    turbidity: Optional[float] = None
    temperature: Optional[float] = None
    tds: Optional[float] = None
    conductivity: Optional[float] = None
    dissolved_oxygen: Optional[float] = None


# ─── Sensor Ingestion Response ───────────────────────────────────────────────────


class AnalysisSummary(BaseModel):
    waterQuality: dict[str, Any]
    anomaly: dict[str, Any]
    risk: dict[str, Any]
    activeWarnings: int


class SensorIngestionResult(BaseModel):
    success: bool
    message: str
    timestamp: str
    reading_id: str
    analysis: AnalysisSummary
