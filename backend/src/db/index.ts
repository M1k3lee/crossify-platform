import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/crossify.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new sqlite3.Database(dbPath);

export function initializeDatabase(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON', async (err) => {
      if (err) return reject(err);
      
      // Create tables
      db.exec(`
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
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS token_deployments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_id TEXT NOT NULL,
      chain TEXT NOT NULL,
      token_address TEXT,
      curve_address TEXT,
      pool_address TEXT,
      bridge_address TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      is_graduated BOOLEAN NOT NULL DEFAULT 0,
      current_supply TEXT NOT NULL DEFAULT '0',
      reserve_balance TEXT NOT NULL DEFAULT '0',
      market_cap REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (token_id) REFERENCES tokens(id),
      UNIQUE(token_id, chain)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_id TEXT NOT NULL,
      chain TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      type TEXT NOT NULL,
      from_address TEXT,
      to_address TEXT,
      amount TEXT,
      price REAL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (token_id) REFERENCES tokens(id)
    );

    CREATE TABLE IF NOT EXISTS shared_liquidity_pools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_id TEXT NOT NULL,
      chain TEXT NOT NULL,
      pool_address TEXT NOT NULL,
      balance TEXT NOT NULL DEFAULT '0',
      tvl REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (token_id) REFERENCES tokens(id),
      UNIQUE(token_id, chain)
    );

    CREATE TABLE IF NOT EXISTS platform_fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      collected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (token_id) REFERENCES tokens(id)
    );

    CREATE TABLE IF NOT EXISTS fee_statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      total_fees_usd REAL NOT NULL DEFAULT 0,
      token_creation_fees REAL NOT NULL DEFAULT 0,
      mint_fees REAL NOT NULL DEFAULT 0,
      cross_chain_fees REAL NOT NULL DEFAULT 0,
      bridge_fees REAL NOT NULL DEFAULT 0,
      buyback_amount REAL NOT NULL DEFAULT 0,
      liquidity_amount REAL NOT NULL DEFAULT 0,
      burn_amount REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date)
    );

    CREATE INDEX IF NOT EXISTS idx_token_deployments_token_id ON token_deployments(token_id);
    CREATE INDEX IF NOT EXISTS idx_token_deployments_chain ON token_deployments(chain);
    CREATE INDEX IF NOT EXISTS idx_transactions_token_id ON transactions(token_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_chain ON transactions(chain);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_platform_fees_token_id ON platform_fees(token_id);
    CREATE INDEX IF NOT EXISTS idx_platform_fees_type ON platform_fees(fee_type);
    CREATE INDEX IF NOT EXISTS idx_platform_fees_collected_at ON platform_fees(collected_at);
    CREATE INDEX IF NOT EXISTS idx_fee_statistics_date ON fee_statistics(date);
  `, async (err) => {
        if (err) return reject(err);
        console.log('Database tables created/verified');
        
        // Run migrations to add missing columns to existing databases
        // This will only run if tables already exist (for existing databases)
        try {
          // Small delay to ensure tables are committed
          await new Promise(resolve => setTimeout(resolve, 100));
          const { migrateDatabase } = await import('./migrate');
          await migrateDatabase();
        } catch (migrationError: any) {
          // Migration errors are non-fatal - tables may be new or migration may have already run
          if (migrationError.message?.includes('no such table')) {
            console.log('ℹ️  Tables are new, migrations not needed');
          } else {
            console.warn('⚠️  Migration warning (non-fatal):', migrationError.message);
          }
        }
        
        resolve();
      });
    });
  });
}

// Helper functions for async operations
// sqlite3 methods accept (sql, params, callback), so promisified version accepts (sql, params)
export function dbRun(sql: string, params?: any[]): Promise<sqlite3.RunResult> {
  return new Promise((resolve, reject) => {
    db.run(sql, params || [], function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

export function dbGet<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params || [], (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

export function dbAll<T = any>(sql: string, params?: any[]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params || [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

export default db;

