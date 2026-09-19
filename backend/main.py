# =============================================================================
# AquaSentinel AI — FastAPI Application Entry Point
# =============================================================================
# Run with: uvicorn main:app --reload
# =============================================================================

from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import create_tables, SessionLocal

# Import all routers
from routers import auth, dashboard, water_quality, anomalies, risk, warnings, sensor_health, historical, sensors

app = FastAPI(
    title="AquaSentinel AI",
    description="Water Quality Monitoring & Analysis API",
    version="1.0.0",
)

# ─── CORS Middleware ──────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Mount Routers ───────────────────────────────────────────────────────────────

app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(water_quality.router, prefix="/api")
app.include_router(anomalies.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(warnings.router, prefix="/api")
app.include_router(sensor_health.router, prefix="/api")
app.include_router(historical.router, prefix="/api")
app.include_router(sensors.router, prefix="/api")


# ─── Health Endpoint (at root, not under /api) ──────────────────────────────────


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AquaSentinel AI",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "models": {
            "water_quality": "rule-based-v1",
            "anomaly_detection": "zscore-v1",
            "risk_prediction": "trend-extrapolation-v1",
        },
    }


# ─── Startup Event ───────────────────────────────────────────────────────────────


@app.on_event("startup")
def on_startup():
    # Import models so they are registered with Base
    import models  # noqa: F401

    # Create tables
    create_tables()
    print("[startup] Database tables created.")

    # Auto-seed if enabled
    if settings.AUTO_SEED:
        from seed import seed_database
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()

    print("[startup] AquaSentinel AI backend ready.")
    print(f"[startup] CORS origins: {settings.CORS_ORIGINS}")
    print(f"[startup] API docs: http://127.0.0.1:8000/docs")
