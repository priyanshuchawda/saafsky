param(
  [switch]$Browser
)

$ErrorActionPreference = "Stop"
$checks = @(
  @{ Name = "Formatting"; Args = @("run", "format:check") },
  @{ Name = "ESLint"; Args = @("run", "lint") },
  @{ Name = "TypeScript"; Args = @("run", "typecheck") },
  @{ Name = "Unit tests and coverage"; Args = @("run", "test:coverage") },
  @{ Name = "Production build"; Args = @("run", "build") },
  @{ Name = "Client JavaScript budget"; Args = @("run", "check:bundle") }
)

if ($Browser) {
  $checks += @{ Name = "Production browser tests"; Args = @("run", "test:e2e:production") }
  $checks += @{ Name = "Public API protection tests"; Args = @("run", "test:protection") }
}

foreach ($check in $checks) {
  Write-Output "--- $($check.Name) ---"
  $arguments = $check.Args
  $output = & npm @arguments 2>&1
  $exitCode = $LASTEXITCODE
  $lines = @($output | ForEach-Object { "$_" } | Where-Object { $_.Trim() })

  if ($exitCode -ne 0) {
    $errors = @($lines | Select-String -Pattern "error|failed|FAIL|\u2716" -CaseSensitive:$false)
    if ($errors.Count -gt 0) {
      $errors | Select-Object -Last 20 | ForEach-Object { Write-Output $_.Line }
    }
    $lines | Select-Object -Last 20 | ForEach-Object { Write-Output $_ }
    exit $exitCode
  }

  if ($check.Name -eq "Unit tests and coverage") {
    $lines |
      Select-String -Pattern "^\u2139 tests |^\u2139 pass |^\u2139 fail |^\u2139 all files" |
      ForEach-Object { Write-Output $_.Line }
  } else {
    $lines | Select-Object -Last 5 | ForEach-Object { Write-Output $_ }
  }
}

Write-Output "Verification complete."
