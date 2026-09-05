"""
ATHENA Personal Wellness & Fitness Intelligence API Main Application.
Modular Monolith Entrypoint.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import time
import json
from datetime import datetime

from apps.api.config import settings
from shared.database.session import engine, Base, SessionLocal
from shared.database.models import (
    User, Profile, FoodItem, FitnessAssessment, DigitalTwinVersion,
    SleepLog, RecoveryLog, MoodLog, Goal
)
from shared.auth.security import hash_password

# Import routers
from apps.api.routes.profile import router as profile_router
from apps.api.routes.twin import router as twin_router
from apps.api.routes.fitness import router as fitness_router
from apps.api.routes.nutrition import router as nutrition_router
from apps.api.routes.recovery import router as recovery_router
from apps.api.routes.coach import router as coach_router
from apps.api.routes.simulator import router as simulator_router
from apps.api.routes.cv import router as cv_router
from apps.api.routes.wellness import router as wellness_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ATHENA Personal Wellness & Fitness Intelligence Module API"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Timing & Audit Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    response.headers["X-Athena-Module"] = "Personal-Wellness-Intelligence"
    return response

# Mount Modular Routers
api_v1_prefix = settings.API_V1_STR
app.include_router(profile_router, prefix=api_v1_prefix)
app.include_router(twin_router, prefix=api_v1_prefix)
app.include_router(fitness_router, prefix=api_v1_prefix)
app.include_router(nutrition_router, prefix=api_v1_prefix)
app.include_router(recovery_router, prefix=api_v1_prefix)
app.include_router(coach_router, prefix=api_v1_prefix)
app.include_router(simulator_router, prefix=api_v1_prefix)
app.include_router(cv_router, prefix=api_v1_prefix)
app.include_router(wellness_router, prefix=api_v1_prefix)

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "module": "ATHENA Personal Wellness & Fitness Intelligence",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION
    }

def init_db_and_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            # Seed Demo User
            user = User(
                id=1,
                username="demo_athlete",
                email="athlete@athena.intelligence",
                hashed_password=hash_password("athena_demo_2026"),
                role="PLAYER",
                is_active=True
            )
            db.add(user)
            db.commit()

            # Seed Profile
            profile = Profile(
                user_id=1,
                full_name="Alex Chen",
                age=28,
                fitness_level="INTERMEDIATE",
                activity_level="MODERATE",
                sex="MALE",
                height_cm=178.0,
                weight_kg=74.5,
                primary_sport="Running / Functional Training",
                training_frequency_per_week=4,
                avg_daily_activity_minutes=50,
                dietary_preference="INDIAN_STANDARD",
                sleep_duration_hours=7.5,
                sleep_quality="GOOD",
                available_equipment=json.dumps(["bodyweight", "dumbbells", "pull-up bar"]),
                fitness_limitations=json.dumps(["Mild left ankle stiffness"]),
                health_notes="Focusing on stamina and mobility.",
                is_onboarded=True
            )
            db.add(profile)

            # Seed Initial Assessment
            assessment = FitnessAssessment(
                user_id=1,
                tier="INTERMEDIATE",
                pushups=28,
                squats=42,
                plank_seconds=110,
                situps=35,
                run_distance_km=3.0,
                run_time_minutes=16.5,
                flexibility_sit_and_reach_cm=28.0,
                balance_single_leg_seconds=40.0,
                category_scores_json=json.dumps({
                    "strength": 72.0,
                    "endurance": 70.0,
                    "cardio": 68.0,
                    "mobility": 64.0,
                    "flexibility": 62.0,
                    "balance": 74.0,
                    "agility": 66.0,
                    "consistency": 76.0
                }),
                explanation_text="Initial intermediate baseline: Solid upper and lower endurance with balanced stability."
            )
            db.add(assessment)

            # Seed Initial Sleep and Recovery
            sleep = SleepLog(
                user_id=1,
                duration_hours=7.8,
                quality_score=82.0,
                bedtime="23:15",
                wake_time="07:05",
                consistency_score=85.0
            )
            db.add(sleep)

            recovery = RecoveryLog(
                user_id=1,
                readiness_score=74,
                breakdown_json=json.dumps([
                    {"factor": "Base Score", "delta": 50, "sign": "+"},
                    {"factor": "Sleep Quality & Duration", "delta": 18, "sign": "+"},
                    {"factor": "Perceived Freshness", "delta": 15, "sign": "+"},
                    {"factor": "Prior Training Load", "delta": -7, "sign": "-"},
                    {"factor": "Systemic Stress", "delta": -4, "sign": "-"},
                    {"factor": "Training Consistency", "delta": 12, "sign": "+"}
                ]),
                perceived_fatigue=4,
                training_load_yesterday=6
            )
            db.add(recovery)

            mood = MoodLog(
                user_id=1,
                mood_score=8,
                stress_level=3,
                energy_level=7,
                motivation_level=8,
                focus_level=7,
                perceived_burnout=2
            )
            db.add(mood)

            # Seed Digital Twin v1
            twin = DigitalTwinVersion(
                user_id=1,
                version=1,
                score_strength=72.0,
                score_endurance=70.0,
                score_cardio=68.0,
                score_mobility=64.0,
                score_flexibility=62.0,
                score_balance=74.0,
                score_agility=66.0,
                score_consistency=76.0,
                physical_summary_json=json.dumps({"strength": 72, "cardio": 68, "mobility": 64}),
                recovery_summary_json=json.dumps({"readiness": 74, "sleep_hours": 7.8}),
                nutrition_summary_json=json.dumps({"diet": "Balanced", "hydration": 2500}),
                mental_summary_json=json.dumps({"mood": 8, "energy": 7}),
                performance_summary_json=json.dumps({"pushups": 28, "squats": 42}),
                goals_summary_json=json.dumps({"goal": "5km Pace & Core Mastery"}),
                delta_summary_json=json.dumps({"note": "Baseline initialization"})
            )
            db.add(twin)

            db.commit()
    finally:
        db.close()

# Auto-initialize DB tables and seed on module load
init_db_and_seed()

if __name__ == "__main__":
    uvicorn.run("apps.api.main:app", host="127.0.0.1", port=8000, reload=True)
