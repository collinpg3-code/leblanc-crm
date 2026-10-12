import { useState } from 'react'
import axios from 'axios'
import { getApiUrl } from '../utils/api'
import { STAGES, STAGE_LABELS, STAGE_COLORS } from '../utils/stages'
import LeadCard from './LeadCard'
import AuthorizationPanel from './AuthorizationPanel'
import '../styles/LeadsList.css'

export default function LeadsList({ leads, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [selectedLead, setSelectedLead] = useState(null)

  const term = searchTerm.toLowerCase()
  const filtered = leads.filter(lead => {
    const matchesSearch = [lead.name, lead.contact, lead.website, lead.industry]
      .some(v => (v || '').toLowerCase().includes(term))
    const matchesStage = filterStage === 'all' || lead.stage === filterStage
    return matchesSearch && matchesStage
  })

  const updateLead = async (leadId, updates) => {
    try {
      const token = localStorage.getItem('crm-token')
      await axios.put(`${getApiUrl()}/engagements/${leadId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      })
      onRefresh()
      setSelectedLead(null)
    } catch (err) {
      console.error('Failed to update lead:', err)
    }
  }

  return (
    <div className="leads-list-container">
      <div className="list-controls">
        <input
          type="search"
          placeholder="Search name, contact, website…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          aria-label="Search leads"
        />

        <div className="filter-buttons" role="group" aria-label="Filter by stage">
          {['all', ...STAGES].map(stage => (
            <button
              key={stage}
              className={`filter-btn ${filterStage === stage ? 'active' : ''}`}
              onClick={() => setFilterStage(stage)}
            >
              {stage !== 'all' && <span className="dot" style={{ background: STAGE_COLORS[stage] }} />}
              {stage === 'all' ? 'All' : STAGE_LABELS[stage]}
            </button>
          ))}
        </div>
      </div>

      <p className="result-count">{filtered.length} lead{filtered.length === 1 ? '' : 's'}</p>

      <div className="leads-grid">
        {filtered.length === 0 ? (
          <div className="no-leads">
            <h3>No leads here yet</h3>
            <p>Use <strong>Import Leads</strong> to pull leads from your backlog, or wait for website enquiries.</p>
          </div>
        ) : (
          filtered.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              stageColors={STAGE_COLORS}
              onSelect={() => setSelectedLead(lead)}
              isSelected={selectedLead?.id === lead.id}
            />
          ))
        )}
      </div>

      {selectedLead && (
        <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdate={updateLead} />
      )}
    </div>
  )
}

function LeadDetail({ lead, onClose, onUpdate }) {
  const [notes, setNotes] = useState(lead.notes || '')
  const [stage, setStage] = useState(lead.stage)
  const [callStatus, setCallStatus] = useState(lead.callStatus || 'not_called')

  const handleSave = () => {
    onUpdate(lead.id, { notes, stage, callStatus, updatedAt: new Date().toISOString() })
  }

  const facts = [
    ['Contact', lead.contact],
    ['Phone', lead.phone && <a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}>{lead.phone}</a>],
    ['Website', lead.website && <a href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer">{lead.website}</a>],
    ['Stack', lead.stack],
    ['Service', lead.service],
    ['Value', `$${lead.estimatedValue}`]
  ].filter(([, v]) => v && v !== 'Unknown')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" role="dialog" aria-label={lead.name} onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>

        <p className="eyebrow" style={{ color: STAGE_COLORS[lead.stage] }}>{STAGE_LABELS[lead.stage]}</p>
        <h2>{lead.name}</h2>
        <p className="lead-meta">
          {[lead.industry, lead.location].filter(v => v && v !== 'Unknown').join(' · ')}
          {lead.source === 'website' && <span className="source-tag">Website enquiry</span>}
        </p>

        <dl className="detail-grid">
          {facts.map(([label, value]) => (
            <div className="detail-field" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <AuthorizationPanel lead={lead} />

        {lead.findings && (
          <div className="detail-findings">
            <dt>Public signals</dt>
            <dd>{lead.findings}</dd>
          </div>
        )}

        <div className="detail-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lead-stage">Stage</label>
              <select id="lead-stage" value={stage} onChange={(e) => setStage(e.target.value)}>
                {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="lead-call">Call status</label>
              <select id="lead-call" value={callStatus} onChange={(e) => setCallStatus(e.target.value)}>
                <option value="not_called">Not called</option>
                <option value="called">Called</option>
                <option value="interested">Interested</option>
                <option value="follow_up">Follow up</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="lead-notes">Notes</label>
            <textarea id="lead-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add call notes…" rows={5} />
          </div>

          <button onClick={handleSave} className="save-btn btn-primary">Save changes</button>
        </div>
      </div>
    </div>
  )
}
