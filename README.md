# LeBlanc Solutions — operation

Website-security service: find prospects → scan authorized clients → deliver a branded
plain-English report → remediate or securely redesign.

## Quick Navigation

- **Workflow:** [WORKFLOW.md](WORKFLOW.md) — pipeline, divisions, boundaries, commands
- **CRM Setup:** [CRM-SETUP.md](CRM-SETUP.md) — deploy & use the sales dashboard
- **Deployment:** [DEPLOYMENT.md](DEPLOYMENT.md) — deploy to Netlify + configure domain
- **Agents:** `.claude/agents/` — lead-scout, scan-operator, report-studio, fix-and-build
- **Skills:** `.claude/skills/` — find-leads, run-scan, generate-report, remediation-pack, secure-redesign
- **Brand:** `brand/brand.json` (colors, fonts, voice)
- **Report engine:** `report/render.js` + `report/template/report-template.js`
- **Scan tool:** `C:\tools\penthera` (security scanner wrapper)

## Two boundaries
1. No scanning without written authorization — Lead Scout uses public data only; scans run
   from the user's own terminal.
2. The user holds all client credentials and presses the final publish/save.

## Setup notes
- Node is installed at `C:\Program Files\nodejs` (not always on the tool shell PATH — prepend it).
- `npm install` already run here (puppeteer + Chromium for PDF rendering).

## The CRM System

**Track leads, calls, and deals all in one place.**

- **Access:** Login dashboard at `crm.leblancsols.com` (or localhost:3000 in development)
- **Username:** CollinLB12 | **Password:** REDACTED
- **Features:** Pipeline view, lead cards, call logging, stage tracking, metrics
- **Auto-sync:** Lead Scout agent → CRM (bulk import leads)

**Setup:**
```bash
cd frontend && npm install && npm run dev    # Port 3000
cd backend && npm install && npm run dev     # Port 3001
```

**Sync leads from Lead Scout:**
```powershell
.\scripts\sync-leads-to-crm.ps1 -CsvPath "clients/batch/leads.csv"
```

**Deploy to Netlify:**
See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions.

---

## Generate a report
```powershell
node report/render.js "<scan.json>" "<Client Name>"
node qa-shot.js   # QA screenshots -> reports/_qa_*.png
```
