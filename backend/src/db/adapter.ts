/**
 * Database adapter that supports both SQLite and PostgreSQL
 * Automatically detects which database to use based on environment variables
 */

import { isPostgreSQLConfigured, initializePostgreSQL, initializePostgreSQLSchema, pgRun, pgGet, pgAll } from './postgres';
import { dbRun as sqliteRun, dbGet as sqliteGet, dbAll as sqliteAll, initializeDatabase as initializeSQLite } from './index';

let usePostgreSQL = false;

/**
 * Initialize database (SQLite or PostgreSQL)
 */
export async function initializeDatabase(): Promise<void> {
  usePostgreSQL = isPostgreSQLConfigured();
  
  if (usePostgreSQL) {
    console.log('🗄️  Using PostgreSQL database');
    initializePostgreSQL();
    await initializePostgreSQLSchema();
  } else {
    console.log('🗄️  Using SQLite database');
    await initializeSQLite();
  }
}

/**
 * Run a database query (INSERT, UPDATE, DELETE)
 */
export async function dbRun(sql: string, params?: any[]): Promise<any> {
  if (usePostgreSQL) {
    // Convert SQLite syntax to PostgreSQL if needed
    const pgSQL = convertToPostgreSQL(sql);
    return pgRun(pgSQL, params);
  } else {
    return sqliteRun(sql, params);
  }
}

/**
 * Get a single row from database
 */
export async function dbGet<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
  if (usePostgreSQL) {
    const pgSQL = convertToPostgreSQL(sql);
    return pgGet<T>(pgSQL, params);
  } else {
    return sqliteGet<T>(sql, params);
  }
}

/**
 * Get all rows from database
 */
export async function dbAll<T = any>(sql: string, params?: any[]): Promise<T[]> {
  if (usePostgreSQL) {
    const pgSQL = convertToPostgreSQL(sql);
    return pgAll<T>(pgSQL, params);
  } else {
    return sqliteAll<T>(sql, params);
  }
}

/**
 * Convert SQLite SQL to PostgreSQL SQL
 */
function convertToPostgreSQL(sql: string): string {
  // Replace ? placeholders with $1, $2, etc.
  let paramIndex = 1;
  let pgSQL = sql.replace(/\?/g, () => {
    const placeholder = `$${paramIndex}`;
    paramIndex++;
    return placeholder;
  });

  // Handle INSERT OR IGNORE -> INSERT ... ON CONFLICT DO NOTHING
  if (sql.includes('INSERT OR IGNORE')) {
    // Extract table name
    const tableMatch = sql.match(/INSERT\s+OR\s+IGNORE\s+INTO\s+(\w+)/i);
    if (tableMatch) {
      const tableName = tableMatch[1];
      pgSQL = pgSQL.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
      
      // Determine primary key or unique constraint
      const conflictColumn = getConflictColumn(tableName, sql);
      if (conflictColumn) {
        pgSQL += ` ON CONFLICT (${conflictColumn}) DO NOTHING`;
      } else {
        // Fallback: use table's primary key
        pgSQL += ` ON CONFLICT DO NOTHING`;
      }
    }
  }

  return pgSQL;
}

/**
 * Get the conflict column for ON CONFLICT clause
 */
function getConflictColumn(tableName: string, sql: string): string {
  // For tokens table, conflict on id
  if (tableName.toLowerCase() === 'tokens') {
    return '(id)';
  }
  
  // For token_deployments, conflict on (token_id, chain)
  if (tableName.toLowerCase() === 'token_deployments') {
    return '(token_id, chain)';
  }
  
  // For fee_statistics, conflict on date
  if (tableName.toLowerCase() === 'fee_statistics') {
    return '(date)';
  }
  
  // For shared_liquidity_pools, conflict on (token_id, chain)
  if (tableName.toLowerCase() === 'shared_liquidity_pools') {
    return '(token_id, chain)';
  }
  
  // Default: use id
  return '(id)';
}

/**
 * Check if using PostgreSQL
 */
export function isUsingPostgreSQL(): boolean {
  return usePostgreSQL;
}

