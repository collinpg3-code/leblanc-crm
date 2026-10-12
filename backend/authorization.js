/**
 * Online security-testing authorization.
 *
 * The CRM creates a private, single-use link for a lead. The client opens it on
 * leblancsols.com/authorize, completes the form and signs electronically. The
 * signed record (values, exact terms version + hash, time, IP, browser) is stored
 * on the engagement and the lead moves to "authorized".
 */

const crypto = require('crypto');

const TERMS_VERSION = '2026-10-12.2';
const LINK_DAYS = 30;
const STANDARD_HOURS = 'Standard hours: after business hours (weekdays 6 pm to 7 am, and weekends)';
const SITE_URL = 'https://leblancsols.com/authorize/';
const STAGE_ORDER = ['prospect', 'qualified', 'authorized', 'scan', 'report', 'fix'];

// The terms the client agrees to. Rendered by the website from this source so the
// stored hash always matches what was shown.
const TERMS = [
  {
    heading: 'Why we test',
    text: 'Security testing is part of every LeBlanc project. For a redesign, we check your current website at the start so we know what to fix and what to protect, and we test your new website before it goes live. For a security check, testing is the service itself. We never test a website without the owner\'s written permission.'
  },
  {
    heading: 'How we test',
    items: [
      'We test only the websites and testing types approved on this form, during the testing window.',
      'If we build you a new website, we also test it before launch. That testing is covered by this form.',
      'We do not run denial-of-service attacks, attempt to take sites offline, or deliberately delete or change your data.',
      'We do not access, copy or keep customer or personal data beyond the minimum needed to show that a problem exists.',
      'We do not use phishing, phone calls or other social engineering against your staff.',
      'We stop testing immediately if you ask, by phone or email, for any reason.',
      'If we find a serious, actively exploitable problem, we tell your contact promptly instead of waiting for the report.'
    ]
  },
  {
    heading: 'Confidentiality',
    text: 'Findings, reports and any information we learn about your systems are confidential. We share them only with the contacts on this form unless you instruct otherwise in writing. Raw scan data is deleted 90 days after the report is delivered unless you ask us to keep it for a re-check.'
  },
  {
    heading: 'Your confirmations',
    items: [
      'You own the websites listed, or you are authorized by the owner to approve this testing.',
      'Where your hosting provider or platform requires notice or permission for security testing, you have given or obtained it.',
      'You have a current backup of your website and its data.',
      'You understand that although testing is designed to be safe, any testing carries some risk of slowing a site, triggering alerts or, with active testing, creating test entries.'
    ]
  },
  {
    heading: 'Liability',
    text: 'LeBlanc Solutions will take reasonable care when testing. Our total liability arising from this engagement is limited to the fees you paid for it. You agree to cover any claims that result from incorrect information on this form, including about ownership of or permission for the listed websites.'
  },
  {
    heading: 'Scope of this authorization',
    text: 'This authorization covers only the websites, testing types and dates on this form, plus the new website we build for you. Any change must be agreed in writing. Your typed name below is your electronic signature and has the same effect as a handwritten one.'
  }
];
const TERMS_HASH = crypto.createHash('sha256').update(JSON.stringify(TERMS)).digest('hex');

const str = (v, max) => (v == null ? '' : String(v).trim().slice(0, max));
const DOMAIN = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitContact(contact) {
  const m = /^(.*?)\s*<([^>]+)>\s*$/.exec(contact || '');
  return m ? { name: m[1], email: m[2] } : { name: '', email: EMAIL.test(contact || '') ? contact : '' };
}

function findByToken(data, token) {
  if (!/^[A-Za-z0-9_-]{30,64}$/.test(token || '')) return null;
  return data.engagements.find(e => e.authorization?.token === token) || null;
}

function linkState(auth) {
  if (!auth) return 'none';
  if (auth.signed) return 'signed';
  if (Date.parse(auth.expiresAt) < Date.now()) return 'expired';
  return 'sent';
}

// What the CRM is allowed to see (never the raw token after creation, except the link).
function crmView(auth) {
  if (!auth) return { status: 'none' };
  return {
    status: linkState(auth),
    link: auth.signed ? null : `${SITE_URL}?t=${auth.token}`,
    createdAt: auth.createdAt,
    expiresAt: auth.expiresAt,
    signed: auth.signed || null
  };
}

