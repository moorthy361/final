# =============================================================================
# AquaSentinel AI — SQLAlchemy ORM Models
# =============================================================================

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    Text,
)
from database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ─── User ────────────────────────────────────────────────────────────────────────


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=_utcnow)


# ─── Sensor Reading ─────────────────────────────────────────────────────────────


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(String, primary_key=True, default=_uuid)
    timestamp = Column(DateTime, nullable=False, default=_utcnow, index=True)
    ph = Column(Float, nullable=True)
    turbidity = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    tds = Column(Float, nullable=True)
    conductivity = Column(Float, nullable=True)
    dissolved_oxygen = Column(Float, nullable=True)


# ─── Anomaly Record ─────────────────────────────────────────────────────────────


class AnomalyRecord(Base):
    __tablename__ = "anomaly_records"

    id = Column(String, primary_key=True, default=_uuid)
    timestamp = Column(DateTime, nullable=False, default=_utcnow, index=True)
    parameter = Column(String, nullable=False)  # ph, turbidity, temperature, tds, conductivity
    value = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=False)  # 0–1
    severity = Column(String, nullable=False)  # normal, warning, critical
    sensor_health = Column(Float, nullable=False, default=95.0)
    status = Column(String, nullable=False, default="detected")  # detected, investigating, resolved
    reason = Column(Text, nullable=False, default="")


# ─── Early Warning ───────────────────────────────────────────────────────────────


class Warning(Base):
    __tablename__ = "warnings"

    id = Column(String, primary_key=True, default=_uuid)
    severity = Column(String, nullable=False)  # advisory, warning, critical
    title = Column(String, nullable=False)
    parameter = Column(String, nullable=False)
    current_value = Column(Float, nullable=False)
    normal_range = Column(String, nullable=True)
    detected_time = Column(DateTime, nullable=False, default=_utcnow)
    reason = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="active")  # active, acknowledged, resolved
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
