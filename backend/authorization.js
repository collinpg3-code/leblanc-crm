/**
 * Online project & testing authorization.
 *
 * The CRM creates a private, single-use link for a lead. The client opens it on
 * leblancsols.com/authorize, picks their project type (new website, redesign or
 * security), completes a form tailored to that, and signs electronically. The
 * signed record (values, exact terms version + hash, time, IP, browser) is stored
 * on the engagement and the lead moves to "authorized".
 */

const crypto = require('crypto');

const TERMS_VERSION = '2026-10-13';
const LINK_DAYS = 30;
const STANDARD_HOURS = 'Standard hours: after business hours (weekdays 6 pm to 7 am, and weekends)';
const SITE_URL = 'https://leblancsols.com/authorize/';
const STAGE_ORDER = ['prospect', 'qualified', 'authorized', 'scan', 'report', 'fix'];
const PROJECT_TYPES = ['new', 'redesign', 'security'];
const PROJECT_LABELS = { new: 'New website', redesign: 'Website redesign', security: 'Security check / fixes' };

const SAFE_TESTING = [
  'We never run denial-of-service attacks, try to take a site offline, or deliberately delete or change your data.',
  'We never access, copy or keep customer or personal data beyond the minimum needed to show a problem exists.',
  'We never use phishing, phone calls or other tricks on your staff.',
  'We stop testing right away if you ask, by phone or email, for any reason.',
  'If we find a serious problem, we tell you promptly instead of waiting for the report.'
];

// The terms the client agrees to, tailored to the project type. Rendered by the
// website from this source so the stored hash always matches what was shown.
function termsFor(type) {
  const about = {
    new: 'This form covers the new website LeBlanc Solutions builds for you. Security testing is part of every website we build: we test your new site before it goes live and after any major update. You don\'t have a website yet, so there is nothing of yours to test today.',
    redesign: 'This form covers your website redesign. Security testing is part of every project: we check your current website at the start so we know what to fix and what to protect, and we test your new website before it goes live.',
    security: 'This form covers a security check of your current website, and any fixes you ask us to make. Testing your website is the service itself.'
  }[type];

  const scope = {
    new: ['We test only the new website we build for you, before launch and after major updates.'],
    redesign: ['We test only the websites listed on this form, during the testing window you choose.', 'We also test your new website before it goes live. That is covered by this form.'],
    security: ['We test only the websites and testing types approved on this form, during the testing window you choose.']
  }[type];

  const confirmations = type === 'new'
    ? [
        'You are authorized to approve this project for the business.',
        'If you have a domain name or hosting account, you own it or are authorized to let us use it for the new website.'
      ]
    : [
        'You own the websites listed, or you are authorized by the owner to approve this testing.',
        'Where your hosting provider requires notice or permission for security testing, you have given or obtained it.',
        'You have a current backup of your website and its data.',
        'Testing is designed to be safe, but any testing carries some risk of slowing a site or triggering alerts' + (type === 'security' ? ', and active testing may create test entries.' : '.')
      ];

  return [
    { heading: 'About this form', text: about },
    { heading: 'How we test', items: [...scope, ...SAFE_TESTING] },
    { heading: 'Confidentiality', text: 'Anything we learn about your website and business stays confidential. We share findings only with the contacts on this form unless you tell us otherwise in writing. Raw test data is deleted 90 days after the project ends unless you ask us to keep it.' },
    { heading: 'Your confirmations', items: confirmations },
    { heading: 'Liability', text: 'LeBlanc Solutions will take reasonable care. Our total liability for this project is limited to the fees you paid for it. You agree to cover any claims that come from incorrect information on this form, including about who owns the websites or accounts listed.' },
    { heading: 'Your signature', text: 'This authorization covers only what is on this form. Any change must be agreed in writing. Typing your name below is your electronic signature and has the same effect as signing by hand.' }
  ];
}
const TERMS = Object.fromEntries(PROJECT_TYPES.map(t => [t, termsFor(t)]));
const hashOf = (terms) => crypto.createHash('sha256').update(JSON.stringify(terms)).digest('hex');

const str = (v, max) => (v == null ? '' : String(v).trim().slice(0, max));
const DOMAIN = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cleanDomain = (d) => str(d, 253).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');

function splitContact(contact) {
  const m = /^(.*?)\s*<([^>]+)>\s*$/.exec(contact || '');
  return m ? { name: m[1], email: m[2] } : { name: '', email: EMAIL.test(contact || '') ? contact : '' };
}

