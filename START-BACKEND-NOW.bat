@echo off
title HAMPIOUS BACKEND - KEEP OPEN
color 0A
cd /d "%~dp0backend"
echo.
echo  =========================================
echo   HAMPIOUS BACKEND - DO NOT CLOSE
echo   Running on http://localhost:8000
echo  =========================================
echo.
:start
"C:\Users\dbisoye\AppData\Roaming\Python\Python314\Scripts\uvicorn.exe" main:app --port 8000 --reload
echo.
echo  Backend stopped! Restarting in 3 seconds...
timeout /T 3 /NOBREAK
goto start
