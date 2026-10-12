import { useState, useEffect } from 'react'
import axios from 'axios'
import { getApiUrl } from '../utils/api'
import LeadsList from '../components/LeadsList'
import Pipeline from '../components/Pipeline'
import ImportLeads from '../components/ImportLeads'
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

  if (loading) return <div className="loading">Loading CRM...</div>

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>LeBlanc Solutions CRM</h1>
          <p>Sales Pipeline & Lead Management</p>
        </div>
        <div className="header-right">
          <ImportLeads onImportSuccess={fetchData} />
          <button onClick={fetchData} className="refresh-btn" title="Refresh leads">
            ↻ Refresh
          </button>
          <span className="user-info">CollinLB12</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-btn ${view === 'list' ? 'active' : ''}`}
          onClick={() => setView('list')}
        >
          📋 Leads List
        </button>
        <button
          className={`nav-btn ${view === 'pipeline' ? 'active' : ''}`}
          onClick={() => setView('pipeline')}
        >
          📊 Pipeline
        </button>
      </nav>

      <div className="metrics-bar">
        <div className="metric">
          <span className="metric-label">Prospects</span>
          <span className="metric-value">{metrics.prospects || 0}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Qualified</span>
          <span className="metric-value">{metrics.qualified || 0}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Authorized</span>
          <span className="metric-value">{metrics.authorized || 0}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Reports</span>
          <span className="metric-value">{metrics.reports || 0}</span>
        </div>
        <div className="metric highlight">
          <span className="metric-label">Pipeline Value</span>
          <span className="metric-value">${metrics.revenue || 0}</span>
        </div>
      </div>

      <main className="dashboard-content">
        {error && <div className="error-banner">{error}</div>}

        {view === 'list' && <LeadsList leads={leads} onRefresh={fetchData} />}
        {view === 'pipeline' && <Pipeline leads={leads} />}
      </main>
    </div>
  )
}
