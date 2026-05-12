param(
  [switch]$SkipDocker,
  [switch]$SkipMigrate,
  [switch]$CleanNext
)

$ErrorActionPreference = "Stop"

function Run-Step([string]$Label, [scriptblock]$Action) {
  Write-Host ""
  Write-Host "==> $Label" -ForegroundColor Cyan
  & $Action
}

function Ensure-Command([string]$CommandName, [string]$Hint) {
  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "Missing required command '$CommandName'. $Hint"
  }
}

Ensure-Command "node" "Install Node.js (LTS) then reopen the terminal."
Ensure-Command "npm" "Install Node.js (LTS) then reopen the terminal."

if (-not $SkipDocker) {
  Ensure-Command "docker" "Install Docker Desktop and ensure it's running."
}

function Resolve-PowerShellExe() {
  $pwsh = Get-Command "pwsh" -ErrorAction SilentlyContinue
  if ($pwsh) { return $pwsh.Source }

  $winPs = Get-Command "powershell" -ErrorAction SilentlyContinue
  if ($winPs) { return $winPs.Source }

  throw "Neither 'pwsh' (PowerShell 7) nor 'powershell' (Windows PowerShell) was found in PATH."
}

Run-Step "Install root dependencies" {
  npm install
}

if ($CleanNext) {
  Run-Step "Clean Next.js build output (.next)" {
    npm run clean:next
  }
}

if (-not $SkipDocker) {
  Run-Step "Start dev services (postgres, redis, minio, mailpit)" {
    npm run docker:dev
  }
}

Run-Step "Generate Prisma client (backend)" {
  npm run backend:generate
}

if (-not $SkipMigrate) {
  Run-Step "Run DB migrations (backend)" {
    npm run backend:migrate
  }
}

Run-Step "Start backend + frontend (two terminals)" {
  $repo = (Resolve-Path ".").Path
  $psExe = Resolve-PowerShellExe

  Start-Process -FilePath $psExe -WorkingDirectory $repo -ArgumentList @(
    "-NoExit",
    "-Command",
    "npm run backend:dev"
  ) | Out-Null

  Start-Process -FilePath $psExe -WorkingDirectory $repo -ArgumentList @(
    "-NoExit",
    "-Command",
    "npm run dev"
  ) | Out-Null

  Write-Host ""
  Write-Host "Frontend: http://localhost:3001" -ForegroundColor Green
  Write-Host "Backend:  http://localhost:4000" -ForegroundColor Green
}

