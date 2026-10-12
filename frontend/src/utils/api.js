export function getApiUrl() {
  if (typeof window === 'undefined') return '/api'

  const hostname = window.location.hostname
  const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1'

  return isProduction ? 'https://leblanc-backend.onrender.com/api' : '/api'
}
