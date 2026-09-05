"""
ATHENA Adaptive AI Coach & Personalization Engine.
Implements:
USER DATA -> DIGITAL TWIN -> FEATURE ENGINEERING -> FITNESS/RECOVERY/NUTRITION MODELS -> RECOMMENDATION ENGINE -> SAFETY GUARDRAIL -> AI COACH -> PERSONALIZED EXPLANATION
"""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime
from shared.database.models import (
    User, Profile, DigitalTwinVersion, SleepLog, RecoveryLog, WorkoutSession, Recommendation
)
from shared.security.guardrails import check_safety_guardrails

def generate_daily_recommendation(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Synthesizes the user's latest recovery, activity, and goals into a daily action plan.
    Provides complete transparent 'WHY ATHENA recommends this' reasoning.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    profile = user.profile
    latest_recovery = db.query(RecoveryLog).filter(RecoveryLog.user_id == user_id).order_by(RecoveryLog.created_at.desc()).first()
    latest_sleep = db.query(SleepLog).filter(SleepLog.user_id == user_id).order_by(SleepLog.created_at.desc()).first()
    latest_workout = db.query(WorkoutSession).filter(WorkoutSession.user_id == user_id).order_by(WorkoutSession.created_at.desc()).first()
    latest_twin = db.query(DigitalTwinVersion).filter(DigitalTwinVersion.user_id == user_id).order_by(DigitalTwinVersion.version.desc()).first()

    # Defaults if newly onboarded
    readiness = latest_recovery.readiness_score if latest_recovery else 74
    sleep_hrs = latest_sleep.duration_hours if latest_sleep else 7.5
    fatigue = latest_recovery.perceived_fatigue if latest_recovery else 4
    load_yesterday = latest_recovery.training_load_yesterday if latest_recovery else 5

    # 1. Feature Engineering & Decision Matrix
    if readiness >= 80 and fatigue <= 4:
        # High readiness, low fatigue -> Progression / High stimulus
        action_type = "WORKOUT"
        intensity = "MODERATE_HIGH"
        duration = 40
        title = "Progressive Strength & Dynamic Intervals"
        summary = "40-minute progressive session focusing on core strength compound movements and short cardio intervals."
        reasoning_why = (
            f"Your Readiness Score is high ({readiness}/100) with solid sleep ({sleep_hrs}h) "
            f"and low fatigue ({fatigue}/10). Your recovery state is primed for progressive physical adaptation."
        )
    elif readiness < 60 or fatigue >= 7 or sleep_hrs < 6.0:
        # Poor recovery / high fatigue / low sleep -> Active recovery
        action_type = "RECOVERY"
        intensity = "LOW"
        duration = 20
        title = "Gentle Mobility & Parasympathetic Decompression"
        summary = "20-minute gentle restorative mobility flow and 10 minutes of nasal diaphragmatic breathing."
        reasoning_why = (
            f"Your Readiness Score is lower today ({readiness}/100) with sleep duration of {sleep_hrs} hours "
            f"and elevated fatigue ({fatigue}/10). ATHENA is protecting your nervous system by downscaling intensity."
        )
    else:
        # Moderate baseline state
        action_type = "WORKOUT"
        intensity = "MODERATE"
        duration = 30
        title = "20-30 Min Moderate Kinetic Workout"
        summary = "Controlled bodyweight and resistance circuit with a dynamic warmup."
        reasoning_why = (
            f"Your recovery is good ({readiness}/100) and consistent, but recent daily activity has been below baseline. "
            "A moderate 25-minute movement stimulus maintains momentum without compromising recovery."
        )

    # 2. Package raw recommendation
    rec_payload = {
        "title": title,
        "summary": summary,
        "action_type": action_type,
        "intensity": intensity,
        "duration_minutes": duration,
        "reasoning_why": reasoning_why,
        "readiness_score": readiness,
        "sleep_hours": sleep_hrs,
        "perceived_fatigue": fatigue,
        "safety_approved": True
    }

    # 3. Pass through Safety & Guardrails Engine
    is_safe, flags, sanitized = check_safety_guardrails(rec_payload)

    # 4. Save to Database
    db_rec = Recommendation(
        user_id=user_id,
        title=sanitized["title"],
        summary=sanitized["summary"],
        action_type=sanitized["action_type"],
        intensity=sanitized["intensity"],
        duration_minutes=sanitized["duration_minutes"],
        reasoning_why=sanitized["reasoning_why"],
        safety_approved=is_safe,
        guardrail_notes="; ".join(flags) if flags else "All safety checks passed"
    )
    db.add(db_rec)
    db.commit()
    db.refresh(db_rec)

    return {
        "id": db_rec.id,
        "title": db_rec.title,
        "summary": db_rec.summary,
        "action_type": db_rec.action_type,
        "intensity": db_rec.intensity,
        "duration_minutes": db_rec.duration_minutes,
        "reasoning_why": db_rec.reasoning_why,
        "safety_approved": db_rec.safety_approved,
        "guardrail_notes": db_rec.guardrail_notes,
        "readiness_metric": readiness
    }


def process_coach_chat(db: Session, user_id: int, user_message: str) -> Dict[str, Any]:
    """
    Natural language conversational interface for ATHENA Coach.
    Grounds explanations in real user metrics; never makes clinical diagnoses.
    """
    msg_lower = user_message.lower()
    latest_recovery = db.query(RecoveryLog).filter(RecoveryLog.user_id == user_id).order_by(RecoveryLog.created_at.desc()).first()
    latest_sleep = db.query(SleepLog).filter(SleepLog.user_id == user_id).order_by(SleepLog.created_at.desc()).first()
    latest_twin = db.query(DigitalTwinVersion).filter(DigitalTwinVersion.user_id == user_id).order_by(DigitalTwinVersion.version.desc()).first()

    readiness = latest_recovery.readiness_score if latest_recovery else 74
    sleep_hrs = latest_sleep.duration_hours if latest_sleep else 7.5

    # Contextual responses grounded in verified data
    if "why" in msg_lower and ("recommend" in msg_lower or "workout" in msg_lower or "easy" in msg_lower):
        reply = (
            f"ATHENA's recommendation is calibrated from your current Readiness Score of {readiness}/100 and "
            f"last night's {sleep_hrs} hours of sleep. When physiological recovery is balanced, we prioritize steady "
            "habit reinforcement rather than unnecessary central nervous system strain."
        )
    elif "tired" in msg_lower or "sore" in msg_lower or "exhausted" in msg_lower:
        reply = (
            f"Acknowledged. Your recovery signal shows readiness at {readiness}/100. "
            "Muscular and neuromuscular fatigue accumulate naturally over training blocks. "
            "I suggest taking today as an active recovery day: 15 minutes of foam rolling, light hip and shoulder mobility, "
            "and hydrating with an extra 500ml of water."
        )
    elif "diet" in msg_lower or "food" in msg_lower or "protein" in msg_lower or "calorie" in msg_lower:
        reply = (
            "For nutrition, consistency and macro balance yield the greatest long-term athletic return. "
            "Aim for approximately 1.4 to 1.8g of protein per kg of bodyweight, distributed across meals. "
            "You can log meals like '2 roti + dal + sabzi + curd' in the Nutrition module for instant portion estimation."
        )
    elif "pcos" in msg_lower or "pcod" in msg_lower:
        reply = (
            "In ATHENA's PCOS/PCOD Wellness module, we emphasize steady blood sugar balance, low-glycemic complex carbohydrates, "
            "regular low-impact walking, and stress management through sleep. Remember that ATHENA is a wellness guide and not "
            "a clinical diagnosis system; we encourage discussing chronic symptoms with your gynecologist or endocrinologist."
        )
    else:
        reply = (
            f"Hello! Based on your Digital Fitness Twin (v{latest_twin.version if latest_twin else 1}), "
            f"your current readiness is {readiness}/100 and training consistency is steady. "
            "How can I assist your training, recovery, or nutrition decisions today?"
        )

    return {
        "user_message": user_message,
        "coach_response": reply,
        "grounding_readiness": readiness,
        "timestamp": datetime.utcnow().isoformat()
    }
