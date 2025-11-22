@echo off
echo Starting Student Performance Analyzer Desktop App...

:: Change to the directory of the script
cd /d "%~dp0"

echo Starting Application...
npm run electron:start

pause
