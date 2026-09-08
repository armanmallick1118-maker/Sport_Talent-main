$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$pranaWeb = Join-Path $root "Sport_Talent-main-yoyo\apps\web"
$cvPlugin = Join-Path $root "Sport_Talent-main-yoyo\plugin-cv_model"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   PRANA Full-Stack Ecosystem Launch" -ForegroundColor Green
Write-Host "   Frontend (PRANA Next.js):  http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Backend API (Auth & Data): http://localhost:8000" -ForegroundColor Yellow
Write-Host "   Kinematics CV Engine:      http://localhost:8002" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start Backend (Express / Prisma on port 8000)
$backendProcess = Start-Process powershell -PassThru -WindowStyle Hidden -WorkingDirectory $backend -ArgumentList @(
  "-NoExit",
  "-Command",
  "npm start"
)

# 2. Start PRANA Web Frontend (Next.js on port 3000)
$frontendProcess = Start-Process powershell -PassThru -WindowStyle Hidden -WorkingDirectory $pranaWeb -ArgumentList @(
  "-NoExit",
  "-Command",
  "npm run dev"
)

# 3. Optional start CV Server (Flask on port 8002)
if (Test-Path (Join-Path $cvPlugin "server.py")) {
  Start-Process powershell -PassThru -WindowStyle Hidden -WorkingDirectory $cvPlugin -ArgumentList @(
    "-NoExit",
    "-Command",
    "python server.py"
  ) | Out-Null
}

Write-Host "PRANA Backend PID: $($backendProcess.Id)" -ForegroundColor Green
Write-Host "PRANA Frontend PID: $($frontendProcess.Id)" -ForegroundColor Green
Write-Host ""
Write-Host "PRANA is running! Access at http://localhost:3000" -ForegroundColor Cyan
Start-Process "http://localhost:3000"