function suggestedType(lead) {
  if (!lead.website) return 'new';
  const s = `${lead.service || ''} ${lead.brief?.recommendedService || ''}`;
  return /security/i.test(s) && !/redesign/i.test(s) ? 'security' : 'redesign';
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
  const type = PROJECT_TYPES.includes(b.projectType) ? b.projectType : null;
  const existing = type === 'redesign' || type === 'security';
  const websites = (Array.isArray(b.websites) ? b.websites : [])
    .map(w => ({ domain: cleanDomain(w?.domain), notes: str(w?.notes, 300) }))
    .filter(w => w.domain);
  const domainPlan = str(b.domainPlan, 20);
  const v = {
    projectType: type,
    projectLabel: PROJECT_LABELS[type] || '',
    business: str(b.business, 150),
    contactName: str(b.contactName, 100),
    role: str(b.role, 100),
    email: str(b.email, 200),
    phone: str(b.phone, 40),
    websites: existing ? websites.slice(0, 10) : [],
    domain: type === 'new' && domainPlan === 'have' ? cleanDomain(b.domain) : '',
    domainPlan: type === 'new' ? (['have', 'need', 'unsure'].includes(domainPlan) ? domainPlan : 'unsure') : '',
    goals: str(b.goals, 1000),
    recon: existing,
    active: type === 'security' && b.active === true,
    startDate: existing ? str(b.startDate, 10) : '',
    endDate: existing ? str(b.endDate, 10) : '',
    hours: existing ? (b.standardHours === true ? STANDARD_HOURS : (str(b.hours, 100) || 'Any time')) : '',
    timeZone: str(b.timeZone, 60),
    signatureName: str(b.signatureName, 100),
    signatureTitle: str(b.signatureTitle, 100),
    agreeTerms: b.agreeTerms === true,
    agreeSignature: b.agreeSignature === true
  };

  const errors = [];
  if (!type) errors.push('Choose what we are working on.');
  if (!v.business) errors.push('Business name is required.');
  if (!v.contactName) errors.push('Your name is required.');
  if (!EMAIL.test(v.email)) errors.push('A valid email is required.');
  if (existing && v.websites.length === 0) errors.push('Add your current website.');
  if (v.websites.some(w => !DOMAIN.test(w.domain))) errors.push('Each website must look like example.com.');
  if (v.domain && !DOMAIN.test(v.domain)) errors.push('Your domain name must look like example.com.');
  if (type === 'security' && (!DATE.test(v.startDate) || !DATE.test(v.endDate))) errors.push('Pick start and end dates for testing.');
  if (existing && (v.startDate || v.endDate)) {
    if (!DATE.test(v.startDate) || !DATE.test(v.endDate)) errors.push('Pick both a start and an end date, or leave both blank.');
    else if (v.endDate < v.startDate) errors.push('The end date must be on or after the start date.');
  }
  if (existing && !v.timeZone) errors.push('Choose your time zone.');
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
      service: str(req.body.service, 100) || lead.service || 'Website Redesign',
      fee: Number(req.body.fee ?? lead.estimatedValue) || 0
    };
    saveData(data);
    res.status(201).json(crmView(lead.authorization));
  });

  // Website: load the form for a link (prefill + suggested project type + terms per type).
  app.get('/api/public/authorization/:token', (req, res) => {
    if (!fromWebsite(req, res)) return;
    const lead = findByToken(loadData(), req.params.token);
    const state = linkState(lead?.authorization);
    if (!lead || state === 'none') return res.status(404).json({ error: 'This link is not valid. Please ask LeBlanc Solutions for a new one.' });
    if (state === 'signed') return res.status(410).json({ error: 'This form has already been signed. Thank you!', signed: true });
    if (state === 'expired') return res.status(410).json({ error: 'This link has expired. Please ask LeBlanc Solutions for a new one.' });

    const contact = splitContact(lead.contact);
    res.json({
      prefill: {
        business: lead.name || '',
        contactName: lead.decisionMaker?.name && !/partner|owner|manager/i.test(lead.decisionMaker.name) ? lead.decisionMaker.name : contact.name,
        email: lead.decisionMaker?.email || contact.email,
        phone: lead.phone || '',
        websites: lead.website ? [{ domain: lead.website.split('/')[0], notes: '' }] : []
      },
      suggestedType: suggestedType(lead),
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

    const terms = TERMS[values.projectType];
    const signedAt = new Date().toISOString();
    lead.authorization.signed = {
      ...values,
      service: lead.authorization.service,
      fee: lead.authorization.fee,
      termsVersion: `${TERMS_VERSION}-${values.projectType}`,
      termsHash: hashOf(terms),
      terms,
      signedAt,
      ip: req.ip,
      userAgent: str(req.headers['user-agent'], 300)
    };
    if (STAGE_ORDER.indexOf(lead.stage) < STAGE_ORDER.indexOf('authorized')) lead.stage = 'authorized';
    lead.authorized = true;
    lead.updatedAt = signedAt;
    const what = values.projectType === 'new'
      ? `new website${values.domain ? ` (${values.domain})` : ''}`
      : `${values.websites.map(w => w.domain).join(', ')} · ${values.active ? 'recon + active' : 'recon'}`;
    data.activity.push({
      type: 'authorized',
      title: `${lead.name} signed the project authorization`,
      description: `${values.signatureName} · ${values.projectLabel} · ${what}`,
      timestamp: signedAt,
      icon: '✍️'
    });
    saveData(data);
    res.status(201).json({ ok: true, signedAt });
  });
};
