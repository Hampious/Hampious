Set-Location "$PSScriptRoot\backend"
Write-Host "Starting Hampious Backend on http://localhost:8000" -ForegroundColor Green
Write-Host "Keep this window open while using the app!" -ForegroundColor Yellow
Write-Host ""
python -m uvicorn main:app --reload --port 8000
Write-Host "Backend stopped. Close this window or press Ctrl+C" -ForegroundColor Red
Read-Host "Press Enter to exit"
