import { useState, useEffect } from 'react'
import axios from 'axios'
import { getApiUrl } from '../utils/api'
import LeadsList from '../components/LeadsList'
import Pipeline from '../components/Pipeline'
import ImportLeads from '../components/ImportLeads'
import Logo from '../components/Logo'
import '../styles/Dashboard.css'

export default function Dashboard({ onLogout }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('list')
  const [metrics, setMetrics] = useState({})

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('crm-token')
      const apiUrl = getApiUrl()
      const response = await axios.get(`${apiUrl}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLeads(response.data.engagements)
      setMetrics(response.data.metrics)
      setError('')
    } catch (err) {
      setError('Failed to load data')
      if (err.response?.status === 401) {
        onLogout()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('crm-token')
    onLogout()
  }

  if (loading) return <div className="loading">Loading CRM…</div>

  const metricItems = [
    ['Prospects', metrics.prospects || 0],
    ['Qualified', metrics.qualified || 0],
    ['Authorized', metrics.authorized || 0],
    ['Reports', metrics.reports || 0],
    ['Pipeline value', `$${(metrics.revenue || 0).toLocaleString()}`, true]
  ]

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <Logo subtitle="CRM" />
        <div className="header-actions">
          <ImportLeads onImportSuccess={fetchData} />
          <button onClick={fetchData} className="refresh-btn" title="Refresh leads" aria-label="Refresh">
            <span aria-hidden="true">↻</span><span className="btn-label"> Refresh</span>
          </button>
          <button onClick={handleLogout} className="logout-btn">Log out</button>
        </div>
      </header>

      <div className="dashboard-intro">
        <p className="eyebrow">Sales pipeline</p>
        <nav className="dashboard-nav" aria-label="View">
          <button className={`nav-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
            Leads
          </button>
          <button className={`nav-btn ${view === 'pipeline' ? 'active' : ''}`} onClick={() => setView('pipeline')}>
            Pipeline
          </button>
        </nav>
      </div>

      <div className="metrics-bar">
        {metricItems.map(([label, value, highlight]) => (
          <div key={label} className={`metric ${highlight ? 'highlight' : ''}`}>
            <span className="metric-label">{label}</span>
            <span className="metric-value">{value}</span>
          </div>
        ))}
      </div>

      <main className="dashboard-content">
        {error && <div className="error-banner">{error}</div>}

        {view === 'list' && <LeadsList leads={leads} onRefresh={fetchData} />}
        {view === 'pipeline' && <Pipeline leads={leads} />}
      </main>
    </div>
  )
}
