# LeBlanc Solutions — Operating Workflow

> A home inspection for your website. Clear findings, ranked fixes, one flat price —
> and now, done-for-you remediation and secure redesign.

This repo is the operation. Each **division** is a Claude Code agent in `.claude/agents/`,
and each repeatable **procedure** is a skill in `.claude/skills/`. The engine (Penthera)
lives at `C:\tools\penthera`.

## The pipeline

```
Lead Scout (OpenOutreach) → [YOU: Sales] → Scan Operator → Report Studio → Fix & Build / Website Designer
   (find + email)            (follow-up)      (scan JSON)     (branded PDF)   (remediation / redesign)
```

| Stage | Division (agent) | Tool/Skill | Output |
|-------|------------------|-----------|--------|
| 1. Find & email prospects | `lead-scout` | **OpenOutreach** (AI lead finder + emailer) | Qualified leads auto-emailed from your mailbox |
| 1b. *Or:* Build shortlist | `lead-scout` | `find-leads` (manual, public-data-only) | `clients/<batch>/leads.csv` for review |
| 2. Sell | **you** | — | signed authorization |
| 3. Scan | `scan-operator` | `run-scan` | `scans/<domain>-<date>.json` |
| 4. Report | `report-studio` | `generate-report` | `reports/<domain>-report.pdf` |
| 5. Fix / redesign | `fix-and-build` | `remediation-pack`, `secure-redesign` | fixes + rebuilt site |
| 5b. *Or:* Design new site | `website-designer` | design skills (taste, image-to-code, web-design-guidelines) | new secure-by-default site |

## Two hard boundaries (non-negotiable)

1. **No scanning without authorization.** Lead Scout works from **public data only** — a
   normal browser visit and public records. Active scanning (Penthera against a live site)
   happens **only** after a signed client authorization, and runs from **your** terminal via
   `scan-client.ps1` (the Claude harness blocks outbound scanning of third parties, by design).
2. **You hold the keys.** Fix & Build produces the exact changes and can build sites, but
   **you** log into client hosting/DNS and press the final "publish/save." Claude never enters
   client credentials.

## Services (the offer)

| Service | What | Price (starting) |
|---------|------|------------------|
| Security check | The scan + ranked plain-English report + one re-check | $100 |
| Remediation | We implement the fixes (headers, CSP, login, DMARC, plugins) | from $450 |
| Secure redesign | Rebuild the site secure-by-default (stack decided per client) | quote |

> Pricing is a starting framework — set your own per engagement.

## Quick commands

### 1. Find and email leads (OpenOutreach)
```powershell
# First time: onboard (describe your product + target market)
cd C:\tools\leblanc-solutions\openoutreach-cli
uv tool run openoutreach init

# Then: find & email leads
uv tool run openoutreach run 5    # find and email 5 qualified leads
```
Emails go from your mailbox. Each lead gets a personalized message explaining why they fit.

### 2. Review and follow up
- Check your Sent folder for the emails that were sent
- Leads reply to your inbox
- Advance conversations manually

### 3. Scan an authorized client (run in YOUR terminal)
```powershell
C:\tools\penthera\scan-client.ps1 clientsite.com -Client "Client Name"
```

### 4. Build the branded PDF from the scan JSON
```powershell
cd C:\tools\leblanc-solutions
node report/render.js "C:\tools\penthera\reports\clientsite.com-<datetime>.json" "Client Name"
```

## Layout

```
brand/brand.json              Single source of truth for colors, fonts, voice
report/template/              The report template (plain-English finding library)
report/render.js              scan JSON -> branded HTML + PDF
scans/                        Raw Penthera JSON per client
reports/                      Delivered PDFs
clients/                      Per-engagement folders (authorization, leads, notes)
.claude/agents/               The divisions
.claude/skills/               The procedures
```
