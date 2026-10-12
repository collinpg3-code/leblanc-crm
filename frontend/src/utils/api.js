export function getApiUrl() {
  // Server-side rendering
  if (typeof window === 'undefined') {
    return '/api'
  }

  // Always use production backend unless explicitly on localhost
  const hostname = window.location.hostname
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost')

  if (isLocalhost) {
    return '/api'
  }

  // Production: use Render backend
  return 'https://leblanc-backend.onrender.com/api'
}
