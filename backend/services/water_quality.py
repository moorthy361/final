# =============================================================================
# AquaSentinel AI — Water Quality Scoring Service
# =============================================================================
# Computes a weighted water quality score from sensor parameters.
# Maps the score to Good / Moderate / Poor / Critical status.
# =============================================================================

from datetime import datetime, timezone

# ─── Normal Ranges ───────────────────────────────────────────────────────────────

NORMAL_RANGES = {
    "ph": {"min": 6.5, "max": 8.5, "ideal_min": 6.8, "ideal_max": 7.5, "weight": 0.25},
    "turbidity": {"min": 0, "max": 5.0, "ideal_min": 0, "ideal_max": 3.0, "weight": 0.25},
    "temperature": {"min": 15, "max": 30, "ideal_min": 18, "ideal_max": 25, "weight": 0.15},
    "tds": {"min": 50, "max": 500, "ideal_min": 100, "ideal_max": 380, "weight": 0.20},
    "conductivity": {"min": 100, "max": 800, "ideal_min": 200, "ideal_max": 520, "weight": 0.15},
}


def _param_score(value: float | None, param: str) -> float:
    """Score a single parameter 0–100. Higher is better."""
    if value is None:
        return 50.0  # no data → neutral

    r = NORMAL_RANGES.get(param)
    if not r:
        return 50.0

    ideal_min = r["ideal_min"]
    ideal_max = r["ideal_max"]
    abs_min = r["min"]
    abs_max = r["max"]

    # Within ideal range → 100
    if ideal_min <= value <= ideal_max:
        return 100.0

    # Between ideal and absolute → linear decay to 40
    if value < ideal_min:
        if value < abs_min:
            return max(0.0, 20.0 - (abs_min - value) * 5)
        return 40.0 + 60.0 * (value - abs_min) / (ideal_min - abs_min)
    else:  # value > ideal_max
        if value > abs_max:
            return max(0.0, 20.0 - (value - abs_max) * 5)
        return 40.0 + 60.0 * (abs_max - value) / (abs_max - ideal_max)


def compute_water_quality(
    ph: float | None = None,
    turbidity: float | None = None,
    temperature: float | None = None,
    tds: float | None = None,
    conductivity: float | None = None,
) -> dict:
    """
    Returns:
        {
            "status": "Good" | "Moderate" | "Poor" | "Critical",
            "score": float 0–100,
            "confidence": float 0–1,
            "lastUpdated": str ISO
        }
    """
    params = {
        "ph": ph,
        "turbidity": turbidity,
        "temperature": temperature,
        "tds": tds,
        "conductivity": conductivity,
    }

    total_weight = 0.0
    weighted_score = 0.0
    available = 0

    for name, value in params.items():
        weight = NORMAL_RANGES[name]["weight"]
        score = _param_score(value, name)
        if value is not None:
            available += 1
        weighted_score += score * weight
        total_weight += weight

    overall = weighted_score / total_weight if total_weight > 0 else 50.0
    confidence = available / 5.0  # how many params had data

    if overall >= 80:
        status = "Good"
    elif overall >= 60:
        status = "Moderate"
    elif overall >= 40:
        status = "Poor"
    else:
        status = "Critical"

    return {
        "status": status,
        "score": round(overall, 1),
        "confidence": round(confidence, 2),
        "lastUpdated": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


def get_param_status(value: float | None, param: str) -> str:
    """Return Normal / Warning / Critical for a single parameter."""
    if value is None:
        return "Normal"
    score = _param_score(value, param)
    if score >= 70:
        return "Normal"
    elif score >= 40:
        return "Warning"
    return "Critical"
