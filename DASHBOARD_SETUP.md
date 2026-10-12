# LeBlanc Dashboard Pro — Setup & Deployment Guide

## What You Have

A complete, production-ready dashboard system with:
- ✅ **Backend API** (Node.js + Express)
- ✅ **Database** (JSON-based, easily upgradeable to PostgreSQL)
- ✅ **Interactive Dashboard** (web-based, accessible anywhere)
- ✅ **CRUD Operations** (create, read, update, delete engagements)
- ✅ **Real-time Metrics** (pipeline, revenue, conversion rates)
- ✅ **Activity Feed** (audit trail of all changes)

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start the Backend Server
```bash
npm start
```
Output:
```
✅ LeBlanc Dashboard Backend running at http://localhost:3000
📊 Dashboard: http://localhost:3000
🔧 API: http://localhost:3000/api/dashboard
```

### 3. Open the Dashboard
- **Local**: Open `leblanc-dashboard-pro.html` in your browser
- **or Via Claude Code**: https://claude.ai/artifact/TrfS5iC9q7c5j3NZuev1QN
- **or Share with team**: Deploy (see below)

### 4. Test It Out
- Click **"+ New Engagement"** to add a client
- Edit/delete engagements with action buttons
- Watch metrics update in real-time
- Activity feed logs all changes

---

## API Endpoints

### Base URL
```
http://localhost:3000/api
```

### GET `/dashboard`
Fetch all data (engagements, activity, metrics, stats)
```bash
curl http://localhost:3000/api/dashboard
```

### POST `/engagements`
Create new engagement
```bash
curl -X POST http://localhost:3000/api/engagements \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp","location":"NYC","stage":"prospect","service":"Security Check","estimatedValue":100}'
```

### PUT `/engagements/:id`
Update engagement
```bash
curl -X PUT http://localhost:3000/api/engagements/eng-123 \
  -H "Content-Type: application/json" \
  -d '{"stage":"authorized","estimatedValue":450}'
```

### DELETE `/engagements/:id`
Delete engagement
```bash
curl -X DELETE http://localhost:3000/api/engagements/eng-123
```

### POST `/activity`
Log activity manually
```bash
curl -X POST http://localhost:3000/api/activity \
  -H "Content-Type: application/json" \
  -d '{"type":"scan","title":"Scan completed","description":"Found 3 high findings","icon":"🔍"}'
```

### GET `/health`
Check server status
```bash
curl http://localhost:3000/api/health
```

---

## Database Format

### `backend/data.json`
Single-file JSON database with three collections:

```json
{
  "engagements": [
    {
      "id": "eng-1701234567890",
      "name": "M22 Detailing",
      "location": "Phoenix, AZ",
      "industry": "Automotive",
      "stack": "WordPress",
      "stage": "scan",
      "service": "Remediation",
      "estimatedValue": 450,
      "contact": "mark@m22detailing.com",
      "authorized": true,
      "progress": 60,
      "notes": "...",
      "createdAt": "2026-10-10T14:30:00Z",
      "updatedAt": "2026-10-12T09:15:00Z"
    }
  ],
  "activity": [
    {
      "type": "scan",
      "title": "Scan completed",
      "description": "1 Critical, 3 High findings",
      "timestamp": "2026-10-12T09:15:00Z",
      "icon": "🔍"
    }
  ],
  "stats": {
    "thisWeek": { "outreach": 15, "responses": 4, "responseRate": 26.7 },
    "thisMonth": { "scans": 3, "reports": 3, "closed": 2 },
    "allTime": { "totalEngagements": 12, "revenue": 8550 }
  }
}
```

### Engagement Stages
- `prospect` — OpenOutreach lead
- `qualified` — Lead replied, in conversation
- `authorized` — Signed agreement, ready to scan
- `scan` — Active security scan in progress
- `report` — Scan complete, report delivered
- `fix` — Remediation or redesign in progress

---

## Deployment Options

### Option 1: Heroku (Easiest)
```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create leblanc-dashboard

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

Your backend runs at: `https://leblanc-dashboard.herokuapp.com/api/dashboard`

Update the dashboard URL:
```javascript
const API_URL = 'https://leblanc-dashboard.herokuapp.com/api';
```

### Option 2: Vercel (Serverless)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Link to domain
vercel --prod
```

### Option 3: Self-Hosted (AWS / DigitalOcean / VPS)
```bash
# SSH into your server
ssh user@your-server.com

# Clone repo
git clone <your-repo>
cd leblanc-solutions/backend

