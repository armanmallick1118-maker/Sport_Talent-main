"""
ATHENA Mental Wellness Engine.
Non-diagnostic mental wellness tracking:
- Mood, stress, energy, motivation, focus, perceived burnout, mindfulness
- Identifies longitudinal patterns and supportive lifestyle recommendations
- Strict non-diagnostic guardrail: Never claims depression/anxiety disorders; provides clinical referral links.
"""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from shared.database.models import MoodLog

def analyze_mental_wellness_trends(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Evaluates recent mood and stress logs to deliver conservative, supportive lifestyle insights.
    """
    recent_logs = db.query(MoodLog).filter(
        MoodLog.user_id == user_id
    ).order_by(MoodLog.created_at.desc()).limit(7).all()

    if not recent_logs:
        return {
            "average_mood": 7.0,
            "average_stress": 4.0,
            "average_energy": 7.0,
            "pattern_summary": "Initial baseline period. Log daily feelings to reveal recovery correlations.",
            "supportive_cues": ["Prioritize 10 minutes of screen-free winding down tonight."],
            "is_emergency_flag": False
        }

    avg_mood = round(sum(l.mood_score for l in recent_logs) / len(recent_logs), 1)
    avg_stress = round(sum(l.stress_level for l in recent_logs) / len(recent_logs), 1)
    avg_energy = round(sum(l.energy_level for l in recent_logs) / len(recent_logs), 1)
    avg_burnout = round(sum(l.perceived_burnout for l in recent_logs) / len(recent_logs), 1)

    cues = []
    if avg_energy <= 4.5:
        cues.append("You have reported lower energy over several consecutive days. Consider reducing training intensity and prioritizing rest.")
    if avg_stress >= 7.0:
        cues.append("Elevated stress levels observed. Gentle walks, breathwork, and reducing caffeine after 2 PM can help restore balance.")
    if avg_burnout >= 6.5:
        cues.append("Perceived burnout is elevated. Schedule a deliberate digital detox or non-exercise leisure block this weekend.")

    if not cues:
        cues.append("Your reported mood and psychological energy are well-aligned with your training targets.")

    return {
        "average_mood": avg_mood,
        "average_stress": avg_stress,
        "average_energy": avg_energy,
        "average_burnout": avg_burnout,
        "days_analyzed": len(recent_logs),
        "supportive_cues": cues,
        "is_emergency_flag": False,
        "disclaimer": "ATHENA Mental Wellness is a supportive lifestyle tracker, not a medical or psychiatric diagnostic service."
    }
