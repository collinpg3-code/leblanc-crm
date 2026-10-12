# Lead Scout Auto-Sync to CRM
# Run this to: Find leads with Lead Scout → Auto-import into CRM

$CsvPath = "C:\tools\leblanc-solutions\clients\batch1\leads.csv"
$CrmUrl = "http://localhost:3001"
$CrmUsername = "CollinLB12"
$CrmPassword = "REDACTED"

Write-Host "`n🔍 Running Lead Scout..." -ForegroundColor Cyan
uv tool run openoutreach run 5

Write-Host "`n⏳ Waiting for CSV..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

if (Test-Path $CsvPath) {
  Write-Host "✅ CSV found! Importing..." -ForegroundColor Green

  # Read CSV
  $csv = Get-Content $CsvPath -Raw
  $lines = $csv -split "`n" | Select-Object -Skip 1
  $leads = @()

  foreach ($line in $lines) {
    if ($line.Trim()) {
      $parts = $line -split ',' | ForEach-Object { $_.Trim() }
      if ($parts.Length -ge 2) {
        $leads += @{
          name = $parts[0]
          contact = $parts[1]
          industry = if ($parts.Length -gt 2) { $parts[2] } else { "Unknown" }
          location = if ($parts.Length -gt 3) { $parts[3] } else { "Unknown" }
          stack = if ($parts.Length -gt 4) { $parts[4] } else { "Unknown" }
          findings = if ($parts.Length -gt 5) { $parts[5] } else { $null }
          website = if ($parts.Length -gt 6) { $parts[6] } else { $null }
        }
      }
    }
  }

  if ($leads.Count -gt 0) {
    $token = "$CrmUsername`:$CrmPassword"
    $body = @{ leads = $leads } | ConvertTo-Json -Depth 10

    try {
      $response = Invoke-RestMethod -Uri "$CrmUrl/api/leads/sync" `
        -Method Post `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $token" } `
        -Body $body

      Write-Host "`n✨ SUCCESS! Imported $($response.imported) leads (Total: $($response.total))" -ForegroundColor Green
      Write-Host "🌐 Open http://localhost:3000 to see them!`n" -ForegroundColor Cyan
    } catch {
      Write-Host "❌ Import failed: $($_.Exception.Message)" -ForegroundColor Red
    }
  } else {
    Write-Host "⚠️ No valid leads found in CSV" -ForegroundColor Yellow
  }
} else {
  Write-Host "❌ CSV not found at $CsvPath" -ForegroundColor Red
  Write-Host "Make sure Lead Scout ran successfully`n" -ForegroundColor Yellow
}
