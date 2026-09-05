"""
ATHENA Database Models
Defines modular entities for:
Users, Profiles, FitnessAssessments, FitnessMetrics, WorkoutSessions,
Exercises, ExerciseSets, NutritionLogs, FoodItems, HydrationLogs, SleepLogs,
RecoveryLogs, MoodLogs, Goals, ProgressSnapshots, DigitalTwinVersions,
Recommendations, CoachInteractions, Challenges, Achievements, CVAnalysis,
WomensWellness, PCOSWellness, AgePlus, ConsentRecords, AuditLogs.
"""
from datetime import datetime
import json
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from .session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), default="PLAYER", nullable=False)  # PLAYER, COACH, INSTITUTION, ENTERPRISE, ADMIN
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    twin_versions = relationship("DigitalTwinVersion", back_populates="user", cascade="all, delete-orphan")
    assessments = relationship("FitnessAssessment", back_populates="user", cascade="all, delete-orphan")
    workouts = relationship("WorkoutSession", back_populates="user", cascade="all, delete-orphan")
    nutrition_logs = relationship("NutritionLog", back_populates="user", cascade="all, delete-orphan")
    hydration_logs = relationship("HydrationLog", back_populates="user", cascade="all, delete-orphan")
    sleep_logs = relationship("SleepLog", back_populates="user", cascade="all, delete-orphan")
    recovery_logs = relationship("RecoveryLog", back_populates="user", cascade="all, delete-orphan")
    mood_logs = relationship("MoodLog", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    coach_interactions = relationship("CoachInteraction", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="user", cascade="all, delete-orphan")
    cv_analyses = relationship("CVAnalysis", back_populates="user", cascade="all, delete-orphan")
    womens_wellness_logs = relationship("WomensWellnessLog", back_populates="user", cascade="all, delete-orphan")
    pcos_wellness_logs = relationship("PCOSWellnessLog", back_populates="user", cascade="all, delete-orphan")
    age_plus_profile = relationship("AgePlusProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    consent_records = relationship("ConsentRecord", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # REQUIRED FIELDS
    full_name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    fitness_level = Column(String(32), default="INTERMEDIATE")  # BEGINNER, INTERMEDIATE, ATHLETE
    activity_level = Column(String(32), default="MODERATE")     # SEDENTARY, LIGHT, MODERATE, VERY_ACTIVE

    # OPTIONAL FIELDS
    sex = Column(String(32), nullable=True)                     # MALE, FEMALE, NON_BINARY, PREFER_NOT_TO_SAY
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    primary_sport = Column(String(64), nullable=True)
    secondary_sports = Column(Text, default="[]")               # JSON list
    training_frequency_per_week = Column(Integer, default=3)
    avg_daily_activity_minutes = Column(Integer, default=45)
    sleep_duration_hours = Column(Float, default=7.5)
    sleep_quality = Column(String(32), default="MODERATE")      # POOR, MODERATE, GOOD, EXCELLENT
    nutrition_preferences = Column(String(64), default="BALANCED") # VEG, NON_VEG, VEGAN, EGGETARIAN
    dietary_preference = Column(String(64), default="INDIAN_STANDARD")
    hydration_habits = Column(String(64), default="MODERATE")   # LOW, MODERATE, HIGH
    preferred_workout_duration_min = Column(Integer, default=30)
    preferred_workout_type = Column(String(64), default="HYBRID") # STRENGTH, CARDIO, MOBILITY, HYBRID
    available_equipment = Column(Text, default="[\"bodyweight\", \"dumbbells\"]") # JSON list
    preferred_location = Column(String(64), default="HOME")     # HOME, GYM, OUTDOORS

    # SENSITIVE FIELDS (Explicitly isolated & guarded)
    fitness_limitations = Column(Text, default="[]")           # Joint pain, past injuries
    health_notes = Column(Text, default="")
    is_onboarded = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class DigitalTwinVersion(Base):
    """
    Versioned Digital Fitness Twin state.
    Twin v1, Twin v2, Twin v3...
    Enables answering: 'How has this person changed over the last 30/90/180 days?'
    """
    __tablename__ = "digital_twin_versions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    version = Column(Integer, nullable=False)                    # 1, 2, 3...
    created_at = Column(DateTime, default=datetime.utcnow)

    # Dimensional Scores (0 - 100)
    score_strength = Column(Float, default=50.0)
    score_endurance = Column(Float, default=50.0)
    score_cardio = Column(Float, default=50.0)
    score_mobility = Column(Float, default=50.0)
    score_flexibility = Column(Float, default=50.0)
    score_balance = Column(Float, default=50.0)
    score_agility = Column(Float, default=50.0)
    score_consistency = Column(Float, default=50.0)

    # State Categories (Physical, Recovery, Nutrition, Mental, Performance, Goals)
    physical_summary_json = Column(Text, default="{}")
    recovery_summary_json = Column(Text, default="{}")
    nutrition_summary_json = Column(Text, default="{}")
    mental_summary_json = Column(Text, default="{}")
    performance_summary_json = Column(Text, default="{}")
    goals_summary_json = Column(Text, default="{}")

    # Delta compared to previous twin version
    delta_summary_json = Column(Text, default="{}")

    user = relationship("User", back_populates="twin_versions")


class FitnessAssessment(Base):
    __tablename__ = "fitness_assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    tier = Column(String(32), default="INTERMEDIATE")           # BEGINNER, INTERMEDIATE, ATHLETE
    pushups = Column(Integer, nullable=True)
    squats = Column(Integer, nullable=True)
    plank_seconds = Column(Integer, nullable=True)
    situps = Column(Integer, nullable=True)
    run_distance_km = Column(Float, nullable=True)
    run_time_minutes = Column(Float, nullable=True)
    sprint_100m_seconds = Column(Float, nullable=True)
    flexibility_sit_and_reach_cm = Column(Float, nullable=True)
    balance_single_leg_seconds = Column(Float, nullable=True)
    agility_t_test_seconds = Column(Float, nullable=True)
    reaction_time_ms = Column(Integer, nullable=True)
    jumping_height_cm = Column(Float, nullable=True)

    category_scores_json = Column(Text, default="{}")
    explanation_text = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="assessments")


class FitnessMetric(Base):
    __tablename__ = "fitness_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    metric_name = Column(String(64), nullable=False)            # e.g., resting_hr, vo2_est, 1rm_squat
    metric_value = Column(Float, nullable=False)
    unit = Column(String(32), nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String(128), nullable=False)
    workout_type = Column(String(64), default="STRENGTH")        # STRENGTH, CARDIO, MOBILITY, RECOVERY, SPORT
    duration_minutes = Column(Integer, nullable=False)
    perceived_exertion_rpe = Column(Integer, default=6)         # 1 - 10
    estimated_calories_burned = Column(Float, default=180.0)
    exercises_json = Column(Text, default="[]")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="workouts")


