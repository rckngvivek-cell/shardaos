param(
  [string]$Route = '/'
)

& (Join-Path $PSScriptRoot 'open-portal.ps1') -App owner -Route $Route
