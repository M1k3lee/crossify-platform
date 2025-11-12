import { Pool, PoolClient } from 'pg';
import { dbRun, dbGet, dbAll } from './index';

let pool: Pool | null = null;

/**
 * Initialize PostgreSQL connection pool
 */
export function initializePostgreSQL(): Pool {
  if (pool) {
    console.log('ℹ️  PostgreSQL pool already initialized, reusing existing pool');
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
  }

  console.log('🔌 Initializing PostgreSQL connection pool...');
  console.log('📋 Connection string format:', connectionString.substring(0, 20) + '...');

  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased timeout for Railway
  });

  pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle PostgreSQL client', err);
  });

  pool.on('connect', () => {
    console.log('✅ PostgreSQL client connected');
  });

  // Test connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Failed to connect to PostgreSQL:', err.message);
    } else {
      console.log('✅ PostgreSQL connection test successful');
    }
  });

  console.log('✅ PostgreSQL connection pool initialized');
  return pool;
}

/**
 * Check if PostgreSQL is configured
 */
export function isPostgreSQLConfigured(): boolean {
  return !!process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');
}

/**
 * PostgreSQL-specific database functions
 */
export async function pgRun(sql: string, params?: any[]): Promise<any> {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized');
  }

  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return {
      lastID: result.rows[0]?.id || null,
      changes: result.rowCount || 0,
    };
  } finally {
    client.release();
  }
}

export async function pgGet<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized');
  }

  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return (result.rows[0] as T) || undefined;
  } finally {
    client.release();
  }
}

export async function pgAll<T = any>(sql: string, params?: any[]): Promise<T[]> {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized');
  }

  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

/**
 * Convert SQLite SQL to PostgreSQL SQL
 */
export function convertSQLiteToPostgreSQL(sql: string): string {
  // Replace SQLite-specific syntax with PostgreSQL
  let pgSQL = sql
    // INTEGER PRIMARY KEY AUTOINCREMENT -> SERIAL PRIMARY KEY
    .replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
    // TEXT -> VARCHAR or TEXT
    .replace(/\bTEXT\b/gi, 'TEXT')
    // REAL -> DOUBLE PRECISION
    .replace(/\bREAL\b/gi, 'DOUBLE PRECISION')
    // BOOLEAN -> BOOLEAN (PostgreSQL supports this)
    .replace(/\bBOOLEAN\b/gi, 'BOOLEAN')
    // INTEGER -> INTEGER (same in PostgreSQL)
    .replace(/\bINTEGER\b/gi, 'INTEGER')
    // CURRENT_TIMESTAMP -> CURRENT_TIMESTAMP (same in PostgreSQL)
    // Remove SQLite-specific PRAGMA statements
    .replace(/PRAGMA\s+\w+\s*=\s*\w+/gi, '-- PRAGMA removed for PostgreSQL')
    // INSERT OR IGNORE -> INSERT ... ON CONFLICT DO NOTHING
    .replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO')
    // Add ON CONFLICT handling for INSERT OR IGNORE
    ;

  // Handle INSERT OR IGNORE by adding ON CONFLICT DO NOTHING
  if (sql.includes('INSERT OR IGNORE')) {
    // Extract table name and add ON CONFLICT clause
    const tableMatch = sql.match(/INSERT\s+OR\s+IGNORE\s+INTO\s+(\w+)/i);
    if (tableMatch) {
      const tableName = tableMatch[1];
      const primaryKey = getPrimaryKeyForTable(tableName);
      if (primaryKey) {
        pgSQL = pgSQL.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
        pgSQL += ` ON CONFLICT (${primaryKey}) DO NOTHING`;
      }
    }
  }

  // Replace ? placeholders with $1, $2, etc. for PostgreSQL
  let paramIndex = 1;
  pgSQL = pgSQL.replace(/\?/g, () => `$${paramIndex++}`);

  return pgSQL;
}

/**
 * Get primary key column name for a table
 */
function getPrimaryKeyForTable(tableName: string): string | null {
  const primaryKeys: Record<string, string> = {
    tokens: 'id',
    token_deployments: 'id',
    transactions: 'id',
    shared_liquidity_pools: 'id',
    platform_fees: 'id',
    fee_statistics: 'id',
  };
  return primaryKeys[tableName.toLowerCase()] || null;
}

/**
 * Initialize PostgreSQL database schema
 */
