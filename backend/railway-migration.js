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

  const cloudSqlPool = new Pool({ connectionString: cloudSqlUrl });

  try {
    // Test connections
    await railwayPool.query('SELECT NOW()');
    console.log('✅ Connected to Railway database');
    
    await cloudSqlPool.query('SELECT NOW()');
    console.log('✅ Connected to Cloud SQL database\n');

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

