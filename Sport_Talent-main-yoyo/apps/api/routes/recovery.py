"""
Sleep & Recovery Endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional
from shared.database.session import get_db
from shared.database.models import SleepLog, RecoveryLog
from shared.auth.security import get_current_user_payload
from modules.wellness.recovery.service import compute_readiness_score
import json

router = APIRouter(prefix="/recovery", tags=["Recovery"])

class SleepLogRequest(BaseModel):
    duration_hours: float
    quality_score: float = 75.0
    bedtime: str = "23:00"
    wake_time: str = "07:00"

class RecoveryLogRequest(BaseModel):
    perceived_fatigue: int = 4
    training_load_yesterday: int = 5
    stress_level: int = 4

@router.get("/readiness")
def get_readiness(payload: Dict[str, Any] = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    latest_sleep = db.query(SleepLog).filter(SleepLog.user_id == user_id).order_by(SleepLog.created_at.desc()).first()
    latest_rec = db.query(RecoveryLog).filter(RecoveryLog.user_id == user_id).order_by(RecoveryLog.created_at.desc()).first()

    sleep_hrs = latest_sleep.duration_hours if latest_sleep else 7.5
    sleep_qual = latest_sleep.quality_score if latest_sleep else 78.0
    fatigue = latest_rec.perceived_fatigue if latest_rec else 4
    load_yesterday = latest_rec.training_load_yesterday if latest_rec else 5
    stress = 4
    consistency = 82.0

    readiness = compute_readiness_score(
        sleep_hours=sleep_hrs,
        sleep_quality=sleep_qual,
        perceived_fatigue=fatigue,
        training_load_yesterday=load_yesterday,
        stress_level=stress,
        consistency_score=consistency
    )
    return readiness

@router.post("/sleep")
def log_sleep(
    data: SleepLogRequest,
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = payload["user_id"]
    log = SleepLog(
        user_id=user_id,
        duration_hours=data.duration_hours,
        quality_score=data.quality_score,
        bedtime=data.bedtime,
        wake_time=data.wake_time,
        consistency_score=80.0
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"status": "success", "message": "Sleep logged successfully"}

@router.post("/log")
def log_recovery(
    data: RecoveryLogRequest,
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = payload["user_id"]
    latest_sleep = db.query(SleepLog).filter(SleepLog.user_id == user_id).order_by(SleepLog.created_at.desc()).first()
    sleep_hrs = latest_sleep.duration_hours if latest_sleep else 7.5

    calc = compute_readiness_score(
        sleep_hours=sleep_hrs,
        sleep_quality=75.0,
        perceived_fatigue=data.perceived_fatigue,
        training_load_yesterday=data.training_load_yesterday,
        stress_level=data.stress_level,
        consistency_score=80.0
    )

    log = RecoveryLog(
        user_id=user_id,
        readiness_score=calc["readiness_score"],
        breakdown_json=json.dumps(calc["breakdown"]),
        perceived_fatigue=data.perceived_fatigue,
        training_load_yesterday=data.training_load_yesterday
    )
    db.add(log)
    db.commit()
    return {"status": "success", "readiness_score": calc["readiness_score"]}
