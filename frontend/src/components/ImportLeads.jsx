import React, { useState } from 'react'
import axios from 'axios'
import '../styles/ImportLeads.css'

export default function ImportLeads({ onImportSuccess }) {
  const [showModal, setShowModal] = useState(false)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setMessage('')
  }

  const handleImport = async () => {
    if (!file) {
      setMessage('Please select a CSV file')
      return
    }

    setLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const csv = event.target.result
        const lines = csv.split('\n').slice(1) // Skip header
        const leads = []

        lines.forEach(line => {
          if (line.trim()) {
            const parts = line.split(',').map(s => s.trim())
            const [business, contact, industry, location, stack, findings, website] = parts
            if (business && contact) {
              leads.push({
                name: business,
                contact,
                industry,
                location,
                stack,
                findings: findings || null,
                website: website || null
              })
            }
          }
        })

        if (leads.length === 0) {
          setMessage('No valid leads found in CSV')
          setLoading(false)
          return
        }

        try {
          const token = localStorage.getItem('crm-token')
          const response = await axios.post('/api/leads/sync', { leads }, {
            headers: { Authorization: `Bearer ${token}` }
          })

          setMessage(`✅ Imported ${response.data.imported} leads! (Total: ${response.data.total})`)
          setFile(null)

          setTimeout(() => {
            setShowModal(false)
            onImportSuccess()
          }, 1500)
        } catch (err) {
          setMessage(`❌ Import failed: ${err.response?.data?.error || err.message}`)
        }
      }
      reader.readAsText(file)
    } catch (err) {
      setMessage(`❌ Error reading file: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="import-btn"
        title="Import leads from CSV"
      >
        📥 Import Leads
      </button>

      {showModal && (
        <div className="import-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="import-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="import-close-btn" onClick={() => setShowModal(false)}>✕</button>

            <h2>Import Leads</h2>
            <p>Upload a CSV file from Lead Scout</p>

            <div className="import-upload-area">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={loading}
                className="import-file-input"
              />
              <p>{file ? `✓ ${file.name}` : 'Choose CSV file or drag & drop'}</p>
            </div>

            <div className="import-csv-format">
              <h4>CSV Format:</h4>
              <code>business,contact,industry,location,stack,findings,website</code>
              <p>Required: business, contact. Optional: industry, location, stack, findings, website</p>
            </div>

            {message && (
              <div className={`import-message ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="import-submit-btn"
            >
              {loading ? 'Importing...' : 'Import Leads'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
