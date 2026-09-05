"""
Future / What-If Simulator Endpoints.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional
from modules.wellness.simulator.service import run_what_if_simulation, PRESET_SCENARIOS

router = APIRouter(prefix="/simulator", tags=["Simulator"])

class SimulationRequest(BaseModel):
    scenario_key: Optional[str] = "increase_frequency"
    days_per_week: Optional[int] = 3
    extra_sleep_hours: Optional[float] = 0.0
    walking_mins_increase: Optional[int] = 0
    timeframe_weeks: Optional[int] = 12

@router.get("/presets")
def get_presets():
    return [
        {"key": k, **v} for k, v in PRESET_SCENARIOS.items()
    ]

@router.post("/run")
def simulate(data: SimulationRequest):
    return run_what_if_simulation(
        scenario_key=data.scenario_key or "custom",
        days_per_week=data.days_per_week or 3,
        extra_sleep_hours=data.extra_sleep_hours or 0.0,
        walking_mins_increase=data.walking_mins_increase or 0,
        timeframe_weeks=data.timeframe_weeks or 12
    )
