@echo off
title Hampious - Starting...
echo ============================================
echo   HAMPIOUS - Starting Backend + Frontend
echo ============================================
echo.

:: Start backend in a new window
start "Hampious Backend :8000" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --reload --port 8000"

:: Wait 3 seconds for backend to boot
timeout /T 3 /NOBREAK >nul

:: Start frontend in a new window
start "Hampious Frontend :3000" cmd /k "cd /d "%~dp0frontend" && set BROWSER=none && npm start"

echo.
echo Both servers are starting...
echo.
echo  Backend  ^> http://localhost:8000
echo  Website  ^> http://localhost:3000
echo  Admin    ^> http://localhost:3000/admin
echo.
echo Wait ~30 seconds for frontend to compile, then open your browser.
echo.
pause