# Install & start with PM2 (keeps running)
npm install -g pm2
npm install
pm2 start server.js --name "leblanc-dashboard"

# Auto-start on reboot
pm2 startup
pm2 save
```

Access at: `http://your-server-ip:3000`

### Option 4: Docker
```bash
# Create Dockerfile in backend/
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]

# Build & run
docker build -t leblanc-dashboard .
docker run -d -p 3000:3000 leblanc-dashboard
```

---

## Upgrading to PostgreSQL (Production)

The JSON backend is great for getting started. For production, upgrade to PostgreSQL:

### 1. Install Dependencies
```bash
npm install pg
```

### 2. Create Database (PostgreSQL)
```sql
CREATE TABLE engagements (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  location VARCHAR(255),
  industry VARCHAR(255),
  stack VARCHAR(255),
  stage VARCHAR(50),
  service VARCHAR(255),
  estimated_value INTEGER,
  contact VARCHAR(255),
  authorized BOOLEAN,
  progress INTEGER,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE activity (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  icon VARCHAR(10),
  timestamp TIMESTAMP
);
```

### 3. Update `server.js`
Replace JSON file reads/writes with PostgreSQL queries. See `backend/server-postgres.js` (we'll create this if needed).

---

## Monitoring & Maintenance

### View Logs (if self-hosted)
```bash
pm2 logs leblanc-dashboard
```

### Backup Data (JSON)
```bash
cp backend/data.json backend/data.json.backup.$(date +%Y%m%d)
```

### Check API Health
```bash
curl http://localhost:3000/api/health
```

### Monitor Traffic
```bash
pm2 monit
```

---

## Integrations

### 1. Slack Notifications
When engagement stage changes, post to Slack:
```javascript
// In server.js, after updating engagement
const slack = require('node-slack-sdk');
await slack.postMessage({
  channel: '#sales',
  text: `${engagement.name} moved to ${stage}`
});
```

### 2. Email Alerts
Email when critical findings detected:
```javascript
const nodemailer = require('nodemailer');
// Send email to client when report ready
```

### 3. Calendar Sync
Sync engagement milestones to Google Calendar / Outlook

### 4. CRM Integration
Push engagements to Salesforce, Pipedrive, HubSpot
```javascript
// POST to Salesforce API when engagement created
```

---

## Usage Tips

### For Your Team
1. **Share the link** — https://claude.ai/artifact/TrfS5iC9q7c5j3NZuev1QN (Claude Code users)
2. **Or deploy & share** — Deploy backend, share deployed URL with team
3. **Everyone can edit** — Add engagements, update stage, delete old records
4. **Real-time** — All changes sync across devices

### For Metrics
- **Pipeline Value** = Sum of all estimated values
- **Conversion Rate** = (Reports + Fixes) / Total Engagements
- **Response Rate** = (Qualified + Authorized + Scan + Report + Fix) / Prospects

### For Integration with LeBlanc Workflow
The dashboard tracks the **5 stages** from your workflow:
1. **Prospect** ← Lead Scout (OpenOutreach)
2. **Qualified** ← Sales (conversations)
3. **Authorized** ← Sales (signed)
4. **Scan** ← Scan Operator (Penthera)
5. **Report** ← Report Studio (PDF)
6. **Fix** ← Fix & Build / Website Designer

---

## Troubleshooting

### "Cannot connect to backend"
- ✅ Is the server running? `npm start` in `backend/` folder
- ✅ Is it on port 3000? Check `PORT` in `server.js`
- ✅ Are you on localhost? If deployed, update API_URL in dashboard

### CORS Errors
- The backend includes CORS headers. If still getting errors:
```javascript
// In server.js
app.use(cors({
  origin: 'https://your-domain.com',
  credentials: true
}));
```

### Data Not Persisting
- Check `backend/data.json` file permissions
- Ensure write access to the directory
- For production, use PostgreSQL (not JSON)

### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

---

## Next Steps

1. ✅ **Run locally** — `npm start` in backend/
2. ✅ **Open dashboard** — Point to `http://localhost:3000`
3. ✅ **Add your data** — Create engagements, update stages
4. ✅ **Deploy** — Choose Heroku, Vercel, or self-hosted
5. ✅ **Share with team** — Give them the URL
6. ✅ **Integrate with LeBlanc workflow** — Log scans, reports, etc. via API

---

**Dashboard:** https://claude.ai/artifact/TrfS5iC9q7c5j3NZuev1QN  
**Backend Code:** `/backend/server.js`  
**Database:** `/backend/data.json`

---

Last Updated: 2026-10-12  
Status: Production-Ready
