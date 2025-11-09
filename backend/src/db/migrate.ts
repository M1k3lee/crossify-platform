import { dbRun, dbGet } from './index';

/**
 * Database migration function
 * Adds missing columns to existing databases
 */
export async function migrateDatabase(): Promise<void> {
  try {
    console.log('🔄 Running database migrations...');

    // First, check if tokens table exists
    try {
      const tableCheck = await dbGet("SELECT name FROM sqlite_master WHERE type='table' AND name='tokens'");
      if (!tableCheck) {
        console.log('ℹ️  Tokens table does not exist yet. Tables will be created with all columns.');
        return;
      }
    } catch (error: any) {
      // Table doesn't exist - this is fine, tables will be created with all columns
      console.log('ℹ️  Tokens table does not exist yet. Tables will be created with all columns.');
      return;
    }

    // Check if cross_chain_enabled column exists
    try {
      await dbGet('SELECT cross_chain_enabled FROM tokens LIMIT 1');
      console.log('✅ cross_chain_enabled column already exists');
    } catch (error: any) {
      if (error.message?.includes('no such column')) {
        console.log('➕ Adding cross_chain_enabled column...');
        // SQLite: Add as nullable first, then update existing rows
        await dbRun(`
          ALTER TABLE tokens 
          ADD COLUMN cross_chain_enabled INTEGER DEFAULT 0
        `);
        // Update existing rows to have default value
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
    } catch (error: any) {
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
    } catch (error: any) {
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

    // Check if platform_fees table exists
    try {
      await dbGet('SELECT id FROM platform_fees LIMIT 1');
      console.log('✅ platform_fees table already exists');
    } catch (error: any) {
      if (error.message?.includes('no such table')) {
        console.log('➕ Creating platform_fees table...');
        await dbRun(`
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
          )
        `);
        await dbRun('CREATE INDEX IF NOT EXISTS idx_platform_fees_token_id ON platform_fees(token_id)');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_platform_fees_type ON platform_fees(fee_type)');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_platform_fees_collected_at ON platform_fees(collected_at)');
        console.log('✅ Created platform_fees table');
      } else {
        throw error;
      }
    }

    // Check if fee_statistics table exists
    try {
      await dbGet('SELECT id FROM fee_statistics LIMIT 1');
      console.log('✅ fee_statistics table already exists');
    } catch (error: any) {
      if (error.message?.includes('no such table')) {
        console.log('➕ Creating fee_statistics table...');
        await dbRun(`
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
          )
        `);
        await dbRun('CREATE INDEX IF NOT EXISTS idx_fee_statistics_date ON fee_statistics(date)');
        console.log('✅ Created fee_statistics table');
      } else {
        throw error;
      }
    }

    // Check if archived, pinned, deleted, visible_in_marketplace columns exist
    for (const column of ['archived', 'pinned', 'deleted', 'visible_in_marketplace']) {
      try {
        await dbGet(`SELECT ${column} FROM tokens LIMIT 1`);
        console.log(`✅ ${column} column already exists`);
      } catch (error: any) {
        if (error.message?.includes('no such column')) {
          console.log(`➕ Adding ${column} column...`);
          const defaultValue = column === 'visible_in_marketplace' ? 1 : 0;
          await dbRun(`
            ALTER TABLE tokens 
            ADD COLUMN ${column} INTEGER DEFAULT ${defaultValue}
          `);
          // Update existing rows to have default value
          await dbRun(`
            UPDATE tokens 
            SET ${column} = ${defaultValue} 
            WHERE ${column} IS NULL
          `);
          console.log(`✅ Added ${column} column`);
        } else {
          throw error;
        }
      }
    }

    // Add customization fields
    const customizationColumns = [
      { name: 'banner_image_ipfs', type: 'TEXT', defaultValue: null },
      { name: 'primary_color', type: 'TEXT', defaultValue: '#3B82F6' },
      { name: 'accent_color', type: 'TEXT', defaultValue: '#8B5CF6' },
      { name: 'background_color', type: 'TEXT', defaultValue: null },
      { name: 'layout_template', type: 'TEXT', defaultValue: 'default' },
      { name: 'custom_settings', type: 'TEXT', defaultValue: null },
      { name: 'github_url', type: 'TEXT', defaultValue: null },
      { name: 'medium_url', type: 'TEXT', defaultValue: null },
      { name: 'reddit_url', type: 'TEXT', defaultValue: null },
      { name: 'youtube_url', type: 'TEXT', defaultValue: null },
      { name: 'linkedin_url', type: 'TEXT', defaultValue: null },
    ];

    for (const column of customizationColumns) {
      try {
        await dbGet(`SELECT ${column.name} FROM tokens LIMIT 1`);
        console.log(`✅ ${column.name} column already exists`);
      } catch (error: any) {
        if (error.message?.includes('no such column')) {
          console.log(`➕ Adding ${column.name} column...`);
          const defaultClause = column.defaultValue !== null 
            ? `DEFAULT '${column.defaultValue}'` 
            : '';
          await dbRun(`
            ALTER TABLE tokens 
            ADD COLUMN ${column.name} ${column.type} ${defaultClause}
          `);
          if (column.defaultValue !== null) {
            await dbRun(`
              UPDATE tokens 
              SET ${column.name} = '${column.defaultValue}' 
              WHERE ${column.name} IS NULL
            `);
          }
          console.log(`✅ Added ${column.name} column`);
        } else {
          throw error;
        }
      }
    }

    // Create token_custom_sections table if it doesn't exist
    try {
      await dbGet('SELECT id FROM token_custom_sections LIMIT 1');
      console.log('✅ token_custom_sections table already exists');
    } catch (error: any) {
      if (error.message?.includes('no such table')) {
        console.log('➕ Creating token_custom_sections table...');
        await dbRun(`
          CREATE TABLE IF NOT EXISTS token_custom_sections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token_id TEXT NOT NULL,
            section_type TEXT NOT NULL,
            title TEXT,
            content TEXT,
            section_order INTEGER NOT NULL DEFAULT 0,
            enabled BOOLEAN NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE
          )
        `);
        await dbRun('CREATE INDEX IF NOT EXISTS idx_token_custom_sections_token_id ON token_custom_sections(token_id)');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_token_custom_sections_enabled ON token_custom_sections(enabled)');
        console.log('✅ Created token_custom_sections table');
      } else {
        throw error;
      }
    }

    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Database migration error:', error);
    throw error;
  }
}

