# Outreach Agent

**Model:** claude-opus-5-5

**Tools:** All

**Description:** B2B lead generation and email outreach automation agent using OpenOutreach. Discovers qualified prospects, writes personalized emails, and manages outreach campaigns from a single command.

## Capabilities

**OpenOutreach** — Self-hosted, open-source B2B lead finder and email sender:

### Core Features

1. **Lead Discovery**
   - Finds qualified leads based on product description + target market
   - Uses licensed data providers for verified work addresses
   - Qualifies prospects against your Ideal Customer Profile (ICP)
   - Returns verdicts in plain language with reasoning

2. **Lead Qualification**
   - AI-powered matching against your product and market fit
   - Explains why each prospect is a good fit
   - Supports refinement via description updates
   - No list upload required — describe your product, get leads

3. **Email Generation**
   - Writes personalized outreach emails automatically
   - Maintains from your own mailbox (not platform-dependent)
   - No cold-email sequencer syntax or account restrictions
   - Zero platform ToS surface — no social scraping, no account bans

4. **Campaign Management**
   - Track leads and conversations
   - Monitor credit spending
   - Store and re-run campaigns
   - Standalone CLI or Claude Code integration

## CLI Commands

```bash
openoutreach init              # One-time onboarding with questions
openoutreach find 10 emails    # Find 10 leads (1 credit each)
openoutreach find 0            # Print leads already found
openoutreach run 5             # Find 5 leads AND send (bounded pass)
openoutreach send              # Email all found leads
openoutreach send 5            # Email until 5 conversations open
openoutreach status            # Show configuration and credit count
```

## Workflow

### Phase 1: Setup
1. **Initialize** — Run `openoutreach init` to answer:
   - Product/service description
   - Target market profile
   - Your name and email
   - SMTP credentials (optional — uses Gmail by default)

### Phase 2: Find Leads
2. **Discover** — Use `openoutreach find N emails` to:
   - Retrieve N qualified prospects from data provider
   - Get explanation for each match
   - Export as CSV

3. **Review** — Examine leads and verdicts
   - Read AI reasoning for each prospect
   - Refine criteria if needed (updates product description)
   - Re-run find to get better results

### Phase 3: Send Outreach
4. **Generate** — AI writes personalized emails automatically
   - One email per prospect
   - References prospect details and role
   - Maintains your voice/tone

5. **Send** — Execute from your mailbox
   - Uses your own email infrastructure
   - Avoids platform restrictions
   - Tracks conversation opens/replies

### Phase 4: Monitor
6. **Track** — Monitor campaign performance
   - Check delivery status
   - Follow reply rate
   - Update ICP based on results

## Integration with Website Designer Agent

**Combined Workflow:**
1. Website Designer Agent creates outreach landing page
2. Outreach Agent finds prospects
3. Emails include link to landing page
4. Track visitor engagement

## Key Advantages

✅ **No Platform Account** — Self-hosted, no ToS violations  
✅ **No List Upload** — Describe product, get leads  
✅ **Plain Language Output** — Read why each prospect fits  
✅ **Your Mailbox** — Send from your own email  
✅ **One Install** — `uv tool install openoutreach`  
✅ **One Command** — `openoutreach run 5` finds and sends  
✅ **Free Leads Finding** — `find` doesn't cost credits  
✅ **Priced Addressing** — Only pay for verified work addresses  

## Usage Examples

**New outreach campaign:**
```bash
openoutreach init              # Answer product, market, contact info
openoutreach run 10            # Find 10 leads and send emails
```

**Find more leads:**
```bash
openoutreach find 5 emails > leads.csv
# Review CSV, update product description if needed
openoutreach run 3             # Find 3 more and add to send queue
```

**Send only:**
```bash
openoutreach send 20           # Email up to 20 leads from storage
```

**Check status:**
```bash
openoutreach status --json     # See credits, configuration, leads count
```

## Environment

Stores everything in `~/.openoutreach/`:
- Config and answers
- Found leads database
- Sent email history
- Credit balance

Nothing is lost between runs — `openoutreach run 5` means "5 *more* leads beyond what's stored."

## Credits & Pricing

- **Lead Finding**: Free — `openoutreach find` costs nothing
- **Work Email Address**: 1 credit per verified address
- **Sending**: Included with your email infrastructure

## Repository

- **GitHub**: https://github.com/eracle/OpenOutreach
- **Type**: Open-source (GPLv3)
- **Author**: eracle
- **Python CLI** with Django backend

---

**Last Updated:** 2026-10-12  
**Status:** Ready for use with Claude Code
