param(
  [ValidateSet('owner', 'employee', 'school', 'all')]
  [string]$App = 'owner',
  [string]$Route = '/login'
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$toolsDir = Join-Path $repoRoot '.tools'
$apiHealthUrl = 'http://127.0.0.1:3000/api/health'
$apiStdoutLog = Join-Path $toolsDir 'portal-api.log'
$apiStderrLog = Join-Path $toolsDir 'portal-api.err.log'
$seedStdoutLog = Join-Path $toolsDir 'owner-seed.log'
$seedStderrLog = Join-Path $toolsDir 'owner-seed.err.log'

$portalConfig = @{
  owner = @{
    BaseUrl = 'http://localhost:5174'
    Script = 'dev:owner'
    Stdout = (Join-Path $toolsDir 'owner-launcher.log')
    Stderr = (Join-Path $toolsDir 'owner-launcher.err.log')
  }
  employee = @{
    BaseUrl = 'http://localhost:5175'
    Script = 'dev:employee'
    Stdout = (Join-Path $toolsDir 'employee-launcher.log')
    Stderr = (Join-Path $toolsDir 'employee-launcher.err.log')
  }
  school = @{
    BaseUrl = 'http://localhost:5176'
    Script = 'dev:school'
    Stdout = (Join-Path $toolsDir 'school-launcher.log')
    Stderr = (Join-Path $toolsDir 'school-launcher.err.log')
  }
}

function Test-HttpEndpoint([string]$url) {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Start-BackgroundCommand(
  [string]$command,
  [string]$stdoutLog,
  [string]$stderrLog
) {
  $bootstrapCommand = "Set-Location -LiteralPath '$repoRoot'; "

  Start-Process `
    -FilePath 'powershell.exe' `
    -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', "$bootstrapCommand$command") `
    -WindowStyle Minimized `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog | Out-Null
}

function Wait-ForCondition(
  [scriptblock]$condition,
  [int]$timeoutSeconds,
  [string]$failureMessage
) {
  for ($attempt = 0; $attempt -lt $timeoutSeconds; $attempt++) {
    if (& $condition) {
      return
    }

    Start-Sleep -Seconds 1
  }

  throw $failureMessage
}

function Ensure-Api {
  if (Test-HttpEndpoint $apiHealthUrl) {
    return $true
  }

  $command = "Set-Location -LiteralPath '$repoRoot'; npm run dev:api"
  Start-BackgroundCommand -command $command -stdoutLog $apiStdoutLog -stderrLog $apiStderrLog

  try {
    Wait-ForCondition `
      -condition { Test-HttpEndpoint $apiHealthUrl } `
      -timeoutSeconds 90 `
      -failureMessage "API did not start within 90 seconds. Check $apiStdoutLog and $apiStderrLog."
    return $true
  } catch {
    Write-Warning $_.Exception.Message
    return $false
  }
}

function Ensure-OwnerSeed {
  try {
    & powershell.exe `
      -NoProfile `
      -ExecutionPolicy Bypass `
      -Command "Set-Location -LiteralPath '$repoRoot'; npm run owner:seed" `
      1> $seedStdoutLog `
      2> $seedStderrLog

    if ($LASTEXITCODE -ne 0) {
      throw "Seed command exited with code $LASTEXITCODE"
    }

    return $true
  } catch {
    Write-Warning "Owner local data seed failed. Check $seedStdoutLog and $seedStderrLog."
    return $false
  }
}

function Ensure-Portal([string]$name) {
  $config = $portalConfig[$name]
  if (-not $config) {
    throw "Unknown portal: $name"
  }

  if (Test-HttpEndpoint $config.BaseUrl) {
    return $true
  }

  $command = "Set-Location -LiteralPath '$repoRoot'; npm run $($config.Script)"
  Start-BackgroundCommand -command $command -stdoutLog $config.Stdout -stderrLog $config.Stderr

  Wait-ForCondition `
    -condition { Test-HttpEndpoint $config.BaseUrl } `
    -timeoutSeconds 90 `
    -failureMessage "$name portal did not start within 90 seconds. Check $($config.Stdout) and $($config.Stderr)."

  return $true
}

function Normalize-Route([string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) {
    return '/login'
  }

  if ($value.StartsWith('/')) {
    return $value
  }

  return "/$value"
}

if (-not (Test-Path $toolsDir)) {
  New-Item -ItemType Directory -Path $toolsDir | Out-Null
}

$normalizedRoute = Normalize-Route $Route

if ($App -eq 'all') {
  $null = Ensure-Api
  $null = Ensure-OwnerSeed

  foreach ($portal in @('owner', 'employee', 'school')) {
    $null = Ensure-Portal $portal
  }

  foreach ($portal in @('owner', 'employee', 'school')) {
    Start-Process "$($portalConfig[$portal].BaseUrl)/login"
  }

  return
}

$null = Ensure-Api

if ($App -eq 'owner') {
  $null = Ensure-OwnerSeed
}

$null = Ensure-Portal $App
Start-Process "$($portalConfig[$App].BaseUrl)$normalizedRoute"
