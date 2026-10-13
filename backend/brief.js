/**
 * Sales briefs: a plug-and-play talk track stored on each lead.
 *
 * Briefs are written by the Lead Scout refill job (public data + one homepage
 * visit) and shown in the CRM lead detail. Shape:
 *   summary            2-3 sentences on the business and its site
 *   recommendedService 'Website Redesign' | 'Security Check' | 'Security Fixes' | 'Redesign + Security'
 *   opener             first line to say on the call
 *   websiteNeeds[]     what their site needs (redesign-first)
 *   benefits[]         how that helps their business
 *   securityIssues[]   { priority: high|medium|low, issue, whyItMatters }
 *   talkingPoints[]    ordered checklist for the call
 *   pitch              ~30-second pitch
 */

const str = (v, max) => (v == null ? '' : String(v).trim().slice(0, max));
const list = (v, max, itemMax) => (Array.isArray(v) ? v : []).map(x => str(x, itemMax)).filter(Boolean).slice(0, max);
const SERVICES = ['Website Redesign', 'Security Check', 'Security Fixes', 'Redesign + Security'];
const SERVICE_VALUE = { 'Website Redesign': 0, 'Security Check': 100, 'Security Fixes': 450, 'Redesign + Security': 0 };
const PRIORITY = ['high', 'medium', 'low'];
const num = (v) => (Number.isFinite(+v) && v !== null && v !== '' ? Math.max(0, Math.min(100, Math.round(+v))) : null);

function cleanBrief(raw) {
  let b = raw;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch { return null; }
  }
  if (!b || typeof b !== 'object') return null;

  const brief = {
    summary: str(b.summary, 800),
    recommendedService: SERVICES.includes(b.recommendedService) ? b.recommendedService : 'Website Redesign',
    opener: str(b.opener, 400),
    websiteNeeds: list(b.websiteNeeds, 8, 240),
    benefits: list(b.benefits, 8, 240),
    securityIssues: (Array.isArray(b.securityIssues) ? b.securityIssues : [])
      .map(i => ({
        priority: PRIORITY.includes(i?.priority) ? i.priority : 'medium',
        issue: str(i?.issue, 200),
        whyItMatters: str(i?.whyItMatters, 300)
      }))
      .filter(i => i.issue)
      .sort((a, c) => PRIORITY.indexOf(a.priority) - PRIORITY.indexOf(c.priority))
      .slice(0, 8),
    talkingPoints: list(b.talkingPoints, 10, 240),
    pitch: str(b.pitch, 1200),
    // Objective site scores (Lighthouse mobile + certificate check)
    siteScore: b.siteScore && typeof b.siteScore === 'object' ? {
      mobileSpeed: num(b.siteScore.mobileSpeed), accessibility: num(b.siteScore.accessibility),
      seo: num(b.siteScore.seo), bestPractices: num(b.siteScore.bestPractices),
      certOk: typeof b.siteScore.certOk === 'boolean' ? b.siteScore.certOk : null,
      loadTime: str(b.siteScore.loadTime, 20)
    } : null,
    leadScore: num(b.leadScore),
    whyJuicy: str(b.whyJuicy, 400),
    // How to close this specific lead
    winPlan: b.winPlan && typeof b.winPlan === 'object' ? {
      offer: str(b.winPlan.offer, 400),
      closers: list(b.winPlan.closers, 6, 300),
      objections: (Array.isArray(b.winPlan.objections) ? b.winPlan.objections : [])
        .map(o => ({ objection: str(o?.objection, 160), response: str(o?.response, 500) }))
        .filter(o => o.objection && o.response).slice(0, 6)
    } : null,
    // Hand-tailored emails (override the CRM's templates)
    emails: (Array.isArray(b.emails) ? b.emails : [])
      .map(e => ({ label: str(e?.label, 60), subject: str(e?.subject, 160), body: str(e?.body, 4000) }))
      .filter(e => e.subject && e.body).slice(0, 6),
    writtenAt: new Date().toISOString()
  };
  return brief.summary || brief.talkingPoints.length ? brief : null;
}

// The person to ask for. Only business-published or public-record details
// (their website, Google listing, state business registry, chamber listings).
const CONFIDENCE = ['confirmed', 'likely'];
function cleanDecisionMaker(raw) {
  let d = raw;
  if (typeof d === 'string') {
    try { d = JSON.parse(d); } catch { return null; }
  }
  if (!d || typeof d !== 'object') return null;
  const email = str(d.email, 200);
  const phone = str(d.phone, 40);
  const dm = {
    name: str(d.name, 120),
    role: str(d.role, 120),
    phone: /^[0-9+().\-\s,x]{7,40}$/i.test(phone) ? phone : '',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '',
    source: str(d.source, 200),
    confidence: CONFIDENCE.includes(d.confidence) ? d.confidence : 'likely',
    howToReach: str(d.howToReach, 300),
    foundAt: new Date().toISOString()
  };
  return dm.name || dm.howToReach ? dm : null;
}

