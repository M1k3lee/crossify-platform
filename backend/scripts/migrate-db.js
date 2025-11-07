/**
 * Database migration script
 * Run this to add missing columns to existing database
 * Usage: node scripts/migrate-db.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/crossify.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function migrate() {
  try {
    console.log('🔄 Running database migrations...');

    // First, check if tokens table exists
    const tableCheck = await dbGet("SELECT name FROM sqlite_master WHERE type='table' AND name='tokens'");
    if (!tableCheck) {
      console.log('⚠️  Tokens table does not exist yet. Please run the backend server first to initialize tables.');
      return;
    }

    // Check if cross_chain_enabled column exists
    try {
      await dbGet('SELECT cross_chain_enabled FROM tokens LIMIT 1');
      console.log('✅ cross_chain_enabled column already exists');
    } catch (error) {
      if (error.message?.includes('no such column') || error.message?.includes('SQLITE_ERROR')) {
        console.log('➕ Adding cross_chain_enabled column...');
        await dbRun(`
          ALTER TABLE tokens 
          ADD COLUMN cross_chain_enabled INTEGER DEFAULT 0
        `);
        await dbRun(`
          UPDATE tokens 
          SET cross_chain_enabled = 0 
          WHERE cross_chain_enabled IS NULL
        `);
        console.log('✅ Added cross_chain_enabled column');
      } else {
        throw error;
      }
    }

    // Check if creator_address column exists
    try {
      await dbGet('SELECT creator_address FROM tokens LIMIT 1');
      console.log('✅ creator_address column already exists');
    } catch (error) {
      if (error.message?.includes('no such column')) {
        console.log('➕ Adding creator_address column...');
        await dbRun(`
          ALTER TABLE tokens 
          ADD COLUMN creator_address TEXT
        `);
        console.log('✅ Added creator_address column');
      } else {
        throw error;
      }
    }

    // Check if advanced_settings column exists
    try {
      await dbGet('SELECT advanced_settings FROM tokens LIMIT 1');
      console.log('✅ advanced_settings column already exists');
    } catch (error) {
      if (error.message?.includes('no such column')) {
        console.log('➕ Adding advanced_settings column...');
        await dbRun(`
          ALTER TABLE tokens 
          ADD COLUMN advanced_settings TEXT
        `);
        console.log('✅ Added advanced_settings column');
      } else {
        throw error;
      }
    }

    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Database migration error:', error);
    throw error;
  } finally {
    db.close();
  }
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});

