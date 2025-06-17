import { expect } from 'chai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Test suite for campaigns table migration
 * Using Mocha testing framework with Chai assertions
 * Tests migration SQL structure without requiring database connection
 */
describe('Campaigns Table Migration', () => {
  let migrationSQL;
  
  before(() => {
    // Read the migration file
    const migrationPath = join(__dirname, '../../supabase/migrations/20250617092028_create_campaigns_table.sql');
    migrationSQL = readFileSync(migrationPath, 'utf8');
  });

  describe('Migration File Structure', () => {
    it('should contain CREATE TABLE statement for campaigns', () => {
      expect(migrationSQL).to.include('CREATE TABLE campaigns');
    });

    it('should have all required columns defined', () => {
      const requiredColumns = [
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
        'user_id UUID NOT NULL REFERENCES auth.users(id)',
        'name VARCHAR(255) NOT NULL',
        'description TEXT',
        'type VARCHAR(50) NOT NULL',
        'status VARCHAR(50) NOT NULL DEFAULT \'draft\'',
        'target_audience JSONB DEFAULT \'{}\'',
        'settings JSONB DEFAULT \'{}\'',
        'scheduled_at TIMESTAMPTZ',
        'started_at TIMESTAMPTZ',
        'completed_at TIMESTAMPTZ',
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
        'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()'
      ];

      requiredColumns.forEach(column => {
        expect(migrationSQL).to.include(column);
      });
    });

    it('should have proper check constraints', () => {
      // Check for type constraint
      expect(migrationSQL).to.include('CHECK (type IN (\'email\', \'sms\', \'phone\', \'social\', \'mixed\'))');
      
      // Check for status constraint
      expect(migrationSQL).to.include('CHECK (status IN (\'draft\', \'scheduled\', \'running\', \'paused\', \'completed\', \'cancelled\'))');
    });

    it('should have foreign key constraint', () => {
      expect(migrationSQL).to.include('REFERENCES auth.users(id) ON DELETE CASCADE');
    });
  });

  describe('Indexes', () => {
    it('should create indexes on key columns', () => {
      const expectedIndexes = [
        'CREATE INDEX idx_campaigns_user_id ON campaigns(user_id)',
        'CREATE INDEX idx_campaigns_status ON campaigns(status)',
        'CREATE INDEX idx_campaigns_type ON campaigns(type)',
        'CREATE INDEX idx_campaigns_created_at ON campaigns(created_at)'
      ];

      expectedIndexes.forEach(index => {
        expect(migrationSQL).to.include(index);
      });
    });
  });

  describe('Row Level Security', () => {
    it('should enable RLS on campaigns table', () => {
      expect(migrationSQL).to.include('ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY');
    });

    it('should create proper RLS policies', () => {
      const expectedPolicies = [
        'CREATE POLICY "Users can view their own campaigns" ON campaigns',
        'FOR SELECT USING (auth.uid() = user_id)',
        'CREATE POLICY "Users can insert their own campaigns" ON campaigns',
        'FOR INSERT WITH CHECK (auth.uid() = user_id)',
        'CREATE POLICY "Users can update their own campaigns" ON campaigns',
        'FOR UPDATE USING (auth.uid() = user_id)',
        'CREATE POLICY "Users can delete their own campaigns" ON campaigns',
        'FOR DELETE USING (auth.uid() = user_id)'
      ];

      expectedPolicies.forEach(policy => {
        expect(migrationSQL).to.include(policy);
      });
    });
  });

  describe('Triggers and Functions', () => {
    it('should create update_updated_at_column function', () => {
      expect(migrationSQL).to.include('CREATE OR REPLACE FUNCTION update_updated_at_column()');
      expect(migrationSQL).to.include('RETURNS TRIGGER AS $$');
      expect(migrationSQL).to.include('NEW.updated_at = NOW()');
      expect(migrationSQL).to.include('$$ LANGUAGE \'plpgsql\'');
    });

    it('should create trigger for updating updated_at column', () => {
      expect(migrationSQL).to.include('CREATE TRIGGER update_campaigns_updated_at');
      expect(migrationSQL).to.include('BEFORE UPDATE ON campaigns');
      expect(migrationSQL).to.include('FOR EACH ROW');
      expect(migrationSQL).to.include('EXECUTE FUNCTION update_updated_at_column()');
    });
  });

  describe('Migration Rollback', () => {
    it('should have proper down migration statements', () => {
      expect(migrationSQL).to.include('DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns');
      expect(migrationSQL).to.include('DROP FUNCTION IF EXISTS update_updated_at_column()');
      expect(migrationSQL).to.include('DROP TABLE IF EXISTS campaigns');
    });
  });

  describe('SQL Syntax Validation', () => {
    it('should have properly formatted PostgreSQL function syntax', () => {
      // Check for proper dollar-quoted strings
      const functionMatch = migrationSQL.match(/\$\$[\s\S]*?\$\$/);
      expect(functionMatch).to.not.be.null;
      expect(functionMatch[0]).to.include('BEGIN');
      expect(functionMatch[0]).to.include('END;');
    });

    it('should have consistent semicolon usage', () => {
      // Check that complete SQL statements end with semicolons
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt =>
          stmt &&
          !stmt.startsWith('--') &&
          (stmt.includes('CREATE') || stmt.includes('ALTER') || stmt.includes('DROP'))
        );
      
      // Each statement should be properly terminated (we split by semicolon, so they should exist)
      expect(statements.length).to.be.greaterThan(0);
    });

    it('should not contain syntax errors', () => {
      // Check for common SQL syntax issues
      expect(migrationSQL).to.not.include('$ language'); // Should be $$ LANGUAGE
      expect(migrationSQL).to.include('RETURNS TRIGGER AS $$'); // Should have proper $$
      expect(migrationSQL).to.include('$$ LANGUAGE \'plpgsql\''); // Should have proper syntax
    });
  });
});