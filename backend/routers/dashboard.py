# =============================================================================
# AquaSentinel AI — Dashboard Router
# =============================================================================
# GET /api/dashboard — aggregate dashboard data
# =============================================================================

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import SensorReading, Warning as WarningModel
from schemas import (
    ApiResponse,
    DashboardDataSchema,
    WaterQualitySchema,
    AnomalyResultSchema,
    RiskPredictionSchema,
    EarlyWarningSchema,
    AllSensorHealthSchema,
)
from routers.water_quality import build_sensor_parameters
from routers.sensor_health import build_all_sensor_health
from services.water_quality import compute_water_quality
from services.anomaly_detection import get_anomaly_summary
from services.risk_prediction import compute_risk

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    # Get recent readings (last 24h for parameter computation)
    since = now - timedelta(hours=24)
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.timestamp >= since)
        .order_by(SensorReading.timestamp.desc())
        .all()
    )

    if not readings:
        readings = (
            db.query(SensorReading)
            .order_by(SensorReading.timestamp.desc())
            .limit(100)
            .all()
        )

    # Water quality from latest reading
    latest = readings[0] if readings else None
    wq = compute_water_quality(
        ph=latest.ph if latest else None,
        turbidity=latest.turbidity if latest else None,
        temperature=latest.temperature if latest else None,
        tds=latest.tds if latest else None,
        conductivity=latest.conductivity if latest else None,
    )

    # Sensor parameters
    params = build_sensor_parameters(readings)

    # Anomaly summary
    anomaly = get_anomaly_summary(db)

    # Risk prediction
    risk = compute_risk(db)

    # Early warnings (active + recently acknowledged)
    warnings = (
        db.query(WarningModel)
        .filter(WarningModel.status.in_(["active", "acknowledged"]))
        .order_by(WarningModel.detected_time.desc())
        .all()
    )
    warning_schemas = [
        EarlyWarningSchema(
            id=w.id,
            severity=w.severity,
            title=w.title,
            parameter=w.parameter,
            currentValue=w.current_value,
            normalRange=w.normal_range,
            detectedTime=w.detected_time.isoformat().replace("+00:00", "Z") if isinstance(w.detected_time, datetime) else str(w.detected_time),
            reason=w.reason,
            recommendedAction=w.recommended_action,
            status=w.status,
            acknowledgedBy=w.acknowledged_by,
            acknowledgedAt=w.acknowledged_at.isoformat().replace("+00:00", "Z") if w.acknowledged_at and isinstance(w.acknowledged_at, datetime) else None,
        )
        for w in warnings
    ]

    # Sensor health
    sensor_health = build_all_sensor_health(db)

    dashboard = DashboardDataSchema(
        timestamp=now.isoformat().replace("+00:00", "Z"),
        waterQuality=WaterQualitySchema(**wq),
        parameters=params,
        anomaly=AnomalyResultSchema(**anomaly),
        risk=RiskPredictionSchema(**risk),
        earlyWarnings=warning_schemas,
        sensorHealth=sensor_health,
    )

    return ApiResponse(success=True, data=dashboard)
