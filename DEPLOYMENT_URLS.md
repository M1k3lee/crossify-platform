# Deployment URLs - Quick Reference

## 🚂 Railway (Backend)
- **Base URL**: `https://crossify-platform-production.up.railway.app`
- **API Base**: `https://crossify-platform-production.up.railway.app/api`
- **Health Check**: `https://crossify-platform-production.up.railway.app/api/health`

## 🌐 Vercel (Frontend)
- **Production**: `https://crossify.io` (or your Vercel domain)
- **API Base**: Set via `VITE_API_BASE` environment variable in Vercel

## 📋 Common API Endpoints

### Diagnostics
- **Sync Diagnostics**: `https://crossify-platform-production.up.railway.app/api/tokens/{tokenId}/sync-diagnostics`

### Health Checks
- **Backend Health**: `https://crossify-platform-production.up.railway.app/api/health`
- **Token Health**: `https://crossify-platform-production.up.railway.app/api/health/tokens`

### Token Operations
- **Get Token**: `https://crossify-platform-production.up.railway.app/api/tokens/{tokenId}`
- **Sync Prices**: `POST https://crossify-platform-production.up.railway.app/api/tokens/{tokenId}/sync-prices`
- **Price Sync Status**: `https://crossify-platform-production.up.railway.app/api/tokens/{tokenId}/price-sync`

## 🔧 How to Use

Replace `{tokenId}` with your actual token ID (UUID format).

Example:
```
https://crossify-platform-production.up.railway.app/api/tokens/9ed6d4f6-02bc-4c3e-8b48-dab785d4d9af/sync-diagnostics
```

