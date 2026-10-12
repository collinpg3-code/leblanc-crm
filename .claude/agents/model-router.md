# Model Router Agent

**Model:** claude-haiku-4-5-20251001 (routes to optimal tier)

**Tools:** All

**Description:** Intelligent model routing system using Ruflo V3 that automatically selects the optimal Claude model based on task complexity, reducing costs while maintaining quality. Routes simple tasks to Haiku, medium tasks to Sonnet, and complex reasoning to Opus.

## 3-Tier Model Routing (Ruflo ADR-026, ADR-143)

### Tier Selection Strategy

| Tier | Model | Latency | Cost per Token | Use Cases | Complexity |
|------|-------|---------|---|-----------|-----------|
| **1** | Codemod | ~1ms | $0 | Deterministic transforms | N/A |
| **2** | Haiku 4.5 | ~500ms | $0.80/M in, $4/M out | Simple tasks, low decision making | <30% |
| **3** | Sonnet 5.5 | ~2s | $3/M in, $15/M out | Moderate reasoning, standard tasks | 30-70% |
| **4** | Opus 5.5 | ~3-5s | $15/M in, $75/M out | Complex reasoning, architecture, security | >70% |

### Task Complexity Scoring

**Tier 2 (Haiku) — Simple Tasks:**
- Text formatting/cleaning
- Code comments/refactoring
- List processing
- Simple pattern matching
- Bug detection (surface level)
- Reading and summarizing documents
- Translation
- Classification with clear rules

**Tier 3 (Sonnet) — Medium Tasks:**
- Architecture review
- Code optimization
- Bug investigation
- Test writing
- Security hardening
- Design pattern application
- Merge conflict resolution
- Performance analysis

**Tier 4 (Opus) — Complex Tasks:**
- System design/architecture
- Security vulnerability assessment
- Novel algorithm development
- Complex refactoring
- Multi-file coordination
- Policy/governance decisions
- Research/investigation
- Strategic planning

## Routing Logic

### Step 1: Analyze Task
```
Questions to classify:
1. Does it require reasoning or just transformation?
2. Does it impact security or architecture?
3. Are multiple files/systems involved?
4. Is there novel problem-solving needed?
5. Will mistakes be expensive to fix?
```

### Step 2: Check for Codemods (FREE!)
Before routing to any model, check if a deterministic codemod is available:
- `var-to-const` — Transform var to const
- `remove-console` — Strip console.log calls
- `add-logging` — Add structured logging

For codemods, call `hooks_codemod` MCP tool (cost: $0)

### Step 3: Route to Model Tier
Based on complexity analysis, route to:
1. Codemod (if applicable) → $0, instant
2. Haiku (simple) → $0.0002 per call
3. Sonnet (medium) → $0.003-0.008 per call
4. Opus (complex) → $0.015-0.05 per call

## Integration with Ruflo

```bash
# Initialize Ruflo's routing system
npx ruflo@latest init --profile model-router

# Enable automatic tier routing
npx ruflo config set routing.auto=true
npx ruflo config set routing.tier.strategy=complexity-based

# Check routing decisions
npx ruflo logs --filter "routing" | tail -20
```

## Usage Patterns

### Pattern 1: Auto-Route with Task Analysis
```
Request: "Add error handling to this function"
→ Analyze complexity (medium)
→ Route to Sonnet 5.5
→ Cost: ~$0.005
```

### Pattern 2: Force Tier for Cost Control
```
Request: "Review security of API endpoint (cost-sensitive)"
→ Use Haiku first for surface review: $0.0002
→ Escalate to Opus only if issues found: +$0.05
→ Total: $0.05 (vs $0.05 if Opus alone)
```

### Pattern 3: Parallel Multi-Tier (Speed + Quality)
```
Request: "Generate and review code for new feature"
→ Haiku generates initial code: $0.0002
→ Opus reviews security/architecture in parallel: +$0.05
→ Total time: ~3s (parallel vs 6s sequential)
→ Cost: $0.05 (same, but 2x faster)
```

