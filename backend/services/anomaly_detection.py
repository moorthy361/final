# =============================================================================
# AquaSentinel AI — Anomaly Detection Service
# =============================================================================
# Z-score based anomaly detection against recent reading history.
# =============================================================================

import math
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models import SensorReading, AnomalyRecord as AnomalyModel

PARAM_KEYS = ["ph", "turbidity", "temperature", "tds", "conductivity"]


def _zscore(value: float, mean: float, std: float) -> float:
    if std == 0:
        return 0.0
    return abs(value - mean) / std


def _severity_from_zscore(z: float) -> str:
    if z >= 3.0:
        return "critical"
    elif z >= 2.0:
        return "warning"
    return "normal"


def _anomaly_score_from_zscore(z: float) -> float:
    """Map z-score to 0–1 anomaly score."""
    return min(1.0, z / 4.0)


def detect_anomalies_for_reading(
    db: Session,
    reading: SensorReading,
    window_size: int = 50,
) -> list[dict]:
    """
    Check each parameter of the new reading against recent history.
    Returns a list of anomaly dicts (only for parameters that are anomalous).
    """
    # Fetch recent readings for statistics
    recent = (
        db.query(SensorReading)
        .filter(SensorReading.timestamp < reading.timestamp)
        .order_by(SensorReading.timestamp.desc())
        .limit(window_size)
        .all()
    )

    anomalies = []
    for param in PARAM_KEYS:
        value = getattr(reading, param, None)
        if value is None:
            continue

        values = [getattr(r, param) for r in recent if getattr(r, param, None) is not None]
        if len(values) < 5:
            continue  # not enough data for statistics

        mean = sum(values) / len(values)
        variance = sum((v - mean) ** 2 for v in values) / len(values)
        std = math.sqrt(variance)

        z = _zscore(value, mean, std)
        severity = _severity_from_zscore(z)

        if severity != "normal":
            direction = "above" if value > mean else "below"
            anomalies.append({
                "parameter": param,
                "value": value,
                "anomaly_score": round(_anomaly_score_from_zscore(z), 2),
                "severity": severity,
                "reason": f"{param.upper()} value {value} is {z:.1f}σ {direction} the rolling mean ({mean:.2f}).",
                "sensor_health": 95.0,  # simplified; real impl would check sensor health
            })

    return anomalies


def get_anomaly_summary(db: Session) -> dict:
    """Compute aggregate anomaly summary for the dashboard."""
    all_anomalies = db.query(AnomalyModel).all()

    total = len(all_anomalies)
    critical = sum(1 for a in all_anomalies if a.severity == "critical")
    warning = sum(1 for a in all_anomalies if a.severity == "warning")

    # Find latest anomaly
    latest = (
        db.query(AnomalyModel)
        .order_by(AnomalyModel.timestamp.desc())
        .first()
    )
    latest_text = latest.reason[:50] if latest else "No anomalies detected"

    # Compute overall anomaly score (max of recent anomalies)
    recent_anomalies = (
        db.query(AnomalyModel)
        .order_by(AnomalyModel.timestamp.desc())
        .limit(10)
        .all()
    )
    max_score = max((a.anomaly_score for a in recent_anomalies), default=0.0)

    # Anomaly rate: fraction of readings that triggered anomalies
    total_readings = db.query(SensorReading).count()
    rate = (total / max(total_readings * 5, 1)) * 100  # 5 params per reading

    # Overall severity
    if critical > 0 and any(a.severity == "critical" and a.status == "detected" for a in all_anomalies):
        severity = "critical"
    elif warning > 0 and any(a.severity == "warning" and a.status != "resolved" for a in all_anomalies):
        severity = "warning"
    else:
        severity = "normal"

    return {
        "detected": max_score > 0.4,
        "score": round(max_score, 2),
        "severity": severity,
        "totalCount": total,
        "criticalCount": critical,
        "warningCount": warning,
        "latestAnomaly": latest_text,
        "anomalyRate": round(rate, 1),
    }
