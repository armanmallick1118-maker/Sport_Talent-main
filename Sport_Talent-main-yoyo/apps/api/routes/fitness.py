"""
Fitness Engine Endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from shared.database.session import get_db
from shared.database.models import FitnessAssessment, WorkoutSession
from shared.auth.security import get_current_user_payload
from modules.wellness.fitness.service import calculate_assessment_scores
from modules.wellness.twin.service import create_or_update_twin_version
import json

router = APIRouter(prefix="/fitness", tags=["Fitness"])

class AssessmentSubmission(BaseModel):
    tier: str = "INTERMEDIATE"
    pushups: Optional[int] = 0
    squats: Optional[int] = 0
    plank_seconds: Optional[int] = 0
    situps: Optional[int] = 0
    run_distance_km: Optional[float] = 0.0
    run_time_minutes: Optional[float] = 0.0
    flexibility_sit_and_reach_cm: Optional[float] = 0.0
    balance_single_leg_seconds: Optional[float] = 0.0
    agility_t_test_seconds: Optional[float] = 0.0

class WorkoutLogRequest(BaseModel):
    title: str
    workout_type: str = "STRENGTH"
    duration_minutes: int = 30
    perceived_exertion_rpe: int = 6
    estimated_calories_burned: float = 180.0
    notes: Optional[str] = ""

@router.post("/assess")
def submit_fitness_assessment(
    data: AssessmentSubmission,
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = payload["user_id"]
    metrics_dict = data.dict()
    result = calculate_assessment_scores(data.tier, metrics_dict)

    assessment = FitnessAssessment(
        user_id=user_id,
        tier=data.tier,
        pushups=data.pushups,
        squats=data.squats,
        plank_seconds=data.plank_seconds,
        situps=data.situps,
        run_distance_km=data.run_distance_km,
        run_time_minutes=data.run_time_minutes,
        flexibility_sit_and_reach_cm=data.flexibility_sit_and_reach_cm,
        balance_single_leg_seconds=data.balance_single_leg_seconds,
        agility_t_test_seconds=data.agility_t_test_seconds,
        category_scores_json=json.dumps(result["scores"]),
        explanation_text=result["explanation"]
    )
    db.add(assessment)
    db.commit()

    # Automatically generate an updated Twin Version!
    twin = create_or_update_twin_version(db, user_id, "ASSESSMENT_UPDATE")

    return {
        "status": "success",
        "scores": result["scores"],
        "explanation": result["explanation"],
        "twin_version_updated": f"Twin v{twin.version}"
    }

@router.get("/assess/latest")
def get_latest_assessment(payload: Dict[str, Any] = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    assessment = db.query(FitnessAssessment).filter(FitnessAssessment.user_id == user_id).order_by(FitnessAssessment.created_at.desc()).first()
    if not assessment:
        # Default mock baseline assessment for clean display
        return {
            "tier": "INTERMEDIATE",
            "scores": {"strength": 68, "endurance": 72, "cardio": 65, "mobility": 60, "flexibility": 55, "balance": 64, "agility": 62, "consistency": 75},
            "explanation": "Baseline assessment: Intermediate level profile established."
        }
    return {
        "tier": assessment.tier,
        "pushups": assessment.pushups,
        "squats": assessment.squats,
        "plank_seconds": assessment.plank_seconds,
        "scores": json.loads(assessment.category_scores_json or "{}"),
        "explanation": assessment.explanation_text
    }

@router.post("/workouts")
def log_workout(
    data: WorkoutLogRequest,
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = payload["user_id"]
    session = WorkoutSession(
        user_id=user_id,
        title=data.title,
        workout_type=data.workout_type,
        duration_minutes=data.duration_minutes,
        perceived_exertion_rpe=data.perceived_exertion_rpe,
        estimated_calories_burned=data.estimated_calories_burned,
        notes=data.notes
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"status": "success", "workout_id": session.id, "message": "Workout logged successfully"}

@router.get("/workouts")
def list_workouts(payload: Dict[str, Any] = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    sessions = db.query(WorkoutSession).filter(WorkoutSession.user_id == user_id).order_by(WorkoutSession.created_at.desc()).limit(20).all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "workout_type": s.workout_type,
            "duration_minutes": s.duration_minutes,
            "rpe": s.perceived_exertion_rpe,
            "calories": s.estimated_calories_burned,
            "created_at": s.created_at.strftime("%b %d, %H:%M")
        }
        for s in sessions
    ]
