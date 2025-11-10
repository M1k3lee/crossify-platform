# Railway Database Setup

## Critical Issue: Ephemeral Storage

Railway uses **ephemeral storage** by default, which means:
- Files are **deleted on every deployment**
- SQLite database files are **lost on redeploy**
- Tokens created before a redeploy will **disappear**

## Solutions

### Option 1: Use Railway PostgreSQL (Recommended)

1. **Add PostgreSQL service to Railway:**
   - Go to your Railway project
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will provide a `DATABASE_URL` environment variable

2. **Update backend to use PostgreSQL:**
   - Install PostgreSQL driver: `npm install pg`
   - Update `backend/src/db/index.ts` to use PostgreSQL instead of SQLite
   - Update connection string to use `DATABASE_URL`

3. **Migrate database schema:**
   - Convert SQLite schema to PostgreSQL
   - Run migrations on Railway

### Option 2: Use Persistent Volume (Railway Pro)

Railway Pro supports persistent volumes:
1. Add a volume to your Railway service
2. Mount it to `/data` directory
3. Set `DATABASE_PATH=/data/crossify.db`

### Option 3: Use External Database

Use an external database service:
- **Supabase** (PostgreSQL, free tier available)
- **PlanetScale** (MySQL, free tier available)
- **Neon** (PostgreSQL, free tier available)

## Current Status

**The database is currently using SQLite with ephemeral storage, which means:**
- ✅ Tokens can be created
- ❌ Tokens are lost on redeploy
- ❌ Database resets on every deployment

## Immediate Fix

Until a persistent database is set up:
1. **Tokens will disappear on redeploy** - this is expected behavior
2. **Sync service will repopulate tokens from blockchain** - but only if tokens exist on-chain
3. **Token creation should work** - but will be lost on next redeploy

## Next Steps

1. **Set up PostgreSQL on Railway** (recommended)
2. **Update database connection code**
3. **Migrate schema to PostgreSQL**
4. **Test token creation and persistence**

## Verification

To verify if database is persistent:
1. Create a token
2. Check Railway logs for: `✅ Token created successfully in database: <tokenId>`
3. Redeploy the service
4. Check if token still exists in database
5. If token is gone → database is ephemeral (expected with SQLite on Railway)

