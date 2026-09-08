#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
PRANA_WEB_DIR="$ROOT_DIR/Sport_Talent-main-yoyo/apps/web"
CV_DIR="$ROOT_DIR/Sport_Talent-main-yoyo/plugin-cv_model"

echo "=========================================================="
echo "   PRANA Full-Stack Ecosystem Launch"
echo "   Frontend (PRANA Next.js):  http://localhost:3000"
echo "   Backend API (Auth & Data): http://localhost:8000"
echo "   Kinematics CV Engine:      http://localhost:8002"
echo "=========================================================="

(cd "$BACKEND_DIR" && npm start) &
BACKEND_PID=$!

(cd "$PRANA_WEB_DIR" && npm run dev) &
FRONTEND_PID=$!

if [ -f "$CV_DIR/server.py" ]; then
  (cd "$CV_DIR" && python3 server.py) &
  CV_PID=$!
fi

echo "PRANA Backend running (PID $BACKEND_PID)"
echo "PRANA Frontend running (PID $FRONTEND_PID)"
echo "Visit http://localhost:3000"

wait
