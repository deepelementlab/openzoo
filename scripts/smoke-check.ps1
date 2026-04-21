Param(
  [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"
$pass = 0
$fail = 0

Write-Host "== OpenZoo smoke check =="

try {
  $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
  if ($health.status -eq "ok" -and $health.database -eq "up") {
    Write-Host "[PASS] health: ok (database: $($health.database))"
    $pass++
  } elseif ($health.status -eq "ok") {
    Write-Host "[WARN] health: ok but database: $($health.database)"
    $pass++
  } else {
    Write-Host "[FAIL] health: $($health.status) (database: $($health.database))"
    $fail++
  }
} catch {
  Write-Host "[FAIL] health endpoint unreachable: $_"
  $fail++
}

try {
  $body = @{ limit = 1 } | ConvertTo-Json
  $headers = @{ "Content-Type" = "application/json" }
  Invoke-RestMethod -Uri "$BaseUrl/rpc/workspace/list" -Method Post -Body $body -Headers $headers | Out-Null
  Write-Host "[PASS] workspace list: reachable"
  $pass++
} catch {
  Write-Host "[FAIL] workspace list: $_"
  $fail++
}

try {
  Invoke-RestMethod -Uri "$BaseUrl/metrics" -Method Get -ErrorAction SilentlyContinue | Out-Null
  Write-Host "[PASS] metrics: reachable"
  $pass++
} catch {
  Write-Host "[WARN] metrics: not available (Prometheus not enabled?)"
}

Write-Host ""
Write-Host "Results: $pass passed, $fail failed"
if ($fail -gt 0) {
  exit 1
}
Write-Host "smoke check finished"
