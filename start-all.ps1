$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$ai = Join-Path $root "ai-pipeline"

Write-Host ""
Write-Host "SportTalent local stack" -ForegroundColor Cyan
Write-Host "Frontend:      http://localhost:5173"
Write-Host "Backend API:   http://localhost:8000"
Write-Host "MediaPipeline: http://localhost:8001"
Write-Host ""

$backendProcess = Start-Process powershell -PassThru -WindowStyle Hidden -WorkingDirectory $backend -ArgumentList @(
  "-NoExit",
  "-Command",
  "npm start"
)

$frontendProcess = Start-Process powershell -PassThru -WindowStyle Hidden -WorkingDirectory $frontend -ArgumentList @(
  "-NoExit",
  "-Command",
  "npm run dev -- --host 0.0.0.0"
)

$aiPython = Join-Path $ai "venv\Scripts\python.exe"
if (Test-Path $aiPython) {
  $oldErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $check = & $aiPython -c "import fastapi, uvicorn" 2>&1
  $ErrorActionPreference = $oldErrorActionPreference
  if ($LASTEXITCODE -eq 0) {
    Start-Process powershell -PassThru -WindowStyle Hidden -WorkingDirectory $ai -ArgumentList @(
      "-NoExit",
      "-Command",
      "venv\Scripts\python.exe -m uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload"
    ) | Out-Null
  } else {
    Write-Warning "MediaPipeline was not started because the Python venv is missing packages. Install Python 3.11/3.12 and run: python -m pip install -r ai-pipeline\requirements.txt"
  }
} else {
  Write-Warning "MediaPipeline was not started because ai-pipeline\venv\Scripts\python.exe was not found."
}

Write-Host "Started backend process $($backendProcess.Id) and frontend process $($frontendProcess.Id)." -ForegroundColor Green
Write-Host "Open http://localhost:5173 in your browser."
