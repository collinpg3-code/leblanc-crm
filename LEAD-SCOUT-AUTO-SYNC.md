# Lead Scout Auto-Sync Setup

## How It Works

1. **Lead Scout finds leads** → Exports CSV
2. **Auto-sync script** → Watches for new CSV, imports automatically
3. **CRM updates** → New leads appear instantly

---

## CSV Format (Required Columns)

```
business,contact,industry,location,stack,findings,website
```

| Column | Required | Example |
|--------|----------|---------|
| business | YES | Tech Startup Inc |
| contact | YES | cto@techstartup.io |
| industry | NO | SaaS |
| location | NO | San Francisco, CA |
| stack | NO | React + Node.js |
| findings | NO | Missing CSP, HSTS, weak auth |
| website | NO | techstartup.io |

---

## Option 1: Manual Upload (Current)

```powershell
# Step 1: Lead Scout exports CSV
uv tool run openoutreach run 5
# Outputs: C:\tools\leblanc-solutions\clients\batch1\leads.csv

# Step 2: Open CRM
http://localhost:3000

# Step 3: Click "Import Leads" button
# Step 4: Upload CSV file
# Done! Leads appear instantly
```

---

## Option 2: Auto-Sync Script (Recommended)

Create a PowerShell **scheduled task** that auto-imports leads:

```powershell
# Create a watcher script
$script = @'
$csvPath = "C:\tools\leblanc-solutions\clients\batch1\leads.csv"
$crmUrl = "http://localhost:3001"

if (Test-Path $csvPath) {
  Write-Host "Syncing leads..." -ForegroundColor Cyan
  & "C:\tools\leblanc-solutions\scripts\sync-leads-to-crm.ps1" `
    -CsvPath $csvPath `
    -CrmUrl $crmUrl
}
'@

# Save to file
$script | Out-File -FilePath "C:\tools\leblanc-solutions\scripts\auto-sync-watcher.ps1" -Encoding UTF8

# Run in background (PowerShell ISE or task scheduler)
& "C:\tools\leblanc-solutions\scripts\auto-sync-watcher.ps1"
```

---

## Option 3: Lead Scout Direct API Call (Advanced)

Have Lead Scout **push directly to CRM API** instead of exporting CSV:

```powershell
# Lead Scout exports leads, then calls CRM API directly
$leads = @(
  @{ name = "Tech Startup Inc", contact = "cto@techstartup.io", website = "techstartup.io", findings = "Missing CSP, HSTS" }
)

$body = @{ leads = $leads } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/leads/sync" `
  -Method Post `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer <token from /api/auth/login>" } `
  -Body $body
```

---

## Example CSV File

```csv
business,contact,industry,location,stack,findings,website
Tech Startup Inc,cto@techstartup.io,SaaS,San Francisco CA,React + Node.js,Missing CSP + HSTS + rate limiting,techstartup.io
Local Dental,admin@localdental.com,Healthcare,Austin TX,WordPress,Weak auth + exposed config,localdental.com
Ecommerce Shop,owner@eshop.com,Retail,Miami FL,Shopify,No HTTPS enforcement,eshop.com
```

---

## What Appears in CRM

Each lead shows:
- **Company name** (clickable lead card)
- **Website** (blue link)
- **Security findings** (orange box)
- **Contact info** + industry + stack
- **Service offered** + estimated value
- **Progress tracker**

---

## Next: Deploy to Netlify

Once auto-sync is working:

1. Push code to GitHub
2. Connect to Netlify
3. Live at `crm.leblancsols.com`
4. Lead Scout syncs from anywhere

See [DEPLOYMENT.md](DEPLOYMENT.md) for steps.

---

## Troubleshooting

**Leads not importing?**
- Check CSV format (7 columns)
- Verify CRM is running
- Check browser console for errors

**Website link not clickable?**
- Make sure `website` column is populated
- Don't include `https://` prefix - just domain name

**Findings not showing?**
- Populate `findings` column in CSV
- Example: "Missing CSP, weak auth, no HTTPS"

---

## Quick Test

```powershell
# Create test CSV
$csv = @"
business,contact,industry,location,stack,findings,website
TestCo,test@testco.com,Tech,Boston MA,React,Missing CSP,testco.com
"@

$csv | Out-File -FilePath "C:\test-leads.csv" -Encoding UTF8

# Import via CRM UI or sync script
C:\tools\leblanc-solutions\scripts\sync-leads-to-crm.ps1 -CsvPath "C:\test-leads.csv" -CrmUrl "http://localhost:3001"
```

---

**Ready?** Test with sample CSV, then set up auto-sync!
