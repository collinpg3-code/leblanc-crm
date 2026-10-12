import { useState } from 'react'
import axios from 'axios'
import { getApiUrl } from '../utils/api'
import { STAGES, STAGE_LABELS, STAGE_COLORS } from '../utils/stages'
import LeadCard from './LeadCard'
import LeadDetail from './LeadDetail'
import '../styles/LeadsList.css'

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('crm-token')}` } })

export default function LeadsList({ leads, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const term = searchTerm.toLowerCase()
  const archivedCount = leads.filter(l => l.archived).length
  const filtered = leads.filter(lead => {
    const matchesSearch = [lead.name, lead.contact, lead.website, lead.industry]
      .some(v => (v || '').toLowerCase().includes(term))
    if (filterStage === 'archived') return lead.archived && matchesSearch
    if (lead.archived) return false
    return matchesSearch && (filterStage === 'all' || lead.stage === filterStage)
  })
  // Keep the open lead in sync with the latest data after saves/refreshes.
  const selected = leads.find(l => l.id === selectedId) || null

  const updateLead = async (leadId, updates) => {
    try {
      await axios.put(`${getApiUrl()}/engagements/${leadId}`, updates, authHeaders())
      onRefresh()
      if ('archived' in updates) setSelectedId(null)
    } catch (err) {
      console.error('Failed to update lead:', err)
    }
  }

  const deleteLead = async (leadId) => {
    try {
      await axios.delete(`${getApiUrl()}/engagements/${leadId}`, authHeaders())
      setSelectedId(null)
      onRefresh()
    } catch (err) {
      console.error('Failed to delete lead:', err)
    }
  }

  const filters = [['all', 'All'], ...STAGES.map(s => [s, STAGE_LABELS[s]]), ['archived', `Archived${archivedCount ? ` (${archivedCount})` : ''}`]]

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

        <div className="filter-buttons" role="group" aria-label="Filter leads">
          {filters.map(([id, label]) => (
            <button key={id} className={`filter-btn ${filterStage === id ? 'active' : ''}`} onClick={() => setFilterStage(id)}>
              {STAGE_COLORS[id] && <span className="dot" style={{ background: STAGE_COLORS[id] }} />}
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="result-count">{filtered.length} lead{filtered.length === 1 ? '' : 's'}</p>

      <div className="leads-grid">
        {filtered.length === 0 ? (
          <div className="no-leads">
            <h3>{filterStage === 'archived' ? 'Nothing archived' : 'No leads here yet'}</h3>
            <p>Use <strong>Import Leads</strong> to pull leads from your backlog, or wait for website enquiries.</p>
          </div>
        ) : (
          filtered.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              stageColors={STAGE_COLORS}
              onSelect={() => setSelectedId(lead.id)}
              isSelected={selectedId === lead.id}
            />
          ))
        )}
      </div>

      {selected && (
        <LeadDetail key={selected.id} lead={selected} onClose={() => setSelectedId(null)} onUpdate={updateLead} onDelete={deleteLead} />
      )}
    </div>
  )
}
