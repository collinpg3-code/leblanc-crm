# Design Kit — high-quality website build & review

The external skills and references the **Fix & Build** division uses to design and rebuild
sites (ours and clients'), plus the compliance rule behind why we build to code.

## The five tools

| # | Tool | Repo / source | What it gives us | How Fix & Build uses it |
|---|------|---------------|------------------|-------------------------|
| 1 | **Taste Skill** | `Leonxlnx/taste-skill` | Premium frontend taste (`design-taste-frontend`), style presets (minimalist/brutalist/soft), audit/redesign | Set the design direction — "anti-slop" UI |
| 2 | **Web Design Guidelines** | `vercel-labs/agent-skills` | `web-design-guidelines` — 100+ rules for **accessibility**, performance, typography, forms, focus, dark mode, i18n | The **compliance gate**: every build reviewed before hand-off |
| 3 | **Awesome Design (DESIGN.md)** | `VoltAgent/awesome-design-md` | 74 brand design systems (Ferrari, Bugatti, BMW M, Apple, Stripe…) as `DESIGN.md` | Pull a proven design system to match a client's industry |
| 4 | **Image-to-Code** | `Leonxlnx/taste-skill` *(same repo as #1)* | `image-to-code` — reference image → working frontend pipeline | Turn a look/mockup into real code |
| 5 | **Playwright** | current Playwright via `npx playwright` *(the `microsoft/playwright-cli` repo is archived)* | Browser automation: screenshots + visual/accessibility QA | Before/after showcase shots; automated WCAG checks on every redesign |

> **Standardized on `Leonxlnx/taste-skill`** (most current: pushed 2026-10-11, ~95k stars) —
> it carries both `design-taste-frontend` (#1) and `image-to-code` (#4). Do **not** also
> install the `tasteskill/tasteskill` fork; stacking forks gives duplicate, conflicting skills.

## How to add them (two ways)

### A. Skills CLI (installs the skills into this project)
> These pull third-party skill packages. Review before relying on them. Run from the project root.
```powershell
npx skills add vercel-labs/agent-skills --skill web-design-guidelines
npx skills add https://github.com/Leonxlnx/taste-skill            # all taste skills
#   or a single one:
npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend
npx skills add https://github.com/Leonxlnx/taste-skill --skill image-to-code
```
Installed skills land in `.claude/skills/` and become available to every agent in the project
(including `fix-and-build`). Re-run to update.

### B. Claude Code plugin (taste-skill only)
In an **interactive** `claude` terminal (these slash commands need the terminal dialog):
```
/plugin marketplace add Leonxlnx/taste-skill
/plugin install taste-skill@taste-skill
```

### Playwright (screenshots + accessibility QA)
Use current Playwright, not the archived `microsoft/playwright-cli`:
```powershell
npm install -D @playwright/test @axe-core/playwright
npx playwright install chromium
npx playwright screenshot --browser=chromium https://site.com before.png   # quick shot
```
Fix & Build uses it for before/after showcase shots and for automated WCAG checks
(`@axe-core/playwright`) on every redesign before hand-off.

### Brand design references (no install — fetch on demand)
```powershell
.\design-kit\get-design-ref.ps1 -List        # see all 74 brands
.\design-kit\get-design-ref.ps1 ferrari      # -> design-refs\ferrari\DESIGN.md (+ previews)
```
Then point the build at `design-refs\<brand>\DESIGN.md`.

## The compliance rule — build to code, avoid lawsuits

Fast / "vibe-coded" sites don't just have security holes — they invite **lawsuits** before
they have a single paying user:
- **Accessibility (ADA / WCAG):** inaccessible sites draw serial-plaintiff demand letters and
  suits against small businesses. This is why every build runs through `web-design-guidelines`
  and targets WCAG 2.2 AA.
- **Privacy (GDPR / CCPA):** missing or broken cookie-consent, trackers firing before consent,
  and leaking personal data carry statutory penalties.

So "secure redesign" always means **secure AND compliant**: WCAG-reviewed, consent handled,
no personal data where it shouldn't be. It's both the right build and a selling point.

## Showcase (our own site)
When we rebuild **leblancsols.com**, these tools produce the showcase: before/after mini
-redesigns and sample pages that demonstrate what we deliver — proof, not claims.
