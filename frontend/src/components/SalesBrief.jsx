import { useEffect, useState } from 'react'
import { fallbackBrief, defaultWinPlan } from '../utils/brief'
import AskFor from './AskFor'
import '../styles/SalesBrief.css'

const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* private mode */ } }
}

// Plug-and-play talk track for a lead: opener, checklist, needs, security, pitch.
export default function SalesBrief({ lead, onEmail }) {
  const brief = lead.brief || fallbackBrief(lead)
  const win = brief.winPlan?.closers?.length ? brief.winPlan : defaultWinPlan(lead, brief)
  const key = `brief-checked-${lead.id}`
  const [checked, setChecked] = useState(() => store.get(key))
  const [copied, setCopied] = useState(false)

  useEffect(() => { store.set(key, checked) }, [key, checked])

  const toggle = (i) => setChecked(c => (c.includes(i) ? c.filter(x => x !== i) : [...c, i]))
  const copyPitch = async () => {
    try { await navigator.clipboard.writeText(brief.pitch); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* ignore */ }
  }

  return (
    <div className="brief">
      <div className="brief-top">
        <span className="brief-service">Pitch: {brief.recommendedService}</span>
        {brief.auto && <span className="brief-auto" title="A full brief will be added by the next lead refresh">Quick brief</span>}
      </div>
      <AskFor lead={lead} />
      {brief.whyJuicy && <p className="brief-juicy"><strong>Why this lead:</strong> {brief.whyJuicy}</p>}
      <p className="brief-summary">{brief.summary}</p>
      {brief.siteScore && <Scorecard s={brief.siteScore} />}

      <div className="brief-next">
        <div>
          <h4>Next step</h4>
          <p>Send the first email. No calls needed: let them read it and reply when they're ready.</p>
        </div>
        {onEmail && <button type="button" className="btn-primary" onClick={onEmail}>Open emails</button>}
      </div>

      {brief.securityIssues?.length > 0 && (
        <div className="brief-block">
          <h4>Security issues</h4>
          <ul className="issues">
            {brief.securityIssues.map((s, i) => (
              <li key={i} className={s.priority}>
                <span className="prio">{s.priority}</span>
                <div><strong>{s.issue}</strong>{s.whyItMatters && <p>{s.whyItMatters}</p>}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="brief-cols">
        <div className="brief-block">
          <h4>What their site needs</h4>
          <ul className="dots">{brief.websiteNeeds.map((n, i) => <li key={i}>{n}</li>)}</ul>
        </div>
        <div className="brief-block">
          <h4>How it helps them</h4>
          <ul className="dots">{brief.benefits.map((n, i) => <li key={i}>{n}</li>)}</ul>
        </div>
      </div>

      {brief.pitch && (
        <div className="brief-block pitch">
          <h4>Your pitch <button type="button" className="copy" onClick={copyPitch}>{copied ? 'Copied' : 'Copy'}</button></h4>
          <p>{brief.pitch}</p>
        </div>
      )}

      <div className="brief-block">
        <h4>When they reply <span className="count">{checked.length}/{brief.talkingPoints.length}</span></h4>
        <p className="reply-hint">They wrote back, so they're interested. Use these in your reply, or on a call if they ask for one.</p>
        <ul className="checklist">
          {brief.talkingPoints.map((t, i) => (
            <li key={i}>
              <label className={checked.includes(i) ? 'done' : ''}>
                <input type="checkbox" checked={checked.includes(i)} onChange={() => toggle(i)} />
                <span>{t}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="brief-block win">
        <h4>How to win this one</h4>
        <p className="win-offer"><strong>Lead with:</strong> {win.offer}</p>
        <ul className="dots">{win.closers.map((c, i) => <li key={i}>{c}</li>)}</ul>
        <h5>If they say…</h5>
        {win.objections.map((o, i) => (
          <details key={i} className="objection">
            <summary>“{o.objection}”</summary>
            <p>{o.response}</p>
          </details>
        ))}
      </div>
    </div>
  )
}

function Scorecard({ s }) {
  const cls = (v) => (v == null ? '' : v < 50 ? 'bad' : v < 80 ? 'meh' : 'good')
  const items = [
    ['Mobile speed', s.mobileSpeed], ['Accessibility', s.accessibility], ['Google SEO', s.seo], ['Best practices', s.bestPractices]
  ].filter(([, v]) => v != null)
  return (
    <div className="scorecard">
      <h4>Google scores their site (on a phone)</h4>
      <div className="scores">
        {items.map(([k, v]) => <div key={k} className={cls(v)}><b>{v}</b><span>{k}</span></div>)}
        {s.certOk === false && <div className="bad"><b>!</b><span>"Not secure" warning</span></div>}
      </div>
      {s.loadTime && <p>Main content takes <strong>{s.loadTime}</strong> to appear on a phone.</p>}
    </div>
  )
}
