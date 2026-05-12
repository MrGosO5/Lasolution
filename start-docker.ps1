$ErrorActionPreference = "Stop"

Write-Host "==> Building and starting full stack via docker compose" -ForegroundColor Cyan
docker compose --profile dev up --build

