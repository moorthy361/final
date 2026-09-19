# =============================================================================
# AquaSentinel AI — Warnings Router
# =============================================================================
# GET  /api/warnings?severity=&status=&parameter=
# POST /api/warnings/{id}/acknowledge?acknowledged_by=
# =============================================================================

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Warning
from schemas import ApiResponse, EarlyWarningSchema

router = APIRouter(tags=["warnings"])


def _to_schema(w: Warning) -> EarlyWarningSchema:
    return EarlyWarningSchema(
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


@router.get("/warnings")
def get_warnings(
    severity: str | None = Query(None),
    status: str | None = Query(None),
    parameter: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Warning)

    if severity:
        query = query.filter(Warning.severity == severity)
    if status:
        query = query.filter(Warning.status == status)
    if parameter:
        query = query.filter(Warning.parameter == parameter)

    warnings = query.order_by(Warning.detected_time.desc()).all()

    return ApiResponse(
        success=True,
        data=[_to_schema(w) for w in warnings],
    )


@router.post("/warnings/{warning_id}/acknowledge")
def acknowledge_warning(
    warning_id: str,
    acknowledged_by: str = Query("Operator"),
    db: Session = Depends(get_db),
):
    warning = db.query(Warning).filter(Warning.id == warning_id).first()
    if not warning:
        raise HTTPException(status_code=404, detail="Warning not found")

    warning.status = "acknowledged"
    warning.acknowledged_by = acknowledged_by
    warning.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(warning)

    return ApiResponse(
        success=True,
        data=_to_schema(warning),
    )
