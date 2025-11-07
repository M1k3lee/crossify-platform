// Vercel serverless function wrapper for the backend API
// This allows the backend to run as serverless functions on Vercel
// Note: For production, you may want to deploy the backend separately on Railway/Render

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // For now, return a message that backend should be deployed separately
  // In production, you can either:
  // 1. Deploy backend to Railway/Render and proxy requests
  // 2. Convert backend routes to individual Vercel serverless functions
  
  res.status(503).json({
    error: 'Backend API is not available on this deployment',
    message: 'Please deploy the backend separately or convert routes to serverless functions'
  });
}


