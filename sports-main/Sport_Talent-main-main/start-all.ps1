# ============================================================
# PRANA & Sport Talent - Local Services Launcher (PowerShell)
# ============================================================
# Usage: .\start-all.ps1

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Join-Path $ScriptDir "frontend"
$AiDir = Join-Path $ScriptDir "ai-pipeline"
$BackendDir = Join-Path $ScriptDir "backend"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  PRANA & Sport Talent - Localhost Services Launcher" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start AI Pipeline (FastAPI) on Port 8000
Write-Host "[1/3] Starting AI Pipeline (FastAPI) on port 8000..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k py -3.11 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload" -WorkingDirectory $AiDir

# 2. Start Frontend (Next.js) on Port 3000
Write-Host "[2/3] Starting Next.js on port 3000..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k npm run dev" -WorkingDirectory $FrontendDir

# 3. Start Backend API on Port 8080
Write-Host "[3/3] Starting Node.js Backend on port 8080..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k node server.js" -WorkingDirectory $BackendDir

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Services launched in dedicated console windows!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Web App:              http://localhost:3000" -ForegroundColor White
Write-Host "  AI CV API (Docs):     http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Assessment Backend:   http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "  To run live webcam exercise detection:" -ForegroundColor Cyan
Write-Host "  py -3.11 run_detector.py --exercise squat" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
