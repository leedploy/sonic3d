@echo off
title Sonic 3D Game Launcher
cd /d "%~dp0"

echo ===================================================
echo           SONIC 3D - GAME LAUNCHER
echo ===================================================
echo.
echo Checking server status on port 59346...

netstat -ano | findstr ":59346" | findstr "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo Server is already running!
    echo Opening game in your default browser...
    start "" "http://127.0.0.1:59346/"
    exit /b
)

echo Starting local web server...
start "" "http://127.0.0.1:59346/"
python -m http.server 59346 --bind 127.0.0.1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Python was not found in PATH, trying Node.js...
    npx -y serve . -l 59346
)
pause
