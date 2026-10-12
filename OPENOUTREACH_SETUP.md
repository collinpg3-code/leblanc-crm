# OpenOutreach Integration — Lead Scout Setup

OpenOutreach is an AI agent that finds qualified B2B prospects and emails them from your mailbox.
The Lead Scout now uses OpenOutreach to automate lead discovery and outreach.

## One-Time Setup

### 1. Install OpenOutreach
```powershell
uv tool install openoutreach
```
(If you don't have `uv`, install it first: `pip install uv`)

### 2. Onboard
```powershell
cd C:\tools\leblanc-solutions
uv tool run openoutreach init
```

When prompted:
- **Product**: Describe LeBlanc Solutions. Example:
  ```
  We scan websites for security issues (missing headers, exposed versions, weak auth),
  deliver a ranked plain-English report, and offer remediation or secure redesign.
  ```
- **Target market**: Define who needs this. Example:
  ```
  Small businesses with transactional sites (booking, forms, accounts): dental,
  detailing, trades, salons, clinics, local services. Built with WordPress/Wix/Squarespace.
  ```
- **Email**: Your business email (OpenOutreach sends outreach from here)
- **Other details**: Follow the wizard

## Using Lead Scout with OpenOutreach

### Basic: Find & Email Leads
```powershell
uv tool run openoutreach run 5
```
- Finds 5 qualified prospects matching your ICP
- Buys verified work emails
- Emails each prospect from your mailbox
- Costs 1 credit per email

### With goal specified
```powershell
uv tool run openoutreach run 10   # find 10 leads
uv tool run openoutreach run 1    # find 1 lead (test)
```

### What happens
1. **Discover**: Finds prospects matching your ICP from licensed data
2. **Qualify**: AI judges each one against your target market description
3. **Enrich**: Buys verified work email for each qualified lead
4. **Send**: Emails from your mailbox with personalized reason why they fit
5. **Narrate**: Shows you each step as it goes

### After sending
- Emails appear in your Sent folder (drafts prefixed `[DRAFT]` for review before send)
- Leads reply to your inbox
- You follow up manually in your email client
- When ready to close, use the Scan Operator for security scanning + report

## Manual Lead Hunting (Fallback)

If you prefer to review leads before outreach, use Lead Scout in manual mode:
```powershell
# Ask Lead Scout for a CSV of prospects to review
# Example: "Find 10 dental clinics in Austin with WordPress sites"
```
Lead Scout will build a public-data-only shortlist in `clients/<batch>/leads.csv`
for you to review and contact manually.

## Troubleshooting

### `uv tool not found`
Install: `pip install uv`

### `openoutreach init` hangs
Press Ctrl+C. Try again or check OpenOutreach docs: https://github.com/eracle/OpenOutreach

### Emails in draft
Review in your email client (`[DRAFT]` prefix), then approve send.

### Out of credits
OpenOutreach charges per email. Check your account at openoutreach.app.

## References
- OpenOutreach docs: https://github.com/eracle/OpenOutreach
- LeBlanc Workflow: [WORKFLOW.md](WORKFLOW.md)
- Lead Scout agent: [.claude/agents/lead-scout.md](.claude/agents/lead-scout.md)
