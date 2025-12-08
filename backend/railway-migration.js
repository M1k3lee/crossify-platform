/**
 * Simple Node.js migration script for Railway
 * This can be deployed as a one-time Railway service
 * Version: 2.0 - Updated with comprehensive debugging
 */

const { Pool } = require('pg');
require('dotenv').config();

// Debug: Log all environment variables (for troubleshooting)
console.log('🔍 Debug: Checking environment variables...');
console.log('   All env vars starting with DATABASE:', Object.keys(process.env).filter(k => k.includes('DATABASE')).join(', '));
console.log('   DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('   DATABASE_URL value (first 50 chars):', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET');
console.log('   CLOUD_SQL_DATABASE_URL exists:', !!process.env.CLOUD_SQL_DATABASE_URL);
console.log('');

const railwayPool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

const cloudSqlUrl = process.env.CLOUD_SQL_DATABASE_URL;

const TABLES = [
  'tokens', 'token_deployments', 'transactions', 'shared_liquidity_pools',
  'platform_fees', 'fee_statistics', 'presale_config', 'presale_transactions',
  'presale_allocations', 'presale_affiliates', 'presale_referrals',
  'liquidity_requests', 'cfy_vesting_schedules', 'cfy_vesting_releases',
  'cfy_staking_pools', 'cfy_staking_positions', 'cfy_staking_rewards',
  'token_custom_sections'
];

