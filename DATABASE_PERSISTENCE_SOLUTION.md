# Database Persistence Solution

## 🚨 Problem

**Issue**: Tokens created on testnet disappear after every deployment to Railway.

**Root Cause**: Railway uses **ephemeral filesystems**. When you deploy, the entire container is wiped and recreated. SQLite database files stored in the local filesystem are deleted.

## ✅ Solution 1: Automatic Blockchain Sync (Implemented)

### How It Works

1. **Startup Sync**: On server startup, the backend automatically queries all TokenFactory contracts on all configured chains and syncs all tokens to the database.

2. **Marketplace Sync**: When users visit the marketplace, tokens are automatically synced from the blockchain if they're missing.

3. **User Dashboard Sync**: When users check their dashboard, their tokens are automatically synced from the blockchain.

### Benefits

- ✅ Tokens are automatically re-discovered after deployments
- ✅ No data loss - all tokens exist on-chain
- ✅ Works immediately after deployment
- ✅ No manual intervention needed

### How It Works

The `startupSync.ts` service:
1. Queries all `TokenCreated` events from TokenFactory contracts
2. Fetches token details (name, symbol, decimals, etc.)
3. Fetches bonding curve details (basePrice, slope, etc.)
4. Inserts tokens into the database
5. Runs automatically on server startup (after 5 seconds delay)

### Configuration

The sync uses these environment variables:

```env
# Factory Addresses (required)
BASE_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
BASE_SEPOLIA_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
BSC_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
BSC_TESTNET_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
SEPOLIA_FACTORY_ADDRESS=0x...
ETHEREUM_FACTORY_ADDRESS=0x...

# RPC URLs (optional - has defaults)
BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

### Limitations

- ⚠️ Only syncs tokens created through TokenFactory contracts
- ⚠️ Syncs from last 50,000 blocks (configurable)
- ⚠️ Database is still ephemeral (but tokens are re-discovered)
- ⚠️ User metadata (logos, descriptions, social links) is not on-chain, so it will be lost

## ✅ Solution 2: PostgreSQL on Railway (Recommended for Production)

### Why PostgreSQL?

- ✅ **Persistent storage** - Database survives deployments
- ✅ **Better performance** - Optimized for production workloads
- ✅ **Scalability** - Can handle more concurrent connections
- ✅ **Data integrity** - ACID compliance
- ✅ **User metadata preserved** - Logos, descriptions, social links persist

### Migration Steps

#### Step 1: Add PostgreSQL to Railway

1. Go to your Railway project
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a PostgreSQL database
4. Note the connection details (will be in environment variables)

#### Step 2: Install PostgreSQL Driver

```bash
cd backend
npm install pg @types/pg
```

#### Step 3: Update Database Configuration

Create `backend/src/db/postgres.ts`:

```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default pool;

// Helper functions
export async function dbRun(sql: string, params?: any[]): Promise<any> {
  const result = await pool.query(sql, params);
  return result;
}

export async function dbGet<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
  const result = await pool.query(sql, params);
  return result.rows[0] as T | undefined;
}

export async function dbAll<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows as T[];
}
```

#### Step 4: Update SQL Queries

PostgreSQL uses different syntax than SQLite:
- `INSERT OR IGNORE` → `INSERT ... ON CONFLICT DO NOTHING`
- `GROUP_CONCAT` → `STRING_AGG`
- `COALESCE(column, 0)` → `COALESCE(column, 0)` (same)
- `LOWER()` → `LOWER()` (same)

#### Step 5: Update Environment Variables

Railway will automatically set `DATABASE_URL`. Update your code to use PostgreSQL when `DATABASE_URL` is set:

```typescript
// backend/src/db/index.ts
const usePostgres = !!process.env.DATABASE_URL;

if (usePostgres) {
  // Use PostgreSQL
  export * from './postgres';
} else {
  // Use SQLite (development)
  export * from './sqlite';
}
```

#### Step 6: Run Migrations

Create migration scripts to set up PostgreSQL schema:

```sql
-- Create tables (same structure as SQLite)
CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  -- ... etc
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_token_deployments_token_id ON token_deployments(token_id);
-- ... etc
```

### Migration Guide

See `POSTGRES_MIGRATION_GUIDE.md` for detailed migration steps.

## 📊 Comparison

| Feature | SQLite (Current) | PostgreSQL (Recommended) |
|---------|------------------|-------------------------|
| **Persistence** | ❌ Ephemeral | ✅ Persistent |
| **Performance** | ⚠️ Good for small apps | ✅ Excellent |
| **Scalability** | ⚠️ Limited | ✅ Highly scalable |
| **Data Loss** | ⚠️ On deployment | ✅ Never |
| **User Metadata** | ❌ Lost on deploy | ✅ Preserved |
| **Setup Complexity** | ✅ Simple | ⚠️ Moderate |
| **Cost** | ✅ Free | ⚠️ ~$5-20/month |

## 🎯 Recommendation

### For Development/Testnet
- ✅ **Use SQLite with blockchain sync** (current solution)
- Tokens are automatically re-discovered
- No additional cost
- Good enough for testing

### For Production
- ✅ **Migrate to PostgreSQL**
- Data persists across deployments
- User metadata is preserved
- Better performance and scalability
- Professional setup

## 🚀 Next Steps

1. **Immediate**: The blockchain sync is already implemented and will work after next deployment
2. **Short-term**: Test the sync by deploying and verifying tokens are re-discovered
3. **Long-term**: Plan migration to PostgreSQL for production

## 📝 Notes

- The blockchain sync queries events from the last 50,000 blocks
- If tokens are older than 50,000 blocks, they may not be discovered
- You can increase the block range in `startupSync.ts` if needed
- The sync runs automatically on startup and in the background
- It's safe to run multiple times (uses `INSERT OR IGNORE`)

---

**Status**: ✅ Blockchain sync implemented and ready to deploy
**Next**: Deploy and verify tokens are automatically re-discovered

