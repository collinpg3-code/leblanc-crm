# LeBlanc Solutions — Model Optimization Strategy

## Complexity Analysis & Model Assignment

Using Ruflo's 3-tier model routing (Haiku → Sonnet → Opus), optimized for cost and quality:

### Workflow Stages with Model Assignments

| Stage | Agent | Task Complexity | Critical Impact | Assigned Model | Reasoning | Est. Cost/Run |
|-------|-------|---|---|---|---|---|
| **1. Find prospects** | lead-scout | 40% (Medium) | Revenue (medium) | **Sonnet 5.5** | Uses external tool; needs reasoning for ICP match & personalization; not security-critical | $0.005 |
| **2. Sales** | — | N/A | High | **You (human)** | Human decision; no model | $0 |
| **3. Scan** | scan-operator | 75% (High) | **CRITICAL** ⚠️ | **Opus 5.5** | Security findings drive liability; interpretation is critical; must not miss or misinterpret issues | $0.045 |
| **4. Report** | report-studio | 25% (Simple) | Medium (client-facing) | **Sonnet 5.5** | Mostly templating & formatting; readable language matters; not novel reasoning | $0.003 |
| **5a. Remediation** | fix-and-build | 75% (High) | **CRITICAL** ⚠️ | **Opus 5.5** | Security implementation; code changes affect client security; mistakes are expensive | $0.050 |
| **5b. Redesign** | website-designer | 80% (Very High) | High | **Opus 5.5** | Design taste, accessibility compliance, security-by-default; UX/visual quality matters; multi-skill orchestration | $0.055 |

---

## Complexity Scoring Breakdown

### Lead Scout (40% — Sonnet 5.5)

**Why Medium?**
- ✅ External tool handles heavy lifting (OpenOutreach finds prospects)
- ✅ Reasoning is straightforward: does prospect fit ICP?
- ✅ No security decisions
- ✅ Format output as CSV

**Cost justification:**
- Haiku ($0.0002): Too limited for personalization & ICP reasoning
- **Sonnet ($0.003-0.005): Perfect fit; handles reasoning + output quality**
- Opus ($0.045): Overkill; not security-critical

---

### Scan Operator (75% — Opus 5.5) ⚠️ **CRITICAL**

**Why High? (Opus Required)**
- 🚨 **Security liability**: Missed findings can expose client to breach
- 🚨 **Interpretation matters**: Raw Penthera output needs careful analysis
- 🚨 **Authorization gate**: Must verify scope before scanning
- 🚨 **Compliance**: Audit trail, scope documentation

**Why NOT Sonnet?**
- Sonnet might miss subtle findings
- Security is not a place to save $0.04

**Mistakes are expensive:**
- Missed SQL injection vulnerability → client gets hacked
- Misinterpreted scope → scan outside authorized range → legal issue
- Wrong confidence level on finding → client dismisses real issue

**Cost justification:**
- Haiku ($0.0002): **NO** — security too critical
- Sonnet ($0.005): **NO** — findings interpretation too important
- **Opus ($0.045): YES** — security demands best reasoning

---

### Report Studio (25% — Sonnet 5.5)

**Why Simple-Medium? (Sonnet Sufficient)**
- ✅ Input is structured JSON (Penthera findings)
- ✅ Output is formatted HTML/PDF (templating)
- ✅ Language quality matters (plain-English explanations)
- ✅ No novel reasoning; mostly transformation

**Mistakes are low-cost:**
- Wrong font size? Re-render in 2 minutes
- Typo? Update template
- Not security-critical

**Cost justification:**
- Haiku ($0.0002): Could work (templating); but language clarity matters
- **Sonnet ($0.003): Best value; handles formatting + readable prose**
- Opus ($0.045): Overkill

---

### Fix & Build (75% — Opus 5.5) ⚠️ **CRITICAL**

**Why High? (Opus Required)**
- 🚨 **Security implementation**: Changes affect client security posture
- 🚨 **Code correctness**: Bugs in fixes can break client site or introduce new vulnerabilities
- 🚨 **Scope mapping**: Must match findings → code changes 1:1
- 🚨 **Architecture decisions**: When/how to refactor vs. patch

**Why NOT Sonnet?**
- Sonnet might miss edge cases in security fixes
- Security hardening requires deep reasoning
- Client code quality reflects on LeBlanc

**Mistakes are expensive:**
- Broken authentication fix → client site down
- Incomplete CSP → still vulnerable
- XSS fix that introduces SQL injection → worse than original

**Cost justification:**
- Haiku ($0.0002): **NO** — code quality too important
- Sonnet ($0.005): **NO** — security implementation too nuanced
- **Opus ($0.050): YES** — security + code correctness demand best model**

---

### Website Designer (80% — Opus 5.5) ⚠️ **VERY HIGH**

