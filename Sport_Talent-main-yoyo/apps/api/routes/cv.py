"""
Computer Vision Exercise Analysis Endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from shared.database.session import get_db
from shared.database.models import CVAnalysis
from shared.auth.security import get_current_user_payload
from modules.wellness.cv.service import evaluate_squat_geometry, analyze_exercise_session
import json

router = APIRouter(prefix="/cv", tags=["Computer Vision"])

class Point(BaseModel):
    x: float
    y: float

class GeometryEvaluationRequest(BaseModel):
    exercise: str = "squat"
    hip: Point
    knee: Point
    ankle: Point
    shoulder: Point

class SessionLogRequest(BaseModel):
    exercise_type: str = "squat"
    reps_completed: int = 12
    rep_consistency_percentage: float = 85.0
    depth_score: str = "Good"
    knee_tracking_score: str = "Centered"
    torso_stability_score: str = "Controlled"
    feedback: List[str] = ["Good tempo", "Full depth maintained"]

@router.post("/evaluate")
def evaluate_frame_geometry(data: GeometryEvaluationRequest):
    return evaluate_squat_geometry(
        hip={"x": data.hip.x, "y": data.hip.y},
        knee={"x": data.knee.x, "y": data.knee.y},
        ankle={"x": data.ankle.x, "y": data.ankle.y},
        shoulder={"x": data.shoulder.x, "y": data.shoulder.y}
    )

@router.post("/log")
def log_cv_session(
    data: SessionLogRequest,
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = payload["user_id"]
    analysis = CVAnalysis(
        user_id=user_id,
        exercise_type=data.exercise_type,
        reps_completed=data.reps_completed,
        rep_consistency_percentage=data.rep_consistency_percentage,
        depth_score=data.depth_score,
        knee_tracking_score=data.knee_tracking_score,
        torso_stability_score=data.torso_stability_score,
        technique_feedback_json=json.dumps(data.feedback)
    )
    db.add(analysis)
    db.commit()
    return {"status": "success", "id": analysis.id}
