# ATHENA REST API Specification

All endpoints are versioned under `/api/v1` and protected by RBAC tokens (`PLAYER, COACH, INSTITUTION, ENTERPRISE, ADMIN`).

## 1. Digital Twin
- `GET /api/v1/twin`: Fetches current versioned Digital Twin state and dimensional scores.
- `GET /api/v1/twin/versions`: Lists historical twin versions (`Twin v1, Twin v2, Twin v3...`).
- `GET /api/v1/twin/delta?days=30`: Computes delta analysis answering: *"How has this person changed over the last 30/90/180 days?"*.
- `POST /api/v1/twin/snapshot`: Triggers an immutable snapshot update.

## 2. Profile & Onboarding
- `GET /api/v1/profile`: Returns required, optional, and sensitive fields cleanly categorized.
- `PUT /api/v1/profile`: Updates profile attributes.

## 3. Physical Fitness Engine
- `POST /api/v1/fitness/assess`: Submits adaptive fitness tests (Beginner, Intermediate, Athlete) and calculates multi-category scores (`STRENGTH, ENDURANCE, CARDIO, MOBILITY, FLEXIBILITY, BALANCE, AGILITY, CONSISTENCY`).
- `GET /api/v1/fitness/assess/latest`: Retrieves latest assessment scores and explanation.
- `POST /api/v1/fitness/workouts`: Logs a workout session.
- `GET /api/v1/fitness/workouts`: Retrieves recent workout logs.

## 4. Nutrition & Calorie Analyser
- `POST /api/v1/nutrition/parse`: Natural language meal estimator (e.g. `"2 roti + dal + sabzi + curd"`).
- `POST /api/v1/nutrition/log`: Records meal logs.
- `GET /api/v1/nutrition/today`: Daily macro and calorie totals.
- `GET /api/v1/nutrition/expenditure`: Mifflin-St Jeor daily energy expenditure with conservative ranges (e.g. `2100–2300 kcal`).
- `GET /api/v1/nutrition/foods`: Reference food database.
- `POST /api/v1/nutrition/hydration/log` & `GET /api/v1/nutrition/hydration/today`: Hydration intake and conservative cues.

## 5. Sleep & Recovery Engine
- `GET /api/v1/recovery/readiness`: Returns explainable Readiness Score (0-100) with full mathematical factor breakdown (`Sleep +18, Recovery +15, Training Load -7, Stress -4, Consistency +12`).
- `POST /api/v1/recovery/log`: Logs perceived fatigue and prior training strain.
- `POST /api/v1/recovery/sleep`: Logs sleep duration and bedtime consistency.

## 6. Adaptive AI Coach
- `GET /api/v1/coach/recommendation`: Generates daily adaptive recommendation with explicit transparent reasoning (`"WHY ATHENA recommends this"`).
- `POST /api/v1/coach/chat`: Conversational coaching interface grounded in actual metrics.

## 7. Future / What-If Simulator
- `GET /api/v1/simulator/presets`: Preset lifestyle scenarios.
- `POST /api/v1/simulator/run`: Evaluates hypothetical training adjustments and returns non-deterministic ranges, confidence ratings, and assumptions.

## 8. Computer Vision Exercise Analysis
- `POST /api/v1/cv/evaluate`: Real-time joint geometry evaluation (knee angles, squat depth, torso stability).
- `POST /api/v1/cv/log`: Logs completed CV repetition session.

## 9. Specialized Wellness Hub
- `GET /api/v1/wellness/mental`: Non-diagnostic mood/energy trends and supportive cues.
- `POST /api/v1/wellness/mental/log`: Logs mood, stress, and burnout scores.
- `GET /api/v1/wellness/womens`: Menstrual cycle tracking, irregular cycle support, phase guidance.
- `GET /api/v1/wellness/pcos`: PCOS/PCOD lifestyle & metabolic supportive cues (non-diagnostic).
- `GET /api/v1/wellness/age-plus`: ATHENA Age+ older adult mobility routines and caregiver consent status.
- `POST /api/v1/wellness/age-plus/caregiver-consent`: Toggles caregiver access permissions.
- `GET /api/v1/wellness/sedentary`: Desk inactivity status and gentle mobility breaks.
- `GET /api/v1/wellness/challenges`: Healthy improvement-focused community challenges.
- `GET /api/v1/wellness/knowledge-graph`: Relational correlation graph linking wellness dimensions.
- `GET /api/v1/wellness/progress`: Multi-horizon (7d, 30d, 90d, 6mo, 1yr) analytics and trend flags.
- `GET /api/v1/wellness/goals` & `POST /api/v1/wellness/goals`: Goal engine with adaptive milestones.
