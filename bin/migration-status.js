#!/usr/bin/env node

/**
 * Migration Status Tracker
 *
 * Simple migration status tracker that works with existing Supabase setup
 * Shows which migration files exist and provides guidance
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  migrationsDir: join(__dirname, '../supabase/migrations')
};

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
        content,
        hasUpSection: content.includes('-- UP MIGRATION'),
        hasDownSection: content.includes('-- DOWN MIGRATION')
      };
    });
  } catch (error) {
    throw new Error(`Failed to read migrations directory: ${error.message}`);
  }
}

/**
 * Show migration status
 */
function showStatus() {
  try {
    console.log(chalk.blue('\n📊 Migration Status\n'));
    
    const migrationFiles = getMigrationFiles();
    
    if (migrationFiles.length === 0) {
      console.log(chalk.yellow('No migration files found.'));
      console.log(chalk.gray('Create a new migration with: pnpm migrate:create <name>'));
      return;
    }
    
    console.log(chalk.blue(`Found ${migrationFiles.length} migration files:\n`));
    
    migrationFiles.forEach((migration, index) => {
      const number = (index + 1).toString().padStart(2, '0');
      const upIcon = migration.hasUpSection ? '✅' : '❌';
      const downIcon = migration.hasDownSection ? '✅' : '❌';
      
      console.log(chalk.gray(`${number}. ${migration.filename}`));
      console.log(chalk.gray(`    UP: ${upIcon}  DOWN: ${downIcon}`));
      
      if (!migration.hasUpSection && !migration.hasDownSection) {
        console.log(chalk.yellow('    ⚠️  No UP/DOWN sections found - raw SQL file'));
      }
    });
    
    console.log(chalk.blue('\n📋 Next Steps:'));
    console.log(chalk.gray('1. Apply migrations via Supabase CLI: supabase db push'));
    console.log(chalk.gray('2. Or apply manually in Supabase dashboard'));
    console.log(chalk.gray('3. Create new migrations with: pnpm migrate:create <name>'));
    console.log('');
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to show status:'), error.message);
    process.exit(1);
  }
}

// Run status check
showStatus();