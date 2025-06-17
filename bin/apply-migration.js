#!/usr/bin/env node

// Apply migration to add subscription fields to users table
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Access environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('Applying migration: Adding subscription fields to users table...');
  
  try {
    // Execute raw SQL to add the new columns
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE public.users
          ADD COLUMN IF NOT EXISTS subscription_id UUID,
          ADD COLUMN IF NOT EXISTS subscription_status TEXT,
          ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
      `
    });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('Added columns: subscription_id, subscription_status, subscription_plan');
    
    // Run the link subscription script again
    console.log('\nNow run the link-subscription.js script to link the subscription to the user profile:');
    console.log('node bin/link-subscription.js --email devpreshy@gmail.com');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.log('\nAlternative approach:');
    console.log('1. Log into the Supabase dashboard');
    console.log('2. Go to the SQL Editor');
    console.log('3. Run the following SQL:');
    console.log(`
      ALTER TABLE public.users
        ADD COLUMN IF NOT EXISTS subscription_id UUID,
        ADD COLUMN IF NOT EXISTS subscription_status TEXT,
        ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
    `);
  }
}

applyMigration();
