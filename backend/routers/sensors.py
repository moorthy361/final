# =============================================================================
# AquaSentinel AI — Sensor Data Ingestion Router
# =============================================================================
# POST /api/sensors/data — ingest a sensor reading, trigger analysis pipeline
# =============================================================================

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import SensorReading, AnomalyRecord as AnomalyModel, Warning as WarningModel
from schemas import ApiResponse, SensorDataInput, SensorIngestionResult, AnalysisSummary
from services.water_quality import compute_water_quality
from services.anomaly_detection import detect_anomalies_for_reading
from services.risk_prediction import compute_risk
from services.warning_engine import check_and_create_warnings

router = APIRouter(tags=["sensors"])


@router.post("/sensors/data")
def ingest_sensor_data(
    data: SensorDataInput,
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    # Parse timestamp or use current time
    if data.timestamp:
        try:
            ts = datetime.fromisoformat(data.timestamp.replace("Z", "+00:00"))
        except ValueError:
            ts = now
    else:
        ts = now

    # Create sensor reading
    reading = SensorReading(
        id=str(uuid.uuid4()),
        timestamp=ts,
        ph=data.ph,
        turbidity=data.turbidity,
        temperature=data.temperature,
        tds=data.tds,
        conductivity=data.conductivity,
        dissolved_oxygen=data.dissolved_oxygen,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    # ─── Analysis Pipeline ────────────────────────────────────────────────────

    # 1. Water quality
    wq = compute_water_quality(
        ph=reading.ph,
        turbidity=reading.turbidity,
        temperature=reading.temperature,
        tds=reading.tds,
        conductivity=reading.conductivity,
    )

    # 2. Anomaly detection
    anomalies = detect_anomalies_for_reading(db, reading)
    for a in anomalies:
        anomaly_record = AnomalyModel(
            id=str(uuid.uuid4()),
            timestamp=ts,
            parameter=a["parameter"],
            value=a["value"],
            anomaly_score=a["anomaly_score"],
            severity=a["severity"],
            sensor_health=a["sensor_health"],
            status="detected",
            reason=a["reason"],
        )
        db.add(anomaly_record)
    db.commit()

    max_anomaly_score = max((a["anomaly_score"] for a in anomalies), default=0.0)
    max_severity = "normal"
    if any(a["severity"] == "critical" for a in anomalies):
        max_severity = "critical"
    elif any(a["severity"] == "warning" for a in anomalies):
        max_severity = "warning"

    # 3. Risk prediction
    risk = compute_risk(db)

    # 4. Warning engine
    check_and_create_warnings(db, reading)

    active_warnings = (
        db.query(WarningModel)
        .filter(WarningModel.status == "active")
        .count()
    )

    result = SensorIngestionResult(
        success=True,
        message="Sensor data ingested and analyzed successfully",
        timestamp=now.isoformat().replace("+00:00", "Z"),
        reading_id=reading.id,
        analysis=AnalysisSummary(
            waterQuality={"status": wq["status"], "score": wq["score"]},
            anomaly={"detected": len(anomalies) > 0, "score": max_anomaly_score, "severity": max_severity},
            risk={"current": risk["current"], "confidence": risk["confidence"]},
            activeWarnings=active_warnings,
        ),
    )

    return ApiResponse(success=True, data=result)
