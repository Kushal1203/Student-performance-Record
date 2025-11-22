@echo off
echo Starting Student Performance Analyzer...

:: Change to the directory of the script
cd /d "%~dp0"

echo Starting Backend Server...
start "Backend Server" cmd /k "python python_backend/main.py"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo Application is starting up.
echo Backend running on port 3001
echo Frontend usually runs on port 5173
echo.
echo You can close this window, but keep the other two windows open.
pause
