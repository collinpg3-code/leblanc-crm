import React from 'react'
import { STAGE_LABELS } from '../utils/stages'
import { fallbackBrief } from '../utils/brief'
import '../styles/LeadCard.css'

const known = (v) => v && v !== 'Unknown'

export default function LeadCard({ lead, stageColors, onSelect, isSelected }) {
  const color = stageColors[lead.stage]
  const brief = lead.brief || fallbackBrief(lead)
  const topIssue = brief.securityIssues?.find(i => i.priority === 'high')
  const hasEmail = !!(lead.decisionMaker?.email || /@/.test(lead.contact || ''))
  const meta = [lead.industry, lead.location && lead.location.split(',').slice(-2).join(',').trim()].filter(known).join(' · ')

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
        <span className="service-badge">{brief.recommendedService}</span>
      </div>

      <h3>{lead.name}</h3>
      {meta && <p className="card-meta">{meta}</p>}
      {lead.decisionMaker?.name && (
        <p className="card-askfor">Email <strong>{lead.decisionMaker.name}</strong>{lead.decisionMaker.role ? `, ${lead.decisionMaker.role}` : ''}</p>
      )}

      <p className="card-summary">{brief.summary}</p>

      {topIssue && <p className="card-issue"><span>High</span>{topIssue.issue}</p>}

      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
        {lead.website && <a href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer">Their site</a>}
        <span className={`card-email ${hasEmail ? '' : 'none'}`}>{hasEmail ? '✉ Email ready' : 'No email found'}</span>
        <button type="button" onClick={onSelect}>Open →</button>
      </div>
    </article>
  )
}