class FoodItem(Base):
    """
    Standard food reference items including extensive Indian household dishes.
    """
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), index=True, nullable=False)
    category = Column(String(64), default="INDIAN_MAIN")        # GRAINS, CURRIES, VEGETABLES, DAIRY, SNACKS, FRUITS, PROTEIN
    serving_unit = Column(String(32), default="piece")          # piece, katori, bowl, glass, 100g
    serving_grams = Column(Float, default=100.0)
    calories = Column(Float, nullable=False)
    protein_g = Column(Float, default=0.0)
    carbs_g = Column(Float, default=0.0)
    fat_g = Column(Float, default=0.0)
    fiber_g = Column(Float, default=0.0)
    is_indian_dish = Column(Boolean, default=True)


class NutritionLog(Base):
    __tablename__ = "nutrition_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    meal_type = Column(String(32), default="LUNCH")             # BREAKFAST, LUNCH, DINNER, SNACK
    raw_input_text = Column(Text, nullable=False)               # e.g., '2 roti + dal + sabzi + curd'
    items_json = Column(Text, default="[]")                     # Parsed items with estimated macros
    total_calories = Column(Float, default=0.0)
    total_protein = Column(Float, default=0.0)
    total_carbs = Column(Float, default=0.0)
    total_fat = Column(Float, default=0.0)
    total_fiber = Column(Float, default=0.0)
    water_ml = Column(Float, default=250.0)
    is_estimated = Column(Boolean, default=True)
    notes = Column(Text, default="Estimated from portion references")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="nutrition_logs")


class HydrationLog(Base):
    __tablename__ = "hydration_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    amount_ml = Column(Integer, nullable=False)
    logged_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="hydration_logs")