function validateSubmission(body) {
  const b = body || {};
  const websites = (Array.isArray(b.websites) ? b.websites : [])
    .map(w => ({ domain: str(w?.domain, 253).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''), notes: str(w?.notes, 300) }))
    .filter(w => w.domain);
  const v = {
    business: str(b.business, 150),
    contactName: str(b.contactName, 100),
    role: str(b.role, 100),
    email: str(b.email, 200),
    phone: str(b.phone, 40),
    websites: websites.slice(0, 10),
    recon: b.recon === true,
    active: b.active === true,
    startDate: str(b.startDate, 10),
    endDate: str(b.endDate, 10),
    hours: b.standardHours === true ? STANDARD_HOURS : (str(b.hours, 100) || 'Any time'),
    timeZone: str(b.timeZone, 60),
    signatureName: str(b.signatureName, 100),
    signatureTitle: str(b.signatureTitle, 100),
    agreeTerms: b.agreeTerms === true,
    agreeSignature: b.agreeSignature === true
  };

  const errors = [];
  if (!v.business) errors.push('Business name is required.');
  if (!v.contactName) errors.push('Contact name is required.');
  if (!EMAIL.test(v.email)) errors.push('A valid email is required.');
  if (v.websites.length === 0) errors.push('List at least one website.');
  if (v.websites.some(w => !DOMAIN.test(w.domain))) errors.push('Each website must be a domain like example.com.');
  if (!v.recon && !v.active) errors.push('Choose at least one type of testing.');
  if (!DATE.test(v.startDate) || !DATE.test(v.endDate)) errors.push('Start and end dates are required.');
  else if (v.endDate < v.startDate) errors.push('End date must be on or after the start date.');
  if (!v.timeZone) errors.push('Choose your time zone.');
  if (!v.signatureName) errors.push('Type your full name to sign.');
  if (!v.agreeTerms || !v.agreeSignature) errors.push('Please tick both agreement boxes.');
  return { values: v, errors };
}

module.exports = function registerAuthorizationRoutes(app, { authenticateToken, loadData, saveData, websiteOrigin }) {
  const fromWebsite = (req, res) => {
    const origin = req.headers.origin;
    if (origin && !websiteOrigin.test(origin)) {
      res.status(403).json({ error: 'Forbidden' });
      return false;
    }
    return true;
  };

  // CRM: current authorization status for a lead.
  app.get('/api/engagements/:id/authorization', authenticateToken, (req, res) => {
    const lead = loadData().engagements.find(e => e.id === req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(crmView(lead.authorization));
  });

  // CRM: create (or replace an unsigned/expired) private link for a lead.
  app.post('/api/engagements/:id/authorization', authenticateToken, (req, res) => {
    const data = loadData();
    const lead = data.engagements.find(e => e.id === req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    if (lead.authorization?.signed) return res.status(409).json({ error: 'This lead has already signed.' });

    const now = new Date();
    lead.authorization = {
      token: crypto.randomBytes(24).toString('base64url'),
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + LINK_DAYS * 864e5).toISOString(),
      service: str(req.body.service, 100) || lead.service || 'Security Check',
      fee: Number(req.body.fee ?? lead.estimatedValue) || 0
    };
    saveData(data);
    res.status(201).json(crmView(lead.authorization));
  });

  // Website: load the form for a link (prefill + terms).
  app.get('/api/public/authorization/:token', (req, res) => {
    if (!fromWebsite(req, res)) return;
    const lead = findByToken(loadData(), req.params.token);
    const state = linkState(lead?.authorization);
    if (!lead || state === 'none') return res.status(404).json({ error: 'This link is not valid. Please ask LeBlanc Solutions for a new one.' });
    if (state === 'signed') return res.status(410).json({ error: 'This authorization has already been signed. Thank you!', signed: true });
    if (state === 'expired') return res.status(410).json({ error: 'This link has expired. Please ask LeBlanc Solutions for a new one.' });

    const contact = splitContact(lead.contact);
    res.json({
      prefill: {
        business: lead.name || '',
        contactName: contact.name,
        email: contact.email,
        phone: lead.phone || '',
        websites: lead.website ? [{ domain: lead.website.split('/')[0], notes: '' }] : []
      },
      service: lead.authorization.service,
      fee: lead.authorization.fee,
      terms: TERMS,
      termsVersion: TERMS_VERSION
    });
  });

  // Website: submit and sign.
  app.post('/api/public/authorization/:token', (req, res) => {
    if (!fromWebsite(req, res)) return;
    const data = loadData();
    const lead = findByToken(data, req.params.token);
    const state = linkState(lead?.authorization);
    if (!lead || state === 'none') return res.status(404).json({ error: 'This link is not valid.' });
    if (state !== 'sent') return res.status(410).json({ error: state === 'signed' ? 'Already signed.' : 'This link has expired.' });

    const { values, errors } = validateSubmission(req.body);
    if (errors.length) return res.status(400).json({ error: errors[0], errors });

    const signedAt = new Date().toISOString();
    lead.authorization.signed = {
      ...values,
      service: lead.authorization.service,
      fee: lead.authorization.fee,
      termsVersion: TERMS_VERSION,
      termsHash: TERMS_HASH,
      terms: TERMS,
      signedAt,
      ip: req.ip,
      userAgent: str(req.headers['user-agent'], 300)
    };
    if (STAGE_ORDER.indexOf(lead.stage) < STAGE_ORDER.indexOf('authorized')) lead.stage = 'authorized';
    lead.authorized = true;
    lead.updatedAt = signedAt;
    data.activity.push({
      type: 'authorized',
      title: `${lead.name} signed the testing authorization`,
      description: `${values.signatureName} · ${values.websites.map(w => w.domain).join(', ')} · ${values.active ? 'recon + active' : 'recon only'}`,
      timestamp: signedAt,
      icon: '✍️'
    });
    saveData(data);
    res.status(201).json({ ok: true, signedAt });
  });
};
