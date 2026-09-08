# 🏋️ Fitness Tracker — HealthHub

A full-stack AI-powered health and fitness tracking dashboard built as a feature of the **Sport_Talent** platform.

## Features

- **AI Health Score** — Google Gemini 3.5 Flash evaluates your workouts, nutrition, and lab reports and gives you a grade (A+ → F) with a full analysis in a "professional father" persona.
- **Workout Tracker** — Log exercises, sets, reps, weight, duration, and calories burned.
- **Nutrition Logger** — Track meals with macronutrients (calories, protein, carbs, fat).
- **Lab Report Manager** — Upload blood panel results and the AI flags abnormal biomarkers.
- **Performance Trend Chart** — Interactive Day / Week / Month chart showing your Overall, Workout, and Nutrition scores over time.
- **Daily Goal Tracking** — AI assigns daily workout and nutrition goals. Check them off when complete. The AI adapts its next plan based on your completion rate.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Recharts, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite via Prisma ORM |
| **AI** | Google Gemini 3.5 Flash (`@google/generative-ai`) |

## Running Locally

### 1. Backend

```bash
cd fitness-tracker/backend
npm install
npx prisma db push
```

Create a `.env` file:
```
DATABASE_URL="file:./health.db"
GEMINI_API_KEY="your_google_ai_developer_api_key"
PORT=3001
```

Start the backend:
```bash
npx nodemon server.js
# or: node server.js
```

### 2. Frontend

```bash
cd fitness-tracker/frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/health/users` | Create a user profile |
| `GET` | `/api/health/users/:id` | Get a user |
| `POST` | `/api/health/workout` | Log a workout |
| `GET` | `/api/health/workout/:userId` | Get workouts |
| `POST` | `/api/health/nutrition` | Log a meal |
| `GET` | `/api/health/nutrition/:userId` | Get nutrition logs |
| `POST` | `/api/health/lab-report` | Submit a lab report |
| `POST` | `/api/health/score/generate/:userId` | Trigger AI analysis |
| `GET` | `/api/health/score/:userId` | Get latest AI score |
| `POST` | `/api/health/goals/track` | Update daily goal completion |
| `GET` | `/api/health/goals/:userId` | Get goal tracking history |

## Architecture

```
fitness-tracker/
├── backend/
│   ├── ai/
│   │   ├── fitnessAgent.js    # Gemini API orchestration
│   │   ├── scoringEngine.js   # Deterministic pre-scoring
│   │   └── alertSystem.js     # Critical biomarker detection
│   ├── controllers/
│   │   └── healthController.js
│   ├── routes/
│   │   └── healthRoutes.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── server.js
└── frontend/
    └── src/
        ├── pages/
        │   ├── HealthHub.jsx      # Main SPA dashboard
        │   ├── WorkoutTracker.jsx
        │   ├── NutritionLogger.jsx
        │   └── LabReportManager.jsx
        ├── components/
        │   └── CircularProgress.jsx
        └── services/
            └── healthApi.js
```
