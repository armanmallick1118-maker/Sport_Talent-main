"""
ATHENA Personal Digital Fitness Twin Engine.
Features:
- Continuously evolving user fitness state across:
  PHYSICAL, RECOVERY, NUTRITION, MENTAL WELLNESS, PERFORMANCE, GOALS
- Versioned snapshots: Twin v1, Twin v2, Twin v3...
- Historical immutability (updates state rather than overwriting history)
- Longitudinal Delta Query Engine:
  Answers: "How has this person changed over the last 30/90/180 days?"
"""
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from shared.database.models import (
    User, Profile, DigitalTwinVersion, FitnessAssessment,
    WorkoutSession, NutritionLog, SleepLog, RecoveryLog, MoodLog, Goal
)

def create_or_update_twin_version(db: Session, user_id: int, trigger_event: str = "ASSESSMENT") -> DigitalTwinVersion:
    """
    Generates a new immutable version of the user's Digital Fitness Twin.
    Aggregates physical, recovery, nutrition, mental, performance, and goal states.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    profile = user.profile
    latest_assessment = db.query(FitnessAssessment).filter(FitnessAssessment.user_id == user_id).order_by(FitnessAssessment.created_at.desc()).first()
    latest_sleep = db.query(SleepLog).filter(SleepLog.user_id == user_id).order_by(SleepLog.created_at.desc()).first()
    latest_recovery = db.query(RecoveryLog).filter(RecoveryLog.user_id == user_id).order_by(RecoveryLog.created_at.desc()).first()
    latest_mood = db.query(MoodLog).filter(MoodLog.user_id == user_id).order_by(MoodLog.created_at.desc()).first()
    latest_goal = db.query(Goal).filter(Goal.user_id == user_id, Goal.status == "ACTIVE").order_by(Goal.created_at.desc()).first()

    # Determine next version number
    prev_twin = db.query(DigitalTwinVersion).filter(DigitalTwinVersion.user_id == user_id).order_by(DigitalTwinVersion.version.desc()).first()
    new_version_num = (prev_twin.version + 1) if prev_twin else 1

    # Physical Dimension
    if latest_assessment and latest_assessment.category_scores_json:
        try:
            cat_scores = json.loads(latest_assessment.category_scores_json)
        except Exception:
            cat_scores = {}
    else:
        cat_scores = {
            "strength": 58.0,
            "endurance": 62.0,
            "cardio": 64.0,
            "mobility": 55.0,
            "flexibility": 52.0,
            "balance": 60.0,
            "agility": 58.0,
            "consistency": 70.0
        }

    strength = float(cat_scores.get("strength", 55.0))
    endurance = float(cat_scores.get("endurance", 55.0))
    cardio = float(cat_scores.get("cardio", 55.0))
    mobility = float(cat_scores.get("mobility", 55.0))
    flexibility = float(cat_scores.get("flexibility", 50.0))
    balance = float(cat_scores.get("balance", 55.0))
    agility = float(cat_scores.get("agility", 55.0))
    consistency = float(cat_scores.get("consistency", 65.0))

    physical_summary = {
        "strength_level": strength,
        "endurance_level": endurance,
        "cardiovascular_fitness": cardio,
        "mobility_score": mobility,
        "flexibility_score": flexibility,
        "balance_score": balance,
        "agility_score": agility,
        "activity_level": profile.activity_level if profile else "MODERATE",
        "training_frequency_target": profile.training_frequency_per_week if profile else 3
    }

    recovery_summary = {
        "readiness_score": latest_recovery.readiness_score if latest_recovery else 74,
        "sleep_hours": latest_sleep.duration_hours if latest_sleep else 7.5,
        "sleep_quality": latest_sleep.quality_score if latest_sleep else 75.0,
        "perceived_fatigue": latest_recovery.perceived_fatigue if latest_recovery else 4,
        "recovery_status": "Solid"
    }

    nutrition_summary = {
        "dietary_preference": profile.dietary_preference if profile else "INDIAN_STANDARD",
        "hydration_target_ml": 2500,
        "macro_distribution": {"protein_pct": 25, "carbs_pct": 50, "fat_pct": 25}
    }

    mental_summary = {
        "mood_score": latest_mood.mood_score if latest_mood else 7,
        "stress_level": latest_mood.stress_level if latest_mood else 4,
        "energy_level": latest_mood.energy_level if latest_mood else 7,
        "motivation_level": latest_mood.motivation_level if latest_mood else 8,
        "focus_level": latest_mood.focus_level if latest_mood else 7
    }

    performance_summary = {
        "pushups_baseline": latest_assessment.pushups if latest_assessment else 22,
        "squats_baseline": latest_assessment.squats if latest_assessment else 35,
        "plank_baseline_sec": latest_assessment.plank_seconds if latest_assessment else 75,
        "consistency_rate": consistency
    }

    goals_summary = {
        "active_goal": latest_goal.title if latest_goal else "Increase Weekly Mobility & Core Strength",
        "target_metric": latest_goal.target_metric if latest_goal else 100.0,
        "current_metric": latest_goal.current_metric if latest_goal else 65.0,
        "timeline_weeks": latest_goal.timeline_weeks if latest_goal else 8
    }

    # Calculate delta if previous twin exists
    delta_summary = {}
    if prev_twin:
        delta_summary = {
            "strength_delta": round(strength - prev_twin.score_strength, 1),
            "endurance_delta": round(endurance - prev_twin.score_endurance, 1),
            "cardio_delta": round(cardio - prev_twin.score_cardio, 1),
            "mobility_delta": round(mobility - prev_twin.score_mobility, 1),
            "consistency_delta": round(consistency - prev_twin.score_consistency, 1),
            "days_since_prev_version": (datetime.utcnow() - prev_twin.created_at).days
        }

    twin = DigitalTwinVersion(
        user_id=user_id,
        version=new_version_num,
        created_at=datetime.utcnow(),
        score_strength=strength,
        score_endurance=endurance,
        score_cardio=cardio,
        score_mobility=mobility,
        score_flexibility=flexibility,
        score_balance=balance,
        score_agility=agility,
        score_consistency=consistency,
        physical_summary_json=json.dumps(physical_summary),
        recovery_summary_json=json.dumps(recovery_summary),
        nutrition_summary_json=json.dumps(nutrition_summary),
        mental_summary_json=json.dumps(mental_summary),
        performance_summary_json=json.dumps(performance_summary),
        goals_summary_json=json.dumps(goals_summary),
        delta_summary_json=json.dumps(delta_summary)
    )
    db.add(twin)
    db.commit()
    db.refresh(twin)
    return twin


def compare_twin_longitudinal_change(db: Session, user_id: int, days_window: int = 30) -> Dict[str, Any]:
    """
    Answers: 'How has this person changed over the last 30/90/180 days?'
    Compares the latest twin snapshot with the twin snapshot closest to N days ago.
    """
    current_twin = db.query(DigitalTwinVersion).filter(
        DigitalTwinVersion.user_id == user_id
    ).order_by(DigitalTwinVersion.version.desc()).first()

    if not current_twin:
        return {"error": "No twin profile recorded yet."}

    cutoff_date = datetime.utcnow() - timedelta(days=days_window)
    past_twin = db.query(DigitalTwinVersion).filter(
        DigitalTwinVersion.user_id == user_id,
        DigitalTwinVersion.created_at <= cutoff_date
    ).order_by(DigitalTwinVersion.created_at.desc()).first()

    # Fallback to the earliest twin if not enough time elapsed
    if not past_twin:
        past_twin = db.query(DigitalTwinVersion).filter(
            DigitalTwinVersion.user_id == user_id
        ).order_by(DigitalTwinVersion.version.asc()).first()

    days_elapsed = (current_twin.created_at - past_twin.created_at).days if past_twin else 0

    return {
        "window_requested_days": days_window,
        "actual_days_elapsed": days_elapsed,
        "current_version": f"Twin v{current_twin.version}",
        "baseline_version": f"Twin v{past_twin.version}" if past_twin else "None",
        "changes": {
            "strength": {
                "current": current_twin.score_strength,
                "baseline": past_twin.score_strength if past_twin else current_twin.score_strength,
                "delta": round(current_twin.score_strength - (past_twin.score_strength if past_twin else current_twin.score_strength), 1)
            },
            "endurance": {
                "current": current_twin.score_endurance,
                "baseline": past_twin.score_endurance if past_twin else current_twin.score_endurance,
                "delta": round(current_twin.score_endurance - (past_twin.score_endurance if past_twin else current_twin.score_endurance), 1)
            },
            "cardio": {
                "current": current_twin.score_cardio,
                "baseline": past_twin.score_cardio if past_twin else current_twin.score_cardio,
                "delta": round(current_twin.score_cardio - (past_twin.score_cardio if past_twin else current_twin.score_cardio), 1)
            },
            "mobility": {
                "current": current_twin.score_mobility,
                "baseline": past_twin.score_mobility if past_twin else current_twin.score_mobility,
                "delta": round(current_twin.score_mobility - (past_twin.score_mobility if past_twin else current_twin.score_mobility), 1)
            },
            "consistency": {
                "current": current_twin.score_consistency,
                "baseline": past_twin.score_consistency if past_twin else current_twin.score_consistency,
                "delta": round(current_twin.score_consistency - (past_twin.score_consistency if past_twin else current_twin.score_consistency), 1)
            }
        },
        "synthesis": (
            f"Over the last {days_elapsed if days_elapsed > 0 else 'recent period'} days (v{past_twin.version if past_twin else 1} to v{current_twin.version}), "
            f"training consistency moved by {round(current_twin.score_consistency - (past_twin.score_consistency if past_twin else current_twin.score_consistency), 1)} points. "
            "Mobility and cardiovascular adaptations reflect regular training stimuli."
        )
    }
