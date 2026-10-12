import { useState } from 'react'
import { STAGES, STAGE_LABELS, STAGE_COLORS } from '../utils/stages'
import SalesBrief from './SalesBrief'
import AuthorizationPanel from './AuthorizationPanel'
import '../styles/LeadDetail.css'

const known = (v) => v && v !== 'Unknown'
const emailOf = (contact) => (/<([^>]+)>/.exec(contact || '') || [])[1] || ((contact || '').match(/[^\s<>]+@[^\s<>]+\.[^\s<>]+/) || [])[0] || ''
const phoneOf = (lead) => lead.phone || ((lead.contact || '').match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/) || [])[0] || ''

export default function LeadDetail({ lead, onClose, onUpdate, onDelete }) {
  const [notes, setNotes] = useState(lead.notes || '')
  const [stage, setStage] = useState(lead.stage)
  const [callStatus, setCallStatus] = useState(lead.callStatus || 'not_called')
  const [tab, setTab] = useState('brief')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const email = emailOf(lead.contact)
  const phone = phoneOf(lead)
  const tel = phone.replace(/[^\d+]/g, '')

  const save = () => onUpdate(lead.id, { notes, stage, callStatus, updatedAt: new Date().toISOString() })
  const toggleArchive = () => onUpdate(lead.id, { archived: !lead.archived, archivedAt: lead.archived ? null : new Date().toISOString() })

  const facts = [
    ['Contact', lead.contact],
    ['Phone', phone && <a href={`tel:${tel}`}>{phone}</a>],
    ['Website', lead.website && <a href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer">{lead.website}</a>],
    ['Location', lead.location],
    ['Built with', lead.stack],
    ['Service', lead.service],
    ['Value', lead.estimatedValue ? `$${lead.estimatedValue}` : 'To quote']
  ].filter(([, v]) => known(v))

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-sheet" role="dialog" aria-label={lead.name} onClick={(e) => e.stopPropagation()}>
        <header className="detail-head">
          <div>
            <p className="eyebrow" style={{ color: STAGE_COLORS[lead.stage] }}>
              {STAGE_LABELS[lead.stage]}{lead.archived ? ' · Archived' : ''}{lead.source === 'website' ? ' · Website enquiry' : ''}
            </p>
            <h2>{lead.name}</h2>
            <p className="detail-meta">{[lead.industry, lead.location].filter(known).join(' · ')}</p>
          </div>
          <button className="detail-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <nav className="detail-tabs" aria-label="Lead sections">
          {[['brief', 'Sales brief'], ['info', 'Details'], ['update', 'Update']].map(([id, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>

        <div className="detail-body">
          {tab === 'brief' && <SalesBrief lead={lead} />}

          {tab === 'info' && (
            <>
              <dl className="facts">
                {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
              {lead.findings && <div className="raw-notes"><h4>Research notes</h4><p>{lead.findings}</p></div>}
              <AuthorizationPanel lead={lead} />
            </>
          )}

          {tab === 'update' && (
            <div className="update-form">
              <div className="form-row">
                <label>Stage
                  <select value={stage} onChange={(e) => setStage(e.target.value)}>
                    {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                  </select>
                </label>
                <label>Call status
                  <select value={callStatus} onChange={(e) => setCallStatus(e.target.value)}>
                    <option value="not_called">Not called</option>
                    <option value="called">Called, no answer</option>
                    <option value="interested">Interested</option>
                    <option value="follow_up">Follow up</option>
                    <option value="not_interested">Not interested</option>
                  </select>
                </label>
              </div>
              <label>Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="What did they say?" /></label>
              <button onClick={save} className="btn-primary wide">Save changes</button>

              <div className="danger-zone">
                <button onClick={toggleArchive}>{lead.archived ? 'Restore lead' : 'Archive lead'}</button>
                {!confirmDelete
                  ? <button className="danger" onClick={() => setConfirmDelete(true)}>Delete</button>
                  : <button className="danger confirm" onClick={() => onDelete(lead.id)}>Tap again to delete for good</button>}
              </div>
              <p className="hint">Archive hides the lead but keeps it. Delete removes it permanently.</p>
            </div>
          )}
        </div>

        <footer className="action-bar">
          {tel ? <a className="act primary" href={`tel:${tel}`}>Call</a> : <span className="act disabled">No phone</span>}
          {tel && <a className="act" href={`sms:${tel}`}>Text</a>}
          {email ? <a className="act" href={`mailto:${email}`}>Email</a> : <span className="act disabled">No email</span>}
          {lead.website && <a className="act" href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer">Site</a>}
        </footer>
      </div>
    </div>
  )
}
