@echo off
title Hampious Launcher
echo.
echo ============================================
echo   HAMPIOUS - Launching App
echo ============================================
echo.

:: Kill anything on port 8000
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000 "') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Start backend using the correct uvicorn path
echo Starting Backend...
start "Hampious Backend :8000" cmd /k "cd /d "%~dp0backend" && "C:\Users\dbisoye\AppData\Roaming\Python\Python314\Scripts\uvicorn.exe" main:app --reload --port 8000"

timeout /T 4 /NOBREAK >nul

:: Start frontend
echo Starting Frontend...
start "Hampious Frontend :3000" cmd /k "cd /d "%~dp0frontend" && set BROWSER=none && npm start"

echo.
echo Backend  : http://localhost:8000
echo Website  : http://localhost:3000
echo Admin    : http://localhost:3000/admin
echo.
echo Keep both terminal windows open!
timeout /T 10 /NOBREAK >nul
start "" "http://localhost:3000"