class SleepLog(Base):
    __tablename__ = "sleep_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    duration_hours = Column(Float, nullable=False)
    quality_score = Column(Float, default=70.0)                 # 0 - 100
    bedtime = Column(String(16), default="23:00")
    wake_time = Column(String(16), default="07:00")
    consistency_score = Column(Float, default=75.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sleep_logs")


class RecoveryLog(Base):
    __tablename__ = "recovery_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    readiness_score = Column(Integer, nullable=False)           # 0 - 100
    breakdown_json = Column(Text, default="{}")                 # Explainable factors: sleep, recovery, load, stress, consistency
    perceived_fatigue = Column(Integer, default=4)              # 1 - 10
    training_load_yesterday = Column(Integer, default=5)        # 1 - 10
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recovery_logs")


class MoodLog(Base):
    """
    Non-diagnostic mental wellness tracking.
    """
    __tablename__ = "mood_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    mood_score = Column(Integer, default=7)                     # 1 - 10
    stress_level = Column(Integer, default=4)                   # 1 - 10
    energy_level = Column(Integer, default=7)                   # 1 - 10
    motivation_level = Column(Integer, default=7)               # 1 - 10
    focus_level = Column(Integer, default=7)                    # 1 - 10
    perceived_burnout = Column(Integer, default=3)              # 1 - 10
    mindfulness_minutes = Column(Integer, default=0)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="mood_logs")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String(128), nullable=False)
    category = Column(String(64), default="FITNESS")            # STRENGTH, ENDURANCE, MOBILITY, SLEEP, NUTRITION, HABIT
    target_metric = Column(Float, nullable=False)
    current_metric = Column(Float, default=0.0)
    baseline_metric = Column(Float, default=0.0)
    unit = Column(String(32), default="")
    timeline_weeks = Column(Integer, default=8)
    milestones_json = Column(Text, default="[]")
    weekly_actions_json = Column(Text, default="[]")
    status = Column(String(32), default="ACTIVE")               # ACTIVE, COMPLETED, PAUSED
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="goals")


class ProgressSnapshot(Base):
    __tablename__ = "progress_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    period = Column(String(32), default="30_DAYS")              # 7_DAYS, 30_DAYS, 90_DAYS, 6_MONTHS, 1_YEAR
    trend_cardio = Column(String(32), default="STABLE")         # IMPROVING, DECLINING, STABLE, UNKNOWN
    trend_strength = Column(String(32), default="IMPROVING")
    trend_recovery = Column(String(32), default="STABLE")
    trend_consistency = Column(String(32), default="IMPROVING")
    consistency_percentage = Column(Float, default=75.0)
    summary_text = Column(Text, default="")
    recorded_at = Column(DateTime, default=datetime.utcnow)


class Recommendation(Base):
    """
    Every recommendation passes through safety pipeline:
    USER DATA -> MODEL -> SAFETY CHECK -> RECOMMENDATION -> AI EXPLANATION
    """
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String(128), nullable=False)
    summary = Column(Text, nullable=False)
    action_type = Column(String(64), default="WORKOUT")         # WORKOUT, RECOVERY, NUTRITION, HYDRATION, MOBILITY_BREAK
    intensity = Column(String(32), default="MODERATE")          # LOW, MODERATE, HIGH, REST
    duration_minutes = Column(Integer, default=25)
    reasoning_why = Column(Text, nullable=False)                # Transparent explanation from structured metrics
    safety_approved = Column(Boolean, default=True)
    guardrail_notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recommendations")


class CoachInteraction(Base):
    __tablename__ = "coach_interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    user_message = Column(Text, nullable=False)
    coach_response = Column(Text, nullable=False)
    structured_context_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="coach_interactions")


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), default="CONSISTENCY")        # CONSISTENCY, MOBILITY, ENDURANCE, STRENGTH
    target_value = Column(Float, nullable=False)
    unit = Column(String(32), default="minutes")
    duration_days = Column(Integer, default=30)
    participants_count = Column(Integer, default=142)
    focus_improvement_note = Column(String(256), default="Improvement and habit based. Never body appearance based.")
    is_active = Column(Boolean, default=True)


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    badge_type = Column(String(64), default="CONSISTENCY_STAR")
    unlocked_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="achievements")


