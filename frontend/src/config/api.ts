// Centralized API configuration
// In production, this should be set to your Railway backend URL
// In development, it will use localhost or the VITE_API_BASE env variable

const getApiBase = (): string => {
  // Check if we have an explicit API base URL in environment variables
  if (import.meta.env.VITE_API_BASE) {
    const base = import.meta.env.VITE_API_BASE;
    // Ensure it doesn't end with /api (we'll add that)
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  
  // In production, we need to use the full Railway URL
  if (import.meta.env.PROD) {
    // Default to Railway URL if not set
    return 'https://crossify-platform-production.up.railway.app/api';
  }
  
  // Development: use localhost
  return 'http://localhost:3001/api';
};

export const API_BASE = getApiBase();

// Log for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE);
}

