# =============================================================================
# AquaSentinel AI — Risk Prediction Router
# =============================================================================
# GET /api/risk — current + forecast risk levels
# =============================================================================

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import ApiResponse, RiskPredictionSchema
from services.risk_prediction import compute_risk

router = APIRouter(tags=["risk"])


@router.get("/risk")
def get_risk(db: Session = Depends(get_db)):
    risk = compute_risk(db)
    return ApiResponse(
        success=True,
        data=RiskPredictionSchema(**risk),
    )
