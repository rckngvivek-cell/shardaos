param(
  [ValidateSet('owner', 'employee', 'school', 'all')]
  [string]$App = 'owner',
  [string]$Route = '/login'
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$toolsDir = Join-Path $repoRoot '.tools'
$apiHealthUrl = 'http://127.0.0.1:3000/api/health'
$firestoreEmulatorHost = '127.0.0.1'
$firestoreEmulatorPort = 8081
$apiStdoutLog = Join-Path $toolsDir 'portal-api.log'
$apiStderrLog = Join-Path $toolsDir 'portal-api.err.log'
$emulatorStdoutLog = Join-Path $toolsDir 'firebase-emulators.log'
$emulatorStderrLog = Join-Path $toolsDir 'firebase-emulators.err.log'
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

function Resolve-JavaHome {
  if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    return $env:JAVA_HOME
  }

  $adoptiumRoot = 'C:\Program Files\Eclipse Adoptium'
  if (Test-Path $adoptiumRoot) {
    $latest = Get-ChildItem -Path $adoptiumRoot -Directory |
      Sort-Object Name -Descending |
      Select-Object -First 1

    if ($latest -and (Test-Path (Join-Path $latest.FullName 'bin\java.exe'))) {
      return $latest.FullName
    }
  }

  return $null
}

function Ensure-JavaInPath {
  if (Get-Command java -ErrorAction SilentlyContinue) {
    return $true
  }

  $javaHome = Resolve-JavaHome
  if (-not $javaHome) {
    return $false
  }

  $env:JAVA_HOME = $javaHome
  $javaBin = Join-Path $javaHome 'bin'

  if (-not $env:Path.Split(';').Contains($javaBin)) {
    $env:Path = "$javaBin;$env:Path"
  }

  return [bool](Get-Command java -ErrorAction SilentlyContinue)
}

function Test-HttpEndpoint([string]$url) {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Test-TcpPort([string]$targetHost, [int]$port) {
  $client = New-Object System.Net.Sockets.TcpClient

  try {
    $asyncResult = $client.BeginConnect($targetHost, $port, $null, $null)

    if (-not $asyncResult.AsyncWaitHandle.WaitOne(1500, $false)) {
      return $false
    }

    $client.EndConnect($asyncResult)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Start-BackgroundCommand(
  [string]$command,
  [string]$stdoutLog,
  [string]$stderrLog
) {
  $bootstrapCommand = "Set-Location -LiteralPath '$repoRoot'; "
  if (Ensure-JavaInPath) {
    $escapedJavaHome = $env:JAVA_HOME -replace "'", "''"
    $escapedPath = $env:Path -replace "'", "''"
    $bootstrapCommand += "`$env:JAVA_HOME='$escapedJavaHome'; "
    $bootstrapCommand += "`$env:Path='$escapedPath'; "
  }

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

function Ensure-Emulators {
  $firestoreReady = Test-TcpPort -targetHost $firestoreEmulatorHost -port $firestoreEmulatorPort

  if ($firestoreReady) {
    return $true
  }

  if (-not (Ensure-JavaInPath)) {
    Write-Warning 'Java is not installed, so the Firestore emulator was skipped. The owner app will use local dev fallback mode.'
    return $false
  }

  $firebaseCli = if (Get-Command firebase -ErrorAction SilentlyContinue) {
    'firebase'
  } else {
    'npx firebase'
  }

  $command = "Set-Location -LiteralPath '$repoRoot'; $firebaseCli emulators:start --only firestore --project school-erp-dev"
  Start-BackgroundCommand -command $command -stdoutLog $emulatorStdoutLog -stderrLog $emulatorStderrLog

  try {
    Wait-ForCondition `
      -condition { Test-TcpPort -targetHost $firestoreEmulatorHost -port $firestoreEmulatorPort } `
      -timeoutSeconds 90 `
      -failureMessage "Firestore emulator did not start within 90 seconds. Check $emulatorStdoutLog and $emulatorStderrLog."
    return $true
  } catch {
    Write-Warning $_.Exception.Message
    return $false
  }
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
  if (-not (Test-TcpPort -targetHost $firestoreEmulatorHost -port $firestoreEmulatorPort)) {
    return $false
  }

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
    Write-Warning "Owner emulator data seed failed. Check $seedStdoutLog and $seedStderrLog."
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
  $null = Ensure-Emulators
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
  $null = Ensure-Emulators
  $null = Ensure-OwnerSeed
}

$null = Ensure-Portal $App
Start-Process "$($portalConfig[$App].BaseUrl)$normalizedRoute"
