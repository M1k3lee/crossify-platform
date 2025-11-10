# Local Development Setup

## Quick Start

Yes, you can run the app locally! Here's how:

## Prerequisites

1. Node.js 18+ installed
2. All dependencies installed (run `npm run install:all` if not done)

## Running Locally

### Option 1: Use SQLite (Easiest for Local Testing)

The backend will automatically use SQLite if `DATABASE_URL` is not set.

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

Backend will run on: `http://localhost:3001`

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:3000`

The frontend is configured to automatically use `http://localhost:3001/api` in development mode.

### Option 2: Connect to Railway PostgreSQL (Use Production Database)

If you want to use the same database as production:

1. Get the `DATABASE_URL` from Railway:
   - Go to Railway → `passionate-spirit` project → PostgreSQL service
   - Copy the `DATABASE_URL` (it's in the Variables tab)

2. Add to `backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres:password@hostname:5432/railway
   ```

3. Then run:
   ```powershell
   cd backend
   npm run dev
   ```

## Testing Token Detail Page Locally

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open: `http://localhost:3000/token/29940f30-a619-4166-bbcc-a1a9ee80aa82`

## Current Fixes Status

### ✅ Completed Fixes

1. **Token Detail Page**
   - ✅ ErrorBoundary component added
   - ✅ Safe property access with null checks
   - ✅ Chain name normalization (base-sepolia, bsc-testnet, sepolia)
   - ✅ Try-catch blocks around deployment rendering
   - ✅ TypeScript errors fixed
   - ✅ All hooks called unconditionally

2. **Backend API**
   - ✅ PostgreSQL boolean handling (toBoolean helper)
   - ✅ Safe JSON parsing for advanced_settings
   - ✅ Nullish coalescing for all token properties
   - ✅ Deployment fetching refactored (separate query)

3. **Database**
   - ✅ PostgreSQL adapter with SQL conversion
   - ✅ GROUP_CONCAT → STRING_AGG conversion
   - ✅ INSERT OR IGNORE → ON CONFLICT DO NOTHING
   - ✅ Token visibility fixes

4. **Documentation**
   - ✅ GitHub link fixed in index.html
   - ✅ README updated with repository links

### 🧪 Testing Checklist

Before final push to Vercel, test locally:

- [ ] Token detail page loads without blank screen
- [ ] All 3 chain deployments display correctly
- [ ] Chain names show correctly (Base Sepolia, BSC Testnet, Sepolia)
- [ ] Price charts load
- [ ] Buy widget displays correctly
- [ ] No console errors
- [ ] Marketplace shows tokens correctly
- [ ] Token merging works (if needed)
- [ ] Error boundaries catch errors gracefully

## Environment Variables for Local Development

### Backend (.env)

**Minimum for SQLite:**
```
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

**For PostgreSQL (Railway):**
```
PORT=3001
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:password@hostname:5432/railway
```

### Frontend

No environment variables needed for local development - it automatically uses `http://localhost:3001/api`

## Troubleshooting

### Backend won't start?

1. Check if port 3001 is available
2. Make sure `.env` file exists in `backend/` directory
3. Check database connection (if using PostgreSQL)

### Frontend won't connect to backend?

1. Make sure backend is running on port 3001
2. Check browser console for CORS errors
3. Verify `CORS_ORIGIN=http://localhost:3000` in backend `.env`

### Database errors?

1. If using SQLite: Make sure `backend/data/` directory exists
2. If using PostgreSQL: Verify `DATABASE_URL` is correct
3. Check backend logs for database connection errors

## Next Steps

1. ✅ Test locally to verify all fixes work
2. ✅ Make any additional fixes if needed
3. ⏭️ Wait for Vercel deployment limit to reset
4. ⏭️ Push final consolidated commit to Vercel
5. ⏭️ Verify production deployment

## Commands Reference

```powershell
# Install all dependencies
npm run install:all

# Start backend (Terminal 1)
npm run dev:backend
# or
cd backend && npm run dev

# Start frontend (Terminal 2)
npm run dev:frontend
# or
cd frontend && npm run dev

# Build for production
npm run build:backend
npm run build:frontend
```

## Notes

- **Local development uses SQLite by default** (no DATABASE_URL needed)
- **Frontend automatically connects to localhost:3001 in dev mode**
- **All fixes are already in the code** - just need to test locally
- **Railway backend is still running** - local testing won't affect production

