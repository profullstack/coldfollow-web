#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCampaignsTable() {
  try {
    console.log('🔍 Checking if campaigns table exists...');
    
    // Try to query the campaigns table
    const { data, error } = await supabase
      .from('campaigns')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.error('❌ Campaigns table does not exist or is not accessible:');
      console.error('Error:', error.message);
      console.error('Code:', error.code);
      console.error('Details:', error.details);
      
      // Check if it's a table not found error
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('\n💡 The campaigns table has not been created yet.');
        console.log('This means the migration has not been applied successfully.');
      }
      
      return false;
    } else {
      console.log('✅ Campaigns table exists and is accessible!');
      console.log('Data:', data);
      return true;
    }
  } catch (err) {
    console.error('❌ Error checking campaigns table:', err.message);
    return false;
  }
}

async function checkMigrationHistory() {
  try {
    console.log('\n🔍 Checking migration history...');
    
    // Check the migration history table
    const { data, error } = await supabase
      .from('supabase_migrations.schema_migrations')
      .select('*')
      .order('version', { ascending: false });

    if (error) {
      console.error('❌ Could not access migration history:', error.message);
      return;
    }

    console.log('📋 Migration history:');
    if (data && data.length > 0) {
      data.forEach(migration => {
        console.log(`  - ${migration.version}: ${migration.name || 'unnamed'}`);
      });
      
      // Check if our campaigns migration is in the history
      const campaignsMigration = data.find(m => m.version === '20250617092028');
      if (campaignsMigration) {
        console.log('✅ Campaigns migration (20250617092028) is in the history');
      } else {
        console.log('❌ Campaigns migration (20250617092028) is NOT in the history');
      }
    } else {
      console.log('  No migrations found in history');
    }
  } catch (err) {
    console.error('❌ Error checking migration history:', err.message);
  }
}

async function main() {
  console.log('🚀 Checking Supabase database state...\n');
  
  const tableExists = await checkCampaignsTable();
  await checkMigrationHistory();
  
  console.log('\n📊 Summary:');
  console.log(`  Table exists: ${tableExists ? '✅ Yes' : '❌ No'}`);
  
  if (!tableExists) {
    console.log('\n🔧 Recommended actions:');
    console.log('  1. Run: ./bin/supabase-db.sh migrate');
    console.log('  2. Check Supabase dashboard for any errors');
    console.log('  3. Verify migration file format is correct');
  }
}

main().catch(console.error);