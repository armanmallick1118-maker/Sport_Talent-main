"""
Specialized Wellness Modules & Longitudinal Analytics Endpoints.
Covers:
- Mental Wellness
- Women's Wellness & PCOS/PCOD Support
- ATHENA AGE+
- Sedentary Activity Intelligence
- Healthy Competition
- Personal Wellness Knowledge Graph
- Longitudinal Progress
- Goals
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from shared.database.session import get_db
from shared.database.models import User, Goal, MoodLog, WomensWellnessLog, PCOSWellnessLog, AgePlusProfile
from shared.auth.security import get_current_user_payload
from modules.wellness.mental.service import analyze_mental_wellness_trends
from modules.wellness.womens.service import get_cycle_guidance
from modules.wellness.pcos.service import analyze_pcos_support_patterns
from modules.wellness.age_plus.service import get_age_plus_dashboard
from modules.wellness.sedentary.service import check_inactivity_status, get_community_challenges
from modules.wellness.knowledge_graph.service import build_user_wellness_knowledge_graph
from modules.wellness.progress.service import compute_longitudinal_progress
from modules.wellness.goals.service import create_adaptive_goal
import json

router = APIRouter(prefix="/wellness", tags=["Wellness Modules"])

class MoodLogRequest(BaseModel):
    mood_score: int = 7
    stress_level: int = 4
    energy_level: int = 7
    motivation_level: int = 7
    focus_level: int = 7
    perceived_burnout: int = 3
    notes: Optional[str] = ""

class GoalCreateRequest(BaseModel):
    title: str
    category: str = "FITNESS"
    target_metric: float
    current_metric: float
    unit: str
    timeline_weeks: int = 8

class CaregiverConsentRequest(BaseModel):
    consented: bool
    caregiver_email: Optional[str] = None

# 1. MENTAL WELLNESS
@router.get("/mental")
def get_mental_trends(payload: Dict[str, Any] = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    return analyze_mental_wellness_trends(db, user_id)

@router.post("/mental/log")
def log_mood(data: MoodLogRequest, payload: Dict[str, Any] = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    log = MoodLog(
        user_id=user_id,
        mood_score=data.mood_score,
        stress_level=data.stress_level,
        energy_level=data.energy_level,
        motivation_level=data.motivation_level,
        focus_level=data.focus_level,
        perceived_burnout=data.perceived_burnout,
        notes=data.notes
    )
    db.add(log)
    db.commit()
    return {"status": "success", "message": "Mood & energy logged successfully"}

# 2. WOMEN'S WELLNESS
@router.get("/womens")
def get_womens_wellness(
    cycle_day: int = Query(14, ge=1, le=45),
    is_irregular: bool = Query(False),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    return get_cycle_guidance(cycle_day=cycle_day, is_irregular=is_irregular)

# 3. PCOS/PCOD SUPPORT
@router.get("/pcos")
def get_pcos_support(
    cycle_regularity: str = Query("VARIABLE"),
    activity_minutes: int = Query(35),
    stress_level: int = Query(4),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    return analyze_pcos_support_patterns(
        cycle_regularity=cycle_regularity,
        symptoms=["Mild bloating", "Fluctuating afternoon energy"],
        activity_minutes_avg=activity_minutes,
        stress_level=stress_level,
        sleep_quality="GOOD"
    )

# 4. AGE+ OLDER ADULT MODULE
@router.get("/age-plus")
def get_age_plus(
    mobility_tier: str = Query("CHAIR_ASSISTED"),
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = payload["user_id"]
    profile = db.query(AgePlusProfile).filter(AgePlusProfile.user_id == user_id).first()
    consented = profile.caregiver_mode_consented if profile else False
    return get_age_plus_dashboard(mobility_tier=mobility_tier, caregiver_consented=consented)

@router.post("/age-plus/caregiver-consent")
def set_caregiver_consent(
    data: CaregiverConsentRequest,
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = payload["user_id"]
    profile = db.query(AgePlusProfile).filter(AgePlusProfile.user_id == user_id).first()
    if not profile:
        profile = AgePlusProfile(
            user_id=user_id,
            caregiver_mode_consented=data.consented,
            caregiver_email=data.caregiver_email
        )
        db.add(profile)
    else:
        profile.caregiver_mode_consented = data.consented
        profile.caregiver_email = data.caregiver_email
    db.commit()
    return {"status": "success", "consented": data.consented}

# 5. SEDENTARY INTELLIGENCE
@router.get("/sedentary")
def check_sedentary(minutes: int = Query(120, ge=0)):
    return check_inactivity_status(minutes)

# 6. HEALTHY COMPETITION
@router.get("/challenges")
def list_challenges():
    return get_community_challenges()

# 7. WELLNESS KNOWLEDGE GRAPH
@router.get("/knowledge-graph")
def get_knowledge_graph(payload: Dict[str, Any] = Depends(get_current_user_payload)):
    user_id = payload["user_id"]
    return build_user_wellness_knowledge_graph(user_id)

# 8. PROGRESS & LONGITUDINAL ANALYTICS
@router.get("/progress")
def get_progress(
    period: str = Query("30_DAYS"),
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = payload["user_id"]
    return compute_longitudinal_progress(db, user_id, period=period)

# 9. GOALS
@router.get("/goals")
def list_goals(payload: Dict[str, Any] = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    goals = db.query(Goal).filter(Goal.user_id == user_id).order_by(Goal.created_at.desc()).all()
    if not goals:
        # Create a default goal for display
        default_goal = create_adaptive_goal(
            db, user_id,
            title="Improve 5km Run Time & Core Endurance",
            category="ENDURANCE",
            target_metric=24.0,
            current_metric=29.5,
            unit="minutes",
            timeline_weeks=8
        )
        goals = [default_goal]

    return [
        {
            "id": g.id,
            "title": g.title,
            "category": g.category,
            "target_metric": g.target_metric,
            "current_metric": g.current_metric,
            "baseline_metric": g.baseline_metric,
            "unit": g.unit,
            "timeline_weeks": g.timeline_weeks,
            "status": g.status,
            "milestones": json.loads(g.milestones_json or "[]"),
            "weekly_actions": json.loads(g.weekly_actions_json or "[]")
        }
        for g in goals
    ]

@router.post("/goals")
def create_goal(data: GoalCreateRequest, payload: Dict[str, Any] = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    goal = create_adaptive_goal(
        db, user_id,
        title=data.title,
        category=data.category,
        target_metric=data.target_metric,
        current_metric=data.current_metric,
        unit=data.unit,
        timeline_weeks=data.timeline_weeks
    )
    return {"status": "success", "goal_id": goal.id}
