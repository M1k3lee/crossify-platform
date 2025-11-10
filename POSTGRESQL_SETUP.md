# PostgreSQL Setup for Railway

## Quick Setup Guide

### Step 1: Add PostgreSQL to Railway

1. Go to your Railway project dashboard
2. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically:
   - Create a PostgreSQL database
   - Add `DATABASE_URL` environment variable to your service
   - Configure SSL and connection pooling

### Step 2: Verify DATABASE_URL

Railway automatically adds `DATABASE_URL` to your service environment variables. It will look like:
```
postgresql://postgres:password@hostname:5432/railway
```

### Step 3: Deploy

The backend will automatically:
- Detect `DATABASE_URL` environment variable
- Use PostgreSQL instead of SQLite
- Create all necessary tables and indexes
- Migrate data (if needed)

## Verification

After deployment, check Railway logs for:
```
🗄️  Using PostgreSQL database
✅ PostgreSQL connection pool initialized
✅ PostgreSQL database schema initialized
```

## Benefits of PostgreSQL

✅ **Persistent storage** - Data survives redeployments
✅ **Better performance** - Optimized for production workloads
✅ **ACID compliance** - Data integrity guarantees
✅ **Concurrent access** - Multiple connections supported
✅ **Better scaling** - Handles larger datasets

## Migration from SQLite

If you have existing data in SQLite:
1. Export data from SQLite database
2. Import into PostgreSQL (manual process)
3. Or let the sync service repopulate from blockchain

## Troubleshooting

### Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check Railway database is running
- Verify network connectivity

### Schema Issues
- Check logs for schema creation errors
- Verify all tables are created
- Check indexes are created

### Data Issues
- Verify foreign key constraints
- Check token sync is working
- Verify deployments are being saved

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string (automatically set by Railway)

Optional:
- `DATABASE_PATH` - SQLite database path (ignored if DATABASE_URL is set)

## Next Steps

1. Add PostgreSQL to Railway
2. Deploy backend
3. Verify tokens are syncing correctly
4. Test token creation
5. Verify marketplace is working

