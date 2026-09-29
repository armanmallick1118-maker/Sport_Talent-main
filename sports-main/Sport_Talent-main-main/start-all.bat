@echo off
TITLE "PRANA and Sport Talent - Local Services Launcher"
COLOR 0A

echo ============================================================
echo   PRANA and Sport Talent - Localhost Services Launcher
echo ============================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "FRONTEND_DIR=%SCRIPT_DIR%frontend"
set "AI_DIR=%SCRIPT_DIR%ai-pipeline"
set "BACKEND_DIR=%SCRIPT_DIR%backend"

:: 1. Start AI Pipeline (FastAPI on Port 8000)
echo [1/3] Starting AI Pipeline (FastAPI) on port 8000...
start "PRANA - AI CV Pipeline (Port 8000)" cmd /k "cd /d "%AI_DIR%" && py -3.11 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload"

:: 2. Start PRANA Frontend (Next.js on Port 3000)
echo [2/3] Starting Next.js on port 3000...
start "PRANA - Frontend (Port 3000)" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

:: 3. Start Node.js Assessment Backend (Port 8080)
echo [3/3] Starting Node.js Backend on port 8080...
start "Sport Talent - Backend API (Port 8080)" cmd /k "cd /d "%BACKEND_DIR%" && node server.js"

echo.
echo ============================================================
echo   All services are launching in separate windows!
echo ============================================================
echo   Web App:             http://localhost:3000
echo   AI CV API (Swagger): http://localhost:8000/docs
echo   Assessment API:      http://localhost:8080/api/v1/assessments
echo.
echo   To run live exercise webcam tracking anytime:
echo   cd ../Exercise-Correction-main
echo   py -3.11 run_detector.py --exercise squat
echo ============================================================
echo.
pause