export async function initializePostgreSQLSchema(): Promise<void> {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create tables
    await client.query(`
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
        github_url TEXT,
        medium_url TEXT,
        reddit_url TEXT,
        youtube_url TEXT,
        linkedin_url TEXT,
        base_price DOUBLE PRECISION NOT NULL,
        slope DOUBLE PRECISION NOT NULL,
        graduation_threshold DOUBLE PRECISION NOT NULL,
        buy_fee_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
        sell_fee_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
        cross_chain_enabled INTEGER NOT NULL DEFAULT 0,
        creator_address TEXT,
        advanced_settings TEXT,
        banner_image_ipfs TEXT,
        primary_color TEXT DEFAULT '#3B82F6',
        accent_color TEXT DEFAULT '#8B5CF6',
        background_color TEXT,
        layout_template TEXT DEFAULT 'default',
        custom_settings TEXT,
        archived INTEGER NOT NULL DEFAULT 0,
        pinned INTEGER NOT NULL DEFAULT 0,
        deleted INTEGER NOT NULL DEFAULT 0,
        visible_in_marketplace INTEGER NOT NULL DEFAULT 1,
        verified INTEGER NOT NULL DEFAULT 0,
        verified_at TIMESTAMP,
        verified_by TEXT,
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
        dex_pool_address TEXT,
        dex_name TEXT,
        graduated_at TIMESTAMP,
        graduation_tx_hash TEXT,
        current_supply TEXT NOT NULL DEFAULT '0',
        reserve_balance TEXT NOT NULL DEFAULT '0',
        market_cap DOUBLE PRECISION NOT NULL DEFAULT 0,
        holder_count INTEGER NOT NULL DEFAULT 0,
        holder_count_updated_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
        UNIQUE(token_id, chain)
      );
      
      -- Add new columns if they don't exist (for existing databases)
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'token_deployments' AND column_name = 'dex_pool_address') THEN
          ALTER TABLE token_deployments ADD COLUMN dex_pool_address TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'token_deployments' AND column_name = 'dex_name') THEN
          ALTER TABLE token_deployments ADD COLUMN dex_name TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'token_deployments' AND column_name = 'graduated_at') THEN
          ALTER TABLE token_deployments ADD COLUMN graduated_at TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'token_deployments' AND column_name = 'graduation_tx_hash') THEN
          ALTER TABLE token_deployments ADD COLUMN graduation_tx_hash TEXT;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        token_id TEXT NOT NULL,
        chain TEXT NOT NULL,
        tx_hash TEXT NOT NULL,
        type TEXT NOT NULL,
        from_address TEXT,
        to_address TEXT,
        amount TEXT,
        price DOUBLE PRECISION,
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
        tvl DOUBLE PRECISION NOT NULL DEFAULT 0,
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
        amount_usd DOUBLE PRECISION,
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
        date TEXT NOT NULL,
        total_fees_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
        token_creation_fees DOUBLE PRECISION NOT NULL DEFAULT 0,
        mint_fees DOUBLE PRECISION NOT NULL DEFAULT 0,
        cross_chain_fees DOUBLE PRECISION NOT NULL DEFAULT 0,
        bridge_fees DOUBLE PRECISION NOT NULL DEFAULT 0,
        buyback_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        liquidity_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        burn_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date)
      );

      -- Presale system tables
      CREATE TABLE IF NOT EXISTS presale_config (
        id TEXT PRIMARY KEY,
        token_symbol TEXT NOT NULL,
        token_name TEXT NOT NULL,
        solana_address TEXT NOT NULL UNIQUE,
        presale_price DOUBLE PRECISION NOT NULL,
        total_tokens_for_presale TEXT NOT NULL,
        min_purchase_sol DOUBLE PRECISION NOT NULL DEFAULT 0.1,
        max_purchase_sol DOUBLE PRECISION,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'pending',
        liquidity_percentage DOUBLE PRECISION NOT NULL DEFAULT 60,
        dev_percentage DOUBLE PRECISION NOT NULL DEFAULT 20,
        marketing_percentage DOUBLE PRECISION NOT NULL DEFAULT 20,
        affiliate_reward_percentage DOUBLE PRECISION NOT NULL DEFAULT 5,
        total_raised_sol DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_contributors INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS presale_transactions (
        id SERIAL PRIMARY KEY,
        presale_id TEXT NOT NULL,
        solana_tx_hash TEXT NOT NULL UNIQUE,
        buyer_address TEXT NOT NULL,
        sol_amount DOUBLE PRECISION NOT NULL,
        token_amount TEXT NOT NULL,
        referral_code TEXT,
        referral_address TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        confirmed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (presale_id) REFERENCES presale_config(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS presale_allocations (
        id SERIAL PRIMARY KEY,
        presale_id TEXT NOT NULL,
        buyer_address TEXT NOT NULL,
        total_sol_contributed DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_tokens_allocated TEXT NOT NULL DEFAULT '0',
        transaction_count INTEGER NOT NULL DEFAULT 0,
        first_contribution_at TIMESTAMP,
        last_contribution_at TIMESTAMP,
        tokens_claimed BOOLEAN NOT NULL DEFAULT false,
        tokens_claimed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (presale_id) REFERENCES presale_config(id) ON DELETE CASCADE,
        UNIQUE(presale_id, buyer_address)
      );

      CREATE TABLE IF NOT EXISTS liquidity_requests (
        id SERIAL PRIMARY KEY,
        token_id TEXT NOT NULL,
        target_chain TEXT NOT NULL,
        source_chain TEXT,
        amount TEXT NOT NULL,
        request_id TEXT,
        tx_hash TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS presale_affiliates (
        id SERIAL PRIMARY KEY,
        presale_id TEXT NOT NULL,
        referral_code TEXT NOT NULL UNIQUE,
        affiliate_address TEXT NOT NULL,
        total_referrals INTEGER NOT NULL DEFAULT 0,
        total_volume_sol DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_rewards_sol DOUBLE PRECISION NOT NULL DEFAULT 0,
        rewards_claimed_sol DOUBLE PRECISION NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (presale_id) REFERENCES presale_config(id) ON DELETE CASCADE,
        UNIQUE(presale_id, referral_code)
      );

      CREATE TABLE IF NOT EXISTS presale_referrals (
        id SERIAL PRIMARY KEY,
        presale_id TEXT NOT NULL,
        affiliate_id INTEGER NOT NULL,
        referral_code TEXT NOT NULL,
        buyer_address TEXT NOT NULL,
        sol_amount DOUBLE PRECISION NOT NULL,
        reward_amount_sol DOUBLE PRECISION NOT NULL,
        transaction_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (presale_id) REFERENCES presale_config(id) ON DELETE CASCADE,
        FOREIGN KEY (affiliate_id) REFERENCES presale_affiliates(id) ON DELETE CASCADE,
        FOREIGN KEY (transaction_id) REFERENCES presale_transactions(id) ON DELETE CASCADE
      );

      -- CFY Token Vesting Tables
      CREATE TABLE IF NOT EXISTS cfy_vesting_schedules (
        id SERIAL PRIMARY KEY,
        beneficiary_address TEXT NOT NULL,
        total_amount TEXT NOT NULL,
        tge_amount TEXT NOT NULL,
        vesting_amount TEXT NOT NULL,
        tge_released BOOLEAN NOT NULL DEFAULT false,
        tge_released_at TIMESTAMP,
        vesting_start_date TIMESTAMP NOT NULL,
        vesting_duration_months INTEGER NOT NULL DEFAULT 18,
        monthly_release_amount TEXT NOT NULL,
        total_released TEXT NOT NULL DEFAULT '0',
        last_release_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(beneficiary_address)
      );

      CREATE TABLE IF NOT EXISTS cfy_vesting_releases (
        id SERIAL PRIMARY KEY,
        vesting_schedule_id INTEGER NOT NULL,
        beneficiary_address TEXT NOT NULL,
        release_amount TEXT NOT NULL,
        release_type TEXT NOT NULL, -- 'tge' or 'monthly'
        release_date TIMESTAMP NOT NULL,
        transaction_hash TEXT,
        status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vesting_schedule_id) REFERENCES cfy_vesting_schedules(id) ON DELETE CASCADE
      );

      -- CFY Staking Tables
      CREATE TABLE IF NOT EXISTS cfy_staking_pools (
        id SERIAL PRIMARY KEY,
        pool_name TEXT NOT NULL UNIQUE,
        pool_type TEXT NOT NULL, -- 'flexible', '30day', '90day', '180day'
        apy_percentage DOUBLE PRECISION NOT NULL,
        lock_period_days INTEGER, -- NULL for flexible
        min_stake_amount TEXT NOT NULL DEFAULT '0',
        max_stake_amount TEXT,
        total_staked TEXT NOT NULL DEFAULT '0',
        total_rewards_distributed TEXT NOT NULL DEFAULT '0',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cfy_staking_positions (
        id SERIAL PRIMARY KEY,
        pool_id INTEGER NOT NULL,
        staker_address TEXT NOT NULL,
        staked_amount TEXT NOT NULL,
        staked_at TIMESTAMP NOT NULL,
        lock_until TIMESTAMP, -- NULL for flexible
        total_rewards_earned TEXT NOT NULL DEFAULT '0',
        rewards_claimed TEXT NOT NULL DEFAULT '0',
        last_reward_calculation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT true,
        unstaked_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pool_id) REFERENCES cfy_staking_pools(id) ON DELETE CASCADE,
        UNIQUE(pool_id, staker_address, staked_at)
      );

      CREATE TABLE IF NOT EXISTS cfy_staking_rewards (
        id SERIAL PRIMARY KEY,
        position_id INTEGER NOT NULL,
        staker_address TEXT NOT NULL,
        reward_amount TEXT NOT NULL,
        reward_period_start TIMESTAMP NOT NULL,
        reward_period_end TIMESTAMP NOT NULL,
        calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        claimed_at TIMESTAMP,
        transaction_hash TEXT,
        FOREIGN KEY (position_id) REFERENCES cfy_staking_positions(id) ON DELETE CASCADE
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_token_deployments_token_id ON token_deployments(token_id);
      CREATE INDEX IF NOT EXISTS idx_token_deployments_chain ON token_deployments(chain);
      CREATE INDEX IF NOT EXISTS idx_transactions_token_id ON transactions(token_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_chain ON transactions(chain);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_platform_fees_token_id ON platform_fees(token_id);
      CREATE INDEX IF NOT EXISTS idx_platform_fees_type ON platform_fees(fee_type);
      CREATE INDEX IF NOT EXISTS idx_platform_fees_collected_at ON platform_fees(collected_at);
      CREATE INDEX IF NOT EXISTS idx_fee_statistics_date ON fee_statistics(date);
      CREATE INDEX IF NOT EXISTS idx_presale_transactions_presale_id ON presale_transactions(presale_id);
      CREATE INDEX IF NOT EXISTS idx_presale_transactions_buyer_address ON presale_transactions(buyer_address);
      CREATE INDEX IF NOT EXISTS idx_presale_transactions_status ON presale_transactions(status);
      CREATE INDEX IF NOT EXISTS idx_presale_allocations_presale_id ON presale_allocations(presale_id);
      CREATE INDEX IF NOT EXISTS idx_presale_allocations_buyer_address ON presale_allocations(buyer_address);
      CREATE INDEX IF NOT EXISTS idx_presale_affiliates_presale_id ON presale_affiliates(presale_id);
      CREATE INDEX IF NOT EXISTS idx_presale_affiliates_referral_code ON presale_affiliates(referral_code);
      CREATE INDEX IF NOT EXISTS idx_presale_referrals_affiliate_id ON presale_referrals(affiliate_id);
      CREATE INDEX IF NOT EXISTS idx_presale_referrals_buyer_address ON presale_referrals(buyer_address);
      CREATE INDEX IF NOT EXISTS idx_cfy_vesting_schedules_beneficiary ON cfy_vesting_schedules(beneficiary_address);
      CREATE INDEX IF NOT EXISTS idx_cfy_vesting_releases_schedule ON cfy_vesting_releases(vesting_schedule_id);
      CREATE INDEX IF NOT EXISTS idx_cfy_vesting_releases_beneficiary ON cfy_vesting_releases(beneficiary_address);
      CREATE INDEX IF NOT EXISTS idx_cfy_staking_positions_pool ON cfy_staking_positions(pool_id);
      CREATE INDEX IF NOT EXISTS idx_cfy_staking_positions_staker ON cfy_staking_positions(staker_address);
      CREATE INDEX IF NOT EXISTS idx_cfy_staking_rewards_position ON cfy_staking_rewards(position_id);
      CREATE INDEX IF NOT EXISTS idx_cfy_staking_rewards_staker ON cfy_staking_rewards(staker_address);
    `);

    await client.query('COMMIT');
    console.log('✅ PostgreSQL database schema initialized');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;