**Why Very High? (Opus Required)**
- 🚨 **Design taste decisions**: Premium UI/UX affects client's brand
- 🚨 **Accessibility compliance**: WCAG 2.2 AA non-negotiable
- 🚨 **Security-by-default**: Architecture decisions embedded in design
- 🚨 **Multi-skill orchestration**: Coordinates design-taste, image-to-code, web-design-guidelines, Playwright
- 🚨 **Client-facing deliverable**: New site is the final product

**Why NOT Sonnet?**
- Sonnet might miss accessibility edge cases
- Design taste is subjective; Opus does better UX
- Skill invocation requires careful reasoning

**Mistakes are expensive:**
- ADA lawsuit risk (accessibility not WCAG AA)
- Security holes baked into design
- Poor UX → client unhappy

**Cost justification:**
- Haiku ($0.0002): **NO** — design complexity too high
- Sonnet ($0.005): Could work for simpler redesigns; but new builds are complex
- **Opus ($0.055): YES** — design quality + compliance + security demand best model**

---

## Cost Optimization Strategies for LeBlanc

### Strategy 1: Staged Escalation (Find Issues First, Deep-Dive Only If Needed)

**For Scan Operator:**
```
Task: Scan clientsite.com

Level 1 — Filter issues (Sonnet): $0.005
  ↓ Identify what looks like critical findings
  ↓ Flag anything needing Opus review

Level 2 — Deep analysis (Opus): $0.045 (only if issues found)
  ↓ Verify findings
  ↓ Assess security impact
  ↓ Confirm scope compliance

Average cost: $0.05 (vs $0.045 if Opus alone)
→ Savings if few issues: 10-20%
```

### Strategy 2: Parallel Review (Speed + Quality)

**For Fix & Build:**
```
Task: Implement security fixes

Parallel 1 (Sonnet): Generate initial fix code: $0.005
Parallel 2 (Opus): Security review of fix code: $0.045
  ↓ Total time: ~3s (parallel) vs 6s (sequential)
  ↓ Total cost: $0.050 (same as Opus alone, but 2x faster)
```

### Strategy 3: Task Decomposition

**For Website Designer:**
```
Task: Build secure-by-default site from mockup

Decompose into:
- Image → code conversion (Sonnet): $0.005
- Design taste direction (Sonnet): $0.005
- Accessibility audit (Sonnet): $0.003
- Final orchestration & approval (Opus): $0.045
  ↓ Total: $0.058 (vs $0.055 if Opus alone)
  ↓ Quality: Higher (multiple models catch different issues)
```

---

## Model Configuration for `.claude/settings.json`

```json
{
  "model_routing": {
    "enabled": true,
    "default_tier": "auto",
    "tier_overrides": {
      "lead-scout": "sonnet-5-5",
      "scan-operator": "opus-5-5",
      "report-studio": "sonnet-5-5",
      "fix-and-build": "opus-5-5",
      "website-designer": "opus-5-5"
    },
    "cost_limits": {
      "per_scan": 0.05,
      "per_engagement": 2.00
    }
  }
}
```

---

## Cost Per Engagement (Example)

### Scenario: Small Business Website Security Check + Remediation

| Task | Model | Quantity | Cost/Unit | Total |
|------|-------|----------|-----------|-------|
| Find prospect (OpenOutreach) | Sonnet | 1 | $0.005 | $0.005 |
| Sales (human) | — | 1 | $0 | $0 |
| Scan (Penthera) | Opus | 1 | $0.045 | $0.045 |
| Report (PDF) | Sonnet | 1 | $0.003 | $0.003 |
| Remediation (code fixes) | Opus | 1 | $0.050 | $0.050 |
| **Total Claude cost** | — | — | — | **$0.103** |
| Client charge | — | — | — | $100-$500+ |
| **Margin** | — | — | — | **~99.98%** |

---

## Monitoring & Adjustments

### Track per engagement:
```bash
# See routing decisions & costs
npx ruflo logs --task-metrics

# Monthly cost breakdown
npx ruflo costs --project leblanc --month current
```

### Adjust if:
- **Opus cost exceeds 20% of engagement price**: Decompose into smaller Sonnet tasks
- **Security issues missed by Sonnet**: Keep Scan Operator on Opus
- **Website designs come back incomplete**: Keep Designer on Opus
- **Lead generation costs are high**: Evaluate if Haiku could handle simpler segments

---

## Key Principles

✅ **Security first (Opus):** Scan Operator, Fix & Build, Website Designer stay on Opus  
✅ **Language quality (Sonnet):** Lead Scout, Report Studio get Sonnet  
✅ **Cost margins are huge:** Claude cost is <0.1% of engagement price  
✅ **Errors are expensive:** Don't cheap-out on security  
✅ **Scale with Sonnet where safe:** Lead generation, reporting, simple tasks  

---

**Last Updated:** 2026-10-12  
**Current Setup:** Sonnet for lead/reporting, Opus for security/design
