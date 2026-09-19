from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import create_tables, SessionLocal

# Import all routers
from routers import (
    auth,
    dashboard,
    water_quality,
    anomalies,
    risk,
    warnings,
    sensor_health,
    historical,
    sensors,
)


# =============================================================================
# APPLICATION
# =============================================================================

app = FastAPI(
    title="AquaSentinel AI",
    description="Water Quality Monitoring & Analysis API",
    version="1.0.0",
)


# =============================================================================
# CORS CONFIGURATION
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# API ROUTERS
# =============================================================================

app.include_router(
    auth.router,
    prefix="/api",
)

app.include_router(
    dashboard.router,
    prefix="/api",
)

app.include_router(
    water_quality.router,
    prefix="/api",
)

app.include_router(
    anomalies.router,
    prefix="/api",
)

app.include_router(
    risk.router,
    prefix="/api",
)

app.include_router(
    warnings.router,
    prefix="/api",
)

app.include_router(
    sensor_health.router,
    prefix="/api",
)

app.include_router(
    historical.router,
    prefix="/api",
)

app.include_router(
    sensors.router,
    prefix="/api",
)


# =============================================================================
# ROOT ENDPOINT
# =============================================================================

@app.get("/")
def root():
    return {
        "service": "AquaSentinel AI",
        "status": "online",
        "version": "1.0.0",
        "message": "AquaSentinel AI backend is running successfully.",
        "docs": "/docs",
        "health": "/health",
    }


# =============================================================================
# HEALTH CHECK
# =============================================================================

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


# =============================================================================
# STARTUP
# =============================================================================

@app.on_event("startup")
def on_startup():

    # Import models so SQLAlchemy registers all models
    import models  # noqa: F401

    # Create database tables
    create_tables()

    print("[startup] Database tables created.")

    # Automatically seed database if enabled
    if settings.AUTO_SEED:

        from seed import seed_database

        db = SessionLocal()

        try:
            seed_database(db)
            print("[startup] Database seeded successfully.")

        except Exception as error:
            print(f"[startup] Database seeding failed: {error}")

        finally:
            db.close()

    print("[startup] AquaSentinel AI backend ready.")
    print(f"[startup] CORS origins: {settings.CORS_ORIGINS}")
    print("[startup] API documentation available at /docs")
