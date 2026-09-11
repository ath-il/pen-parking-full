@echo off
cd /d "%~dp0penpark-frontend"

if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
)

echo Starting PenPark Frontend on http://localhost:5173
call npm run dev
pause
