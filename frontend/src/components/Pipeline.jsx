import { STAGES, STAGE_LABELS, STAGE_COLORS } from '../utils/stages'
import '../styles/Pipeline.css'

export default function Pipeline({ leads }) {
  return (
    <div className="pipeline-container">
      <div className="pipeline-board">
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.stage === stage)
          const stageValue = stageLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0)

          return (
            <section key={stage} className="pipeline-column" style={{ borderTopColor: STAGE_COLORS[stage] }}>
              <div className="column-header">
                <h3>{STAGE_LABELS[stage]}</h3>
                <div className="column-stats">
                  <span className="count">{stageLeads.length}</span>
                  <span className="value">${stageValue.toLocaleString()}</span>
                </div>
              </div>

              <div className="column-cards">
                {stageLeads.length === 0 && <p className="column-empty">Nothing here</p>}
                {stageLeads.map(lead => (
                  <div key={lead.id} className="pipeline-card">
                    <p className="card-name">{lead.name}</p>
                    {lead.industry && lead.industry !== 'Unknown' && <p className="card-industry">{lead.industry}</p>}
                    <p className="card-value">${lead.estimatedValue}</p>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
