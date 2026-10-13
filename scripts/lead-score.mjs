// Adds siteScore, leadScore (0-100) and whyJuicy to each lead's brief, sorts best first,
// and drops leads under --min (default 0). Usage:
//   node scripts/lead-score.mjs <leads.json> <scores.json> <out.json> [--min 55]
// Need (50): how badly the site needs us. Value (25): can they afford it. Reach (25): can we reach the decision-maker.
import fs from 'fs'

const [, , leadsFile, scoresFile, outFile, ...rest] = process.argv
const min = Number(rest[rest.indexOf('--min') + 1]) || 0
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''))
const leads = read(leadsFile)
const scores = fs.existsSync(scoresFile) ? read(scoresFile) : {}

const HIGH_VALUE = /dent|ortho|med ?spa|aesthetic|dermat|plastic|law|attorney|legal|roof|hvac|heat|cool|plumb|remodel|builder|exterior|solar/i
const MID_VALUE = /chiro|vet|animal|physical|therapy|cpa|tax|account|real ?estate|realt|insurance|landscap|electric|auto|body/i

export function scoreLead(lead, s = {}) {
  const b = lead.brief || {}
  const why = []
  let need = 0
  if (s.certOk === false) { need += 15; why.push('visitors get a "Not secure" warning') }
  if (s.mobileSpeed != null) {
    if (s.mobileSpeed < 30) { need += 20; why.push(`Google scores their site ${s.mobileSpeed}/100 on phones`) }
    else if (s.mobileSpeed < 50) { need += 14; why.push(`Google scores their site ${s.mobileSpeed}/100 on phones`) }
    else if (s.mobileSpeed < 70) need += 7
  }
  if (s.viewportOk === false || (b.websiteNeeds || []).some(n => /not mobile-friendly|works on phones/i.test(n))) { need += 15; why.push("site isn't built for phones") }
  const yr = (b.websiteNeeds || []).map(n => /©\s?(\d{4})/.exec(n)?.[1]).find(Boolean)
  if (yr && +yr < 2021) { need += 8; why.push(`footer still says © ${yr}`) } else if (yr && +yr < 2023) need += 4
  if ((b.websiteNeeds || []).some(n => /outdated layout|modern code/i.test(n))) need += 6
  if ((b.websiteNeeds || []).some(n => /online booking|quote form|"get a quote"/i.test(n))) { need += 6; why.push('no easy way to book or get a quote online') }
  const issues = b.securityIssues || []
  if (issues.some(i => i.priority === 'high')) { need += 8; why.push('serious security issue') } else if (issues.some(i => i.priority === 'medium')) need += 4
  need = Math.min(need, 50)

  const ind = `${lead.industry || ''} ${lead.business || lead.name || ''}`
  let value = HIGH_VALUE.test(ind) ? 15 : MID_VALUE.test(ind) ? 11 : 7
  if ((lead.teamSize || 0) >= 4) value += 5
  if (lead.locations > 1) value += 5
  value = Math.min(value, 25)

  const dm = lead.decisionMaker || {}
  let reach = 0
  if (dm.name) reach += dm.confidence === 'confirmed' ? 10 : 6
  if (dm.email) { reach += 10; why.push(`direct email for ${dm.name || 'the owner'}`) }
  if (dm.phone || lead.contact) reach += 5
  reach = Math.min(reach, 25)

  return { leadScore: need + value + reach, need, value, reach, whyJuicy: why.slice(0, 4).join('; ') }
}

const out = leads.map(l => {
  const s = scores[l.business] || {}
  const r = scoreLead(l, s)
  // No-website leads are scored by hand in research; keep that score.
  if (!l.url && l.brief?.leadScore != null) {
    r.leadScore = l.brief.leadScore
    r.whyJuicy = l.brief.whyJuicy || 'Established business with no website'
  }
  return {
    ...l,
    brief: {
      ...l.brief,
      siteScore: s.mobileSpeed != null || s.certOk != null ? { mobileSpeed: s.mobileSpeed ?? null, accessibility: s.accessibility ?? null, seo: s.seo ?? null, bestPractices: s.bestPractices ?? null, certOk: s.certOk ?? null, loadTime: s.loadTime || '' } : null,
      leadScore: r.leadScore,
      whyJuicy: r.whyJuicy ? r.whyJuicy.charAt(0).toUpperCase() + r.whyJuicy.slice(1) + '.' : ''
    },
    _score: r
  }
}).sort((a, b) => b.brief.leadScore - a.brief.leadScore)

const kept = out.filter(l => l.brief.leadScore >= min)
fs.writeFileSync(outFile, JSON.stringify(kept.map(({ _score, ...l }) => l), null, 2))
for (const l of out) console.log(`${String(l.brief.leadScore).padStart(3)}  need ${String(l._score.need).padStart(2)} value ${String(l._score.value).padStart(2)} reach ${String(l._score.reach).padStart(2)}  ${l.brief.leadScore >= min ? 'KEEP' : 'drop'}  ${l.business}`)
console.log(`KEPT=${kept.length} DROPPED=${out.length - kept.length} (min ${min})`)
