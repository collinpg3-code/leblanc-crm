import { useState } from 'react'
import { emailDrafts, DEFAULT_SIGNATURE } from '../utils/emails'
import '../styles/EmailDrafts.css'

const SIG_KEY = 'email-signature'
const readSig = () => { try { return localStorage.getItem(SIG_KEY) || DEFAULT_SIGNATURE } catch { return DEFAULT_SIGNATURE } }

export default function EmailDrafts({ lead, toEmail }) {
  const [signature, setSignature] = useState(readSig)
  const [copied, setCopied] = useState('')
  const drafts = emailDrafts(lead, signature)
  const [open, setOpen] = useState(drafts[0]?.id || 'first')
  const needsAddress = /\[Your mailing address/.test(signature)

  const copy = async (key, text) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1600) } catch { /* ignore */ }
  }
  const saveSig = (v) => { setSignature(v); try { localStorage.setItem(SIG_KEY, v) } catch { /* private mode */ } }

  return (
    <div className="emails">
      {needsAddress && (
        <p className="email-warn">Add your mailing address to the signature below before sending cold emails. US law (CAN-SPAM) requires it.</p>
      )}
      {toEmail ? <p className="email-to">Sending to <strong>{toEmail}</strong></p> : <p className="email-to">No email on file. Copy these into your email app.</p>}

      {drafts.map(d => (
        <section key={d.id} className={`draft ${open === d.id ? 'open' : ''}`}>
          <button type="button" className="draft-head" onClick={() => setOpen(open === d.id ? '' : d.id)} aria-expanded={open === d.id}>
            <span>{d.label}</span><span className="chev" aria-hidden="true">{open === d.id ? '–' : '+'}</span>
          </button>
          {open === d.id && (
            <div className="draft-body">
              <div className="row">
                <label>Subject</label>
                <button type="button" onClick={() => copy(d.id + 's', d.subject)}>{copied === d.id + 's' ? 'Copied' : 'Copy'}</button>
              </div>
              <p className="subject">{d.subject}</p>
              <div className="row">
                <label>Email</label>
                <button type="button" onClick={() => copy(d.id + 'b', d.body)}>{copied === d.id + 'b' ? 'Copied' : 'Copy'}</button>
              </div>
              <pre className="body">{d.body}</pre>
              {toEmail && (
                <a className="send" href={`mailto:${toEmail}?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(d.body)}`}>Open in email app</a>
              )}
            </div>
          )}
        </section>
      ))}

      <details className="sig">
        <summary>Your signature</summary>
        <textarea rows={5} value={signature} onChange={(e) => saveSig(e.target.value)} />
        <p className="hint">Saved on this device and used in every draft.</p>
      </details>
    </div>
  )
}
