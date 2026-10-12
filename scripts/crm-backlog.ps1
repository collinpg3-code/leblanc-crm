<#
  CRM lead backlog helper. Signs in with $env:CRM_PASSWORD (never printed).

  Status:  .\scripts\crm-backlog.ps1 -Status
           Prints how many leads are waiting, how many are needed to reach -Target,
           and every business already known (backlog + pipeline) to avoid duplicates.
  Push:    .\scripts\crm-backlog.ps1 -PushCsv clients\batch\leads.csv
           Adds every row of a Lead Scout CSV to the backlog (duplicates skipped).
#>
param(
  [switch]$Status,
  [string]$PushCsv,
  [int]$Target = 50,
  [string]$CrmUrl = 'https://leblanc-backend.onrender.com',
  [string]$Username = 'CollinLB12'
)

$ErrorActionPreference = 'Stop'

# Apps opened before the variable was saved don't see it in $env:, so also read it from the user profile.
if (-not $env:CRM_PASSWORD) { $env:CRM_PASSWORD = [Environment]::GetEnvironmentVariable('CRM_PASSWORD', 'User') }
if (-not $env:CRM_PASSWORD) {
  Write-Error 'CRM_PASSWORD is not set. Run: [Environment]::SetEnvironmentVariable(''CRM_PASSWORD'', ''<password>'', ''User'') and reopen PowerShell.'
}

# Render's free plan sleeps; the first request can take ~1 minute.
$login = Invoke-RestMethod -Uri "$CrmUrl/api/auth/login" -Method Post -ContentType 'application/json' -TimeoutSec 120 `
  -Body (@{ username = $Username; password = $env:CRM_PASSWORD } | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.token)" }

if ($Status) {
  $b = Invoke-RestMethod -Uri "$CrmUrl/api/backlog?known=1" -Headers $headers -TimeoutSec 60
  $needed = [Math]::Max(0, $Target - $b.count)
  "BACKLOG_COUNT=$($b.count)"
  "TARGET=$Target"
  "NEEDED=$needed"
  'KNOWN_BUSINESSES (do not research these again):'
  $b.known | ForEach-Object { "- $($_.name)$(if ($_.website) { " | $($_.website)" })" }
}

if ($PushCsv) {
  if (-not (Test-Path $PushCsv)) { Write-Error "CSV not found: $PushCsv" }
  # Send rows as-is; the backend maps Lead Scout columns (business, url, public_flags, ...).
  $leads = @(Import-Csv $PushCsv)
  $body = @{ leads = $leads } | ConvertTo-Json -Depth 5
  $r = Invoke-RestMethod -Uri "$CrmUrl/api/backlog" -Method Post -ContentType 'application/json' -Headers $headers -Body $body -TimeoutSec 60
  "ADDED=$($r.added) SKIPPED=$($r.skipped) BACKLOG_NOW=$($r.count)"
}
