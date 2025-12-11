/**
 * Railway Migration Service
 * 
 * This script runs INSIDE Railway to export data and upload it to Cloud Storage
 * or output it for manual import.
 * 
 * Deploy this as a temporary Railway service to migrate data.
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const railwayPool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

const cloudSqlUrl = process.env.CLOUD_SQL_DATABASE_URL;

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

async function exportData() {
  if (!railwayPool) {
    throw new Error('DATABASE_URL not set');
  }

  console.log('📊 Exporting data from Railway database...\n');

  const allData: Record<string, any[]> = {};

  for (const table of TABLES_TO_MIGRATE) {
    try {
      const result = await railwayPool.query(`SELECT * FROM ${table}`);
      allData[table] = result.rows;
      console.log(`✅ Exported ${result.rows.length} rows from ${table}`);
    } catch (error: any) {
      if (error.message.includes('does not exist')) {
        console.log(`⏭️  Table ${table} does not exist, skipping`);
      } else {
        console.error(`❌ Error exporting ${table}:`, error.message);
      }
    }
  }

  return allData;
}

async function importToCloudSQL(data: Record<string, any[]>) {
  if (!cloudSqlUrl) {
    console.log('⚠️  CLOUD_SQL_DATABASE_URL not set, skipping import');
    console.log('📋 Data exported, but not imported. Use the exported data manually.');
    return;
  }

  const cloudSqlPool = new Pool({ connectionString: cloudSqlUrl });

  console.log('\n📥 Importing data to Cloud SQL...\n');

  for (const [table, rows] of Object.entries(data)) {
    if (rows.length === 0) continue;

    console.log(`📦 Importing ${rows.length} rows to ${table}...`);

    const columns = Object.keys(rows[0]);
    const columnNames = columns.join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    let imported = 0;
    for (const row of rows) {
      try {
        const values = columns.map(col => {
          const value = row[col];
          if (value === null || value === undefined) return null;
          // Handle boolean conversions
          if (['is_graduated', 'archived', 'pinned', 'deleted', 'cross_chain_enabled', 
               'visible_in_marketplace', 'verified', 'tokens_claimed', 'is_active', 
               'tge_released'].includes(col)) {
            return value === 1 || value === true;
          }
          return value;
        });

        await cloudSqlPool.query(
          `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        );
        imported++;
      } catch (error: any) {
        if (error.code !== '23505') { // Skip duplicate key errors
          console.error(`   ⚠️  Error importing row:`, error.message);
        }
      }
    }

    console.log(`   ✅ Imported ${imported}/${rows.length} rows`);
  }

  await cloudSqlPool.end();
}

async function main() {
  console.log('🚀 Railway Migration Service\n');

  try {
    // Export from Railway
    const data = await exportData();

    // Print summary
    console.log('\n📊 Export Summary:');
    let totalRows = 0;
    for (const [table, rows] of Object.entries(data)) {
      if (rows.length > 0) {
        console.log(`   ${table}: ${rows.length} rows`);
        totalRows += rows.length;
      }
    }
    console.log(`\n   Total: ${totalRows} rows exported\n`);

    // Import to Cloud SQL if URL provided
    if (cloudSqlUrl) {
      await importToCloudSQL(data);
      console.log('\n✅ Migration completed!');
    } else {
      console.log('\n⚠️  CLOUD_SQL_DATABASE_URL not set.');
      console.log('📋 Data has been exported. Set CLOUD_SQL_DATABASE_URL to import.');
      console.log('\n💾 Exported data structure:');
      console.log(JSON.stringify(Object.keys(data).reduce((acc, key) => {
        acc[key] = data[key].length;
        return acc;
      }, {} as Record<string, number>), null, 2));
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (railwayPool) await railwayPool.end();
  }
}

main().catch(console.error);





