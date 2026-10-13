import '../styles/AskFor.css'

// "Who to ask for" on a lead: the decision-maker found from public business sources.
export default function AskFor({ lead }) {
  const dm = lead.decisionMaker
  if (!dm) {
    return (
      <div className="askfor empty">
        <h4>Who to email</h4>
        <p><strong>The owner.</strong> No name found yet. Send the first email to the business address and start with “Hi there,”. Owners of small businesses usually read the main inbox.</p>
      </div>
    )
  }
  const tel = (dm.phone || '').replace(/[^\d+x]/gi, '').replace(/x.*/i, '')
  return (
    <div className="askfor">
      <h4>Who to email <span className={`conf ${dm.confidence}`}>{dm.confidence === 'confirmed' ? 'Confirmed' : 'Likely'}</span></h4>
      <p className="who">{dm.name || 'The owner'}{dm.role && <span>, {dm.role}</span>}</p>
      {(dm.phone || dm.email) && (
        <div className="direct">
          {dm.phone && <a href={`tel:${tel}`}>Direct: {dm.phone}</a>}
          {dm.email && <a href={`mailto:${dm.email}`}>{dm.email}</a>}
        </div>
      )}
      {dm.howToReach && <p className="tip">{dm.howToReach}</p>}
      {dm.source && <p className="src">Source: {dm.source}</p>}
    </div>
  )
}
