/**
 * Lead backlog routes.
 *
 * Lead Scout leads are added to data.backlog (deduplicated). "Import Leads" in
 * the CRM pulls the next N from the backlog into the pipeline as prospects.
 */

const crypto = require('crypto');
const { cleanBrief, SERVICE_VALUE } = require('./brief');

const MAX_PULL = 50;
const str = (v, max) => (v == null ? '' : String(v).trim().slice(0, max));

// Normalise one incoming lead (from a parsed CSV row or a sync script).
// Keep only a real address: "NOT LOCATED" -> null, "https://x.com/ (301 ...)" -> "x.com".
function cleanWebsite(value) {
  const first = str(value, 300).split(/\s+/)[0].replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(first) ? first : null;
}

function cleanLead(raw) {
  const website = cleanWebsite(raw.website || raw.url);
  return {
    name: str(raw.name || raw.business, 200),
    contact: str(raw.contact, 300),
    website: website || null,
    industry: str(raw.industry || raw.sub_niche, 150) || 'Unknown',
    location: str(raw.location, 200) || 'Unknown',
    stack: str(raw.stack, 400) || 'Unknown',
    findings: str(raw.findings || raw.public_flags, 1000) || null,
    angle: str(raw.outreach_angle || raw.angle, 1000) || null,
    notes: str(raw.notes, 1000) || null,
    brief: cleanBrief(raw.brief)
  };
}

// Same business = same website domain, or same name when there's no website.
function keyOf(lead) {
  const site = (lead.website || '').toLowerCase().replace(/^www\./, '').split('/')[0];
  return site || `name:${(lead.name || '').toLowerCase()}`;
}

function addToBacklog(data, rawLeads) {
  const seen = new Set([...data.engagements, ...data.backlog].map(keyOf));
  let added = 0;
  for (const raw of rawLeads) {
    const lead = cleanLead(raw || {});
    if (!lead.name) continue;
    const key = keyOf(lead);
    if (seen.has(key)) continue;
    seen.add(key);
    data.backlog.push({ ...lead, id: `bl-${crypto.randomBytes(5).toString('hex')}`, addedAt: new Date().toISOString() });
    added++;
  }
  return added;
}

function toEngagement(lead, now) {
  const notes = [lead.angle && `Angle: ${lead.angle}`, lead.notes].filter(Boolean).join('\n\n');
  const service = lead.brief?.recommendedService || 'Website Redesign';
  return {
    id: `eng-${crypto.randomBytes(6).toString('hex')}`,
    name: lead.name,
    contact: lead.contact,
    industry: lead.industry,
    location: lead.location,
    stack: lead.stack,
    website: lead.website,
    findings: lead.findings,
    stage: 'prospect',
    service,
    estimatedValue: SERVICE_VALUE[service] ?? 0,
    brief: lead.brief || null,
    authorized: false,
    source: 'lead-scout',
    createdAt: now,
    updatedAt: now,
    notes: notes || 'Imported from Lead Scout',
    progress: 10
  };
}

module.exports = function registerBacklogRoutes(app, { authenticateToken, loadData, saveData }) {
  // How many leads are waiting, plus a short preview of what's next.
  // ?known=1 also lists every business already in the backlog or pipeline,
  // so the refill job can avoid researching them again.
  app.get('/api/backlog', authenticateToken, (req, res) => {
    const { backlog, engagements } = loadData();
    const body = { count: backlog.length, next: backlog.slice(0, 5).map(l => ({ name: l.name, industry: l.industry })) };
    if (req.query.known) {
      body.known = [...backlog, ...engagements].map(l => ({ name: l.name, website: l.website || null }));
    }
    res.json(body);
  });

  // Add leads to the backlog (CSV upload in the CRM).
  app.post('/api/backlog', authenticateToken, (req, res) => {
    if (!Array.isArray(req.body.leads)) return res.status(400).json({ error: 'Expected array of leads' });
    const data = loadData();
    const added = addToBacklog(data, req.body.leads.slice(0, 1000));
    saveData(data);
    res.json({ added, skipped: req.body.leads.length - added, count: data.backlog.length });
  });

  // Move the next N backlog leads into the pipeline.
  app.post('/api/backlog/pull', authenticateToken, (req, res) => {
    const count = Math.min(Math.max(parseInt(req.body.count, 10) || 0, 1), MAX_PULL);
    const data = loadData();
    const batch = data.backlog.splice(0, count);
    const now = new Date().toISOString();
    for (const lead of batch) {
      const engagement = toEngagement(lead, now);
      data.engagements.push(engagement);
      data.activity.push({
        type: 'import',
        title: `Lead imported: ${engagement.name}`,
        description: `${engagement.name} (${engagement.industry})`,
        timestamp: now,
        icon: '🤖'
      });
    }
    saveData(data);
    res.json({ imported: batch.length, remaining: data.backlog.length });
  });

  // Full export of every lead (pipeline + backlog), for backups before a reset.
  app.get('/api/leads/export', authenticateToken, (req, res) => {
    const { engagements, backlog } = loadData();
    res.json({ exportedAt: new Date().toISOString(), engagements, backlog });
  });

  // Start fresh: remove all pipeline and backlog leads. Leads with a signed
  // testing authorization are kept (legal record). Requires an exact phrase.
  app.post('/api/leads/reset', authenticateToken, (req, res) => {
    if (req.body.confirm !== 'DELETE ALL LEADS') return res.status(400).json({ error: 'Confirmation phrase missing.' });
    const data = loadData();
    const kept = data.engagements.filter(e => e.authorization?.signed);
    const removed = { pipeline: data.engagements.length - kept.length, backlog: data.backlog.length };
    data.engagements = kept;
    data.backlog = [];
    data.activity.push({ type: 'reset', title: 'Leads reset', description: `Removed ${removed.pipeline} pipeline and ${removed.backlog} backlog leads`, timestamp: new Date().toISOString(), icon: '🧹' });
    saveData(data);
    res.json({ removed, kept: kept.length });
  });

  // Lead Scout sync scripts: leads go to the backlog. Response keeps the
  // old { imported, total } shape the scripts print.
  app.post('/api/leads/sync', authenticateToken, (req, res) => {
    if (!Array.isArray(req.body.leads)) return res.status(400).json({ error: 'Expected array of leads' });
    const data = loadData();
    const added = addToBacklog(data, req.body.leads.slice(0, 1000));
    saveData(data);
    res.json({ imported: added, total: data.backlog.length });
  });
};
