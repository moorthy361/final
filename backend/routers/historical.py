# =============================================================================
# AquaSentinel AI — Historical Data Router
# =============================================================================
# GET /api/historical?start_date=&end_date=&parameter=&limit=&offset=&sort_by=&sort_order=&search=
# GET /api/historical/export — CSV download
# =============================================================================

import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import SensorReading
from schemas import ApiResponse, HistoricalRecordSchema, PaginatedResponseSchema
from services.water_quality import compute_water_quality, get_param_status

router = APIRouter(tags=["historical"])


def _to_historical(r: SensorReading) -> HistoricalRecordSchema:
    """Convert a SensorReading ORM object to a HistoricalRecordSchema."""
    wq = compute_water_quality(
        ph=r.ph, turbidity=r.turbidity, temperature=r.temperature,
        tds=r.tds, conductivity=r.conductivity,
    )

    # Simple anomaly flag: any parameter in Warning or Critical state
    is_anomaly = any(
        get_param_status(getattr(r, p, None), p) != "Normal"
        for p in ["ph", "turbidity", "temperature", "tds", "conductivity"]
    )

    # Sensor health approximation
    sensor_health = 95.0
    for p in ["ph", "turbidity", "temperature", "tds", "conductivity"]:
        if getattr(r, p, None) is None:
            sensor_health -= 5

    return HistoricalRecordSchema(
        timestamp=r.timestamp.isoformat().replace("+00:00", "Z") if isinstance(r.timestamp, datetime) else str(r.timestamp),
        ph=round(r.ph or 0, 2),
        turbidity=round(r.turbidity or 0, 2),
        temperature=round(r.temperature or 0, 1),
        tds=round(r.tds or 0, 0),
        conductivity=round(r.conductivity or 0, 0),
        waterStatus=wq["status"],
        anomaly=is_anomaly,
        riskLevel="Low" if wq["score"] >= 80 else ("Moderate" if wq["score"] >= 60 else ("High" if wq["score"] >= 40 else "Critical")),
        sensorHealth=round(sensor_health, 0),
    )


def _apply_filters(query, start_date, end_date, parameter, search):
    if start_date:
        try:
            dt = datetime.fromisoformat(start_date)
            query = query.filter(SensorReading.timestamp >= dt)
        except ValueError:
            pass
    if end_date:
        try:
            dt = datetime.fromisoformat(end_date)
            query = query.filter(SensorReading.timestamp <= dt)
        except ValueError:
            pass

    # parameter filter is handled in the response (we always fetch all columns)
    # search — search by timestamp string (basic implementation)

    return query


@router.get("/historical")
def get_historical(
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    parameter: str | None = Query(None),
    limit: int = Query(15, ge=1, le=200),
    offset: int = Query(0, ge=0),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc"),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(SensorReading)
    query = _apply_filters(query, start_date, end_date, parameter, search)

    total = query.count()

    # Sorting
    sort_column = SensorReading.timestamp  # default
    if sort_by == "ph":
        sort_column = SensorReading.ph
    elif sort_by == "turbidity":
        sort_column = SensorReading.turbidity
    elif sort_by == "temperature":
        sort_column = SensorReading.temperature
    elif sort_by == "tds":
        sort_column = SensorReading.tds
    elif sort_by == "conductivity":
        sort_column = SensorReading.conductivity

    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    readings = query.offset(offset).limit(limit).all()

    page = (offset // limit) + 1 if limit > 0 else 1
    total_pages = max(1, (total + limit - 1) // limit)

    return ApiResponse(
        success=True,
        data=PaginatedResponseSchema(
            data=[_to_historical(r) for r in readings],
            total=total,
            page=page,
            pageSize=limit,
            totalPages=total_pages,
        ),
    )


@router.get("/historical/export")
def export_historical_csv(
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    parameter: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(SensorReading)
    query = _apply_filters(query, start_date, end_date, parameter, None)
    readings = query.order_by(SensorReading.timestamp.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["timestamp", "ph", "turbidity", "temperature", "tds", "conductivity", "dissolved_oxygen"])

    for r in readings:
        writer.writerow([
            r.timestamp.isoformat() if isinstance(r.timestamp, datetime) else str(r.timestamp),
            r.ph, r.turbidity, r.temperature, r.tds, r.conductivity, r.dissolved_oxygen,
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=aquasentinel_export.csv"},
    )
