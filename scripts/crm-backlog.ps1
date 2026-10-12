<#
  CRM lead backlog helper. Signs in with $env:CRM_PASSWORD (never printed).

  Status:  .\scripts\crm-backlog.ps1 -Status
           Prints how many leads are waiting, how many are needed to reach -Target,
           and every business already known (backlog + pipeline) to avoid duplicates.
  Push:    .\scripts\crm-backlog.ps1 -PushCsv clients\batch\leads.csv
           Adds every row of a Lead Scout CSV to the backlog (duplicates skipped).
  Push:    .\scripts\crm-backlog.ps1 -PushJson clients\batch\leads.json
           Adds a JSON array of leads (with "brief" objects) to the backlog.
  Briefs:  .\scripts\crm-backlog.ps1 -NeedsBriefs [-Limit 15]
           Prints leads (pipeline + backlog) that have no sales brief yet, as JSON.
           .\scripts\crm-backlog.ps1 -PushBriefs clients\batch\briefs.json
           Saves a JSON array of { "id": "...", "brief": { ... } } onto those leads.
  Backup:  .\scripts\crm-backlog.ps1 -ExportTo clients\archive\leads-backup.json
           Saves every pipeline and backlog lead to a local JSON file.
  Reset:   .\scripts\crm-backlog.ps1 -ResetAll -ExportTo <backup.json>
           Exports first (required), then removes all leads except signed authorizations.
#>
param(
  [switch]$Status,
  [string]$PushCsv,
  [string]$PushJson,
  [switch]$NeedsBriefs,
  [string]$PushBriefs,
  [int]$Limit = 15,
  [string]$ExportTo,
  [switch]$ResetAll,
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

if ($ResetAll -and -not $ExportTo) { Write-Error '-ResetAll requires -ExportTo so a backup is saved first.' }

if ($ExportTo) {
  $dir = Split-Path $ExportTo -Parent
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $raw = (Invoke-WebRequest -Uri "$CrmUrl/api/leads/export" -Headers $headers -UseBasicParsing -TimeoutSec 60).Content
  [IO.File]::WriteAllText((Join-Path (Resolve-Path ($(if ($dir) { $dir } else { '.' }))) (Split-Path $ExportTo -Leaf)), $raw)
  $e = $raw | ConvertFrom-Json
  "EXPORTED pipeline=$(@($e.engagements).Count) backlog=$(@($e.backlog).Count) -> $ExportTo"
}

if ($ResetAll) {
  $check = [IO.File]::ReadAllText((Resolve-Path $ExportTo)) | ConvertFrom-Json
  if (-not $check.exportedAt) { Write-Error 'Backup file looks wrong; not resetting.' }
  $r = Invoke-RestMethod -Uri "$CrmUrl/api/leads/reset" -Method Post -ContentType 'application/json' -Headers $headers -Body '{"confirm":"DELETE ALL LEADS"}' -TimeoutSec 60
  "RESET removed_pipeline=$($r.removed.pipeline) removed_backlog=$($r.removed.backlog) kept_signed=$($r.kept)"
}

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

function Read-JsonArray($path) {
  if (-not (Test-Path $path)) { Write-Error "File not found: $path" }
  $text = [IO.File]::ReadAllText((Resolve-Path $path))
  $null = $text | ConvertFrom-Json  # fails loudly on invalid JSON
  if ($text.TrimStart()[0] -ne '[') { Write-Error "$path must contain a JSON array" }
  $text
}

if ($PushJson) {
  # Sent as raw JSON so nested brief objects keep their full depth.
  $body = '{"leads":' + (Read-JsonArray $PushJson) + '}'
  $r = Invoke-RestMethod -Uri "$CrmUrl/api/backlog" -Method Post -ContentType 'application/json; charset=utf-8' -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 60
  "ADDED=$($r.added) SKIPPED=$($r.skipped) BACKLOG_NOW=$($r.count)"
}

if ($NeedsBriefs) {
  $r = Invoke-RestMethod -Uri "$CrmUrl/api/leads/needs-brief?limit=$Limit" -Headers $headers -TimeoutSec 60
  "MISSING_BRIEFS_TOTAL=$($r.total)"
  $r.leads | ConvertTo-Json -Depth 4
}

if ($PushBriefs) {
  $items = (Read-JsonArray $PushBriefs) | ConvertFrom-Json
  $ok = 0; $failed = 0
  foreach ($item in $items) {
    $body = @{ brief = $item.brief } | ConvertTo-Json -Depth 8
    try {
      Invoke-RestMethod -Uri "$CrmUrl/api/leads/$($item.id)/brief" -Method Put -ContentType 'application/json; charset=utf-8' -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 60 | Out-Null
      $ok++
    } catch { $failed++; "FAILED $($item.id): $($_.Exception.Message)" }
  }
  "BRIEFS_SAVED=$ok FAILED=$failed"
}
