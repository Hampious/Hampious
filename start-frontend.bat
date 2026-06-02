@echo off
title Hampious Frontend
cd /d "%~dp0frontend"
echo Starting Hampious Frontend on http://localhost:3000 ...
set BROWSER=none
npm start
pause
