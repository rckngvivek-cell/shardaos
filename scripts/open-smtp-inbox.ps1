param()

$repoRoot = Split-Path -Parent $PSScriptRoot
$toolsDir = Join-Path $repoRoot '.tools'
$smtpHost = '127.0.0.1'
$smtpPort = 1025
$smtpInboxUrl = 'http://127.0.0.1:1080'
$smtpStdoutLog = Join-Path $toolsDir 'smtp.log'
$smtpStderrLog = Join-Path $toolsDir 'smtp.err.log'

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
  Start-Process `
    -FilePath 'powershell.exe' `
    -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', "Set-Location -LiteralPath '$repoRoot'; $command") `
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

if (-not (Test-Path $toolsDir)) {
  New-Item -ItemType Directory -Path $toolsDir | Out-Null
}

if (-not (Test-TcpPort -targetHost $smtpHost -port $smtpPort)) {
  Start-BackgroundCommand -command 'npm run dev:smtp' -stdoutLog $smtpStdoutLog -stderrLog $smtpStderrLog

  Wait-ForCondition `
    -condition { (Test-TcpPort -targetHost $smtpHost -port $smtpPort) -and (Test-HttpEndpoint $smtpInboxUrl) } `
    -timeoutSeconds 30 `
    -failureMessage "SMTP inbox did not start within 30 seconds. Check $smtpStdoutLog and $smtpStderrLog."
}

Start-Process $smtpInboxUrl