// Function to create tables manually if schema file doesn't exist
async function createTablesManually(pool) {
  // Create tokens table first (other tables depend on it)
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
    )
  `);

  // Create other tables (simplified - just the essential ones for migration)
  await pool.query(`
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
    )
  `);

  await pool.query(`
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
    )
  `);

  await pool.query(`
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
    )
  `);

  await pool.query(`
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
    )
  `);

  await pool.query(`
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
    )
  `);

  // Create presale tables
  await pool.query(`
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
    )
  `);

  await pool.query(`
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
    )
  `);

  await pool.query(`
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
    )
  `);

  await pool.query(`
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
    )
  `);

  await pool.query(`
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
    )
  `);

  await pool.query(`
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
    )
  `);

  await pool.query(`
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
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cfy_vesting_releases (
      id SERIAL PRIMARY KEY,
      vesting_schedule_id INTEGER NOT NULL,
      beneficiary_address TEXT NOT NULL,
      release_amount TEXT NOT NULL,
      release_type TEXT NOT NULL,
      release_date TIMESTAMP NOT NULL,
      transaction_hash TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vesting_schedule_id) REFERENCES cfy_vesting_schedules(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cfy_staking_pools (
      id SERIAL PRIMARY KEY,
      pool_name TEXT NOT NULL UNIQUE,
      pool_type TEXT NOT NULL,
      apy_percentage DOUBLE PRECISION NOT NULL,
      lock_period_days INTEGER,
      min_stake_amount TEXT NOT NULL DEFAULT '0',
      max_stake_amount TEXT,
      total_staked TEXT NOT NULL DEFAULT '0',
      total_rewards_distributed TEXT NOT NULL DEFAULT '0',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cfy_staking_positions (
      id SERIAL PRIMARY KEY,
      pool_id INTEGER NOT NULL,
      staker_address TEXT NOT NULL,
      staked_amount TEXT NOT NULL,
      staked_at TIMESTAMP NOT NULL,
      lock_until TIMESTAMP,
      total_rewards_earned TEXT NOT NULL DEFAULT '0',
      rewards_claimed TEXT NOT NULL DEFAULT '0',
      last_reward_calculation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN NOT NULL DEFAULT true,
      unstaked_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES cfy_staking_pools(id) ON DELETE CASCADE,
      UNIQUE(pool_id, staker_address, staked_at)
    )
  `);

  await pool.query(`
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
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS token_custom_sections (
      id SERIAL PRIMARY KEY,
      token_id TEXT NOT NULL,
      section_type TEXT NOT NULL,
      title TEXT,
      content TEXT,
      section_order INTEGER NOT NULL DEFAULT 0,
      enabled BOOLEAN NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
      UNIQUE(token_id, section_type, section_order)
    )
  `);
}

async function migrate() {
  console.log('🚀 Starting Railway → Cloud SQL Migration\n');
  
  // Debug: Show what environment variables are available
  console.log('🔍 Environment Check:');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set (' + process.env.DATABASE_URL.substring(0, 30) + '...)' : '❌ Not set');
  console.log('   CLOUD_SQL_DATABASE_URL:', process.env.CLOUD_SQL_DATABASE_URL ? '✅ Set' : '❌ Not set');
  console.log('');

  if (!railwayPool) {
    console.error('❌ DATABASE_URL environment variable is missing!');
    console.error('   Please add DATABASE_URL to the migration-temp service variables in Railway.');
    console.error('   Get it from: Postgres service → Variables tab → DATABASE_URL');
    throw new Error('DATABASE_URL not set');
  }

  if (!cloudSqlUrl) {
    console.error('❌ CLOUD_SQL_DATABASE_URL environment variable is missing!');
    console.error('   Please add CLOUD_SQL_DATABASE_URL to the migration-temp service variables.');
    throw new Error('CLOUD_SQL_DATABASE_URL not set');
  }

  // Cloud SQL requires SSL but allows self-signed certs
  // Use sslmode=no-verify to skip certificate verification
  let cloudSqlConnectionString = cloudSqlUrl;
  if (!cloudSqlUrl.includes('sslmode=')) {
    // Add SSL mode to connection string - no-verify skips cert validation
    const separator = cloudSqlUrl.includes('?') ? '&' : '?';
    cloudSqlConnectionString = `${cloudSqlUrl}${separator}sslmode=no-verify`;
  }
  
  console.log('🔐 Using SSL connection (no-verify mode for Cloud SQL)');
  
  const cloudSqlPool = new Pool({ 
    connectionString: cloudSqlConnectionString,
    ssl: {
      rejectUnauthorized: false // Don't verify certificate (Cloud SQL uses self-signed)
    }
  });

  try {
    // Test connections
    await railwayPool.query('SELECT NOW()');
    console.log('✅ Connected to Railway database');
    
    await cloudSqlPool.query('SELECT NOW()');
    console.log('✅ Connected to Cloud SQL database\n');

    // Initialize Cloud SQL schema (create tables if they don't exist)
    console.log('📋 Initializing Cloud SQL schema...');
    const fs = require('fs');
    const path = require('path');
    
    try {
      // Read and execute schema SQL
      const schemaPath = path.join(__dirname, 'railway-migration-schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        // Split by semicolons and execute each statement
        const statements = schemaSQL.split(';').filter(s => s.trim().length > 0);
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await cloudSqlPool.query(statement.trim());
            } catch (err) {
              // Ignore "already exists" errors
              if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
                console.warn(`   ⚠️  Schema warning: ${err.message}`);
              }
            }
          }
        }
        console.log('✅ Cloud SQL schema initialized\n');
      } else {
        // Fallback: Create tables manually if SQL file doesn't exist
        console.log('   ℹ️  Schema file not found, creating tables manually...');
        await createTablesManually(cloudSqlPool);
        console.log('✅ Cloud SQL schema initialized\n');
      }
    } catch (schemaError) {
      console.warn('⚠️  Schema initialization warning:', schemaError.message);
      console.log('   ℹ️  Attempting to create tables manually...');
      try {
        await createTablesManually(cloudSqlPool);
        console.log('✅ Cloud SQL schema initialized\n');
      } catch (manualError) {
        console.error('❌ Failed to initialize schema:', manualError.message);
        throw manualError;
      }
    }

    // Migrate each table
    let totalExported = 0;
    let totalImported = 0;

    for (const table of TABLES) {
      try {
        // Export from Railway
        const result = await railwayPool.query(`SELECT * FROM ${table}`);
        const rows = result.rows;
        
        if (rows.length === 0) {
          console.log(`⏭️  ${table}: 0 rows (skipping)`);
          continue;
        }

        console.log(`📦 ${table}: ${rows.length} rows`);

        // Import to Cloud SQL
        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          const columnNames = columns.join(', ');
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

          let imported = 0;
          for (const row of rows) {
            try {
              const values = columns.map(col => {
                const value = row[col];
                if (value === null || value === undefined) return null;
                // Handle booleans
                if (['is_graduated', 'archived', 'pinned', 'deleted', 
                     'cross_chain_enabled', 'visible_in_marketplace', 'verified',
                     'tokens_claimed', 'is_active', 'tge_released'].includes(col)) {
                  return value === 1 || value === true;
                }
                return value;
              });

              await cloudSqlPool.query(
                `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                values
              );
              imported++;
            } catch (error) {
              if (error.code !== '23505') { // Skip duplicates
                console.error(`   ⚠️  Row error:`, error.message);
              }
            }
          }

          console.log(`   ✅ Imported ${imported}/${rows.length} rows`);
          totalExported += rows.length;
          totalImported += imported;
        }
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`⏭️  ${table}: table doesn't exist (skipping)`);
        } else {
          console.error(`❌ ${table}:`, error.message);
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Exported: ${totalExported} rows`);
    console.log(`   Imported: ${totalImported} rows`);
    console.log('\n✅ Migration completed!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await railwayPool.end();
    await cloudSqlPool.end();
  }
}

migrate().catch(console.error);

