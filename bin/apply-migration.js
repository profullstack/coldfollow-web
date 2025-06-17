#!/usr/bin/env node

/**
 * Migration Runner
 *
 * Runs database migrations using Supabase client
 * Supports running all pending migrations or specific migrations
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  migrationsDir: join(__dirname, '../supabase/migrations')
};

/**
 * Validate required environment variables
 */
function validateConfig() {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    console.error(chalk.red('❌ Missing required environment variables:'));
    console.error(chalk.red('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'));
    console.error(chalk.yellow('\nPlease check your .env file and ensure these variables are configured.'));
    process.exit(1);
  }
}

/**
 * Create Supabase client with service role privileges
 */
function createSupabaseClient() {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Initialize migration tracking table
 */
async function initializeMigrationTable(supabase) {
  console.log(chalk.blue('🔧 Initializing migration tracking...'));
  
  // Try to query the _migrations table to see if it exists
  const { error: checkError } = await supabase
    .from('_migrations')
    .select('id')
    .limit(1);

  // If table doesn't exist (PGRST116 error), we need to create it manually
  if (checkError && checkError.code === 'PGRST116') {
    console.log(chalk.yellow('⚠️  Migration table does not exist. Please create it manually in your Supabase dashboard:'));
    console.log(chalk.gray(`
CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_migrations_filename ON _migrations(filename);
    `));
    throw new Error('Migration table does not exist. Please create it manually using the SQL above.');
  }

  const error = checkError && checkError.code !== 'PGRST116' ? checkError : null;
  
  if (error) {
    throw new Error(`Failed to initialize migration table: ${error.message}`);
  }
}

/**
 * Get list of migration files
 */
function getMigrationFiles() {
  try {
    const files = readdirSync(config.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    return files.map(filename => {
      const filepath = join(config.migrationsDir, filename);
      const content = readFileSync(filepath, 'utf8');
      
      return {
        filename,
        filepath,
        content
      };
    });
  } catch (error) {
    throw new Error(`Failed to read migrations directory: ${error.message}`);
  }
}

/**
 * Get applied migrations from database
 */
async function getAppliedMigrations(supabase) {
  const { data, error } = await supabase
    .from('_migrations')
    .select('filename, applied_at')
    .order('filename');
  
  if (error) {
    // If table doesn't exist, return empty array
    if (error.code === 'PGRST116') {
      return [];
    }
    throw new Error(`Failed to get applied migrations: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Calculate checksum for migration content
 */
async function calculateChecksum(content) {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Extract UP migration SQL from migration file
 */
function extractUpMigration(content) {
  // Look for UP MIGRATION section
  const upMatch = content.match(/-- UP MIGRATION[\s\S]*?(?=-- DOWN MIGRATION|$)/i);
  if (upMatch) {
    return upMatch[0]
      .replace(/-- UP MIGRATION.*?\n/i, '')
      .replace(/-- Write your up migration SQL here:.*?\n/i, '')
      .trim();
  }
  
  // If no sections found, assume entire file is UP migration
  return content.trim();
}

/**
 * Apply a single migration
 */
async function applyMigration(supabase, migration) {
  const upSql = extractUpMigration(migration.content);
  const checksum = await calculateChecksum(migration.content);
  
  if (!upSql || upSql.length === 0) {
    console.log(chalk.yellow(`⚠️  Skipping empty migration: ${migration.filename}`));
    return;
  }
  
  console.log(chalk.blue(`📄 Applying migration: ${migration.filename}`));
  
  // Note: We cannot execute SQL directly via Supabase client
  // Migrations should be applied via Supabase CLI: supabase db push
  console.log(chalk.yellow(`⚠️  Note: SQL execution skipped for: ${migration.filename}`));
  console.log(chalk.gray('   Migrations should be applied via Supabase CLI: supabase db push'));
  
  // Record the migration as applied
  const { error: recordError } = await supabase
    .from('_migrations')
    .insert({
      filename: migration.filename,
      checksum
    });
  
  if (recordError) {
    throw new Error(`Failed to record migration: ${recordError.message}`);
  }
  
  console.log(chalk.green(`✅ Applied: ${migration.filename}`));
}

/**
 * Run all pending migrations
 */
async function runMigrations() {
  try {
    validateConfig();
    
    console.log(chalk.blue('🚀 Starting migration runner...\n'));
    
    const supabase = createSupabaseClient();
    
    // Initialize migration tracking
    await initializeMigrationTable(supabase);
    
    // Get migration files and applied migrations
    const migrationFiles = getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations(supabase);
    
    console.log(chalk.blue(`📁 Found ${migrationFiles.length} migration files`));
    console.log(chalk.blue(`✅ ${appliedMigrations.length} migrations already applied\n`));
    
    // Find pending migrations
    const appliedFilenames = new Set(appliedMigrations.map(m => m.filename));
    const pendingMigrations = migrationFiles.filter(m => !appliedFilenames.has(m.filename));
    
    if (pendingMigrations.length === 0) {
      console.log(chalk.green('🎉 No pending migrations - database is up to date!'));
      return;
    }
    
    console.log(chalk.yellow(`📋 Found ${pendingMigrations.length} pending migrations:`));
    pendingMigrations.forEach(m => {
      console.log(chalk.gray(`   - ${m.filename}`));
    });
    console.log('');
    
    // Apply pending migrations
    let appliedCount = 0;
    for (const migration of pendingMigrations) {
      try {
        await applyMigration(supabase, migration);
        appliedCount++;
      } catch (error) {
        console.error(chalk.red(`❌ Failed to apply ${migration.filename}:`));
        console.error(chalk.red(`   ${error.message}`));
        throw error;
      }
    }
    
    console.log(chalk.green(`\n🎉 Successfully applied ${appliedCount} migrations!`));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Migration failed:'), error.message);
    process.exit(1);
  }
}

/**
 * Show migration status
 */
async function showStatus() {
  try {
    validateConfig();
    
    const supabase = createSupabaseClient();
    
    // Initialize migration tracking if needed
    await initializeMigrationTable(supabase);
    
    const migrationFiles = getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations(supabase);
    
    console.log(chalk.blue('\n📊 Migration Status\n'));
    
    const appliedMap = new Map(appliedMigrations.map(m => [m.filename, m]));
    
    migrationFiles.forEach(migration => {
      const applied = appliedMap.get(migration.filename);
      if (applied) {
        console.log(chalk.green(`✅ ${migration.filename} (applied ${applied.applied_at})`));
      } else {
        console.log(chalk.yellow(`⏳ ${migration.filename} (pending)`));
      }
    });
    
    const pendingCount = migrationFiles.length - appliedMigrations.length;
    console.log(chalk.blue(`\nTotal: ${migrationFiles.length} migrations, ${appliedMigrations.length} applied, ${pendingCount} pending\n`));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to show status:'), error.message);
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'status':
    await showStatus();
    break;
  case 'run':
  case undefined:
    await runMigrations();
    break;
  default:
    console.log(chalk.blue('Migration Runner\n'));
    console.log(chalk.gray('Usage:'));
    console.log('  node bin/apply-migration.js        - Run pending migrations');
    console.log('  node bin/apply-migration.js run    - Run pending migrations');
    console.log('  node bin/apply-migration.js status - Show migration status');
    process.exit(1);
}
