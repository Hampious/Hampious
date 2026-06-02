@echo off
title Hampious Backend
cd /d "%~dp0backend"
echo Starting Hampious Backend on http://localhost:8000 ...
python -m uvicorn main:app --reload --port 8000
pause
