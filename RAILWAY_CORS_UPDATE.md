# Railway CORS Configuration Update

## Issue
The backend was blocking requests from the Vercel frontend due to CORS policy. The CORS configuration only allowed `http://localhost:3000`, but the frontend is deployed on `https://crossify-platform.vercel.app`.

## Solution
Updated the backend CORS configuration to allow multiple origins:
- `http://localhost:3000` (local development)
- `http://localhost:3001` (local development alternative)
- `https://crossify-platform.vercel.app` (Vercel deployment)
- `https://crossify.io` (production domain)
- `https://www.crossify.io` (www subdomain)
- Environment variable origins (`CORS_ORIGIN`, `VERCEL_URL`, `FRONTEND_URL`)

## Files Changed
- `backend/src/index.ts` - Updated CORS middleware to support multiple origins

## Next Steps
1. The code has been committed and pushed to GitHub
2. Railway should automatically redeploy the backend
3. If Railway doesn't auto-deploy, manually trigger a redeploy in Railway dashboard
4. Test the contact form again after deployment

## Verification
After Railway redeploys, test the contact form:
- Should no longer see CORS errors in console
- Contact form should submit successfully
- No email client fallback should be needed

## Optional: Set Environment Variable in Railway
You can also set `CORS_ORIGIN` environment variable in Railway dashboard if you want to restrict to specific domains:
- Go to Railway → Your Service → Variables
- Add: `CORS_ORIGIN=https://crossify-platform.vercel.app,https://crossify.io`

Note: The code now supports multiple origins by default, so this is optional.

