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

# Helper to check if a port is in use
function Test-PortOccupied($port) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

# 1. Start Backend (Express / Prisma on port 8000)
if (-not (Test-PortOccupied 8000)) {
    Write-Host "[1/3] Starting Backend API on http://localhost:8000..." -ForegroundColor Cyan
    $backendProcess = Start-Process powershell -PassThru -WorkingDirectory $backend -ArgumentList @(
        "-NoExit",
        "-Command",
        "npm start"
    )
    Write-Host "  -> Backend Process PID: $($backendProcess.Id)" -ForegroundColor Green
} else {
    Write-Host "[1/3] Port 8000 is already listening (Backend active)." -ForegroundColor DarkGreen
}

# 2. Start PRANA Web Frontend (Next.js on port 3000)
if (-not (Test-PortOccupied 3000)) {
    Write-Host "[2/3] Starting PRANA Web Frontend on http://localhost:3000..." -ForegroundColor Cyan
    $frontendProcess = Start-Process powershell -PassThru -WorkingDirectory $pranaWeb -ArgumentList @(
        "-NoExit",
        "-Command",
        "npm run dev"
    )
    if ($frontendProcess) {
        Write-Host "  -> Frontend Process PID: $($frontendProcess.Id)" -ForegroundColor Green
    }
} else {
    Write-Host "[2/3] Port 3000 is already listening (Frontend active)." -ForegroundColor DarkGreen
}

# 3. Optional start CV Server (Flask on port 8002)
if (Test-Path (Join-Path $cvPlugin "server.py")) {
    if (-not (Test-PortOccupied 8002)) {
        Write-Host "[3/3] Starting Kinematics CV Engine on http://localhost:8002..." -ForegroundColor Cyan
        Start-Process powershell -PassThru -WorkingDirectory $cvPlugin -ArgumentList @(
            "-NoExit",
            "-Command",
            "python server.py"
        ) | Out-Null
    }
}

# 4. Wait for Frontend (localhost:3000) to be fully ready before launching browser
Write-Host ""
Write-Host "Waiting for PRANA Frontend (http://localhost:3000) to respond..." -ForegroundColor Yellow
$maxRetries = 35
$isReady = $false

for ($i = 1; $i -le $maxRetries; $i++) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $connectTask = $tcp.ConnectAsync("127.0.0.1", 3000)
        if ($connectTask.Wait(500)) {
            $tcp.Close()
            $isReady = $true
            break
        }
    } catch {
        # Dev server is still compiling
    }
    Write-Host "  Checking frontend readiness ($i/$maxRetries)..." -ForegroundColor Gray
    Start-Sleep -Seconds 1
}

if ($isReady) {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " [SUCCESS] PRANA Frontend is live at http://localhost:3000" -ForegroundColor Green
    Write-Host " Launching browser..." -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Green
    Start-Process "http://localhost:3000"
} else {
    Write-Warning "Frontend server took longer than expected to bind to port 3000."
    Write-Host "Please verify the PRANA frontend terminal window or navigate to http://localhost:3000 once compiling completes." -ForegroundColor Yellow
}
