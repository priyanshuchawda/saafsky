param(
  [switch]$RequireGemini,
  [int]$Port = 3100
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$nextCli = Join-Path $repoRoot "node_modules\next\dist\bin\next"
$envFile = Join-Path $repoRoot ".env.local"
$envLines = if (Test-Path -LiteralPath $envFile) {
  Get-Content -LiteralPath $envFile
} else {
  @()
}
$hasGeminiKey = [bool]($envLines | Where-Object { $_ -match '^GEMINI_API_KEY\s*=\s*\S+' })
$hasRedisUrl = [bool]($envLines | Where-Object { $_ -match '^UPSTASH_REDIS_REST_URL\s*=\s*\S+' })
$hasRedisToken = [bool]($envLines | Where-Object { $_ -match '^UPSTASH_REDIS_REST_TOKEN\s*=\s*\S+' })

if (-not (Test-Path -LiteralPath $nextCli)) {
  throw "Next.js is not installed. Run npm ci before the live smoke check."
}
if ($RequireGemini -and -not ($hasGeminiKey -and $hasRedisUrl -and $hasRedisToken)) {
  throw "Gemini smoke requires GEMINI_API_KEY and both Upstash credentials in .env.local."
}

$node = (Get-Command node.exe -ErrorAction Stop).Source
$tempRoot = [System.IO.Path]::GetTempPath()
$stdoutLog = Join-Path $tempRoot "saafsky-live-smoke-$Port.out.log"
$stderrLog = Join-Path $tempRoot "saafsky-live-smoke-$Port.err.log"
$arguments = '"{0}" start --hostname 127.0.0.1 --port {1}' -f $nextCli, $Port
$server = $null
$baseUrl = "http://127.0.0.1:$Port"

try {
  $server = Start-Process `
    -FilePath $node `
    -ArgumentList $arguments `
    -WorkingDirectory $repoRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    if ($server.HasExited) {
      throw "Production server exited before becoming ready. Check the local build and port $Port."
    }
    try {
      $null = Invoke-WebRequest -Uri $baseUrl -TimeoutSec 2
      $ready = $true
      break
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }
  if (-not $ready) {
    throw "Production server did not become ready on port $Port."
  }

  $air = Invoke-RestMethod `
    -Uri "$baseUrl/api/air?lat=28.614&lon=77.209" `
    -TimeoutSec 20
  if (-not $air.data.current.time -or -not $air.retrievedAt) {
    throw "Air endpoint returned an incomplete response."
  }
  Write-Output "Open-Meteo air route: passed (validated snapshot)."

  $locations = Invoke-RestMethod `
    -Uri "$baseUrl/api/locations?q=Delhi" `
    -TimeoutSec 20
  if (-not $locations.results -or $locations.results.Count -lt 1) {
    throw "City lookup returned no Delhi result."
  }
  Write-Output "Open-Meteo location route: passed (validated city result)."

  $body = @{
    question = "What should I consider for air conditions today?"
    latitude = 28.6139
    longitude = 77.209
    profile = @{
      sensitive = $false
      children = $false
      outdoorExercise = $false
      commute = "none"
      cookingSmoke = $false
    }
    history = @()
  } | ConvertTo-Json -Depth 5
  $reply = Invoke-RestMethod `
    -Uri "$baseUrl/api/chat" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body `
    -TimeoutSec 25
  if (-not $reply.answer -or $reply.mode -notin @("ai", "fallback")) {
    throw "Chat endpoint returned an invalid response."
  }
  if ($RequireGemini -and $reply.mode -ne "ai") {
    throw "Chat returned deterministic fallback; check provider credentials, quota, and rate limits."
  }
  if ($RequireGemini -and (-not $reply.referencedActionIds.Count -or -not $reply.sourceIds.Count)) {
    throw "Gemini returned no validated action or source references for this question."
  }
  Write-Output "SaafSky chat route: passed (mode=$($reply.mode), actions=$($reply.referencedActionIds.Count), sources=$($reply.sourceIds.Count))."
  Write-Output "Live provider smoke check complete. No keys or response text were printed."
} catch {
  $status = $null
  try { $status = $_.Exception.Response.StatusCode.value__ } catch { }
  if ($status) {
    throw "Live provider smoke check failed (HTTP $status). Check provider availability, configuration, quota, and local rate limits."
  }
  throw
} finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
  }
  foreach ($log in @($stdoutLog, $stderrLog)) {
    if (Test-Path -LiteralPath $log) {
      Remove-Item -LiteralPath $log -Force
    }
  }
}
