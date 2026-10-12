import { useEffect, useState } from 'react'
import axios from 'axios'
import { getApiUrl } from '../utils/api'
import '../styles/AuthorizationPanel.css'

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('crm-token')}` } })
const fmt = (iso) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

function contactEmail(contact) {
  const m = /<([^>]+)>/.exec(contact || '')
  return m ? m[1] : (/^\S+@\S+\.\S+$/.test(contact || '') ? contact : '')
}

export default function AuthorizationPanel({ lead, onChange }) {
  const [auth, setAuth] = useState(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [showCopy, setShowCopy] = useState(false)

  useEffect(() => {
    axios.get(`${getApiUrl()}/engagements/${lead.id}/authorization`, authHeaders())
      .then(({ data }) => setAuth(data))
      .catch(() => setAuth({ status: 'error' }))
  }, [lead.id])

  const message = (link) =>
    `Hi${lead.contact && /<|@/.test(lead.contact) ? ' ' + lead.contact.split(/[<\s]/)[0] : ''}, here's the project form for your website. It takes about 3 minutes and gives us permission to check your current site so we can get started: ${link}\n\n— LeBlanc Solutions`

  const share = async (link) => {
    const text = message(link)
    if (navigator.share) {
      try { await navigator.share({ title: 'Website security testing authorization', text }); return } catch { /* cancelled */ }
    }
    await copy(link)
  }

  const copy = async (link) => {
    try { await navigator.clipboard.writeText(link); setNote('Link copied.') } catch { setNote(link) }
  }

  const create = async () => {
    setBusy(true)
    setNote('')
    try {
      const { data } = await axios.post(`${getApiUrl()}/engagements/${lead.id}/authorization`, {}, authHeaders())
      setAuth(data)
      onChange?.()
      await share(data.link)
    } catch (err) {
      setNote(err.response?.data?.error || err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!auth) return <div className="auth-panel"><p className="auth-muted">Loading authorization…</p></div>

  const email = contactEmail(lead.contact)
  const subject = encodeURIComponent('Your website security check: authorization form')

  return (
    <div className="auth-panel">
      <div className="auth-head">
        <h3>Project authorization</h3>
        <span className={`auth-badge ${auth.status}`}>
          {{ none: 'Not sent', sent: 'Waiting to sign', expired: 'Link expired', signed: 'Signed', error: 'Unavailable' }[auth.status]}
        </span>
      </div>

      {auth.status === 'signed' && (
        <>
          <p className="auth-line">
            Signed by <strong>{auth.signed.signatureName}</strong>{auth.signed.signatureTitle ? `, ${auth.signed.signatureTitle}` : ''} on {fmt(auth.signed.signedAt)}
          </p>
          <p className="auth-muted">
            {auth.signed.websites.map(w => w.domain).join(', ')} · {auth.signed.active ? 'Recon + active testing' : 'Recon only'} · {auth.signed.startDate} to {auth.signed.endDate}
          </p>
          <button className="btn-primary" onClick={() => setShowCopy(true)}>View signed copy</button>
        </>
      )}

      {auth.status === 'sent' && (
        <>
          <p className="auth-muted">Link sent {fmt(auth.createdAt)} · expires {fmt(auth.expiresAt)}</p>
          <div className="auth-actions">
            <button className="btn-primary" onClick={() => share(auth.link)}>Share link</button>
            {email && <a className="auth-btn" href={`mailto:${email}?subject=${subject}&body=${encodeURIComponent(message(auth.link))}`}>Email</a>}
            {lead.phone && <a className="auth-btn" href={`sms:${lead.phone.replace(/[^\d+]/g, '')}?&body=${encodeURIComponent(message(auth.link))}`}>Text</a>}
            <button onClick={() => copy(auth.link)}>Copy link</button>
          </div>
        </>
      )}

      {(auth.status === 'none' || auth.status === 'expired') && (
        <>
          <p className="auth-muted">Send the client a private link to sign the project and testing authorization on leblancsols.com. Required before we test their site.</p>
          <button className="btn-primary" onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Send authorization'}</button>
        </>
      )}

      {note && <p className="auth-note">{note}</p>}
      {showCopy && <SignedCopy lead={lead} signed={auth.signed} onClose={() => setShowCopy(false)} />}
    </div>
  )
}

function SignedCopy({ lead, signed, onClose }) {
  const rows = [
    ['Business', signed.business], ['Contact', `${signed.contactName}${signed.role ? `, ${signed.role}` : ''}`],
    ['Email', signed.email], ['Phone', signed.phone],
    ['Testing approved', signed.active ? 'Recon testing and active testing' : 'Recon testing only'],
    ['Testing window', `${signed.startDate} to ${signed.endDate}${signed.hours ? ` · ${signed.hours}` : ''}${signed.timeZone ? ` (${signed.timeZone})` : ''}`],
    ['Service and fee', `${signed.service}${signed.fee ? ` · $${signed.fee}` : ''}`]
  ].filter(([, v]) => v)

  return (
    <div className="signed-overlay" onClick={onClose}>
      <article className="signed-copy" onClick={(e) => e.stopPropagation()}>
        <div className="signed-toolbar">
          <button className="btn-primary" onClick={() => window.print()}>Print / save PDF</button>
          <button onClick={onClose}>Close</button>
        </div>
        <p className="eyebrow">LeBlanc Solutions</p>
        <h2>Website Project &amp; Testing Authorization</h2>
        <p className="auth-muted">Signed electronically for {lead.name}</p>

        <dl className="signed-grid">
          {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>

        <h4>Websites in scope</h4>
        <ul>{signed.websites.map(w => <li key={w.domain}><strong>{w.domain}</strong>{w.notes ? ` (${w.notes})` : ''}</li>)}</ul>

        {signed.terms.map(s => (
          <section key={s.heading}>
            <h4>{s.heading}</h4>
            {s.text && <p>{s.text}</p>}
            {s.items && <ul>{s.items.map(i => <li key={i}>{i}</li>)}</ul>}
          </section>
        ))}

        <div className="signed-sig">
          <div className="sig-name">{signed.signatureName}</div>
          <p>{signed.signatureName}{signed.signatureTitle ? `, ${signed.signatureTitle}` : ''} · signed {fmt(signed.signedAt)}</p>
          <p className="auth-muted small">Agreed to terms and electronic signature. Terms version {signed.termsVersion} (SHA-256 {signed.termsHash.slice(0, 16)}…) · IP {signed.ip} · {signed.userAgent}</p>
        </div>
      </article>
    </div>
  )
}
