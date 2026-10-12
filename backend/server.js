/**
 * LeBlanc Solutions Dashboard Backend
 * Express.js server for managing engagements and operations data
 *
 * Run: node backend/server.js
 * API: http://localhost:3001
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const store = require('./store');
const registerBacklogRoutes = require('./backlog');
const registerAuthorizationRoutes = require('./authorization');

const app = express();
const PORT = process.env.PORT || 3001;

// Credentials come from the environment (Render env vars in production).
const VALID_USERNAME = (process.env.CRM_USERNAME || 'CollinLB12').trim();
// Strip whitespace and accidental surrounding quotes pasted into the Render UI.
const VALID_PASSWORD = (process.env.CRM_PASSWORD || '').trim().replace(/^(['"])(.*)\1$/, '$2');
if (!VALID_PASSWORD) {
  console.warn('⚠️  CRM_PASSWORD is not set — all logins will be rejected.');
}

// Token = HMAC of the username keyed by the password: it never contains the
// password, and every issued token stops working when the password changes.
function makeToken() {
  return crypto.createHmac('sha256', VALID_PASSWORD).update(VALID_USERNAME).digest('hex');
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Middleware
app.set('trust proxy', 1); // Render sits behind one proxy; req.ip = real client
app.use(cors());
app.use(express.json());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  next();
});

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  if (!VALID_PASSWORD || !safeEqual(token, makeToken())) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  next();
}

// Data lives in Postgres when DATABASE_URL is set (see store.js)
const loadData = store.load;
const saveData = store.save;

// Routes

// Login throttling: 5 failures per IP, or 30 overall, within 15 minutes blocks
// further attempts until the window passes. Stops password guessing.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const failedLogins = new Map(); // key -> timestamps of recent failures

function recentFailures(key) {
  const now = Date.now();
  const recent = (failedLogins.get(key) || []).filter(t => now - t < LOGIN_WINDOW_MS);
  failedLogins.set(key, recent);
  return recent;
}

// POST: Login
app.post('/api/auth/login', (req, res) => {
  const ipFailures = recentFailures(`ip:${req.ip}`);
  const allFailures = recentFailures('all');
  if (ipFailures.length >= 5 || allFailures.length >= 30) {
    const oldest = Math.min(...(ipFailures.length >= 5 ? ipFailures : allFailures));
    const retryAfter = Math.ceil((oldest + LOGIN_WINDOW_MS - Date.now()) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({ error: `Too many failed attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.` });
  }

  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '').trim();

  if (VALID_PASSWORD && username === VALID_USERNAME && safeEqual(password, VALID_PASSWORD)) {
    failedLogins.delete(`ip:${req.ip}`);
    res.json({ token: makeToken(), user: username });
  } else {
    ipFailures.push(Date.now());
    allFailures.push(Date.now());
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// GET: Get all data (dashboard view)
app.get('/api/dashboard', authenticateToken, (req, res) => {
  const data = loadData();

  // Calculate metrics
  const metrics = {
    prospects: data.engagements.filter(e => e.stage === 'prospect').length,
    qualified: data.engagements.filter(e => e.stage === 'qualified').length,
    authorized: data.engagements.filter(e => e.stage === 'authorized').length,
    reports: data.engagements.filter(e => e.stage === 'report').length,
    fixes: data.engagements.filter(e => e.stage === 'fix').length,
    revenue: data.engagements.reduce((sum, e) => sum + (e.estimatedValue || 0), 0),
    conversions: data.engagements.filter(e => e.stage === 'report' || e.stage === 'fix').length,
  };

  res.json({
    engagements: data.engagements,
    activity: data.activity.slice(-10),
    metrics,
    stats: data.stats || {}
  });
});

// GET: Get single engagement
app.get('/api/engagements/:id', authenticateToken, (req, res) => {
  const data = loadData();
  const engagement = data.engagements.find(e => e.id === req.params.id);
  if (!engagement) {
    return res.status(404).json({ error: 'Engagement not found' });
  }
  res.json(engagement);
});

// POST: Create new engagement (from Lead Scout agent)
app.post('/api/engagements', authenticateToken, (req, res) => {
  const data = loadData();
  const engagement = {
    id: `eng-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...req.body
  };

  data.engagements.push(engagement);

  // Add activity log
  data.activity.push({
    type: 'created',
    title: `New engagement: ${engagement.name}`,
    description: `${engagement.name} (${engagement.stage})`,
    timestamp: engagement.createdAt,
    icon: '✨'
  });

  saveData(data);
  res.status(201).json(engagement);
});

// PUT: Update engagement
app.put('/api/engagements/:id', authenticateToken, (req, res) => {
  const data = loadData();
  const index = data.engagements.findIndex(e => e.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Engagement not found' });
  }

  const oldStage = data.engagements[index].stage;
  const { authorization, id, ...changes } = req.body; // signed records and ids can't be edited here
  const updated = {
    ...data.engagements[index],
    ...changes,
    updatedAt: new Date().toISOString()
  };

  data.engagements[index] = updated;

  // Log stage change
  if (oldStage !== updated.stage) {
    data.activity.push({
      type: 'updated',
      title: `${updated.name} moved to ${updated.stage}`,
      description: `Stage changed from ${oldStage} to ${updated.stage}`,
      timestamp: updated.updatedAt,
      icon: '📝'
    });
  }

  saveData(data);
  res.json(updated);
});

// DELETE: Delete engagement
app.delete('/api/engagements/:id', authenticateToken, (req, res) => {
  const data = loadData();
  const engagement = data.engagements.find(e => e.id === req.params.id);

  if (!engagement) {
    return res.status(404).json({ error: 'Engagement not found' });
  }

  data.engagements = data.engagements.filter(e => e.id !== req.params.id);

  data.activity.push({
    type: 'deleted',
    title: `${engagement.name} deleted`,
    description: `Engagement removed from pipeline`,
    timestamp: new Date().toISOString(),
    icon: '🗑️'
  });

  saveData(data);
  res.json({ success: true });
});

// POST: Add activity
app.post('/api/activity', authenticateToken, (req, res) => {
  const data = loadData();
  const activity = {
    ...req.body,
    timestamp: new Date().toISOString()
  };

  data.activity.push(activity);
  saveData(data);
  res.status(201).json(activity);
});

// POST: Update stats
app.post('/api/stats', authenticateToken, (req, res) => {
  const data = loadData();
  data.stats = { ...data.stats, ...req.body };
  saveData(data);
  res.json(data.stats);
});

// Lead backlog: Lead Scout leads wait here until pulled into the pipeline
registerBacklogRoutes(app, { authenticateToken, loadData, saveData });

// POST: Public website contact form -> new prospect. No auth, so validate
// strictly, rate-limit per IP, and silently drop bots that fill the honeypot.
const SITE_ORIGIN = /^https:\/\/(www\.)?(leblancsols\.com|calm-selkie-f8758a\.netlify\.app)$/i;
// DEV_WEBSITE_ORIGIN (local only, e.g. http://localhost:4321) lets the local site preview call the API.
const WEBSITE_ORIGIN = { test: (origin) => SITE_ORIGIN.test(origin) || (!!process.env.DEV_WEBSITE_ORIGIN && origin === process.env.DEV_WEBSITE_ORIGIN) };

// Online testing authorization (private links signed on leblancsols.com/authorize)
registerAuthorizationRoutes(app, { authenticateToken, loadData, saveData, websiteOrigin: WEBSITE_ORIGIN });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const recentSubmissions = new Map(); // ip -> timestamps in the last hour

function tooManySubmissions(ip) {
  const now = Date.now();
  const recent = (recentSubmissions.get(ip) || []).filter(t => now - t < 60 * 60 * 1000);
  recent.push(now);
  recentSubmissions.set(ip, recent);
  return recent.length > 5;
}

const field = (value, max) => String(value ?? '').trim().slice(0, max);

app.post('/api/public/contact', (req, res) => {
  const origin = req.headers.origin;
  if (origin && !WEBSITE_ORIGIN.test(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (field(req.body.company_site, 10)) {
    return res.status(201).json({ ok: true }); // honeypot filled: pretend success
  }
  if (tooManySubmissions(req.ip)) {
    return res.status(429).json({ error: 'Too many requests. Please email us instead.' });
  }

  const name = field(req.body.name, 100);
  const email = field(req.body.email, 200);
  const phone = field(req.body.phone, 40);
  const business = field(req.body.business, 150);
  const website = field(req.body.website, 300).replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  const message = field(req.body.message, 2000);
  // What the visitor asked for on the form. Redesign value is 0 until quoted.
  const SERVICES = {
    redesign: ['Website Redesign', 0],
    check: ['Security Check', 100],
    fixes: ['Security Fixes', 450],
    unsure: ['Not sure yet', 0]
  };
  const [service, estimatedValue] = SERVICES[field(req.body.service, 20)] || SERVICES.redesign;

  if (!name || !EMAIL.test(email)) {
    return res.status(400).json({ error: 'Please enter your name and a valid email.' });
  }
  if (phone && !/^[0-9+().\-\s]{7,40}$/.test(phone)) {
    return res.status(400).json({ error: 'Please enter a valid phone number.' });
  }

  const now = new Date().toISOString();
  const engagement = {
    id: `eng-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    name: business || name,
    contact: `${name} <${email}>`,
    phone: phone || null,
    industry: 'Unknown',
    location: 'Unknown',
    stack: 'Unknown',
    website: website || null,
    findings: null,
    stage: 'prospect',
    service,
    estimatedValue,
    authorized: false,
    source: 'website',
    createdAt: now,
    updatedAt: now,
    notes: message ? `Website form: ${message}` : 'Website form (no message)',
    progress: 10
  };

  const data = loadData();
  data.engagements.push(engagement);
  data.activity.push({
    type: 'created',
    title: `Website enquiry: ${engagement.name}`,
    description: phone ? `${name} <${email}> · ${phone}` : `${name} <${email}>`,
    timestamp: now,
    icon: '🌐'
  });
  saveData(data);

  res.status(201).json({ ok: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    commit: (process.env.RENDER_GIT_COMMIT || 'local').slice(0, 7),
    passwordConfigured: Boolean(VALID_PASSWORD),
    username: VALID_USERNAME,
    storage: store.storageMode(),
  });
});

// Start server once stored data is loaded
store.init().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✅ LeBlanc Dashboard Backend running at http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:3000`);
    console.log(`🔧 API: http://localhost:${PORT}/api/dashboard\n`);
  });
}).catch(err => {
  console.error('❌ Could not load CRM data — refusing to start so nothing gets overwritten:', err);
  process.exit(1);
});
