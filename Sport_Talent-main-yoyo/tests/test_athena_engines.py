"""
Unit tests for ATHENA Wellness Intelligence Engines.
Covers:
- Physical fitness engine scoring
- Nutrition natural language parser & calorie ranges
- Sleep & recovery explainable readiness score
- Safety guardrails & prohibited medical claim suppression
- What-If simulator non-deterministic ranges
"""
import pytest
from modules.wellness.fitness.service import calculate_assessment_scores
from modules.wellness.nutrition.service import parse_natural_meal_input, calculate_energy_expenditure
from modules.wellness.recovery.service import compute_readiness_score
from modules.wellness.simulator.service import run_what_if_simulation
from shared.security.guardrails import check_safety_guardrails, format_conservative_energy_range

def test_fitness_assessment_scoring():
    metrics = {
        "pushups": 30,
        "squats": 45,
        "plank_seconds": 120,
        "situps": 40,
        "run_distance_km": 3.0,
        "run_time_minutes": 15.0,
        "flexibility_sit_and_reach_cm": 28.0,
        "balance_single_leg_seconds": 35.0,
        "agility_t_test_seconds": 11.5,
        "workouts_per_week": 4
    }
    result = calculate_assessment_scores("INTERMEDIATE", metrics)
    scores = result["scores"]
    assert 10 <= scores["strength"] <= 100
    assert 10 <= scores["endurance"] <= 100
    assert 10 <= scores["cardio"] <= 100
    assert 10 <= scores["mobility"] <= 100
    assert "explanation" in result
    assert "INTERMEDIATE" in result["explanation"]

def test_nutrition_natural_meal_parser_indian_dishes():
    text = "2 roti + dal + sabzi + curd"
    parsed = parse_natural_meal_input(text)
    items = parsed["items"]
    totals = parsed["totals"]

    assert len(items) == 4
    assert totals["calories"] > 350
    assert totals["protein_g"] > 15
    assert parsed["is_estimated"] is True
    assert "estimation" in parsed["estimation_label"].lower()

def test_calorie_expenditure_conservative_range():
    res = calculate_energy_expenditure(
        age=28,
        weight_kg=75.0,
        height_cm=178.0,
        sex="MALE",
        activity_level="MODERATE",
        workout_mins_today=30
    )
    assert "conservative_daily_range" in res
    assert "–" in res["conservative_daily_range"]
    assert "kcal" in res["conservative_daily_range"]
    assert res["total_estimated_expenditure_kcal"] > 1800

def test_readiness_score_breakdown():
    # Scenario: Good sleep, moderate fatigue, low stress
    rec = compute_readiness_score(
        sleep_hours=7.8,
        sleep_quality=85.0,
        perceived_fatigue=3,
        training_load_yesterday=5,
        stress_level=3,
        consistency_score=85.0
    )
    assert rec["readiness_score"] >= 70
    assert len(rec["breakdown"]) == 6
    factors = [b["factor"] for b in rec["breakdown"]]
    assert "Base Score" in factors
    assert "Sleep Quality & Duration" in factors

def test_safety_guardrails_blocks_prohibited_claims():
    # Prohibited medical claim
    unsafe_data = {
        "summary": "Our analysis indicates you have PCOS and depression.",
        "reasoning_why": "Metabolic and mood markers matched.",
        "calories": 900
    }
    is_safe, flags, sanitized = check_safety_guardrails(unsafe_data)
    assert "MEDICAL_DIAGNOSIS_CLAIM_SUPPRESSED" in flags
    assert "EXTREME_CALORIC_RESTRICTION_BLOCKED" in flags
    assert "pcos" not in sanitized["summary"].lower() or "clinical" in sanitized["reasoning_why"].lower()

def test_what_if_simulator_returns_bounds_and_confidence():
    sim = run_what_if_simulation("increase_frequency")
    assert "projected_range" in sim
    assert "confidence" in sim
    assert "assumptions" in sim
    assert len(sim["assumptions"]) > 0
    assert "trade_offs" in sim
