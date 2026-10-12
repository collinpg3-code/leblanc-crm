import { useState } from 'react'
import axios from 'axios'
import { getApiUrl } from '../utils/api'
import Logo from '../components/Logo'
import '../styles/Login.css'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${getApiUrl()}/auth/login`, { username, password })
      localStorage.setItem('crm-token', response.data.token)
      onLogin()
    } catch (err) {
      if (!err.response) {
        setError(`Can't reach the server (${err.message}). Try again in a minute.`)
      } else {
        setError(err.response.data?.error || `Login failed (HTTP ${err.response.status})`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <Logo subtitle="CRM" />
        <h1>Sign in</h1>
        <p className="subtitle">Sales pipeline and lead management.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message" role="alert">{error}</div>}

          <button type="submit" disabled={loading} className="login-btn btn-primary">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
