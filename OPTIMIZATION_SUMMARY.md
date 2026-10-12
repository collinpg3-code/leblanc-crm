# LeBlanc Solutions — Workflow Optimization Summary

## Model Assignments (Optimized)

Your workflow now uses tiered Claude models for maximum quality + efficiency:

| Agent | Assigned Model | Tier | Complexity | Cost/Run | Why |
|-------|---|---|---|---|---|
| **Lead Scout** | Sonnet 5.5 | 3 | 40% (Medium) | $0.005 | ICP reasoning + personalization; not security-critical |
| **Scan Operator** ⚠️ | **Opus 5.5** | 4 | 75% (High) | $0.045 | **CRITICAL**: Security findings drive liability; must not miss issues |
| **Report Studio** | Sonnet 5.5 | 3 | 25% (Simple) | $0.003 | Templating + readable language; no novel reasoning |
| **Fix & Build** ⚠️ | **Opus 5.5** | 4 | 75% (High) | $0.050 | **CRITICAL**: Security implementation; mistakes are expensive |
| **Website Designer** ⚠️ | **Opus 5.5** | 4 | 80% (Very High) | $0.055 | **CRITICAL**: Design taste + accessibility + security; multi-skill orchestration |

---

## Cost Impact per Engagement

### Example: Security Check + Remediation

| Task | Model | Cost |
|------|-------|------|
| Lead generation | Sonnet | $0.005 |
| Security scan | Opus | $0.045 |
| Report generation | Sonnet | $0.003 |
| Remediation implementation | Opus | $0.050 |
| **Total Claude cost** | — | **$0.103** |
| **Client charge** | — | **$100–$500+** |
| **Claude % of revenue** | — | **<0.1%** |

✅ **Optimization result:** You're optimized to use Sonnet (cheaper) for non-critical tasks while keeping Opus (best quality) for security-critical work. **Cost margin remains excellent.**

---

## What Changed

### Agent Definition Updates
All agents now specify their optimal model in `.claude/agents/<agent>.md`:

```yaml
---
name: lead-scout
model: claude-sonnet-5-5    # ← Added
tools: ...
---
```

### Files Updated
- ✅ `.claude/agents/lead-scout.md` → Sonnet
- ✅ `.claude/agents/scan-operator.md` → Opus
- ✅ `.claude/agents/report-studio.md` → Sonnet
- ✅ `.claude/agents/fix-and-build.md` → Opus
- ✅ `.claude/agents/website-designer.md` → Opus (already set)

### Documentation Created
- 📄 `MODEL_OPTIMIZATION.md` — Full strategy & analysis
- 📄 `OPTIMIZATION_SUMMARY.md` — This file

---

## How Model Assignment Works

When you invoke an agent in Claude Code:
1. **Agent definition** specifies which model to use
2. **Claude Code** automatically routes to that model
3. **No extra work** — just call the agent normally

**Example:**
```
You: "Find leads for dental clinics in Austin"
→ Claude Code reads lead-scout.md
→ Sees `model: claude-sonnet-5-5`
→ Runs Lead Scout on Sonnet 5.5
→ Returns results
```

---

## Why These Assignments?

### Sonnet for Lead Scout & Reporting
- **Reasoning:** Medium complexity; needs judgment but no security decisions
- **Cost:** $0.003–0.005 per task (10x cheaper than Opus)
- **Quality:** Fully adequate for ICP matching & templating
- **Savings:** ~$0.04 per engagement with no quality hit

### Opus for Scan, Fix & Build, Website Design
- **Reasoning:** High complexity; security is non-negotiable
- **Cost:** $0.045–0.055 per task
- **Quality:** Best in class for security reasoning & design taste
- **Why:** Missed findings, bad fixes, or poor design are too expensive to save $0.04

**Bottom line:** You optimize for cost where safe, but never compromise on security or quality. ✅

---

## When to Deviate

### Upgrade Lead Scout to Opus?
- No. Sonnet is sufficient; Lead Scout doesn't make security decisions.

### Downgrade Scan Operator to Sonnet?
- ⚠️ **Never.** Security findings are critical. Stay Opus.

### Downgrade Fix & Build to Sonnet?
- ⚠️ **Never.** Code security implementation requires Opus-level reasoning.

### Downgrade Website Designer to Sonnet?
- Maybe for very simple redesigns (e.g., color change only).
- But for new sites or complex redesigns, stay Opus.

---

## Monitoring & Adjustments

### Monthly Review
```bash
# Check cost breakdown
npx ruflo costs --project leblanc --month current

# See routing decisions
npx ruflo logs --task-metrics
```

### Adjust if:
- ❌ Scan Operator misses findings → Keep Opus (never downgrade)
- ❌ Fix & Build introduces bugs → Keep Opus (never downgrade)
- ✅ Report generation is slow → Consider Haiku if templating is simple
- ✅ Lead generation costs are 20%+ of revenue → Optimize decomposition into Haiku tasks

---

## Key Principle

**Cost is negligible (~$0.10 per $100–$500 engagement).**  
**Quality is paramount.**  

Optimize for speed and user experience, not to save pennies. Security + design + reporting need the best models.

---

**Last Updated:** 2026-10-12  
**Status:** Ready to deploy