class CVAnalysis(Base):
    __tablename__ = "cv_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    exercise_type = Column(String(64), default="squat")         # squat, pushup, plank, lunge
    reps_completed = Column(Integer, default=0)
    rep_consistency_percentage = Column(Float, default=85.0)
    depth_score = Column(String(32), default="Good")
    knee_tracking_score = Column(String(32), default="Needs attention")
    torso_stability_score = Column(String(32), default="Moderate")
    technique_feedback_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="cv_analyses")


class WomensWellnessLog(Base):
    """
    Dedicated cycle and wellness tracking.
    Conservative, supportive, strictly non-diagnostic.
    """
    __tablename__ = "womens_wellness_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    cycle_day = Column(Integer, default=14)
    phase = Column(String(32), default="FOLLICULAR")            # MENSTRUAL, FOLLICULAR, OVULATORY, LUTEAL, IRREGULAR
    is_irregular_cycle = Column(Boolean, default=False)
    symptoms_json = Column(Text, default="[]")                  # Cramps, bloating, fatigue, headache, etc.
    energy_rating = Column(Integer, default=7)                  # 1 - 10
    training_adjustment_note = Column(Text, default="Energy aligns well with moderate strength and steady cardio.")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="womens_wellness_logs")


class PCOSWellnessLog(Base):
    """
    PCOS/PCOD Wellness Support (strictly non-diagnostic lifestyle assistance).
    """
    __tablename__ = "pcos_wellness_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    cycle_regularity_observed = Column(String(64), default="VARIABLE")
    symptoms_json = Column(Text, default="[]")
    sleep_pattern_notes = Column(Text, default="Adequate 7.5h sleep logged")
    stress_level = Column(Integer, default=4)
    lifestyle_support_tips = Column(Text, default="Focus on steady-state walks, balanced fiber-rich meals, and stress reduction.")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="pcos_wellness_logs")


class AgePlusProfile(Base):
    """
    ATHENA Age+ Module for older adult mobility, safe low-impact movement.
    Caregiver mode is enabled ONLY with explicit consent.
    """
    __tablename__ = "age_plus_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    mobility_tier = Column(String(32), default="CHAIR_AND_WALK") # CHAIR_ASSISTED, ACTIVE_WALKING, INDEPENDENT_STRENGTH
    balance_safety_level = Column(String(32), default="MODERATE")
    chair_exercises_enabled = Column(Boolean, default=True)
    daily_walking_target_minutes = Column(Integer, default=20)
    caregiver_mode_consented = Column(Boolean, default=False)
    caregiver_email = Column(String(120), nullable=True)
    caregiver_access_scope = Column(String(64), default="ACTIVITY_AND_SAFETY_ONLY")

    user = relationship("User", back_populates="age_plus_profile")


class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    consent_type = Column(String(64), nullable=False)           # DATA_ANALYTICS, CAREGIVER_SHARING, RESEARCH_OPTOUT
    is_granted = Column(Boolean, default=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45), default="127.0.0.1")

    user = relationship("User", back_populates="consent_records")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    action = Column(String(64), nullable=False)                 # e.g., UPDATE_PROFILE, DELETE_DATA, SAFETY_INTERCEPT
    resource = Column(String(128), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String(32), default="SUCCESS")
    details = Column(Text, default="")

    user = relationship("User", back_populates="audit_logs")


class LabReport(Base):
    __tablename__ = "lab_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    test_date = Column(DateTime, nullable=False)
    panel_name = Column(String(64), nullable=False)             # e.g., CBC, Lipid Panel
    biomarkers_json = Column(Text, default="[]")                # JSON array of results
    lab_name = Column(String(128), nullable=True)
    doctor = Column(String(128), nullable=True)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Needs back_populates on User but we'll leave it simple for now or just add it
    user = relationship("User", backref="lab_reports")


class FitnessScore(Base):
    __tablename__ = "fitness_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True, nullable=False)
    overall_score = Column(Float, default=0.0)
    workout_score = Column(Float, default=0.0)
    nutrition_score = Column(Float, default=0.0)
    health_score = Column(Float, default=0.0)
    grade = Column(String(8), nullable=True)
    strengths_json = Column(Text, default="[]")
    weaknesses_json = Column(Text, default="[]")
    seven_day_plan_json = Column(Text, default="{}")
    critical_alerts_json = Column(Text, default="[]")
    full_analysis = Column(Text, nullable=True)
    score_history_json = Column(Text, default="[]")
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="fitness_score")
