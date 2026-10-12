import '../styles/Pipeline.css'

export default function Pipeline({ leads }) {
  const stages = ['prospect', 'qualified', 'authorized', 'scan', 'report', 'fix']
  const stageLabels = {
    prospect: '🌱 Prospects',
    qualified: '⭐ Qualified',
    authorized: '✅ Authorized',
    scan: '🔍 Scan',
    report: '📄 Report',
    fix: '🔧 Fix'
  }

  return (
    <div className="pipeline-container">
      <div className="pipeline-board">
        {stages.map(stage => {
          const stageLeads = leads.filter(l => l.stage === stage)
          const stageValue = stageLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0)

          return (
            <div key={stage} className="pipeline-column">
              <div className="column-header">
                <h3>{stageLabels[stage]}</h3>
                <div className="column-stats">
                  <span className="count">{stageLeads.length}</span>
                  <span className="value">${stageValue}</span>
                </div>
              </div>

              <div className="column-cards">
                {stageLeads.map(lead => (
                  <div key={lead.id} className="pipeline-card">
                    <p className="card-name">{lead.name}</p>
                    <p className="card-industry">{lead.industry}</p>
                    <p className="card-value">${lead.estimatedValue}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
