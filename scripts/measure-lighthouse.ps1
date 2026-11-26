param(
  [int]$Port = 3101,
  [string]$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$nextCli = Join-Path $repoRoot "node_modules\next\dist\bin\next"
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
if (-not (Test-Path -LiteralPath $nextCli)) {
  throw "Next.js is not installed. Run npm ci before performance measurement."
}
if (-not (Test-Path -LiteralPath $ChromePath)) {
  throw "Chrome was not found at the configured path. Pass -ChromePath to locate it."
}

$tempRoot = [System.IO.Path]::GetTempPath()
$stdoutLog = Join-Path $tempRoot "saafsky-lighthouse-server-$Port.out.log"
$stderrLog = Join-Path $tempRoot "saafsky-lighthouse-server-$Port.err.log"
$baseUrl = "http://127.0.0.1:$Port"
$routes = @("/", "/planner", "/indoor", "/impact", "/assistant", "/settings", "/scenarios")
$server = $null

try {
  $arguments = '"{0}" start --hostname 127.0.0.1 --port {1}' -f $nextCli, $Port
  $server = Start-Process `
    -FilePath $nodePath `
    -ArgumentList $arguments `
    -WorkingDirectory $repoRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    if ($server.HasExited) {
      throw "Production server exited before performance measurement started."
    }
    try {
      $null = Invoke-WebRequest -Uri $baseUrl -TimeoutSec 2
      $ready = $true
      break
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }
  if (-not $ready) { throw "Production server did not become ready on port $Port." }

  foreach ($route in $routes) {
    $safeRoute = if ($route -eq "/") { "home" } else { $route.Trim("/") }
    $reportPath = Join-Path $tempRoot "saafsky-lighthouse-$safeRoute.json"
    $lighthouseArguments = @(
      "--yes",
      "lighthouse@13.6.0",
      "$baseUrl$route",
      "--chrome-path=$ChromePath",
      "--output=json",
      "--output-path=$reportPath",
      "--quiet",
      "--only-categories=performance"
    )
    & npx @lighthouseArguments
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $reportPath)) {
      throw "Lighthouse failed for route $route."
    }

    $report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
    $resources = @($report.audits.'resource-summary'.details.items)
    $scriptBytes = (
      $resources |
        Where-Object { $_.resourceType -eq "Script" } |
        Measure-Object -Property transferSize -Sum
    ).Sum
    if ($null -eq $scriptBytes) { $scriptBytes = 0 }
    $culture = [Globalization.CultureInfo]::InvariantCulture
    $lcp = $report.audits.'largest-contentful-paint'.numericValue.ToString('F0', $culture)
    $tbt = $report.audits.'total-blocking-time'.numericValue.ToString('F0', $culture)
    $cls = $report.audits.'cumulative-layout-shift'.numericValue.ToString('F3', $culture)
    $js = ([double]$scriptBytes).ToString('F0', $culture)
    Write-Output "${route}: score=$([int]($report.categories.performance.score * 100)); LCP=${lcp}ms; TBT=${tbt}ms; CLS=$cls; JS=${js}B"
    Remove-Item -LiteralPath $reportPath -Force
  }
} finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
    $server.WaitForExit()
  }
  if ($server) { $server.Dispose() }
  foreach ($file in @($stdoutLog, $stderrLog)) {
    if (Test-Path -LiteralPath $file) {
      Remove-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue
    }
  }
}
