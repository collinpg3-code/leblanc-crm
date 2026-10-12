// Dev uses the Vite proxy (/api -> localhost:3001). Production builds call the
// Render backend directly; override with VITE_API_URL if it ever moves.
const PROD_API_URL = 'https://leblanc-backend.onrender.com/api'

export function getApiUrl() {
  if (import.meta.env.DEV) return '/api'
  return import.meta.env.VITE_API_URL || PROD_API_URL
}
