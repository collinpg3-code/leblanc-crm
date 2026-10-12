import React, { useState } from 'react'
import axios from 'axios'
import { getApiUrl } from '../utils/api'
import { parseCsv } from '../utils/csv'
import '../styles/ImportLeads.css'

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('crm-token')}` } })
const errorText = (err) => err.response?.data?.error || err.message

export default function ImportLeads({ onImportSuccess }) {
  const [showModal, setShowModal] = useState(false)
  const [backlog, setBacklog] = useState(null)
  const [count, setCount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const refreshBacklog = async () => {
    try {
      const { data } = await axios.get(`${getApiUrl()}/backlog`, authHeaders())
      setBacklog(data)
    } catch (err) {
      setMessage({ ok: false, text: `Couldn't load backlog: ${errorText(err)}` })
    }
  }

  const open = () => {
    setShowModal(true)
    setMessage(null)
    refreshBacklog()
  }

  const pull = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const { data } = await axios.post(`${getApiUrl()}/backlog/pull`, { count }, authHeaders())
      setMessage({ ok: true, text: `Imported ${data.imported} lead${data.imported === 1 ? '' : 's'} into your pipeline. ${data.remaining} left in the backlog.` })
      await refreshBacklog()
      onImportSuccess()
    } catch (err) {
      setMessage({ ok: false, text: `Import failed: ${errorText(err)}` })
    } finally {
      setLoading(false)
    }
  }

  const addCsv = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setLoading(true)
    setMessage(null)
    try {
      const leads = parseCsv(await file.text())
      if (leads.length === 0) throw new Error('No rows found in that CSV')
      const { data } = await axios.post(`${getApiUrl()}/backlog`, { leads }, authHeaders())
      const skipped = data.skipped ? ` (${data.skipped} already in the CRM or backlog, skipped)` : ''
      setMessage({ ok: true, text: `Added ${data.added} lead${data.added === 1 ? '' : 's'} to the backlog${skipped}.` })
      await refreshBacklog()
    } catch (err) {
      setMessage({ ok: false, text: `Couldn't add CSV: ${errorText(err)}` })
    } finally {
      setLoading(false)
    }
  }

  const waiting = backlog?.count ?? 0

  return (
    <>
      <button onClick={open} className="import-btn" title="Import leads from the backlog">
        Import Leads
      </button>

      {showModal && (
        <div className="import-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="import-modal-content" role="dialog" aria-label="Import leads" onClick={(e) => e.stopPropagation()}>
            <button className="import-close-btn" onClick={() => setShowModal(false)} aria-label="Close">✕</button>

            <h2>Import Leads</h2>
            <p className="import-backlog-count">
              {backlog ? <><strong>{waiting}</strong> lead{waiting === 1 ? '' : 's'} waiting in the backlog</> : 'Loading backlog…'}
            </p>
            {backlog?.next?.length > 0 && (
              <p className="import-next">Next up: {backlog.next.map(l => l.name).join(', ')}{waiting > backlog.next.length ? ', …' : ''}</p>
            )}

            <div className="import-pull">
              <label htmlFor="import-count">How many?</label>
              <input
                id="import-count"
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                disabled={loading}
              />
              <button onClick={pull} disabled={loading || waiting === 0} className="import-submit-btn">
                {loading ? 'Working…' : `Import ${Math.min(count, waiting || count)} lead${Math.min(count, waiting || count) === 1 ? '' : 's'}`}
              </button>
            </div>

            {message && <div className={`import-message ${message.ok ? 'success' : 'error'}`}>{message.text}</div>}

            <div className="import-add">
              <h4>Add Lead Scout results to the backlog</h4>
              <label className="import-file-label">
                <input type="file" accept=".csv" onChange={addCsv} disabled={loading} className="import-file-input" />
                Choose a leads.csv file
              </label>
              <p>Works with Lead Scout's CSV (business, url, sub_niche, location, stack, public_flags, contact, …). Duplicates are skipped.</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
