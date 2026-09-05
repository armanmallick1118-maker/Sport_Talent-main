"""
Digital Fitness Twin Endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from shared.database.session import get_db
from shared.database.models import DigitalTwinVersion
from shared.auth.security import get_current_user_payload
from modules.wellness.twin.service import create_or_update_twin_version, compare_twin_longitudinal_change
import json

router = APIRouter(prefix="/twin", tags=["Digital Twin"])

@router.get("")
def get_latest_twin(payload: Dict[str, Any] = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    twin = db.query(DigitalTwinVersion).filter(DigitalTwinVersion.user_id == user_id).order_by(DigitalTwinVersion.version.desc()).first()
    if not twin:
        # Generate initial version if none exists
        twin = create_or_update_twin_version(db, user_id, "INITIAL")

    return {
        "version": f"Twin v{twin.version}",
        "version_number": twin.version,
        "created_at": twin.created_at.isoformat(),
        "scores": {
            "strength": twin.score_strength,
            "endurance": twin.score_endurance,
            "cardio": twin.score_cardio,
            "mobility": twin.score_mobility,
            "flexibility": twin.score_flexibility,
            "balance": twin.score_balance,
            "agility": twin.score_agility,
            "consistency": twin.score_consistency
        },
        "physical": json.loads(twin.physical_summary_json or "{}"),
        "recovery": json.loads(twin.recovery_summary_json or "{}"),
        "nutrition": json.loads(twin.nutrition_summary_json or "{}"),
        "mental": json.loads(twin.mental_summary_json or "{}"),
        "performance": json.loads(twin.performance_summary_json or "{}"),
        "goals": json.loads(twin.goals_summary_json or "{}"),
        "delta_summary": json.loads(twin.delta_summary_json or "{}")
    }

@router.get("/versions")
def list_twin_versions(payload: Dict[str, Any] = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    twins = db.query(DigitalTwinVersion).filter(DigitalTwinVersion.user_id == user_id).order_by(DigitalTwinVersion.version.asc()).all()
    return [
        {
            "version": f"Twin v{t.version}",
            "version_number": t.version,
            "created_at": t.created_at.isoformat(),
            "consistency": t.score_consistency,
            "strength": t.score_strength,
            "cardio": t.score_cardio
        }
        for t in twins
    ]

@router.get("/delta")
def get_twin_delta(
    days: int = Query(30, description="Window in days: 30, 90, 180"),
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = payload["user_id"]
    return compare_twin_longitudinal_change(db, user_id, days_window=days)

@router.post("/snapshot")
def trigger_snapshot(payload: Dict[str, Any] = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    twin = create_or_update_twin_version(db, user_id, "MANUAL_TRIGGER")
    return {"status": "success", "new_version": f"Twin v{twin.version}"}
