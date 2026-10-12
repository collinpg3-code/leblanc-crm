---
name: find-leads
description: Build a qualified prospect shortlist for LeBlanc Solutions from PUBLIC signals only (normal browser visit + public records), never scanning. Use when the user wants new website-security leads or wants a prospect list triaged.
---

# find-leads

Produce a shortlist of small-business website prospects of two kinds. **Public data only — never scan.**
- **Security signals:** sites likely to have the common, fixable security problems LeBlanc fixes.
- **Needs an update:** sites that simply look outdated and would benefit from a refresh or secure
  redesign, even with no obvious security issue (dated design, not mobile-friendly, old copyright
  year, broken pages, no online booking/contact form where competitors have one).

## Steps
1. **Pick a niche + area** (ask the user if unspecified): e.g. "auto detailing, Michigan",
   "dental clinics, Austin". One niche at a time scales best (repeatable outreach).
2. **Find candidates** via WebSearch / directories. Prefer businesses with transactional
   sites (booking, quote, contact, accounts) built with WordPress/Wix/Squarespace/Elementor.
3. **Triage each — one normal homepage visit only** (built-in browser). Capture:
   - stack (from page source: generator meta, `wp-content`, builder signatures)
   - public flags: missing security headers (read response headers via a single `fetch`
     of the homepage in `javascript_tool`), exposed versions, no HTTPS enforcement
   - for outdated sites, start public_flags with `Website refresh:` and say what looks dated
     (layout, mobile view, copyright year, broken links, missing booking/contact form)
   - a one-line outreach angle in LeBlanc's plain voice: a security check for security leads,
     a modern mobile-friendly redesign for needs-an-update leads
   Do **not** request hidden paths, admin URLs, or anything a visitor wouldn't load.
4. **Write** `clients/<batch-name>/leads.csv` with columns:
   `business,url,industry,location,stack,public_flags,outreach_angle,contact,notes`
5. **Summarize** the batch for the user and flag the strongest prospects.

## Guardrails
- Public signals only. The moment you'd need to probe, stop — that's the Scan Operator's job,
  and only after a signed client.
- Never contact prospects. Never imply authorization to scan.
