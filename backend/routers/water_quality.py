# =============================================================================
# AquaSentinel AI — Water Quality Router
# =============================================================================
# GET /api/water-quality?time_range=  — returns water quality + parameters
# =============================================================================

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import SensorReading
from schemas import ApiResponse, WaterQualityResponse, SensorParametersSchema, SensorReadingSchema, DataPoint
from services.water_quality import compute_water_quality, get_param_status

router = APIRouter(tags=["water-quality"])

TIME_RANGE_MAP = {
    "1h": timedelta(hours=1),
    "6h": timedelta(hours=6),
    "12h": timedelta(hours=12),
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
}

PARAM_UNITS = {
    "ph": "pH",
    "turbidity": "NTU",
    "temperature": "°C",
    "tds": "ppm",
    "conductivity": "µS/cm",
}


def _build_sensor_reading(readings: list[SensorReading], param: str) -> SensorReadingSchema:
    """Build a SensorReadingSchema for a single parameter from a list of readings."""
    values = [getattr(r, param) for r in readings if getattr(r, param, None) is not None]

    if not values:
        return SensorReadingSchema(
            value=0, unit=PARAM_UNITS[param], status="Normal", trend=0,
            trendDirection="stable", min=0, max=0, average=0,
            lastUpdated=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            history=[], sensorHealth=95,
        )

    current = values[0]  # most recent
    minimum = min(values)
    maximum = max(values)
    average = sum(values) / len(values)

    # Trend: compare first (most recent) vs average of older readings
    if len(values) >= 3:
        older_avg = sum(values[1:]) / len(values[1:])
        trend_pct = ((current - older_avg) / older_avg * 100) if older_avg != 0 else 0
    else:
        trend_pct = 0

    if abs(trend_pct) < 1:
        trend_dir = "stable"
    elif trend_pct > 0:
        trend_dir = "up"
    else:
        trend_dir = "down"

    # History sparkline (up to 24 points)
    history = []
    step = max(1, len(readings) // 24)
    for i in range(0, min(len(readings), 24 * step), step):
        r = readings[i]
        val = getattr(r, param, None)
        if val is not None:
            history.append(DataPoint(
                timestamp=r.timestamp.isoformat().replace("+00:00", "Z") if isinstance(r.timestamp, datetime) else str(r.timestamp),
                value=round(val, 2),
            ))
    history.reverse()  # oldest first for sparkline

    return SensorReadingSchema(
        value=round(current, 2),
        unit=PARAM_UNITS[param],
        status=get_param_status(current, param),
        trend=round(trend_pct, 1),
        trendDirection=trend_dir,
        min=round(minimum, 2),
        max=round(maximum, 2),
        average=round(average, 2),
        lastUpdated=readings[0].timestamp.isoformat().replace("+00:00", "Z") if isinstance(readings[0].timestamp, datetime) else str(readings[0].timestamp),
        history=history,
        sensorHealth=95.0,
    )


def build_sensor_parameters(readings: list[SensorReading]) -> SensorParametersSchema:
    """Build SensorParametersSchema from a list of readings."""
    return SensorParametersSchema(
        ph=_build_sensor_reading(readings, "ph"),
        turbidity=_build_sensor_reading(readings, "turbidity"),
        temperature=_build_sensor_reading(readings, "temperature"),
        tds=_build_sensor_reading(readings, "tds"),
        conductivity=_build_sensor_reading(readings, "conductivity"),
    )


@router.get("/water-quality")
def get_water_quality(
    time_range: str = Query("24h", alias="time_range"),
    db: Session = Depends(get_db),
):
    delta = TIME_RANGE_MAP.get(time_range, timedelta(hours=24))
    since = datetime.now(timezone.utc) - delta

    readings = (
        db.query(SensorReading)
        .filter(SensorReading.timestamp >= since)
        .order_by(SensorReading.timestamp.desc())
        .all()
    )

    if not readings:
        # Fallback to all available data
        readings = (
            db.query(SensorReading)
            .order_by(SensorReading.timestamp.desc())
            .limit(100)
            .all()
        )

    latest = readings[0] if readings else None
    wq = compute_water_quality(
        ph=latest.ph if latest else None,
        turbidity=latest.turbidity if latest else None,
        temperature=latest.temperature if latest else None,
        tds=latest.tds if latest else None,
        conductivity=latest.conductivity if latest else None,
    )

    params = build_sensor_parameters(readings)

    return ApiResponse(
        success=True,
        data=WaterQualityResponse(
            status=wq["status"],
            score=wq["score"],
            confidence=wq["confidence"],
            lastUpdated=wq["lastUpdated"],
            parameters=params,
        ),
    )