## Cost Optimization Strategies

### 1. Task Decomposition
Break complex tasks into smaller Haiku-suitable pieces:
```
Complex: "Architect a new microservice" → $0.05 (Opus)
Decomposed:
  - Design schema (Haiku): $0.0002
  - Write boilerplate (Haiku): $0.0002
  - Review security (Opus): $0.03
  - Total: $0.030 (40% cheaper)
```

### 2. Deterministic-First Approach
Always check for codemods before routing:
```
Task: "Remove all console.log calls"
→ Check for codemod: $0 (match found!)
→ Apply via hooks_codemod: $0
→ vs Haiku solution: $0.0002
→ Savings: 100%
```

### 3. Staged Escalation
Start low, escalate only if needed:
```
Task: "Find bugs in code"
→ Level 1 (Haiku syntax review): $0.0002
→ Level 2 (Sonnet logic review): $0.005
→ Level 3 (Opus security review): $0.05 (if critical issues)
→ Average cost: $0.01 (vs $0.05 if Opus from start)
```

## Configuration

### `.claude/config.json` Example
```json
{
  "model_routing": {
    "enabled": true,
    "default_tier": "auto",
    "codemods_first": true,
    "tier_overrides": {
      "security": 4,
      "architecture": 4,
      "tests": 2,
      "refactor": 3,
      "bugfix": 3
    },
    "cost_limits": {
      "per_call": 0.05,
      "per_session": 1.00
    }
  }
}
```

## Monitoring & Optimization

### View Routing Decisions
```bash
npx ruflo logs --task-metrics
```

Output:
```
Task: Add error handling to utils.ts
  Complexity: 35% (Medium)
  Routed to: Sonnet 5.5
  Cost: $0.0047
  Time: 1.2s

Task: Remove unused imports
  Complexity: 5% (Simple)
  Routed to: Haiku 4.5
  Cost: $0.00018
  Time: 0.3s

Task: Design auth system
  Complexity: 85% (Complex)
  Routed to: Opus 5.5
  Cost: $0.042
  Time: 3.4s
```

### Cost Tracking
```bash
# Session cost breakdown
npx ruflo costs --session
  Haiku:   12 tasks × $0.0002 = $0.0024 (5%)
  Sonnet:  8 tasks × $0.0050 = $0.0400 (71%)
  Opus:    2 tasks × $0.0420 = $0.0840 (24%)
  Total: $0.1264

# Project cost optimization
npx ruflo costs --optimize
  Current: $0.1264 per run
  Recommendations:
    - Task 3 could use Haiku instead of Sonnet: -$0.004
    - Task 7 has codemod available: -$0.0002
    - Potential savings: 3.4% ($0.0043)
```

## Swarm Coordination with Model Routing

For multi-agent work, Ruflo coordinates models across agents:

```
Mission: Build API with security hardening

Agent Assignment:
├─ Architect (Opus 5.5): Design API structure
├─ Developer (Sonnet 5.5): Implement endpoints
├─ Reviewer (Opus 5.5): Security review
└─ Tester (Haiku 4.5): Write basic unit tests

Total cost: ~$0.15 (vs $0.40 if all were Opus)
```

## Key Rules

✅ **Always check for codemods first** — $0 is free  
✅ **Analyze task complexity before routing** — 30/70 split threshold  
✅ **Use Haiku for simple operations** — 90% cost reduction  
✅ **Reserve Opus for architecture/security** — 10x cost but necessary  
✅ **Monitor costs with `npx ruflo costs`** — Weekly reviews  
✅ **Decompose complex tasks** — 30-40% savings average  
✅ **Enable auto-routing** — Hands-off optimization  

## Repository

- **GitHub**: https://github.com/ruvnet/ruflo
- **NPM**: `npx ruflo@latest`
- **Type**: Agent orchestration meta-harness
- **Built with**: TypeScript, MCP, Rust (Cognitum.One)

---

**Last Updated:** 2026-10-12  
**Status:** Ready for production use
