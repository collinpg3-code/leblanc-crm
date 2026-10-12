# LeBlanc Solutions CRM Setup

## Quick Start

### Local Development

**1. Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

**2. Start backend** (Terminal 1)
```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

**3. Start frontend** (Terminal 2)
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

**4. Login**
- Go to http://localhost:3000
- Username: `CollinLB12`
- Password: `REDACTED`

### Sync Leads from Lead Scout

```powershell
# Generate leads with Lead Scout agent
uv tool run openoutreach run 5

# Export leads to CSV
# Then sync to CRM:
.\scripts\sync-leads-to-crm.ps1 -CsvPath "clients/batch1/leads.csv"
```

---

## Deployment to Netlify

### Prerequisites
- Netlify account
- GitHub repo connected to Netlify
- Domain: `crm.leblancsols.com`

### Steps

**1. Push code to GitHub**
```bash
git add .
git commit -m "Add CRM system"
git push origin main
```

**2. Create Netlify site**
- Go to https://app.netlify.com
- New site from Git → Select repo
- Build command: `npm run build`
- Publish directory: `frontend/dist`

**3. Configure environment variables** (Netlify dashboard)
```
VITE_API_URL=https://crm.leblancsols.com
CRM_USERNAME=CollinLB12
CRM_PASSWORD=REDACTED
```

**4. Add domain**
- Domain settings → Add domain `crm.leblancsols.com`
- Point your DNS to Netlify nameservers

---

## API Endpoints

### Authentication
- `POST /api/auth/login` — Login with credentials
  - Body: `{ username, password }`
  - Returns: `{ token, user }`

### Engagements (Leads)
- `GET /api/dashboard` — Get all leads + metrics
- `GET /api/engagements/:id` — Get single lead
- `POST /api/engagements` — Create lead
- `PUT /api/engagements/:id` — Update lead
- `DELETE /api/engagements/:id` — Delete lead

### Lead Scout Integration
- `POST /api/leads/sync` — Bulk import leads from CSV
  - Body: `{ leads: [{ name, contact, industry, location, stack }] }`

All endpoints except `/api/auth/login` require `Authorization: Bearer <token>` header.

---

## Project Structure

```
leblanc-solutions/
├── frontend/               # React CRM dashboard
│   ├── src/
│   │   ├── pages/         # Login, Dashboard
│   │   ├── components/    # LeadsList, Pipeline, LeadCard
│   │   ├── styles/        # CSS
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/               # Express API
│   ├── server.js         # Main server + routes
│   ├── data.json         # Lead database
│   └── package.json
├── scripts/              # Utilities
│   └── sync-leads-to-crm.ps1
├── netlify.toml          # Netlify configuration
├── config.example.js     # Configuration template
└── CRM-SETUP.md          # This file
```

---

## Security

### Current Implementation
- Basic token authentication (CollinLB12 : REDACTED)
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- CORS enabled for cross-origin requests
- Input validation on API endpoints

### For Production (TODO)
- [ ] Migrate to JWT tokens
- [ ] Store credentials in environment variables
- [ ] Add rate limiting
- [ ] Enable HTTPS/TLS
- [ ] Database instead of JSON file
- [ ] User role-based access control (RBAC)
- [ ] Audit logging
- [ ] API key rotation

---

## Troubleshooting

### "Connection refused" error
- Make sure backend is running: `npm run dev` in `backend/` folder
- Check port 3001 is not in use: `netstat -ano | findstr :3001`

### Login fails
- Verify username/password: `CollinLB12` / `REDACTED`
- Check browser console for errors (F12)
- Clear localStorage: `localStorage.clear()` in console

### Leads not syncing
- Verify CSV format matches: `business,contact,industry,location,stack,outreach_angle,public_flags,notes`
- Check Lead Scout agent exported the file
- Run sync script with full path: `.\scripts\sync-leads-to-crm.ps1 -CsvPath "C:\full\path\to\leads.csv"`

---

## Next Steps

1. **Test locally** — Add a few test leads via API
2. **Deploy to Netlify** — Follow deployment steps above
3. **Integrate with Lead Scout** — Set up automatic sync after agent runs
4. **Add Call Logging** — Track calls and outcomes per lead
5. **Upgrade to Database** — Move from JSON to PostgreSQL for scale

---

## Support

For issues:
1. Check the [troubleshooting](#troubleshooting) section
2. Review API docs above
3. Check browser console (F12) for errors
4. Review backend logs: `npm run dev` output
