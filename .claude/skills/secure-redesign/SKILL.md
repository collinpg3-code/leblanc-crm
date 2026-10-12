---
name: secure-redesign
description: Redesign an authorized client's website to be secure by default. Stack decided per client — harden-in-place or rebuild as a fast static/modern site. Use when a client buys a secure redesign.
---

# secure-redesign

Decide the approach **per client**, then build with security carried in from the start.
Authorized work only; the user holds credentials and does the final publish.

## Decide the stack
- **Harden-in-place** when the current CMS is sound and they mainly need safety + a polish:
  apply the `remediation-pack`, update components, tidy the theme.
- **Rebuild as static/modern** when the old site is fragile, bloated, plugin-heavy, or risky:
  fewer moving parts = smaller attack surface. Good for brochure/booking/lead-gen sites.
- If unsure, lay out the trade-offs (cost, maintenance, CMS needs) and let the user choose.

## Build principles (either path)
- Security by default: send the full header set + a tested CSP; enforce HTTPS/HSTS.
- No secrets in client-side code; forms post to a vetted endpoint or service.
- Minimal dependencies, all current; nothing unmaintained.
- Keep the client's brand unless they asked for a refresh; mobile-first and fast.

## Compliance — build to code, avoid lawsuits
Fast-built sites invite lawsuits before they have users. Every redesign must be:
- **Accessible — WCAG 2.2 AA.** Review with the `web-design-guidelines` skill
  (`vercel-labs/agent-skills`). Inaccessible sites draw ADA/serial-plaintiff demand letters.
- **Privacy-correct.** Cookie-consent in place; no non-essential trackers before consent; no
  personal data mishandled (GDPR/CCPA).
Treat "secure redesign" as **secure + compliant**, and sell it that way.

## Build method — use the Design Kit (`design-kit/README.md`)
- Set direction with **Taste Skill** `design-taste-frontend`; use `image-to-code` to turn a
  reference image into frontend code.
- Pull a proven design system for the client's industry:
  `design-kit/get-design-ref.ps1 <brand>` → `design-refs/<brand>/DESIGN.md`, and build to it.
- Preview locally or as an artifact for client sign-off before anything goes live. Stage
  changes; never push breaking changes straight to production.
- Before hand-off, run the build through `web-design-guidelines` and fix what it flags.

## QA with Playwright (screenshots + accessibility)
- Capture **before/after** screenshots (`npx playwright screenshot ...`) for the showcase and
  the client's proof.
- Run automated **WCAG checks** with `@axe-core/playwright` and fix violations — this is the
  evidence that the site is built to code (ADA/accessibility), not just claimed to be.
See `design-kit/README.md` for setup.

## Hand-off
Deliver the finished files + exact deploy steps. Then run `run-scan` against the new site
(staging or post-deploy, with authorization) to prove it's clean, and generate a fresh report.
