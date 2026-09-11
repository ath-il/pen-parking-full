@echo off
cd /d "%~dp0pen-parking-backend\pen-parking-backend"

if not exist "venv\Scripts\python.exe" (
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

echo Starting PenPark Backend on http://localhost:5000
python app.py
pause
