// Generates deploy/_headers (Netlify) with security headers for leblancsols.com.
// The CSP allows each inline <script> by its SHA-256 hash, so re-run this after
// editing any inline script:  node scripts/build-site-headers.mjs
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const root = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', 'deploy')
const pages = ['index.html', 'showcase/clean.html', 'showcase/premium.html']

const hashes = new Set()
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8')
  for (const [, body] of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    hashes.add(`'sha256-${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}'`)
  }
}

const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].join(' ')}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "media-src 'self'",
  "connect-src 'self' https://leblanc-backend.onrender.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests'
].join('; ')

const headers = `/*
  Content-Security-Policy: ${csp}
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains
`

fs.writeFileSync(path.join(root, '_headers'), headers)
console.log(`wrote deploy/_headers with ${hashes.size} script hashes`)
