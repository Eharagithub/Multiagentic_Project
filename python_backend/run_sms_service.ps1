# PowerShell script to run SMS service with correct Python interpreter
# Run this from the python_backend directory

$pythonExe = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    Write-Host "Error: Python executable not found at $pythonExe" -ForegroundColor Red
    Write-Host "Make sure you're in the python_backend directory and virtual environment is set up." -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting SMS service on port 8006..." -ForegroundColor Green
Write-Host "Using Python: $pythonExe" -ForegroundColor Cyan

& $pythonExe -m uvicorn services.sms_api:app --host 0.0.0.0 --port 8006 --reload

