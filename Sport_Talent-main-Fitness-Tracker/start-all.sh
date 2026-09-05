#!/usr/bin/env bash
# ============================================================
# Sports AI — Start All Services Locally
# ============================================================
# Usage: ./start-all.sh
# Stops all: Ctrl+C (kills all child processes cleanly)
# ============================================================

set -e

WORKSPACE_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$WORKSPACE_DIR/frontend"
BACKEND_DIR="$WORKSPACE_DIR/backend"
MEDIAPIPE_DIR="$WORKSPACE_DIR/ai-pipeline"

# ── Colors ────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── PID tracking ──────────────────────────────────────────────
PIDS=()

cleanup() {
  echo ""
  echo -e "${YELLOW}⏹  Stopping all services...${NC}"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  echo -e "${GREEN}✅ All services stopped. Goodbye!${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Header ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║       🏆  Sports AI — Local Dev Stack        ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. MediaPipeline (FastAPI on :8001) ───────────────────────
echo -e "${CYAN}[1/3]${NC} Starting ${BOLD}MediaPipeline${NC} (FastAPI) on port ${BOLD}8001${NC}..."
cd "$MEDIAPIPE_DIR"
if [ ! -f venv/bin/uvicorn ]; then
  echo -e "${YELLOW}  ⚠  venv/bin/uvicorn not found — installing requirements...${NC}"
  venv/bin/pip install -r requirements.txt -q
fi
venv/bin/uvicorn api.main:app \
  --host 0.0.0.0 \
  --port 8001 \
  --reload \
  --log-level info > /tmp/mediapipe.log 2>&1 &
PIDS+=($!)
echo -e "${GREEN}  ✅ MediaPipeline PID: $!${NC}"
sleep 2

# ── 2. Backend (Express on :8000) ─────────────────────────────
echo -e "${CYAN}[2/3]${NC} Starting ${BOLD}Backend${NC} (Express.js) on port ${BOLD}8000${NC}..."
cd "$BACKEND_DIR"
if [ ! -d node_modules ]; then
  echo -e "${YELLOW}  ⚠  node_modules missing — running npm install...${NC}"
  npm install -q
fi
npm run dev > /tmp/backend.log 2>&1 &
PIDS+=($!)
echo -e "${GREEN}  ✅ Backend PID: $!${NC}"
sleep 2

# ── 3. Frontend (Vite on :5173) ───────────────────────────────
echo -e "${CYAN}[3/3]${NC} Starting ${BOLD}Frontend${NC} (React + Vite) on port ${BOLD}5173${NC}..."
cd "$FRONTEND_DIR"
if [ ! -d node_modules ]; then
  echo -e "${YELLOW}  ⚠  node_modules missing — running npm install...${NC}"
  npm install -q
fi
npm run dev > /tmp/frontend.log 2>&1 &
PIDS+=($!)
echo -e "${GREEN}  ✅ Frontend PID: $!${NC}"
sleep 3

# ── Summary ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║         🚀 All Services Running!             ║${NC}"
echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}${GREEN}║  🌐 Frontend       → http://localhost:5173   ║${NC}"
echo -e "${BOLD}${GREEN}║  ⚙️  Backend        → http://localhost:8000   ║${NC}"
echo -e "${BOLD}${GREEN}║  🤖 MediaPipeline  → http://localhost:8001   ║${NC}"
echo -e "${BOLD}${GREEN}║  📄 API Docs       → http://localhost:8001/docs ║${NC}"
echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}${GREEN}║  📋 Logs:                                    ║${NC}"
echo -e "${BOLD}${GREEN}║    MediaPipeline → /tmp/mediapipe.log        ║${NC}"
echo -e "${BOLD}${GREEN}║    Backend       → /tmp/backend.log          ║${NC}"
echo -e "${BOLD}${GREEN}║    Frontend      → /tmp/frontend.log         ║${NC}"
echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}${GREEN}║  Press  Ctrl+C  to stop all services         ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Keep script alive (waits for all background jobs)
wait
