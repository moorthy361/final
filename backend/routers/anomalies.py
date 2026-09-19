# =============================================================================
# AquaSentinel AI — Anomalies Router
# =============================================================================
# GET /api/anomalies?parameter=&severity=&page=&page_size=
# GET /api/anomalies/latest
# =============================================================================

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import AnomalyRecord
from schemas import ApiResponse, AnomalyRecordSchema, AnomalyResultSchema, PaginatedResponseSchema
from services.anomaly_detection import get_anomaly_summary

router = APIRouter(tags=["anomalies"])


def _to_schema(a: AnomalyRecord) -> AnomalyRecordSchema:
    return AnomalyRecordSchema(
        id=a.id,
        timestamp=a.timestamp.isoformat().replace("+00:00", "Z") if isinstance(a.timestamp, datetime) else str(a.timestamp),
        parameter=a.parameter,
        value=a.value,
        anomalyScore=a.anomaly_score,
        severity=a.severity,
        sensorHealth=a.sensor_health,
        status=a.status,
        reason=a.reason,
    )


@router.get("/anomalies")
def get_anomalies(
    parameter: str | None = Query(None),
    severity: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(AnomalyRecord)

    if parameter:
        query = query.filter(AnomalyRecord.parameter == parameter)
    if severity:
        query = query.filter(AnomalyRecord.severity == severity)

    total = query.count()
    records = (
        query
        .order_by(AnomalyRecord.timestamp.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    total_pages = max(1, (total + page_size - 1) // page_size)

    summary = get_anomaly_summary(db)

    return ApiResponse(
        success=True,
        data={
            "summary": summary,
            "records": PaginatedResponseSchema(
                data=[_to_schema(a) for a in records],
                total=total,
                page=page,
                pageSize=page_size,
                totalPages=total_pages,
            ),
        },
    )


@router.get("/anomalies/latest")
def get_latest_anomaly(db: Session = Depends(get_db)):
    latest = (
        db.query(AnomalyRecord)
        .order_by(AnomalyRecord.timestamp.desc())
        .first()
    )

    return ApiResponse(
        success=True,
        data=_to_schema(latest) if latest else None,
    )
