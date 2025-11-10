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
    console.log('📋 DATABASE_URL is set:', process.env.DATABASE_URL ? 'Yes' : 'No');
    if (process.env.DATABASE_URL) {
      // Log first part of connection string (without password) for debugging
      const url = new URL(process.env.DATABASE_URL);
      console.log(`📋 Connecting to: postgresql://${url.username}@${url.hostname}:${url.port}${url.pathname}`);
    }
    try {
      initializePostgreSQL();
      await initializePostgreSQLSchema();
      console.log('✅ PostgreSQL database initialized successfully');
    } catch (error: any) {
      console.error('❌ Failed to initialize PostgreSQL:', error.message);
      throw error;
    }
  } else {
    console.log('🗄️  Using SQLite database');
    console.log('ℹ️  DATABASE_URL not set or not a PostgreSQL URL');
    console.log('ℹ️  To use PostgreSQL, set DATABASE_URL environment variable');
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
  let pgSQL = sql;
  const originalSQL = sql; // Keep original for logging
  
  // Handle GROUP_CONCAT -> STRING_AGG (PostgreSQL equivalent)
  // PostgreSQL STRING_AGG requires TEXT type, so we need to cast values
  // GROUP_CONCAT(DISTINCT column ORDER BY ...) -> STRING_AGG(DISTINCT CAST(column AS TEXT), ',' ORDER BY ...)
  // GROUP_CONCAT(column ORDER BY ...) -> STRING_AGG(CAST(column AS TEXT), ',' ORDER BY ...)
  
  // Handle GROUP_CONCAT with ORDER BY (with or without DISTINCT)
  // Pattern: GROUP_CONCAT(column ORDER BY orderColumn) or GROUP_CONCAT(DISTINCT column ORDER BY orderColumn)
  pgSQL = pgSQL.replace(/GROUP_CONCAT\s*\(\s*(DISTINCT\s+)?([^)]+?)\s+ORDER\s+BY\s+([^)]+)\s*\)/gi, (match, distinct, column, orderBy) => {
    const hasDistinct = distinct && distinct.trim().toUpperCase() === 'DISTINCT';
    const col = column.trim();
    const order = orderBy.trim();
    
    // If it's already cast or is a string literal, use as-is
    if (col.toUpperCase().includes('CAST') || col.toUpperCase().includes('AS TEXT') || col.startsWith("'")) {
      const distinctStr = hasDistinct ? 'DISTINCT ' : '';
      return `STRING_AGG(${distinctStr}${col}, ',' ORDER BY ${order})`;
    }
    // Cast to TEXT for STRING_AGG (handles boolean, integer, etc.)
    const distinctStr = hasDistinct ? 'DISTINCT ' : '';
    const converted = `STRING_AGG(${distinctStr}CAST(${col} AS TEXT), ',' ORDER BY ${order})`;
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Converted: ${match} → ${converted}`);
    }
    return converted;
  });
  
  // Handle GROUP_CONCAT(DISTINCT ...) without ORDER BY
  pgSQL = pgSQL.replace(/GROUP_CONCAT\s*\(\s*DISTINCT\s+([^)]+)\s*\)/gi, (match, column) => {
    const col = column.trim();
    // If it's already cast or is a string literal, use as-is
    if (col.toUpperCase().includes('CAST') || col.toUpperCase().includes('AS TEXT') || col.startsWith("'")) {
      return `STRING_AGG(DISTINCT ${col}, ',')`;
    }
    // Cast to TEXT for STRING_AGG
    const converted = `STRING_AGG(DISTINCT CAST(${col} AS TEXT), ',')`;
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Converted: ${match} → ${converted}`);
    }
    return converted;
  });
  
  // Handle GROUP_CONCAT without DISTINCT or ORDER BY
  pgSQL = pgSQL.replace(/GROUP_CONCAT\s*\(\s*([^)]+)\s*\)/gi, (match, column) => {
    // Check if it already has DISTINCT or ORDER BY (shouldn't happen after first replaces, but just in case)
    if (column.toUpperCase().includes('DISTINCT') || column.toUpperCase().includes('ORDER BY')) {
      return match; // Already handled
    }
    const col = column.trim();
    // If it's already cast or is a string literal, use as-is
    if (col.toUpperCase().includes('CAST') || col.toUpperCase().includes('AS TEXT') || col.startsWith("'")) {
      return `STRING_AGG(${col}, ',')`;
    }
    // Cast to TEXT for STRING_AGG (handles boolean, integer, etc.)
    const converted = `STRING_AGG(CAST(${col} AS TEXT), ',')`;
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Converted: ${match} → ${converted}`);
    }
    return converted;
  });

  // Replace ? placeholders with $1, $2, etc.
  let paramIndex = 1;
  pgSQL = pgSQL.replace(/\?/g, () => {
    const placeholder = `$${paramIndex}`;
    paramIndex++;
    return placeholder;
  });

  // Handle INSERT OR IGNORE -> INSERT ... ON CONFLICT DO NOTHING
  if (sql.toUpperCase().includes('INSERT OR IGNORE')) {
    // Extract table name from original SQL
    const tableMatch = sql.match(/INSERT\s+OR\s+IGNORE\s+INTO\s+(\w+)/i);
    if (tableMatch) {
      const tableName = tableMatch[1];
      // Remove INSERT OR IGNORE from the converted SQL (after placeholder replacement)
      pgSQL = pgSQL.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
      
      // Determine conflict column
      const conflictColumn = getConflictColumn(tableName, sql);
      
      // Add ON CONFLICT clause at the end (before semicolon if present)
      const hasSemicolon = pgSQL.trim().endsWith(';');
      const sqlWithoutSemicolon = hasSemicolon ? pgSQL.trim().slice(0, -1) : pgSQL.trim();
      pgSQL = `${sqlWithoutSemicolon} ON CONFLICT ${conflictColumn} DO NOTHING${hasSemicolon ? ';' : ''}`;
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

