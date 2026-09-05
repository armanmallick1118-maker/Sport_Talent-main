"""
Adaptive AI Coach Endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any
from shared.database.session import get_db
from shared.auth.security import get_current_user_payload
from modules.wellness.coach.service import generate_daily_recommendation, process_coach_chat

router = APIRouter(prefix="/coach", tags=["Coach"])

class CoachChatRequest(BaseModel):
    message: str

@router.get("/recommendation")
def get_daily_recommendation(
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = payload["user_id"]
    return generate_daily_recommendation(db, user_id)

@router.post("/chat")
def chat_with_coach(
    data: CoachChatRequest,
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = payload["user_id"]
    return process_coach_chat(db, user_id, data.message)
