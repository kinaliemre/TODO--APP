param()

$ErrorActionPreference = "Stop"

function Test-PortOpen {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  return [bool]$conn
}

function Wait-FrontendReady {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [int]$TimeoutSeconds = 60
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
      if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 500) {
        return $true
      }
    } catch {
      Start-Sleep -Milliseconds 800
    }
  }
  return $false
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"
$pythonExe = Join-Path $backendDir ".venv\Scripts\python.exe"
$npmExe = Join-Path $env:ProgramFiles "nodejs\npm.cmd"
$pgBin = "C:\Program Files\PostgreSQL\18\bin"
$pgData = Join-Path $backendDir "pgdata"
$pgLog = Join-Path $backendDir "postgres.log"
$frontendUrl = "http://127.0.0.1:5173"

if (-not (Test-Path $pythonExe)) {
  exit 1
}

if (-not (Test-Path $npmExe)) {
  $npmExe = "npm.cmd"
}

$pgIsReady = Join-Path $pgBin "pg_isready.exe"
$pgCtl = Join-Path $pgBin "pg_ctl.exe"

if ((Test-Path $pgIsReady) -and (Test-Path $pgCtl) -and (Test-Path (Join-Path $pgData "PG_VERSION"))) {
  & $pgIsReady -h localhost -p 5432 *> $null
  if ($LASTEXITCODE -ne 0) {
    Start-Process -FilePath $pgCtl -ArgumentList @("-D", $pgData, "-l", $pgLog, "start") -WindowStyle Hidden
  }
}

if (-not (Test-PortOpen -Port 8000)) {
  Start-Process `
    -FilePath $pythonExe `
    -WorkingDirectory $backendDir `
    -ArgumentList @("-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000", "--reload") `
    -WindowStyle Hidden
}

if (-not (Test-PortOpen -Port 5173)) {
  Start-Process `
    -FilePath $npmExe `
    -WorkingDirectory $frontendDir `
    -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "5173", "--strictPort") `
    -WindowStyle Hidden
}

[void](Wait-FrontendReady -Url $frontendUrl -TimeoutSeconds 60)

$chrome64 = Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"
$programFilesX86 = [Environment]::GetEnvironmentVariable("ProgramFiles(x86)")
$chrome32 = if ($programFilesX86) { Join-Path $programFilesX86 "Google\Chrome\Application\chrome.exe" } else { $null }

if (Test-Path $chrome64) {
  Start-Process -FilePath $chrome64 -ArgumentList @($frontendUrl)
} elseif ($chrome32 -and (Test-Path $chrome32)) {
  Start-Process -FilePath $chrome32 -ArgumentList @($frontendUrl)
} else {
  Start-Process -FilePath $frontendUrl
}
