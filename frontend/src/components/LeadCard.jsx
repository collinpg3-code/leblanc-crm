import React from 'react'
import { STAGE_LABELS } from '../utils/stages'
import '../styles/LeadCard.css'

const known = (v) => v && v !== 'Unknown'

export default function LeadCard({ lead, stageColors, onSelect, isSelected }) {
  const color = stageColors[lead.stage]
  const meta = [lead.industry, lead.location].filter(known).join(' · ')

  return (
    <article
      className={`lead-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect())}
      tabIndex={0}
      role="button"
      style={{ borderTopColor: color }}
    >
      <div className="card-header">
        <span className="stage-badge" style={{ color, borderColor: color }}>{STAGE_LABELS[lead.stage] || lead.stage}</span>
        {lead.source === 'website' && <span className="source-badge">Website</span>}
      </div>

      <h3>{lead.name}</h3>
      {meta && <p className="card-meta">{meta}</p>}

      {lead.website && (
        <a className="card-website" href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
          {lead.website}
        </a>
      )}

      {lead.findings && <p className="card-findings">{lead.findings}</p>}

      <dl className="card-info">
        {known(lead.contact) && (
          <div className="info-row">
            <dt>Contact</dt>
            <dd>{lead.contact}</dd>
          </div>
        )}
        {lead.phone && (
          <div className="info-row">
            <dt>Phone</dt>
            <dd><a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`} onClick={(e) => e.stopPropagation()}>{lead.phone}</a></dd>
          </div>
        )}
        <div className="info-row">
          <dt>Service</dt>
          <dd>{lead.service}</dd>
        </div>
        <div className="info-row">
          <dt>Value</dt>
          <dd className="value">${lead.estimatedValue}</dd>
        </div>
      </dl>

      <div className="progress-bar" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${lead.progress || 0}%`, background: color }} />
      </div>
    </article>
  )
}
