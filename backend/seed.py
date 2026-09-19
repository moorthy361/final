# =============================================================================
# AquaSentinel AI — Seed Data Generator
# =============================================================================
# Generates ~500 realistic sensor readings spanning 7 days, along with
# anomaly records, warnings, and a default admin user.
# =============================================================================

import math
import random
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from sqlalchemy.orm import Session

from models import User, SensorReading, AnomalyRecord, Warning


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def seed_database(db: Session) -> None:
    """Populate the database with realistic sample data."""

    # Check if already seeded
    if db.query(User).first():
        print("[seed] Database already contains data — skipping seed.")
        return

    print("[seed] Seeding database with sample data...")

    now = datetime.now(timezone.utc)
    random.seed(42)  # reproducible

    # ─── Admin User ──────────────────────────────────────────────────────────

    admin = User(
        id=str(uuid.uuid4()),
        email="admin@aquasentinel.ai",
        name="Admin User",
        hashed_password=_hash_password("admin123"),
        avatar_url=None,
    )
    db.add(admin)

    # ─── Sensor Readings (500 readings over 7 days ≈ one every ~20 min) ──────

    readings = []
    num_readings = 500
    interval_minutes = (7 * 24 * 60) / num_readings  # ~20.16 min

    for i in range(num_readings):
        t = now - timedelta(minutes=interval_minutes * (num_readings - i))

        # Time-of-day factor for temperature (diurnal cycle)
        hour = t.hour + t.minute / 60
        diurnal = math.sin((hour - 6) / 24 * 2 * math.pi)  # peaks around noon

        # Base values with natural variation
        ph = 7.1 + random.gauss(0, 0.15) + 0.1 * diurnal
        turbidity = 3.5 + random.gauss(0, 0.8) + abs(random.gauss(0, 0.3))
        temperature = 22.0 + 3.0 * diurnal + random.gauss(0, 0.5)
        tds = 310 + random.gauss(0, 25) + 10 * diurnal
        conductivity = 470 + random.gauss(0, 30) + 15 * diurnal

        # Inject occasional anomalies (~5% of readings)
        if random.random() < 0.05:
            anomaly_param = random.choice(["ph", "turbidity", "temperature", "tds", "conductivity"])
            if anomaly_param == "ph":
                ph += random.choice([-1.2, 1.5])
            elif anomaly_param == "turbidity":
                turbidity += random.uniform(4, 8)
            elif anomaly_param == "temperature":
                temperature += random.choice([-5, 6])
            elif anomaly_param == "tds":
                tds += random.uniform(80, 150)
            else:
                conductivity += random.uniform(100, 200)

        # Clamp to realistic ranges
        ph = round(max(5.5, min(9.5, ph)), 2)
        turbidity = round(max(0.1, min(15, turbidity)), 2)
        temperature = round(max(10, min(35, temperature)), 1)
        tds = round(max(50, min(600, tds)))
        conductivity = round(max(100, min(900, conductivity)))

        reading = SensorReading(
            id=str(uuid.uuid4()),
            timestamp=t,
            ph=ph,
            turbidity=turbidity,
            temperature=temperature,
            tds=tds,
            conductivity=conductivity,
            dissolved_oxygen=round(random.uniform(6, 9), 1),
        )
        readings.append(reading)
        db.add(reading)

    db.flush()  # flush to get IDs

    # ─── Anomaly Records (from the injected anomalies) ───────────────────────

    anomaly_params = {
        "ph": {"threshold": 7.8, "direction": "above"},
        "turbidity": {"threshold": 6.0, "direction": "above"},
        "temperature": {"threshold": 27.0, "direction": "above"},
        "tds": {"threshold": 400, "direction": "above"},
        "conductivity": {"threshold": 600, "direction": "above"},
    }

    anomaly_count = 0
    for reading in readings:
        for param, cfg in anomaly_params.items():
            value = getattr(reading, param, None)
            if value is None:
                continue
            if cfg["direction"] == "above" and value > cfg["threshold"]:
                severity = "critical" if value > cfg["threshold"] * 1.2 else "warning"
                anomaly = AnomalyRecord(
                    id=str(uuid.uuid4()),
                    timestamp=reading.timestamp,
                    parameter=param,
                    value=value,
                    anomaly_score=round(random.uniform(0.55, 0.95), 2),
                    severity=severity,
                    sensor_health=round(random.uniform(85, 98), 1),
                    status=random.choice(["detected", "investigating", "resolved"]),
                    reason=f"{param.upper()} value {value} exceeds threshold ({cfg['threshold']}).",
                )
                db.add(anomaly)
                anomaly_count += 1

    # ─── Warnings ────────────────────────────────────────────────────────────

    warning_templates = [
        {
            "severity": "critical",
            "title": "Rapid Turbidity Increase",
            "parameter": "turbidity",
            "current_value": 8.5,
            "normal_range": "1.0 – 5.0 NTU",
            "reason": "Turbidity increased significantly over the recent observation window.",
            "recommended_action": "Inspect the water source and verify sensor condition.",
            "status": "active",
            "time_offset": 28,
        },
        {
            "severity": "warning",
            "title": "pH Level Approaching Threshold",
            "parameter": "ph",
            "current_value": 7.8,
            "normal_range": "6.5 – 7.5 pH",
            "reason": "pH level trending upward and approaching upper normal limit.",
            "recommended_action": "Monitor pH readings and check recent calibration.",
            "status": "active",
            "time_offset": 45,
        },
        {
            "severity": "advisory",
            "title": "TDS Gradual Rise",
            "parameter": "tds",
            "current_value": 395,
            "normal_range": "200 – 380 ppm",
            "reason": "Total Dissolved Solids showing gradual increasing trend.",
            "recommended_action": "Review TDS trend data and assess potential contamination sources.",
            "status": "acknowledged",
            "time_offset": 120,
        },
        {
            "severity": "warning",
            "title": "Conductivity Fluctuation",
            "parameter": "conductivity",
            "current_value": 560,
            "normal_range": "400 – 520 µS/cm",
            "reason": "Conductivity readings showing unusual variability.",
            "recommended_action": "Check sensor calibration and water source.",
            "status": "resolved",
            "time_offset": 360,
        },
        {
            "severity": "critical",
            "title": "Temperature Anomaly",
            "parameter": "temperature",
            "current_value": 27.2,
            "normal_range": "18 – 25 °C",
            "reason": "Temperature exceeded normal operating range.",
            "recommended_action": "Investigate thermal source near sensor.",
            "status": "resolved",
            "time_offset": 480,
        },
        {
            "severity": "advisory",
            "title": "pH Sensor Drift",
            "parameter": "ph",
            "current_value": 7.1,
            "normal_range": "6.5 – 7.5 pH",
            "reason": "Gradual pH sensor drift detected by health analysis.",
            "recommended_action": "Schedule sensor recalibration.",
            "status": "resolved",
            "time_offset": 720,
        },
    ]

    for wt in warning_templates:
        detected = now - timedelta(minutes=wt["time_offset"])
        w = Warning(
            id=str(uuid.uuid4()),
            severity=wt["severity"],
            title=wt["title"],
            parameter=wt["parameter"],
            current_value=wt["current_value"],
            normal_range=wt["normal_range"],
            detected_time=detected,
            reason=wt["reason"],
            recommended_action=wt["recommended_action"],
            status=wt["status"],
            acknowledged_by="Operator" if wt["status"] == "acknowledged" else None,
            acknowledged_at=detected + timedelta(minutes=60) if wt["status"] == "acknowledged" else None,
        )
        db.add(w)

    db.commit()
    print(f"[seed] Created: 1 user, {len(readings)} sensor readings, {anomaly_count} anomaly records, {len(warning_templates)} warnings")
    print(f"[seed] Default login: admin@aquasentinel.ai / admin123")
