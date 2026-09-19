# =============================================================================
# AquaSentinel AI — Warning Engine Service
# =============================================================================
# Generates early warnings when parameters exceed configurable thresholds.
# =============================================================================

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models import Warning, SensorReading

# ─── Threshold Configuration ─────────────────────────────────────────────────────

THRESHOLDS = {
    "ph": {
        "advisory": {"low": 6.5, "high": 7.8},
        "warning": {"low": 6.3, "high": 8.2},
        "critical": {"low": 6.0, "high": 8.5},
        "normal_range": "6.5 – 7.5 pH",
        "unit": "pH",
    },
    "turbidity": {
        "advisory": {"low": None, "high": 4.5},
        "warning": {"low": None, "high": 6.0},
        "critical": {"low": None, "high": 8.0},
        "normal_range": "1.0 – 5.0 NTU",
        "unit": "NTU",
    },
    "temperature": {
        "advisory": {"low": 16, "high": 27},
        "warning": {"low": 14, "high": 29},
        "critical": {"low": 12, "high": 32},
        "normal_range": "18 – 25 °C",
        "unit": "°C",
    },
    "tds": {
        "advisory": {"low": 80, "high": 380},
        "warning": {"low": 60, "high": 420},
        "critical": {"low": 40, "high": 480},
        "normal_range": "200 – 380 ppm",
        "unit": "ppm",
    },
    "conductivity": {
        "advisory": {"low": 150, "high": 520},
        "warning": {"low": 120, "high": 600},
        "critical": {"low": 100, "high": 700},
        "normal_range": "400 – 520 µS/cm",
        "unit": "µS/cm",
    },
}


def _check_threshold(value: float, param: str) -> tuple[str | None, str]:
    """
    Check value against thresholds for a parameter.
    Returns (severity, direction) or (None, "") if within normal range.
    Checks from most severe to least.
    """
    cfg = THRESHOLDS.get(param)
    if not cfg:
        return None, ""

    for severity in ["critical", "warning", "advisory"]:
        low = cfg[severity].get("low")
        high = cfg[severity].get("high")

        if low is not None and value < low:
            return severity, "below"
        if high is not None and value > high:
            return severity, "above"

    return None, ""


def _generate_title(param: str, direction: str) -> str:
    param_names = {
        "ph": "pH Level",
        "turbidity": "Turbidity",
        "temperature": "Temperature",
        "tds": "TDS",
        "conductivity": "Conductivity",
    }
    name = param_names.get(param, param)
    if direction == "above":
        return f"{name} Exceeding Threshold"
    return f"{name} Below Threshold"


def _generate_reason(param: str, value: float, direction: str, unit: str) -> str:
    return f"{param.upper()} reading of {value:.2f} {unit} is {direction} the acceptable range."


def _generate_action(param: str, severity: str) -> str:
    actions = {
        "critical": f"Immediately investigate the {param} sensor and water source. Consider shutting down the intake.",
        "warning": f"Monitor {param} readings closely and check recent sensor calibration.",
        "advisory": f"Review {param} trend data and assess potential causes.",
    }
    return actions.get(severity, f"Monitor {param} readings.")


def check_and_create_warnings(db: Session, reading: SensorReading) -> list[dict]:
    """
    Check a sensor reading against all thresholds and create warning records.
    Skips if an active warning already exists for the same parameter.
    Returns the list of newly created warning dicts.
    """
    new_warnings = []
    now = datetime.now(timezone.utc)

    for param in ["ph", "turbidity", "temperature", "tds", "conductivity"]:
        value = getattr(reading, param, None)
        if value is None:
            continue

        severity, direction = _check_threshold(value, param)
        if severity is None:
            # Value is within normal range — resolve any active warnings for this param
            active = (
                db.query(Warning)
                .filter(Warning.parameter == param, Warning.status == "active")
                .all()
            )
            for w in active:
                w.status = "resolved"
            continue

        # Check if there's already an active warning for this parameter
        existing = (
            db.query(Warning)
            .filter(Warning.parameter == param, Warning.status.in_(["active", "acknowledged"]))
            .first()
        )
        if existing:
            # Update severity if it got worse
            severity_order = {"advisory": 0, "warning": 1, "critical": 2}
            if severity_order.get(severity, 0) > severity_order.get(existing.severity, 0):
                existing.severity = severity
                existing.current_value = value
                existing.title = _generate_title(param, direction)
                existing.reason = _generate_reason(param, value, direction, THRESHOLDS[param]["unit"])
                existing.recommended_action = _generate_action(param, severity)
            continue

        cfg = THRESHOLDS[param]
        warning = Warning(
            id=str(uuid.uuid4()),
            severity=severity,
            title=_generate_title(param, direction),
            parameter=param,
            current_value=value,
            normal_range=cfg["normal_range"],
            detected_time=now,
            reason=_generate_reason(param, value, direction, cfg["unit"]),
            recommended_action=_generate_action(param, severity),
            status="active",
        )
        db.add(warning)
        new_warnings.append({
            "id": warning.id,
            "severity": severity,
            "parameter": param,
            "title": warning.title,
        })

    db.commit()
    return new_warnings
