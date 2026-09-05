"""
ATHENA Sleep & Recovery Engine.
Features:
- Explainable Readiness Score (0 - 100) with explicit breakdown factors:
  (Sleep, Recovery, Training Load, Stress, Consistency)
- Recovery state classification (Optimal, Good, Moderate, Needs Rest)
- Training intensity adaptation guidance for AI Coach
"""
from typing import Dict, Any

def compute_readiness_score(
    sleep_hours: float,
    sleep_quality: float,        # 0 - 100
    perceived_fatigue: int,      # 1 - 10 (higher is more fatigued)
    training_load_yesterday: int,# 1 - 10 (higher is harder)
    stress_level: int,           # 1 - 10 (higher is more stressed)
    consistency_score: float     # 0 - 100
) -> Dict[str, Any]:
    """
    Computes explainable readiness score:
    Base: 50
    Sleep factor: up to +20 or -15
    Recovery baseline: up to +18
    Training load adjustment: -2 to -12
    Stress penalty: 0 to -8
    Consistency bonus: up to +15
    """
    base_score = 50.0

    # 1. Sleep Contribution (target: 7.0 - 8.5 hours)
    if sleep_hours >= 7.5:
        sleep_delta = 18.0 + (min(sleep_quality, 100.0) / 100.0) * 4.0
    elif sleep_hours >= 6.5:
        sleep_delta = 12.0
    elif sleep_hours >= 5.5:
        sleep_delta = 0.0
    else:
        sleep_delta = -14.0
    sleep_delta = round(sleep_delta, 1)

    # 2. Recovery / Perceived Fatigue Contribution
    # Low fatigue (1-3) gives positive; high fatigue (7-10) penalizes
    if perceived_fatigue <= 3:
        recovery_delta = 15.0
    elif perceived_fatigue <= 5:
        recovery_delta = 8.0
    elif perceived_fatigue <= 7:
        recovery_delta = 0.0
    else:
        recovery_delta = -12.0

    # 3. Training Load Yesterday Penalty
    if training_load_yesterday >= 8:
        load_delta = -9.0
    elif training_load_yesterday >= 6:
        load_delta = -6.0
    elif training_load_yesterday >= 4:
        load_delta = -3.0
    else:
        load_delta = 0.0

    # 4. Stress Impact
    if stress_level >= 8:
        stress_delta = -8.0
    elif stress_level >= 5:
        stress_delta = -4.0
    else:
        stress_delta = 0.0

    # 5. Consistency Bonus
    consistency_delta = round((min(100.0, max(0.0, consistency_score)) / 100.0) * 14.0, 1)

    total = base_score + sleep_delta + recovery_delta + load_delta + stress_delta + consistency_delta
    readiness_score = int(min(99, max(15, round(total))))

    if readiness_score >= 82:
        state = "OPTIMAL"
        recommended_intensity = "HIGH"
        coach_cue = "Physiological recovery is primed. Ideal day for progressive overload or intense intervals."
    elif readiness_score >= 70:
        state = "GOOD"
        recommended_intensity = "MODERATE"
        coach_cue = "Recovery is solid. Proceed with planned standard session with focused warm-up."
    elif readiness_score >= 50:
        state = "MODERATE"
        recommended_intensity = "MODERATE_LOW"
        coach_cue = "Subtle fatigue detected. Keep working sets controlled and prioritize movement quality."
    else:
        state = "NEEDS_REST"
        recommended_intensity = "ACTIVE_RECOVERY"
        coach_cue = "Elevated systemic fatigue. Prioritize light mobility, hydration, and an early sleep window."

    breakdown = [
        {"factor": "Base Score", "delta": 50, "sign": "+", "detail": "Neutral physiological baseline"},
        {"factor": "Sleep Quality & Duration", "delta": sleep_delta, "sign": "+" if sleep_delta >= 0 else "", "detail": f"{sleep_hours} hrs logged"},
        {"factor": "Perceived Freshness", "delta": recovery_delta, "sign": "+" if recovery_delta >= 0 else "", "detail": f"Fatigue rating {perceived_fatigue}/10"},
        {"factor": "Prior Training Load", "delta": load_delta, "sign": "" if load_delta <= 0 else "+", "detail": f"Yesterday effort {training_load_yesterday}/10"},
        {"factor": "Systemic Stress", "delta": stress_delta, "sign": "" if stress_delta <= 0 else "+", "detail": f"Stress level {stress_level}/10"},
        {"factor": "Training Consistency", "delta": consistency_delta, "sign": "+", "detail": f"{consistency_score}% weekly habit adherence"}
    ]

    return {
        "readiness_score": readiness_score,
        "state": state,
        "recommended_intensity": recommended_intensity,
        "coach_cue": coach_cue,
        "breakdown": breakdown
    }
