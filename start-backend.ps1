$backendPath = Join-Path $PSScriptRoot "pen-parking-backend\pen-parking-backend"
$venvPython = Join-Path $backendPath "venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "Creating virtual environment..."
    python -m venv (Join-Path $backendPath "venv")
    & $venvPython -m pip install --upgrade pip
    & $venvPython -m pip install -r (Join-Path $backendPath "requirements.txt")
}

Write-Host "Starting PenPark Backend on http://localhost:5000"
Set-Location $backendPath
& $venvPython app.py
