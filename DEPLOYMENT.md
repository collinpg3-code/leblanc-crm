# LeBlanc Solutions CRM — Deployment Guide

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Netlify (crm.leblancsols.com)        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │   Frontend       │         │    Backend       │     │
│  │   (React SPA)    │◄────────│    (Node.js)     │     │
│  │   /              │  API    │   /api/...       │     │
│  └──────────────────┘         └────┬─────────────┘     │
│                                    │                    │
│                              ┌─────▼─────────┐         │
│                              │  data.json    │         │
│                              │  (database)   │         │
│                              └───────────────┘         │
└─────────────────────────────────────────────────────────┘
         ▲                              ▲
         │ (browser)                    │ (HTTP)
         │                              │
    ┌────┴──────────────────────────────┴───┐
    │         Your Computer (Local)         │
    ├──────────────────────────────────────┤
    │  Lead Scout Agent                    │
    │  ├─ Find leads (OpenOutreach)       │
    │  └─ Export: clients/batch/leads.csv │
    │                                      │
    │  sync-leads-to-crm.ps1              │
    │  └─ POST /api/leads/sync            │
    └─────────────────────────────────────┘
```

---

## Prerequisites

- Netlify account (free tier works)
- GitHub account + repo
- Domain `crm.leblancsols.com` (or your subdomain)
- Node.js 18+ locally

---

## Step 1: Prepare for Deployment

### 1a. Update URLs in code
**File:** `frontend/src/components/...`

Search for `localhost:3001` and replace with your Netlify domain:
```javascript
// Before:
const API_URL = 'http://localhost:3001'

// After:
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001'
```

### 1b. Update package.json scripts
**File:** `frontend/package.json` and `backend/package.json`

```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "preview": "vite preview"
  }
}
```

---

## Step 2: Push to GitHub

```bash
cd C:\tools\leblanc-solutions

# Initialize git (if not already)
git init
git add .
git commit -m "Initial CRM commit: frontend + backend + deployment config"
git remote add origin https://github.com/YOUR_USERNAME/leblanc-crm.git
git push -u origin main
```

---

## Step 3: Connect Netlify

**3a. Create Netlify site**
1. Go to https://app.netlify.com/teams
2. Click "New site from Git"
3. Select GitHub repo → `leblanc-crm`
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
   - Functions directory: `backend`

**3b. Deploy**
- Netlify auto-deploys when you push to `main`
- Check deploy logs in dashboard
- Get temporary URL (e.g., `https://xyz123.netlify.app`)

---

## Step 4: Configure Domain

**4a. Add custom domain** (in Netlify dashboard)
- Domain settings → Add custom domain
- Enter: `crm.leblancsols.com`

**4b. Point DNS** (at your domain registrar)
Option A: Use Netlify nameservers (recommended)
- Get nameservers from Netlify
- Update at domain registrar (GoDaddy, etc.)

Option B: CNAME record (if you use other nameservers)
- Add CNAME: `crm` → `your-netlify-site.netlify.app`

Wait 24-48 hours for propagation. Check: `nslookup crm.leblancsols.com`

---

## Step 5: Configure Environment Variables

In Netlify dashboard: **Site settings → Build & deploy → Environment**

Add:
```
VITE_API_URL = https://crm.leblancsols.com
CRM_USERNAME = CollinLB12
CRM_PASSWORD = <your CRM password>
NODE_ENV = production
```

Trigger redeploy (Deploys → Trigger deploy) after saving.

---

## Step 6: Test Deployment

```bash
# Visit your site
https://crm.leblancsols.com

# Login
Username: CollinLB12
Password: <your CRM password>

# Test API (in browser console)
const res = await fetch('https://crm.leblancsols.com/api/dashboard', {
  headers: { Authorization: 'Bearer <token from /api/auth/login>' }
})
console.log(await res.json())
```

---

## Step 7: Integrate Lead Scout Sync

Update your Lead Scout workflow to sync leads:

```powershell
# After Lead Scout runs and exports leads.csv:
.\scripts\sync-leads-to-crm.ps1 `
  -CsvPath "clients/batch1/leads.csv" `
  -CrmUrl "https://crm.leblancsols.com" `
  -Username "CollinLB12" `
  -Password "<your CRM password>"
```

Or add this as a PowerShell scheduled task to run automatically.

---

## Monitoring & Troubleshooting

### Check deployment status
- Netlify dashboard → Deploys tab
- Look for errors in build logs

### View live logs
```bash
# Stream logs from Netlify CLI
npm install -g netlify-cli
netlify logs -s <site-id>
```

### Test API endpoints
```powershell
# Test login
Invoke-RestMethod -Uri "https://crm.leblancsols.com/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"username":"CollinLB12","password":"<your CRM password>"}'

# Test dashboard
Invoke-RestMethod -Uri "https://crm.leblancsols.com/api/dashboard" `
  -Headers @{"Authorization"="Bearer <token from /api/auth/login>"}
```

---

## Security for Production

### Immediate (before going live)
- [ ] Change default password in backend
- [ ] Use environment variables for credentials
- [ ] Enable Netlify authentication (OAuth)
- [ ] Set up HTTPS (auto-enabled on Netlify)

### Before scaling
- [ ] Migrate from JSON to database (PostgreSQL, MongoDB)
- [ ] Implement proper JWT tokens
- [ ] Add rate limiting
- [ ] Set up audit logging
- [ ] Enable API key management
- [ ] Add RBAC (roles & permissions)

### Ongoing
- [ ] Monitor for security updates (Node.js, npm packages)
- [ ] Review access logs weekly
- [ ] Rotate credentials monthly
- [ ] Keep Netlify & dependencies updated

---

## Rollback (if needed)

```bash
# Revert last deployment in Netlify dashboard:
# Deploys → Previous deploy → Restore this deploy

# Or from CLI:
netlify deploy --alias=rollback-<date>
```

---

## Costs

**Netlify Free Tier:**
- 300 build minutes/month
- 100 GB bandwidth/month
- Git auto-deploys
- HTTPS included
- Custom domain included

**When you'll need Pro:**
- > 300 build minutes
- > 100 GB bandwidth
- Scheduled functions (auto-sync)
- Priority support

---

## Next Steps

1. ✅ Deploy to Netlify
2. ✅ Test login and dashboard
3. ✅ Sync first batch of leads
4. ✅ Make calls and log outcomes
5. → Move to PostgreSQL (when JSON gets slow)
6. → Add user management (team access)
7. → Add analytics/reporting dashboard

---

## Support

- Netlify docs: https://docs.netlify.com
- Environment variables: https://docs.netlify.com/configure-builds/environment-variables/
- Custom domains: https://docs.netlify.com/domains-https/custom-domains/
- Troubleshooting: Check `netlify.toml` and build logs in dashboard
