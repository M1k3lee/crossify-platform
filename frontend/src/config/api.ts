// Centralized API configuration
// In production, this should be set to your Railway backend URL
// In development, it will use localhost or the VITE_API_BASE env variable

const getApiBase = (): string => {
  // Check if we have an explicit API base URL in environment variables
  // This should be set in Vercel as VITE_API_BASE
  if (import.meta.env.VITE_API_BASE) {
    const base = import.meta.env.VITE_API_BASE;
    // Ensure it doesn't end with /api (we'll add that)
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  
  // In production, we need to use the full Railway URL
  // IMPORTANT: This should be set via VITE_API_BASE in Vercel environment variables
  // Get the URL from Railway: passionate-spirit project → crossify-platform service → Settings → Domains
  if (import.meta.env.PROD) {
    // Fallback - but this should be set via VITE_API_BASE in Vercel
    console.warn('⚠️ VITE_API_BASE not set in production! Using fallback URL. Please set it in Vercel environment variables.');
    return 'https://crossify-platform-production.up.railway.app/api';
  }
  
  // Development: use localhost
  return 'http://localhost:3001/api';
};

export const API_BASE = getApiBase();

// Log for debugging (always log in production to help debug)
console.log('🔗 API Base URL:', API_BASE);

