import React from 'react'
import '../styles/LeadCard.css'

export default function LeadCard({ lead, stageColors, onSelect, isSelected }) {
  return (
    <div
      className={`lead-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      style={{ borderLeftColor: stageColors[lead.stage] }}
    >
      <div className="card-header">
        <h3>{lead.name}</h3>
        <span
          className="stage-badge"
          style={{ backgroundColor: stageColors[lead.stage] }}
        >
          {lead.stage}
        </span>
      </div>

      {lead.website && (
        <div className="card-website">
          <a href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer">
            Link {lead.website}
          </a>
        </div>
      )}

      <div className="card-meta">
        <p><strong>{lead.industry}</strong></p>
        <p className="location">Location {lead.location}</p>
      </div>

      {lead.findings && (
        <div className="card-findings">
          <p className="findings-label">Issues:</p>
          <p className="findings-text">{lead.findings}</p>
        </div>
      )}

      <div className="card-info">
        <div className="info-row">
          <span className="label">Stack:</span>
          <span>{lead.stack}</span>
        </div>
        <div className="info-row">
          <span className="label">Service:</span>
          <span>{lead.service}</span>
        </div>
        <div className="info-row">
          <span className="label">Value:</span>
          <span className="value">${lead.estimatedValue}</span>
        </div>
      </div>

      <div className="card-footer">
        <p className="notes">{lead.notes?.substring(0, 50)}...</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${lead.progress}%` }}></div>
        </div>
      </div>
    </div>
  )
}
