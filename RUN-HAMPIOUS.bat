@echo off
title Hampious App Launcher
color 0A
echo.
echo  ==========================================
echo   HAMPIOUS - Starting Everything...
echo  ==========================================
echo.

:: Kill anything already on these ports
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000 "') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 "') do taskkill /F /PID %%a >nul 2>&1

echo  Starting Backend (port 8000)...
start "HAMPIOUS BACKEND - DO NOT CLOSE" cmd /k "color 0A && cd /d "%~dp0backend" && echo Backend running on http://localhost:8000 && "C:\Users\dbisoye\AppData\Roaming\Python\Python314\Scripts\uvicorn.exe" main:app --reload --port 8000"

echo  Waiting for backend to boot...
timeout /T 5 /NOBREAK >nul

echo  Starting Frontend (port 3000)...
start "HAMPIOUS FRONTEND - DO NOT CLOSE" cmd /k "color 0B && cd /d "%~dp0frontend" && set BROWSER=none && echo Frontend compiling... wait 30 seconds && npm start"

echo.
echo  ==========================================
echo   Both servers starting!
echo   Backend  : http://localhost:8000
echo   Website  : http://localhost:3000
echo   Admin    : http://localhost:3000/admin
echo  ==========================================
echo.
echo  Keep BOTH terminal windows open.
echo  Opening browser in 35 seconds...
echo.
timeout /T 35 /NOBREAK >nul
start "" "http://localhost:3000"
