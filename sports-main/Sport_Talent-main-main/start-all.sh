#!/usr/bin/env bash
# ============================================================
# PRANA — Start Services Locally
# ============================================================
# Usage: ./start-all.sh
# Stops all: Ctrl+C (kills all child processes cleanly)
# ============================================================

set -e

WORKSPACE_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$WORKSPACE_DIR/frontend"
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
  echo -e "${YELLOW}⏹  Stopping all PRANA services...${NC}"
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
echo -e "${BOLD}${CYAN}║    🌱  PRANA — Vitality & Wellness Platform  ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. PRANA Frontend (Next.js on :3000) ──────────────────────
echo -e "${CYAN}[1/2]${NC} Starting ${BOLD}PRANA Frontend${NC} (Next.js) on port ${BOLD}3000${NC}..."
cd "$FRONTEND_DIR"
if [ ! -d node_modules ]; then
  echo -e "${YELLOW}  ⚠  node_modules missing — running npm install...${NC}"
  npm install -q
fi
npm run dev > /tmp/prana-frontend.log 2>&1 &
PIDS+=($!)
echo -e "${GREEN}  ✅ PRANA Frontend PID: $!${NC}"
sleep 2

# ── 2. MediaPipeline / AI CV (FastAPI on :8001) ───────────────
if [ -d "$MEDIAPIPE_DIR" ]; then
  echo -e "${CYAN}[2/2]${NC} Starting ${BOLD}AI Pipeline${NC} (FastAPI) on port ${BOLD}8001${NC}..."
  cd "$MEDIAPIPE_DIR"
  if [ -f venv/bin/uvicorn ]; then
    venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload --log-level info > /tmp/mediapipe.log 2>&1 &
    PIDS+=($!)
    echo -e "${GREEN}  ✅ AI Pipeline PID: $!${NC}"
  fi
fi

# ── Summary ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║         🚀 PRANA Running Successfully!       ║${NC}"
echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}${GREEN}║  🌐 PRANA App      → http://localhost:3000   ║${NC}"
echo -e "${BOLD}${GREEN}║  🤖 AI CV Pipeline → http://localhost:8001   ║${NC}"
echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}${GREEN}║  Press Ctrl+C to stop all services           ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""

wait
