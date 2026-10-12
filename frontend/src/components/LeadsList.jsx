import { useState } from 'react'
import axios from 'axios'
import LeadCard from './LeadCard'
import '../styles/LeadsList.css'

export default function LeadsList({ leads, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [selectedLead, setSelectedLead] = useState(null)

  const filtered = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.contact.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStage = filterStage === 'all' || lead.stage === filterStage
    return matchesSearch && matchesStage
  })

  const stages = ['prospect', 'qualified', 'authorized', 'scan', 'report', 'fix']
  const stageColors = {
    prospect: '#666',
    qualified: '#ff9800',
    authorized: '#2196f3',
    scan: '#9c27b0',
    report: '#4caf50',
    fix: '#f44336'
  }

  const updateLead = async (leadId, updates) => {
    try {
      const token = localStorage.getItem('crm-token')
      await axios.put(`/api/engagements/${leadId}`, updates, {
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
          type="text"
          placeholder="Search leads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="filter-buttons">
          {['all', ...stages].map(stage => (
            <button
              key={stage}
              className={`filter-btn ${filterStage === stage ? 'active' : ''}`}
              onClick={() => setFilterStage(stage)}
              style={stage !== 'all' ? { borderColor: stageColors[stage] } : {}}
            >
              {stage === 'all' ? 'All' : stage.charAt(0).toUpperCase() + stage.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="leads-grid">
        {filtered.length === 0 ? (
          <div className="no-leads">No leads found</div>
        ) : (
          filtered.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              stageColors={stageColors}
              onSelect={() => setSelectedLead(lead)}
              isSelected={selectedLead?.id === lead.id}
            />
          ))
        )}
      </div>

      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={updateLead}
          stageColors={stageColors}
        />
      )}
    </div>
  )
}

function LeadDetail({ lead, onClose, onUpdate, stageColors }) {
  const [notes, setNotes] = useState(lead.notes || '')
  const [stage, setStage] = useState(lead.stage)
  const [callStatus, setCallStatus] = useState(lead.callStatus || 'not_called')

  const stages = ['prospect', 'qualified', 'authorized', 'scan', 'report', 'fix']

  const handleSave = () => {
    onUpdate(lead.id, {
      notes,
      stage,
      callStatus,
      updatedAt: new Date().toISOString()
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>

        <h2>{lead.name}</h2>
        <p className="lead-meta">{lead.industry} • {lead.location}</p>

        <div className="detail-grid">
          <div className="detail-field">
            <label>Contact</label>
            <p>{lead.contact}</p>
          </div>
          <div className="detail-field">
            <label>Stack</label>
            <p>{lead.stack}</p>
          </div>
          <div className="detail-field">
            <label>Service</label>
            <p>{lead.service}</p>
          </div>
          <div className="detail-field">
            <label>Value</label>
            <p>${lead.estimatedValue}</p>
          </div>
        </div>

        <div className="detail-form">
          <div className="form-group">
            <label>Stage</label>
            <select value={stage} onChange={(e) => setStage(e.target.value)}>
              {stages.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Call Status</label>
            <select value={callStatus} onChange={(e) => setCallStatus(e.target.value)}>
              <option value="not_called">Not Called</option>
              <option value="called">Called</option>
              <option value="interested">Interested</option>
              <option value="follow_up">Follow Up</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add call notes..."
              rows={4}
            />
          </div>

          <button onClick={handleSave} className="save-btn">Save Changes</button>
        </div>
      </div>
    </div>
  )
}
