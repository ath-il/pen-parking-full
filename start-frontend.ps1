$frontendPath = Join-Path $PSScriptRoot "penpark-frontend"

Write-Host "Starting PenPark Frontend on http://localhost:5173"
Set-Location $frontendPath

if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "Installing npm dependencies..."
    npm install
}

npm run dev
