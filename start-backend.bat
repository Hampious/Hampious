@echo off
title Hampious Backend - Port 8000
cd /d "%~dp0backend"
echo Starting Hampious Backend...
"C:\Users\dbisoye\AppData\Roaming\Python\Python314\Scripts\uvicorn.exe" main:app --reload --port 8000
pause
