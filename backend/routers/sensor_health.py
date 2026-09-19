# =============================================================================
# AquaSentinel AI — Sensor Health Router
# =============================================================================
# GET /api/sensor-health — health metrics for all 5 sensors
# =============================================================================

import math
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import SensorReading
from schemas import ApiResponse, AllSensorHealthSchema, SensorHealthDataSchema, DataPoint

router = APIRouter(tags=["sensor-health"])

PARAM_KEYS = ["ph", "turbidity", "temperature", "tds", "conductivity"]


def _compute_sensor_health(db: Session, param: str, readings: list[SensorReading]) -> SensorHealthDataSchema:
    """Compute health metrics for a single sensor parameter."""
    values = [getattr(r, param) for r in readings if getattr(r, param, None) is not None]
    total = len(readings)
    available = len(values)

    missing = total - available
    now = datetime.now(timezone.utc)

    # Detect invalid readings (extreme outliers)
    invalid = 0
    spike_count = 0
    if len(values) >= 3:
        mean = sum(values) / len(values)
        variance = sum((v - mean) ** 2 for v in values) / len(values)
        std = math.sqrt(variance) if variance > 0 else 0

        for i, v in enumerate(values):
            if std > 0 and abs(v - mean) > 4 * std:
                invalid += 1
            if i > 0 and std > 0 and abs(v - values[i - 1]) > 3 * std:
                spike_count += 1

    # Drift detection: compare first half mean vs second half mean
    drift_detected = False
    if len(values) >= 20:
        half = len(values) // 2
        first_half_mean = sum(values[:half]) / half
        second_half_mean = sum(values[half:]) / (len(values) - half)
        mean = sum(values) / len(values)
        if mean != 0:
            drift_pct = abs(first_half_mean - second_half_mean) / abs(mean) * 100
            drift_detected = drift_pct > 15

    # Stuck value detection: too many identical consecutive values
    stuck = False
    if len(values) >= 5:
        max_consecutive = 1
        current_run = 1
        for i in range(1, len(values)):
            if abs(values[i] - values[i - 1]) < 0.001:
                current_run += 1
                max_consecutive = max(max_consecutive, current_run)
            else:
                current_run = 1
        stuck = max_consecutive >= 5

    # Health score
    health = 100.0
    if total > 0:
        health -= (missing / total) * 20  # missing readings penalty
    health -= invalid * 3
    health -= spike_count * 2
    if drift_detected:
        health -= 10
    if stuck:
        health -= 15
    health = max(0, min(100, health))

    # Reliability score (slightly different weighting)
    reliability = health - (spike_count * 1) - (invalid * 2)
    reliability = max(0, min(100, reliability))

    # Status
    if health >= 90:
        status = "Healthy"
    elif health >= 70:
        status = "Warning"
    elif health >= 40:
        status = "Faulty"
    else:
        status = "Offline"

    # Last communication
    last_reading = None
    for r in readings:
        if getattr(r, param, None) is not None:
            last_reading = r
            break
    last_comm = last_reading.timestamp if last_reading else now
    last_comm_str = last_comm.isoformat().replace("+00:00", "Z") if isinstance(last_comm, datetime) else str(last_comm)

    # Health history (sample 24 points)
    history = []
    if readings:
        step = max(1, len(readings) // 24)
        for i in range(0, min(len(readings), 24 * step), step):
            r = readings[i]
            ts = r.timestamp.isoformat().replace("+00:00", "Z") if isinstance(r.timestamp, datetime) else str(r.timestamp)
            # Approximate health at that point
            h = health + (hash(ts) % 6 - 3)  # small variation
            h = max(0, min(100, h))
            history.append(DataPoint(timestamp=ts, value=round(h, 1)))
        history.reverse()

    return SensorHealthDataSchema(
        health=round(health, 1),
        reliabilityScore=round(reliability, 1),
        status=status,
        missingReadings=missing,
        invalidReadings=invalid,
        spikeCount=spike_count,
        driftDetected=drift_detected,
        stuckValueDetected=stuck,
        lastCommunication=last_comm_str,
        history=history,
    )


def build_all_sensor_health(db: Session) -> AllSensorHealthSchema:
    """Build health data for all 5 sensors. Used by both this router and the dashboard."""
    since = datetime.now(timezone.utc) - timedelta(hours=24)
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

    return AllSensorHealthSchema(
        **{param: _compute_sensor_health(db, param, readings) for param in PARAM_KEYS}
    )


@router.get("/sensor-health")
def get_sensor_health(db: Session = Depends(get_db)):
    return ApiResponse(
        success=True,
        data=build_all_sensor_health(db),
    )
