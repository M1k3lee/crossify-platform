/**
 * Data Migration Script: Railway PostgreSQL → Google Cloud SQL
 * 
 * This script exports all data from Railway database and imports it into Cloud SQL.
 * Run this BEFORE Railway trial expires to preserve all tokens and data.
 * 
 * Usage:
 *   1. Set RAILWAY_DATABASE_URL (from Railway dashboard)
 *   2. Set CLOUD_SQL_DATABASE_URL (from Cloud SQL)
 *   3. Run: npx ts-node scripts/migrate-railway-to-cloudsql.ts
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Database connections
const railwayPool = process.env.RAILWAY_DATABASE_URL
  ? new Pool({ connectionString: process.env.RAILWAY_DATABASE_URL })
  : null;

const cloudSqlPool = process.env.CLOUD_SQL_DATABASE_URL
  ? new Pool({ connectionString: process.env.CLOUD_SQL_DATABASE_URL })
  : null;

// Tables to migrate (in order due to foreign key constraints)
const TABLES_TO_MIGRATE = [
  'tokens',
  'token_deployments',
  'transactions',
  'shared_liquidity_pools',
  'platform_fees',
  'fee_statistics',
  'presale_config',
  'presale_transactions',
  'presale_allocations',
  'presale_affiliates',
  'presale_referrals',
  'liquidity_requests',
  'cfy_vesting_schedules',
  'cfy_vesting_releases',
  'cfy_staking_pools',
  'cfy_staking_positions',
  'cfy_staking_rewards',
  'token_custom_sections',
];

interface MigrationStats {
  table: string;
  rowsExported: number;
  rowsImported: number;
  errors: string[];
}

async function checkConnections(): Promise<void> {
  console.log('🔍 Checking database connections...\n');

  if (!railwayPool) {
    throw new Error('❌ RAILWAY_DATABASE_URL not set! Get it from Railway dashboard.');
  }

  if (!cloudSqlPool) {
    throw new Error('❌ CLOUD_SQL_DATABASE_URL not set! Use Cloud SQL connection string.');
  }

  // Test Railway connection
  try {
    const result = await railwayPool.query('SELECT NOW()');
    console.log('✅ Railway database: Connected');
  } catch (error) {
    throw new Error(`❌ Railway database connection failed: ${error}`);
  }

  // Test Cloud SQL connection
  try {
    const result = await cloudSqlPool.query('SELECT NOW()');
    console.log('✅ Cloud SQL database: Connected\n');
  } catch (error) {
    throw new Error(`❌ Cloud SQL database connection failed: ${error}`);
  }
}

async function getTableRowCount(pool: Pool, tableName: string): Promise<number> {
  const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
  return parseInt(result.rows[0].count, 10);
}

async function migrateTable(tableName: string): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: tableName,
    rowsExported: 0,
    rowsImported: 0,
    errors: [],
  };

  console.log(`\n📦 Migrating table: ${tableName}`);

  try {
    // Get row count from Railway
    stats.rowsExported = await getTableRowCount(railwayPool!, tableName);
    console.log(`   📊 Found ${stats.rowsExported} rows in Railway`);

    if (stats.rowsExported === 0) {
      console.log(`   ⏭️  Skipping (empty table)`);
      return stats;
    }

    // Export all data from Railway
    const exportResult = await railwayPool!.query(`SELECT * FROM ${tableName}`);
    const rows = exportResult.rows;

    if (rows.length === 0) {
      return stats;
    }

    // Get column names
    const columns = Object.keys(rows[0]);
    const columnNames = columns.join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    // Clear existing data in Cloud SQL (optional - comment out if you want to merge)
    // await cloudSqlPool!.query(`DELETE FROM ${tableName}`);

    // Import into Cloud SQL
    // Use ON CONFLICT to handle duplicates gracefully
    const insertQuery = `
      INSERT INTO ${tableName} (${columnNames})
      VALUES (${placeholders})
      ON CONFLICT DO NOTHING
    `;

    let imported = 0;
    for (const row of rows) {
      try {
        const values = columns.map(col => {
          const value = row[col];
          // Handle null values and special types
          if (value === null || value === undefined) {
            return null;
          }
          // Handle boolean conversion (PostgreSQL uses true/false, not 0/1)
          if (typeof value === 'boolean') {
            return value;
          }
          // Handle integer booleans (0/1) - convert to proper boolean
          if (columns.includes('is_graduated') && col === 'is_graduated') {
            return value === 1 || value === true;
          }
          if (columns.includes('archived') && col === 'archived') {
            return value === 1 || value === true;
          }
          if (columns.includes('pinned') && col === 'pinned') {
            return value === 1 || value === true;
          }
          if (columns.includes('deleted') && col === 'deleted') {
            return value === 1 || value === true;
          }
          if (columns.includes('cross_chain_enabled') && col === 'cross_chain_enabled') {
            return value === 1 || value === true;
          }
          if (columns.includes('visible_in_marketplace') && col === 'visible_in_marketplace') {
            return value === 1 || value === true;
          }
          if (columns.includes('verified') && col === 'verified') {
            return value === 1 || value === true;
          }
          if (columns.includes('tokens_claimed') && col === 'tokens_claimed') {
            return value === 1 || value === true;
          }
          if (columns.includes('is_active') && col === 'is_active') {
            return value === 1 || value === true;
          }
          if (columns.includes('tge_released') && col === 'tge_released') {
            return value === 1 || value === true;
          }
          return value;
        });

        await cloudSqlPool!.query(insertQuery, values);
        imported++;
      } catch (error: any) {
        // Check if it's a duplicate key error (which is OK)
        if (error.code === '23505') {
          // Unique constraint violation - row already exists, skip
          continue;
        }
        stats.errors.push(`Row error: ${error.message}`);
        console.error(`   ⚠️  Error importing row:`, error.message);
      }
    }

    stats.rowsImported = imported;
    console.log(`   ✅ Imported ${imported}/${stats.rowsExported} rows to Cloud SQL`);

    // Verify import
    const cloudSqlCount = await getTableRowCount(cloudSqlPool!, tableName);
    console.log(`   ✅ Cloud SQL now has ${cloudSqlCount} rows in ${tableName}`);

  } catch (error: any) {
    stats.errors.push(error.message);
    console.error(`   ❌ Error migrating ${tableName}:`, error.message);
  }

  return stats;
}

async function main() {
  console.log('🚀 Starting Railway → Cloud SQL Migration\n');
  console.log('⚠️  This will copy all data from Railway to Cloud SQL\n');

  try {
    // Check connections
    await checkConnections();

    // Get counts from Railway
    console.log('📊 Current Railway Database Stats:');
    for (const table of TABLES_TO_MIGRATE) {
      try {
        const count = await getTableRowCount(railwayPool!, table);
        if (count > 0) {
          console.log(`   ${table}: ${count} rows`);
        }
      } catch (error) {
        // Table might not exist, skip
      }
    }

    // Confirm before proceeding
    console.log('\n⚠️  Ready to migrate. This will:');
    console.log('   1. Export all data from Railway');
    console.log('   2. Import into Cloud SQL');
    console.log('   3. Skip duplicates (ON CONFLICT DO NOTHING)');
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Migrate each table
    const allStats: MigrationStats[] = [];
    for (const table of TABLES_TO_MIGRATE) {
      const stats = await migrateTable(table);
      allStats.push(stats);
    }

    // Summary
    console.log('\n\n📊 Migration Summary:');
    console.log('='.repeat(60));
    let totalExported = 0;
    let totalImported = 0;
    let totalErrors = 0;

    for (const stats of allStats) {
      if (stats.rowsExported > 0) {
        console.log(`${stats.table}:`);
        console.log(`  Exported: ${stats.rowsExported}`);
        console.log(`  Imported: ${stats.rowsImported}`);
        if (stats.errors.length > 0) {
          console.log(`  Errors: ${stats.errors.length}`);
          totalErrors += stats.errors.length;
        }
        totalExported += stats.rowsExported;
        totalImported += stats.rowsImported;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Total Exported: ${totalExported} rows`);
    console.log(`Total Imported: ${totalImported} rows`);
    if (totalErrors > 0) {
      console.log(`Total Errors: ${totalErrors}`);
    }
    console.log('='.repeat(60));

    if (totalImported === totalExported) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log(`\n⚠️  Migration completed with ${totalExported - totalImported} rows not imported (likely duplicates)`);
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Close connections
    if (railwayPool) await railwayPool.end();
    if (cloudSqlPool) await cloudSqlPool.end();
  }
}

// Run migration
if (require.main === module) {
  main().catch(console.error);
}

export { main as migrateRailwayToCloudSQL };



