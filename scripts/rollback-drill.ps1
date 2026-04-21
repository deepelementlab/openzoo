Param(
  [string]$ComposeFile = "docker-compose.yml",
  [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"
$rollbackStart = Get-Date

Write-Host "== OpenZoo rollback drill =="

Write-Host "Step 1: Record pre-rollback state"
try {
  $preHealth = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
  Write-Host "  Pre-rollback status: $($preHealth.status) (database: $($preHealth.database))"
} catch {
  Write-Host "  Pre-rollback: server not reachable (expected if testing cold start)"
}

Write-Host "Step 2: stop server (simulate failure)"
docker compose -f $ComposeFile stop server

Write-Host "Step 3: start server again (rollback target)"
docker compose -f $ComposeFile up -d server

Write-Host "Step 4: wait for healthy"
$maxAttempts = 30
$attempt = 0
$healthy = $false
while ($attempt -lt $maxAttempts) {
  $attempt++
  Start-Sleep -Seconds 2
  try {
    $h = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
    if ($h.status -eq "ok" -and $h.database -eq "up") {
      $healthy = $true
      break
    }
    Write-Host "  Waiting... ($attempt/$maxAttempts) status=$($h.status) db=$($h.database)"
  } catch {
    Write-Host "  Waiting... ($attempt/$maxAttempts) not reachable"
  }
}

if (-not $healthy) {
  Write-Host "[FAIL] Server did not become healthy within $($maxAttempts * 2) seconds"
  exit 1
}

$rollbackDuration = (Get-Date) - $rollbackStart
Write-Host "Step 5: verify data consistency"
try {
  $body = @{ limit = 5 } | ConvertTo-Json
  $headers = @{ "Content-Type" = "application/json" }
  $result = Invoke-RestMethod -Uri "$BaseUrl/rpc/workspace/list" -Method Post -Body $body -Headers $headers
  Write-Host "  Workspace list: ok ($($result.workspaces.Count) workspaces)"
} catch {
  Write-Host "  Workspace list: $_"
}

Write-Host ""
Write-Host "Rollback drill completed"
Write-Host "RTO (Recovery Time Objective): $($rollbackDuration.TotalSeconds.ToString('F1')) seconds"
