"""
Profile & Onboarding Endpoints.
Distinguishes:
- Required information (age, full_name, fitness_level, activity_level)
- Optional information (sport, height, weight, sleep, dietary, equipment)
- Sensitive information (fitness_limitations, health_notes)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from shared.database.session import get_db
from shared.database.models import User, Profile
from shared.auth.security import get_current_user_payload
import json

router = APIRouter(prefix="/profile", tags=["Profile"])

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    fitness_level: Optional[str] = "INTERMEDIATE"
    activity_level: Optional[str] = "MODERATE"
    sex: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    primary_sport: Optional[str] = None
    training_frequency_per_week: Optional[int] = 3
    avg_daily_activity_minutes: Optional[int] = 45
    dietary_preference: Optional[str] = "INDIAN_STANDARD"
    available_equipment: Optional[List[str]] = None
    fitness_limitations: Optional[List[str]] = None
    health_notes: Optional[str] = None

@router.get("")
def get_profile(payload: Dict[str, Any] = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {
        "required": {
            "full_name": profile.full_name,
            "age": profile.age,
            "fitness_level": profile.fitness_level,
            "activity_level": profile.activity_level
        },
        "optional": {
            "sex": profile.sex,
            "height_cm": profile.height_cm,
            "weight_kg": profile.weight_kg,
            "primary_sport": profile.primary_sport,
            "training_frequency_per_week": profile.training_frequency_per_week,
            "avg_daily_activity_minutes": profile.avg_daily_activity_minutes,
            "dietary_preference": profile.dietary_preference,
            "available_equipment": json.loads(profile.available_equipment) if profile.available_equipment else []
        },
        "sensitive": {
            "fitness_limitations": json.loads(profile.fitness_limitations) if profile.fitness_limitations else [],
            "health_notes": profile.health_notes
        },
        "is_onboarded": profile.is_onboarded
    }

@router.put("")
def update_profile(data: ProfileUpdateRequest, payload: Dict[str, Any] = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = payload["user_id"]
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if data.full_name is not None: profile.full_name = data.full_name
    if data.age is not None: profile.age = data.age
    if data.fitness_level is not None: profile.fitness_level = data.fitness_level
    if data.activity_level is not None: profile.activity_level = data.activity_level
    if data.sex is not None: profile.sex = data.sex
    if data.height_cm is not None: profile.height_cm = data.height_cm
    if data.weight_kg is not None: profile.weight_kg = data.weight_kg
    if data.primary_sport is not None: profile.primary_sport = data.primary_sport
    if data.training_frequency_per_week is not None: profile.training_frequency_per_week = data.training_frequency_per_week
    if data.avg_daily_activity_minutes is not None: profile.avg_daily_activity_minutes = data.avg_daily_activity_minutes
    if data.dietary_preference is not None: profile.dietary_preference = data.dietary_preference
    if data.available_equipment is not None: profile.available_equipment = json.dumps(data.available_equipment)
    if data.fitness_limitations is not None: profile.fitness_limitations = json.dumps(data.fitness_limitations)
    if data.health_notes is not None: profile.health_notes = data.health_notes
    profile.is_onboarded = True

    db.commit()
    db.refresh(profile)
    return {"status": "success", "message": "Profile updated successfully"}
