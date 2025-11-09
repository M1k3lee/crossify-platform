# PostgreSQL Migration Guide

## Overview

This guide will help you migrate from SQLite to PostgreSQL on Railway for persistent database storage.

## Prerequisites

- Railway account with a project
- Node.js backend codebase
- Basic knowledge of SQL

## Step 1: Add PostgreSQL to Railway

1. Go to your Railway project dashboard
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically:
   - Create a PostgreSQL database
   - Set `DATABASE_URL` environment variable
   - Provide connection details

4. Note the database name and connection details (you'll see them in the Railway dashboard)

## Step 2: Install Dependencies

```bash
cd backend
npm install pg @types/pg
```

## Step 3: Create PostgreSQL Database Module

Create `backend/src/db/postgres.ts`:

```typescript
import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
});

export default pool;

// Helper functions (compatible with SQLite interface)
export async function dbRun(sql: string, params?: any[]): Promise<QueryResult> {
  // Convert SQLite syntax to PostgreSQL
  const pgSql = convertSqliteToPostgres(sql);
  const result = await pool.query(pgSql, params);
  return result;
}

export async function dbGet<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
  const pgSql = convertSqliteToPostgres(sql);
  const result = await pool.query(pgSql, params);
  return result.rows[0] as T | undefined;
}

export async function dbAll<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const pgSql = convertSqliteToPostgres(sql);
  const result = await pool.query(pgSql, params);
  return result.rows as T[];
}

// Convert SQLite syntax to PostgreSQL
function convertSqliteToPostgres(sql: string): string {
  let pgSql = sql;

  // INSERT OR IGNORE → INSERT ... ON CONFLICT DO NOTHING
  pgSql = pgSql.replace(/INSERT OR IGNORE INTO/gi, 'INSERT INTO');
  
  // Add ON CONFLICT for INSERT OR IGNORE
  if (pgSql.match(/INSERT INTO.*\(.*\)\s*VALUES/gi)) {
    // This is a simplified conversion - you may need to adjust based on your SQL
    // For now, we'll handle this in the migration script
  }

  // GROUP_CONCAT → STRING_AGG
  pgSql = pgSql.replace(/GROUP_CONCAT\(([^)]+)\)/gi, (match, expr) => {
    // Extract column name and separator if present
    const parts = expr.split(',').map((p: string) => p.trim());
    if (parts.length > 1) {
      // GROUP_CONCAT(col, separator) → STRING_AGG(col, separator)
      return `STRING_AGG(${parts[0]}::text, ${parts[1]})`;
    } else {
      // GROUP_CONCAT(col) → STRING_AGG(col, ',')
      return `STRING_AGG(${parts[0]}::text, ',')`;
    }
  });

  // INTEGER PRIMARY KEY AUTOINCREMENT → SERIAL PRIMARY KEY
  pgSql = pgSql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');

  // BOOLEAN → BOOLEAN (same, but SQLite uses INTEGER)
  // We'll handle this in the schema

  // TEXT → TEXT (same)

  // REAL → REAL or NUMERIC (same)

  return pgSql;
}

// Initialize database (create tables)
export async function initializeDatabase(): Promise<void> {
  try {
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        decimals INTEGER NOT NULL DEFAULT 18,
        initial_supply TEXT NOT NULL,
        logo_ipfs TEXT,
        description TEXT,
        twitter_url TEXT,
        discord_url TEXT,
        telegram_url TEXT,
        website_url TEXT,
        base_price REAL NOT NULL,
        slope REAL NOT NULL,
        graduation_threshold REAL NOT NULL,
        buy_fee_percent REAL NOT NULL DEFAULT 0,
        sell_fee_percent REAL NOT NULL DEFAULT 0,
        cross_chain_enabled INTEGER NOT NULL DEFAULT 0,
        creator_address TEXT,
        advanced_settings TEXT,
        archived INTEGER NOT NULL DEFAULT 0,
        pinned INTEGER NOT NULL DEFAULT 0,
        deleted INTEGER NOT NULL DEFAULT 0,
        visible_in_marketplace INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS token_deployments (
        id SERIAL PRIMARY KEY,
        token_id TEXT NOT NULL,
        chain TEXT NOT NULL,
        token_address TEXT,
        curve_address TEXT,
        pool_address TEXT,
        bridge_address TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        is_graduated BOOLEAN NOT NULL DEFAULT false,
        current_supply TEXT NOT NULL DEFAULT '0',
        reserve_balance TEXT NOT NULL DEFAULT '0',
        market_cap REAL NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
        UNIQUE(token_id, chain)
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        token_id TEXT NOT NULL,
        chain TEXT NOT NULL,
        tx_hash TEXT NOT NULL,
        type TEXT NOT NULL,
        from_address TEXT,
        to_address TEXT,
        amount TEXT,
        price REAL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS shared_liquidity_pools (
        id SERIAL PRIMARY KEY,
        token_id TEXT NOT NULL,
        chain TEXT NOT NULL,
        pool_address TEXT NOT NULL,
        balance TEXT NOT NULL DEFAULT '0',
        tvl REAL NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
        UNIQUE(token_id, chain)
      );

      CREATE TABLE IF NOT EXISTS platform_fees (
        id SERIAL PRIMARY KEY,
        token_id TEXT,
        chain TEXT NOT NULL,
        fee_type TEXT NOT NULL,
        amount TEXT NOT NULL,
        amount_usd REAL,
        native_amount TEXT,
        from_address TEXT,
        to_address TEXT,
        tx_hash TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        collected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS fee_statistics (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        total_fees_usd REAL NOT NULL DEFAULT 0,
        token_creation_fees REAL NOT NULL DEFAULT 0,
        mint_fees REAL NOT NULL DEFAULT 0,
        cross_chain_fees REAL NOT NULL DEFAULT 0,
        bridge_fees REAL NOT NULL DEFAULT 0,
        buyback_amount REAL NOT NULL DEFAULT 0,
        liquidity_amount REAL NOT NULL DEFAULT 0,
        burn_amount REAL NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_token_deployments_token_id ON token_deployments(token_id);
      CREATE INDEX IF NOT EXISTS idx_token_deployments_chain ON token_deployments(chain);
      CREATE INDEX IF NOT EXISTS idx_transactions_token_id ON transactions(token_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_chain ON transactions(chain);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_platform_fees_token_id ON platform_fees(token_id);
      CREATE INDEX IF NOT EXISTS idx_platform_fees_type ON platform_fees(fee_type);
      CREATE INDEX IF NOT EXISTS idx_platform_fees_collected_at ON platform_fees(collected_at);
      CREATE INDEX IF NOT EXISTS idx_fee_statistics_date ON fee_statistics(date);
    `);

    console.log('✅ PostgreSQL database initialized');
  } catch (error) {
    console.error('❌ Error initializing PostgreSQL database:', error);
    throw error;
  }
}
```

## Step 4: Update Database Index

Update `backend/src/db/index.ts` to use PostgreSQL when `DATABASE_URL` is set:

```typescript
// Use PostgreSQL if DATABASE_URL is set, otherwise use SQLite
const usePostgres = !!process.env.DATABASE_URL;

