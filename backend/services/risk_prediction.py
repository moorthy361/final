# =============================================================================
# AquaSentinel AI — Risk Prediction Service
# =============================================================================
# Computes current risk level from anomaly rate + parameter trends.
# Forecasts 6h/12h/24h risk using trend extrapolation.
# =============================================================================

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from models import SensorReading, AnomalyRecord
from services.water_quality import compute_water_quality


RISK_LEVELS = ["Low", "Moderate", "High", "Critical"]


def _risk_score_from_quality(quality_score: float, anomaly_rate: float) -> float:
    """
    Combine water quality and anomaly rate into a 0–100 risk score.
    Higher score = higher risk.
    """
    # Invert quality (100 = good → 0 risk)
    quality_risk = 100 - quality_score
    # Anomaly rate contribution
    anomaly_risk = min(anomaly_rate * 10, 50)
    return min(100, quality_risk * 0.7 + anomaly_risk * 0.3)


def _level_from_score(score: float) -> str:
    if score >= 75:
        return "Critical"
    elif score >= 50:
        return "High"
    elif score >= 25:
        return "Moderate"
    return "Low"


def compute_risk(db: Session) -> dict:
    """
    Returns:
        {
            "current": str,
            "sixHour": str | None,
            "twelveHour": str | None,
            "twentyFourHour": str | None,
            "confidence": float,
            "trend": list[DataPoint],
            "factors": list[RiskFactor],
        }
    """
    now = datetime.now(timezone.utc)

    # Get latest reading
    latest = (
        db.query(SensorReading)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )

    if not latest:
        return {
            "current": "Low",
            "sixHour": None,
            "twelveHour": None,
            "twentyFourHour": None,
            "confidence": 0.0,
            "trend": [],
            "factors": [],
        }

    # Current water quality
    wq = compute_water_quality(
        ph=latest.ph,
        turbidity=latest.turbidity,
        temperature=latest.temperature,
        tds=latest.tds,
        conductivity=latest.conductivity,
    )

    # Anomaly rate from last 24h
    day_ago = now - timedelta(hours=24)
    recent_anomalies = (
        db.query(AnomalyRecord)
        .filter(AnomalyRecord.timestamp >= day_ago)
        .count()
    )
    recent_readings = (
        db.query(SensorReading)
        .filter(SensorReading.timestamp >= day_ago)
        .count()
    )
    anomaly_rate = (recent_anomalies / max(recent_readings, 1)) * 100

    current_score = _risk_score_from_quality(wq["score"], anomaly_rate)
    current_level = _level_from_score(current_score)

    # ─── Trend (last 48h risk scores, one per hour) ──────────────────────────

    trend_points = []
    for hours_ago in range(48, -1, -1):
        t = now - timedelta(hours=hours_ago)
        # Get reading closest to this time
        reading = (
            db.query(SensorReading)
            .filter(SensorReading.timestamp <= t)
            .order_by(SensorReading.timestamp.desc())
            .first()
        )
        if reading:
            q = compute_water_quality(
                ph=reading.ph,
                turbidity=reading.turbidity,
                temperature=reading.temperature,
                tds=reading.tds,
                conductivity=reading.conductivity,
            )
            score = 100 - q["score"]  # invert: high quality = low risk
        else:
            score = 20.0  # default low risk
        trend_points.append({
            "timestamp": t.isoformat().replace("+00:00", "Z"),
            "value": round(score, 1),
        })

    # ─── Forecast (simple trend extrapolation) ───────────────────────────────

    if len(trend_points) >= 6:
        recent_scores = [p["value"] for p in trend_points[-6:]]
        older_scores = [p["value"] for p in trend_points[-12:-6]] if len(trend_points) >= 12 else recent_scores
        trend_delta = (sum(recent_scores) / len(recent_scores)) - (sum(older_scores) / len(older_scores))

        six_h = min(100, max(0, current_score + trend_delta * 1.0))
        twelve_h = min(100, max(0, current_score + trend_delta * 2.0))
        twenty_four_h = min(100, max(0, current_score + trend_delta * 4.0))

        six_hour = _level_from_score(six_h)
        twelve_hour = _level_from_score(twelve_h)
        twenty_four_hour = _level_from_score(twenty_four_h)
    else:
        six_hour = None
        twelve_hour = None
        twenty_four_hour = None

    # ─── Contributing Factors ────────────────────────────────────────────────

    factors = []

    # Turbidity
    if latest.turbidity and latest.turbidity > 5.0:
        factors.append({
            "parameter": "Turbidity trend",
            "contribution": "High" if latest.turbidity > 8 else "Moderate",
            "description": f"Turbidity at {latest.turbidity:.1f} NTU, above ideal range.",
        })

    # pH
    if latest.ph and (latest.ph < 6.5 or latest.ph > 8.0):
        factors.append({
            "parameter": "pH variation",
            "contribution": "Moderate",
            "description": f"pH at {latest.ph:.2f}, outside ideal range (6.5–8.0).",
        })

    # TDS
    if latest.tds and latest.tds > 380:
        factors.append({
            "parameter": "TDS level",
            "contribution": "Moderate" if latest.tds < 450 else "High",
            "description": f"TDS at {latest.tds:.0f} ppm, elevated.",
        })

    # Conductivity
    if latest.conductivity and latest.conductivity > 520:
        factors.append({
            "parameter": "Conductivity change",
            "contribution": "Low",
            "description": f"Conductivity at {latest.conductivity:.0f} µS/cm, minor drift.",
        })

    # Temperature
    if latest.temperature and (latest.temperature < 18 or latest.temperature > 25):
        factors.append({
            "parameter": "Temperature",
            "contribution": "Low",
            "description": f"Temperature at {latest.temperature:.1f}°C, outside ideal range.",
        })

    # Ensure at least one factor
    if not factors:
        factors.append({
            "parameter": "Overall stability",
            "contribution": "Low",
            "description": "All parameters within acceptable ranges.",
        })

    confidence = min(0.95, 0.5 + (recent_readings / 200))

    return {
        "current": current_level,
        "sixHour": six_hour,
        "twelveHour": twelve_hour,
        "twentyFourHour": twenty_four_hour,
        "confidence": round(confidence, 2),
        "trend": trend_points,
        "factors": factors,
    }
