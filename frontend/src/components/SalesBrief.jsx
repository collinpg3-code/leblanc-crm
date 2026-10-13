import { useEffect, useState } from 'react'
import { fallbackBrief } from '../utils/brief'
import AskFor from './AskFor'
import '../styles/SalesBrief.css'

const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* private mode */ } }
}

// Plug-and-play talk track for a lead: opener, checklist, needs, security, pitch.
export default function SalesBrief({ lead }) {
  const brief = lead.brief || fallbackBrief(lead)
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
      <p className="brief-summary">{brief.summary}</p>

      {brief.opener && (
        <div className="brief-block opener">
          <h4>Open with</h4>
          <p>“{brief.opener}”</p>
        </div>
      )}

      <div className="brief-block">
        <h4>Talk about <span className="count">{checked.length}/{brief.talkingPoints.length}</span></h4>
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
    </div>
  )
}