if (usePostgres) {
  console.log('📦 Using PostgreSQL database');
  export * from './postgres';
} else {
  console.log('📦 Using SQLite database');
  export * from './sqlite';
}
```

Create `backend/src/db/sqlite.ts` (move existing SQLite code here):

```typescript
// Move all existing SQLite code from index.ts here
// ... (existing SQLite implementation)
```

## Step 5: Update SQL Queries

Update queries that use SQLite-specific syntax:

### GROUP_CONCAT → STRING_AGG

**Before (SQLite):**
```sql
SELECT GROUP_CONCAT(td.chain) as chains
```

**After (PostgreSQL):**
```sql
SELECT STRING_AGG(td.chain::text, ',') as chains
```

### INSERT OR IGNORE → ON CONFLICT

**Before (SQLite):**
```sql
INSERT OR IGNORE INTO tokens (...) VALUES (...)
```

**After (PostgreSQL):**
```sql
INSERT INTO tokens (...) VALUES (...)
ON CONFLICT (id) DO NOTHING
```

### Update Routes

Update `backend/src/routes/tokens.ts` to use PostgreSQL-compatible SQL:

```typescript
// Replace GROUP_CONCAT with STRING_AGG
const query = `
  SELECT 
    t.id, t.name, t.symbol,
    STRING_AGG(td.chain::text, ',') as chains,
    STRING_AGG(td.token_address::text, ',') as token_addresses,
    -- etc
  FROM tokens t
  LEFT JOIN token_deployments td ON t.id = td.token_id
  WHERE ...
  GROUP BY t.id
`;
```

## Step 6: Test Locally

1. Set `DATABASE_URL` in your local `.env`:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/crossify
   ```

2. Start PostgreSQL locally (using Docker):
   ```bash
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=crossify postgres:15
   ```

3. Run your backend:
   ```bash
   npm run dev
   ```

4. Verify tables are created and queries work

## Step 7: Deploy to Railway

1. Push your changes to GitHub
2. Railway will automatically deploy
3. PostgreSQL database will be automatically created and connected
4. Verify tokens are synced from blockchain

## Step 8: Data Migration (Optional)

If you have existing SQLite data, you can migrate it:

1. Export SQLite data:
   ```bash
   sqlite3 data/crossify.db .dump > backup.sql
   ```

2. Convert SQL to PostgreSQL format (manual or use a tool)

3. Import into PostgreSQL:
   ```bash
   psql $DATABASE_URL < backup.sql
   ```

## Troubleshooting

### Connection Issues

- Verify `DATABASE_URL` is set in Railway
- Check SSL settings (Railway requires SSL in production)
- Verify database is running and accessible

### SQL Syntax Errors

- Check for SQLite-specific syntax (GROUP_CONCAT, INSERT OR IGNORE, etc.)
- Use PostgreSQL-compatible functions
- Test queries in a PostgreSQL client first

### Performance Issues

- Add indexes for frequently queried columns
- Use connection pooling (already implemented)
- Monitor query performance

## Benefits After Migration

- ✅ **Persistent storage** - Data survives deployments
- ✅ **Better performance** - Optimized for production
- ✅ **Scalability** - Can handle more concurrent users
- ✅ **Data integrity** - ACID compliance
- ✅ **User metadata preserved** - Logos, descriptions, etc.

## Next Steps

1. Complete migration
2. Test thoroughly
3. Monitor performance
4. Optimize queries as needed

---

**Status**: 📋 Guide ready - Migration can be performed when needed
**Priority**: ⚠️ Medium - Current SQLite + blockchain sync solution works for now

