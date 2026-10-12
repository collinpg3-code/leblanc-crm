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
    writtenAt: new Date().toISOString()
  };
  return brief.summary || brief.talkingPoints.length ? brief : null;
}

function registerBriefRoutes(app, { authenticateToken, loadData, saveData }) {
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

module.exports = { cleanBrief, registerBriefRoutes, SERVICE_VALUE };
