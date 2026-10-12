---
name: remediation-pack
description: Produce ready-to-apply security fixes from a LeBlanc scan (headers, CSP, login hardening, DMARC/SPF, updates), tailored to the client's stack. Use when an authorized client buys remediation.
---

# remediation-pack

From the scan JSON, generate fixes the client (or the user on their behalf) can apply.
Write everything to `clients/<client>/remediation/` with an apply-order `README.md`.
**The user applies changes and holds credentials — you never log in or publish.**

## 1. Security headers + HSTS
Detect the server (scan `fingerprint.server`; nginx/Apache/SiteGround). Produce the matching
snippet. Apache/`.htaccess` starter:
```apache
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "geolocation=(), camera=(), microphone=()"
</IfModule>
```
nginx: emit the equivalent `add_header` lines. On SiteGround, note the panel/plugin path.

## 2. Content-Security-Policy (report-only first)
Inspect the live site's actual scripts (built-in browser) to list legitimate sources
(self, Google Fonts, analytics, HubSpot, etc.). Emit **two** policies: a
`Content-Security-Policy-Report-Only` to deploy first, then the enforced
`Content-Security-Policy`. Start `default-src 'self'` and add only what's needed. Warn:
test report-only before enforcing — CSP can break a page-builder site.

## 3. Login hardening (WordPress/CMS)
Rate-limit + lockout, two-factor, and optionally move/obscure the login path. Name specific
plugins/settings for their CMS. Note: don't lock the client out — brief them first.

## 4. Email auth
If DMARC is weak (e.g. `sp=none`), give the exact TXT record to set `sp=quarantine`;
check SPF/DKIM alignment. These are DNS changes the user makes at the registrar/DNS host.

## 5. Updates
List outdated components from the scan with the target versions and update order (backup first).

## Verify
Have the user re-run `run-scan` and confirm each item cleared. Report honestly if any fix
didn't take. Produce a short before/after for the client.