function registerBriefRoutes(app, { authenticateToken, loadData, saveData }) {
  // Leads with no decision-maker yet, for the refill job.
  app.get('/api/leads/needs-contact', authenticateToken, (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 15, 50);
    const { engagements, backlog } = loadData();
    const pick = (l, kind) => ({ id: l.id, kind, name: l.name, website: l.website || null, location: l.location, contact: l.contact || null });
    const missing = [
      ...engagements.filter(e => !e.decisionMaker && !e.archived).map(e => pick(e, 'lead')),
      ...backlog.filter(l => !l.decisionMaker).map(l => pick(l, 'backlog'))
    ];
    res.json({ total: missing.length, leads: missing.slice(0, limit) });
  });

  // What Collin kept, progressed, archived or deleted, newest first.
  app.get('/api/leads/feedback', authenticateToken, (req, res) => {
    const fb = [...(loadData().leadFeedback || [])].reverse();
    const count = (v) => fb.filter(f => f.verdict.startsWith(v)).length;
    res.json({ summary: { liked: count('progressed') + count('interested'), disliked: count('archived') + count('deleted') + count('not_interested') }, feedback: fb.slice(0, 200) });
  });

  // Save the decision-maker on a pipeline or backlog lead.
  app.put('/api/leads/:id/contact', authenticateToken, (req, res) => {
    const dm = cleanDecisionMaker(req.body.decisionMaker);
    if (!dm) return res.status(400).json({ error: 'Need at least a name or a howToReach note.' });
    const data = loadData();
    const lead = data.engagements.find(e => e.id === req.params.id) || data.backlog.find(l => l.id === req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    lead.decisionMaker = dm;
    saveData(data);
    res.json({ ok: true });
  });

  // Leads (pipeline + backlog) that don't have a brief yet, for the refill job.
  app.get('/api/leads/needs-brief', authenticateToken, (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 15, 50);
    const { engagements, backlog } = loadData();
    const pick = (l, kind) => ({ id: l.id, kind, name: l.name, website: l.website || null, industry: l.industry, location: l.location, stack: l.stack, findings: l.findings || null });
    const open = engagements.filter(e => !e.brief && !e.archived).map(e => pick(e, 'lead'));
    const waiting = backlog.filter(l => !l.brief).map(l => pick(l, 'backlog'));
    res.json({ total: open.length + waiting.length, leads: [...open, ...waiting].slice(0, limit) });
  });

  // Save a brief on a pipeline lead or backlog lead by id.
  app.put('/api/leads/:id/brief', authenticateToken, (req, res) => {
    const brief = cleanBrief(req.body.brief);
    if (!brief) return res.status(400).json({ error: 'Brief needs at least a summary or talking points.' });
    const data = loadData();
    const lead = data.engagements.find(e => e.id === req.params.id) || data.backlog.find(l => l.id === req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    lead.brief = brief;
    if (lead.stage === 'prospect' && lead.source !== 'website') {
      lead.service = brief.recommendedService;
      if (!lead.estimatedValue || lead.estimatedValue === 100) lead.estimatedValue = SERVICE_VALUE[brief.recommendedService];
    }
    saveData(data);
    res.json({ ok: true });
  });
}

// Implicit lead feedback from what Collin does in the CRM, so the lead finder
// can learn what he likes (progressed/interested) and doesn't (archived/deleted).
function recordFeedback(data, lead, verdict) {
  if (!data.leadFeedback) data.leadFeedback = [];
  data.leadFeedback.push({
    verdict,
    name: lead.name,
    industry: lead.industry || null,
    location: lead.location || null,
    website: lead.website || null,
    source: lead.source || null,
    leadScore: lead.brief?.leadScore ?? null,
    whyJuicy: lead.brief?.whyJuicy || null,
    recommendedService: lead.brief?.recommendedService || lead.service || null,
    decisionMaker: lead.decisionMaker?.name ? `${lead.decisionMaker.name} (${lead.decisionMaker.confidence})` : null,
    at: new Date().toISOString()
  });
  if (data.leadFeedback.length > 500) data.leadFeedback = data.leadFeedback.slice(-500);
}

module.exports = { cleanBrief, cleanDecisionMaker, registerBriefRoutes, recordFeedback, SERVICE_VALUE };
