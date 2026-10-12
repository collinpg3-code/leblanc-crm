// LeBlanc Solutions CRM Configuration
// Copy this file to config.js and customize for your environment

module.exports = {
  // Backend API configuration
  api: {
    url: process.env.VITE_API_URL || 'http://localhost:3001',
    timeout: process.env.VITE_API_TIMEOUT || 5000
  },

  // CRM credentials (change these in production)
  auth: {
    username: process.env.CRM_USERNAME || 'CollinLB12',
    password: process.env.CRM_PASSWORD
  },

  // Netlify configuration (for deployment)
  netlify: {
    siteName: process.env.NETLIFY_SITE_NAME || 'leblanc-crm',
    environment: process.env.CONTEXT || 'production'
  },

  // Feature flags
  debug: process.env.VITE_DEBUG_MODE === 'true',
  environment: process.env.NODE_ENV || 'development'
}
