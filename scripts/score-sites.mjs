// Scores lead websites with Google Lighthouse (mobile) plus an SSL certificate check.
// Usage: node scripts/score-sites.mjs <leads.json> <scores.json>
//   leads.json: array of { business, url } (Lead Scout format)
//   scores.json: { "<business>": { mobileSpeed, accessibility, seo, bestPractices, loadTime, certOk, ... } }
// Re-running skips businesses already scored. ~1 minute per site.
import fs from 'fs'
import https from 'https'
import path from 'path'
import { execFileSync } from 'child_process'
import { createRequire } from 'module'

const [, , inFile, outFile] = process.argv
if (!inFile || !outFile) { console.error('Usage: node scripts/score-sites.mjs <leads.json> <scores.json>'); process.exit(1) }
const require = createRequire(import.meta.url)
const lhCli = require.resolve('lighthouse/cli/index.js')
const leads = JSON.parse(fs.readFileSync(inFile, 'utf8').replace(/^﻿/, ''))
const tmp = path.join(path.dirname(path.resolve(outFile)), '.lh-tmp.json')

function certCheck(url) {
  return new Promise(resolve => {
    const req = https.get(url, { timeout: 15000 }, res => { res.resume(); resolve({ certOk: true }) })
    req.on('error', e => resolve(/CERT|SSL|TLS|self.signed|altname|expired/i.test(`${e.code} ${e.message}`) ? { certOk: false, certError: e.code } : { certOk: null, certError: e.code || e.message }))
    req.on('timeout', () => { req.destroy(); resolve({ certOk: null, certError: 'timeout' }) })
  })
}

const results = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {}
for (const l of leads) {
  const url = l.url && (l.url.startsWith('http') ? l.url : `https://${l.url}`)
  if (!url || results[l.business]) continue
  const cert = await certCheck(url)
  let lh
  try {
    execFileSync(process.execPath, [lhCli, url, '--quiet', '--output=json', `--output-path=${tmp}`, '--form-factor=mobile',
      '--only-categories=performance,accessibility,seo,best-practices', '--chrome-flags=--headless=new --ignore-certificate-errors'], { timeout: 120000, stdio: 'ignore' })
    const r = JSON.parse(fs.readFileSync(tmp, 'utf8'))
    const s = (k) => (r.categories[k]?.score == null ? null : Math.round(r.categories[k].score * 100))
    lh = { mobileSpeed: s('performance'), accessibility: s('accessibility'), seo: s('seo'), bestPractices: s('best-practices'),
      loadTime: r.audits['largest-contentful-paint']?.displayValue || null, viewportOk: r.audits.viewport?.score === 1 }
  } catch (e) { lh = { error: String(e.message).slice(0, 120) } }
  results[l.business] = { url, ...cert, ...lh }
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2))
  console.log(`${l.business}: speed=${lh.mobileSpeed ?? '-'} cert=${cert.certOk}`)
}
try { fs.unlinkSync(tmp) } catch { /* none */ }
console.log('SCORED', Object.keys(results).length)
