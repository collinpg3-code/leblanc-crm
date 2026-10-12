import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import './styles/App.css'

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('crm-token')
    setAuthenticated(!!token)
    setLoading(false)
  }, [])

  if (loading) return <div className="loading">Loading...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!authenticated ? <Login onLogin={() => setAuthenticated(true)} /> : <Navigate to="/" />}
        />
        <Route
          path="/"
          element={authenticated ? <Dashboard onLogout={() => setAuthenticated(false)} /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  )
}
