"""
ATHENA Physical Fitness Engine.
Implements:
- Adaptive fitness assessments (Beginner, Intermediate, Athlete)
- Multi-dimensional category scores:
  STRENGTH, ENDURANCE, CARDIO, MOBILITY, FLEXIBILITY, BALANCE, AGILITY, CONSISTENCY
- Transparent, explainable calculation models (avoids opaque single health scores)
"""
from typing import Dict, Any, Optional
import math

def calculate_assessment_scores(tier: str, metrics: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes normalized category scores (0 - 100) based on age, tier, and assessment results.
    Transparent, explainable formulas.
    """
    tier = tier.upper() if tier else "INTERMEDIATE"

    pushups = metrics.get("pushups", 0) or 0
    squats = metrics.get("squats", 0) or 0
    plank_sec = metrics.get("plank_seconds", 0) or 0
    situps = metrics.get("situps", 0) or 0
    run_km = metrics.get("run_distance_km", 0.0) or 0.0
    run_mins = metrics.get("run_time_minutes", 0.0) or 0.0
    sprint_100m = metrics.get("sprint_100m_seconds", 0.0) or 0.0
    flex_cm = metrics.get("flexibility_sit_and_reach_cm", 0.0) or 0.0
    balance_sec = metrics.get("balance_single_leg_seconds", 0.0) or 0.0
    agility_sec = metrics.get("agility_t_test_seconds", 0.0) or 0.0
    workouts_per_week = metrics.get("workouts_per_week", 3) or 3

    # STRENGTH: Upper and lower body volume relative to tier
    if tier == "BEGINNER":
        strength_raw = (pushups / 15.0) * 50.0 + (squats / 25.0) * 50.0
    elif tier == "ATHLETE":
        strength_raw = (pushups / 50.0) * 50.0 + (squats / 75.0) * 50.0
    else: # INTERMEDIATE
        strength_raw = (pushups / 30.0) * 50.0 + (squats / 45.0) * 50.0
    strength_score = min(100.0, max(10.0, round(strength_raw, 1)))

    # ENDURANCE: Core isometric hold and high-rep trunk stamina
    if tier == "BEGINNER":
        endurance_raw = (plank_sec / 60.0) * 50.0 + (situps / 20.0) * 50.0
    elif tier == "ATHLETE":
        endurance_raw = (plank_sec / 180.0) * 50.0 + (situps / 60.0) * 50.0
    else:
        endurance_raw = (plank_sec / 120.0) * 50.0 + (situps / 40.0) * 50.0
    endurance_score = min(100.0, max(10.0, round(endurance_raw, 1)))

    # CARDIO: Aerobic pace (km/min)
    if run_km > 0 and run_mins > 0:
        pace_min_per_km = run_mins / run_km
        # Good standard: 5.0 min/km is 90, 8.0 min/km is 50, 10.0 min/km is 35
        cardio_raw = 110.0 - (pace_min_per_km * 7.5)
        cardio_score = min(100.0, max(15.0, round(cardio_raw, 1)))
    else:
        cardio_score = 55.0

    # FLEXIBILITY & MOBILITY
    # Standard sit-and-reach: 25cm is neutral, 35cm is great
    flex_score = min(100.0, max(15.0, round(30.0 + (flex_cm * 2.0), 1)))
    mobility_score = min(100.0, max(15.0, round(flex_score * 0.9 + (squats > 15 and 10 or 0), 1)))

    # BALANCE: Single-leg stance (eyes open/closed)
    balance_score = min(100.0, max(15.0, round((balance_sec / 45.0) * 100.0, 1)))

    # AGILITY: T-Test or shuttle runs (lower time is better, e.g. 10-14 seconds)
    if agility_sec > 0:
        agility_score = min(100.0, max(20.0, round(120.0 - (agility_sec * 6.0), 1)))
    else:
        agility_score = 60.0

    # CONSISTENCY: Weekly training habit fidelity
    consistency_score = min(100.0, max(20.0, round((workouts_per_week / 4.0) * 85.0, 1)))

    scores = {
        "strength": strength_score,
        "endurance": endurance_score,
        "cardio": cardio_score,
        "mobility": mobility_score,
        "flexibility": flex_score,
        "balance": balance_score,
        "agility": agility_score,
        "consistency": consistency_score
    }

    explanation = (
        f"Assessment evaluated for {tier} tier. "
        f"Strength ({strength_score}/100) based on {pushups} push-ups and {squats} squats. "
        f"Endurance ({endurance_score}/100) based on {plank_sec}s plank and {situps} sit-ups. "
        f"Cardio ({cardio_score}/100) determined from {run_km}km run pace. "
        f"Mobility & Flexibility ({mobility_score}/100) calibrated from sit-and-reach test ({flex_cm}cm)."
    )

    return {
        "scores": scores,
        "tier": tier,
        "explanation": explanation
    }
