// Dev uses the Vite proxy (/api -> localhost:3001). Production builds call the
// Render backend directly; override with VITE_API_URL if it ever moves.
// VITE_API_URL may be given with or without the trailing /api.
const PROD_BACKEND_URL = 'https://leblanc-backend.onrender.com'

export function getApiUrl() {
  if (import.meta.env.DEV) return '/api'
  const base = (import.meta.env.VITE_API_URL || PROD_BACKEND_URL).replace(/\/+$/, '')
  return base.endsWith('/api') ? base : `${base}/api`
}
