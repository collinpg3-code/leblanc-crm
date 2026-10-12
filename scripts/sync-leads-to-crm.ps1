param(
  [Parameter(Mandatory=$true)]
  [string]$CsvPath,

  [Parameter(Mandatory=$false)]
  [string]$CrmUrl = "http://localhost:3001",

  [Parameter(Mandatory=$false)]
  [string]$Username = "CollinLB12",

  [Parameter(Mandatory=$false)]
  [string]$Password = "REDACTED"
)

# Verify CSV exists
if (-not (Test-Path $CsvPath)) {
  Write-Host "CSV file not found: $CsvPath" -ForegroundColor Red
  exit 1
}

# Read CSV
$leads = @()
$csv = Import-Csv $CsvPath

foreach ($row in $csv) {
  $leads += @{
    name = $row.business
    contact = $row.contact
    industry = $row.industry
    location = $row.location
    stack = $row.stack
  }
}

Write-Host "Found $($leads.Count) leads in CSV" -ForegroundColor Cyan

# Login
Write-Host "Logging in to CRM..." -ForegroundColor Cyan
try {
  $body = ConvertTo-Json @{ username = $Username; password = $Password }
  $loginResponse = Invoke-RestMethod -Uri "$CrmUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $body
  $token = $loginResponse.token
  Write-Host "Login successful" -ForegroundColor Green
} catch {
  Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

# Sync leads
Write-Host "Syncing leads to CRM..." -ForegroundColor Cyan
try {
  $syncBody = ConvertTo-Json @{ leads = $leads } -Depth 10
  $response = Invoke-RestMethod -Uri "$CrmUrl/api/leads/sync" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body $syncBody

  Write-Host "Sync complete!" -ForegroundColor Green
  Write-Host "   Imported: $($response.imported)" -ForegroundColor Green
  Write-Host "   Total leads: $($response.total)" -ForegroundColor Green
} catch {
  Write-Host "Sync failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

Write-Host "Done! Access CRM at: $CrmUrl" -ForegroundColor Green
