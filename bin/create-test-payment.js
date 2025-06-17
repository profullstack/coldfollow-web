#!/usr/bin/env node

/**
 * Script to create test subscriptions directly
 * 
 * Example:
 * node bin/create-test-payment.js --email user@example.com
 */

import { supabase } from '../src/utils/supabase.js';
import crypto from 'crypto';

console.log('Supabase configuration:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY exists:', !!process.env.SUPABASE_KEY);
console.log('SUPABASE_KEY from process.env:', !!process.env.SUPABASE_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY from process.env:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
if (process.env.SUPABASE_KEY) {
  console.log('SUPABASE_KEY length:', process.env.SUPABASE_KEY.length);
  console.log('Using service role key:', process.env.SUPABASE_KEY === process.env.SUPABASE_SERVICE_ROLE_KEY);
}
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All environment variables:');
Object.keys(process.env).forEach(key => {
  const value = key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD') 
    ? '[REDACTED]' 
    : process.env[key];
  console.log(`${key}: ${value}`);
});

console.log('Creating Supabase client...');
try {
  if (supabase) {
    console.log('Supabase client created successfully' + 
      (process.env.SUPABASE_KEY === process.env.SUPABASE_SERVICE_ROLE_KEY ? ' with service role key' : ''));
  }
} catch (e) {
  console.error('Error creating Supabase client:', e);
  process.exit(1);
}

// Simple argument parsing
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const options = {
    email: null,
    plan: 'monthly',
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } 
    else if (arg.startsWith('--email=')) {
      options.email = arg.split('=')[1];
    }
    else if (arg === '--email' || arg === '-e') {
      options.email = args[++i];
    }
    else if (arg.startsWith('--plan=')) {
      options.plan = arg.split('=')[1];
    }
    else if (arg === '--plan' || arg === '-p') {
      options.plan = args[++i];
    }
  }
  
  return options;
}

// Parse command line arguments
const { email, plan, help } = parseCommandLineArgs();

// Show help if requested or no email provided
if (help || !email) {
  console.log(`
  Create Test Subscription
  =======================
  This script creates an active subscription for testing purposes,
  bypassing the actual payment process.

  Usage:
    node bin/create-test-payment.js --email <email> [--plan <plan_type>]

  Options:
    --email, -e      User's email address (required)
    --plan, -p       Subscription plan: 'monthly' or 'yearly' (default: monthly)
    --help, -h       Show this help message

  Examples:
    node bin/create-test-payment.js --email user@example.com
    node bin/create-test-payment.js --email user@example.com --plan yearly
  `);
  process.exit(0);
}

// Validate inputs
if (!['monthly', 'yearly'].includes(plan)) {
  console.error(`Error: Invalid plan '${plan}'. Must be 'monthly' or 'yearly'.`);
  process.exit(1);
}

async function activateSubscription() {
  try {
    console.log(`Creating active subscription for ${email} with ${plan} plan...`);
    
    // Calculate expiration date
    const now = new Date();
    const expirationDate = new Date(now);
    if (plan === 'yearly') {
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    } else {
      expirationDate.setMonth(expirationDate.getMonth() + 1);
    }
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (userError) {
      console.error('Error checking for user:', userError.message);
      process.exit(1);
    }
    
    const userId = userData?.id;
    if (userId) {
      console.log(`Found user with ID: ${userId}`);
    } else {
      console.log('User not found in database. Will create subscription without user ID.');
    }
    
    // First inspect the subscriptions table to see what columns we can use
    console.log('Inspecting subscriptions table structure...');
    const { data: subSample, error: subSampleError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);
    
    if (subSampleError) {
      console.error('Error inspecting subscriptions table:', subSampleError.message);
      process.exit(1);
    }
    
    // Get column names from database
    const subColumns = subSample && subSample.length > 0 
      ? Object.keys(subSample[0]) 
      : ['id', 'email', 'status', 'expiration_date'];
    
    console.log('Available subscription columns:', subColumns.join(', '));
    
    // Set subscription data (only include fields that exist in the schema)
    const subscriptionData = {
      email,
      status: 'active',
    };
    
    // Add other fields only if they exist in the schema
    if (subColumns.includes('expiration_date')) {
      subscriptionData.expiration_date = expirationDate.toISOString();
    }
    
    if (subColumns.includes('start_date')) {
      subscriptionData.start_date = now.toISOString();
    }
    
    if (subColumns.includes('plan')) {
      subscriptionData.plan = plan;
    }
    
    if (subColumns.includes('interval')) {
      subscriptionData.interval = plan === 'monthly' ? 'month' : 'year';
    }
    
    if (subColumns.includes('amount')) {
      subscriptionData.amount = plan === 'monthly' ? 5.00 : 30.00;
    }
    
    if (subColumns.includes('payment_method')) {
      subscriptionData.payment_method = 'test';
    }
    
    // Add user_id if available and column exists
    if (userId && subColumns.includes('user_id')) {
      subscriptionData.user_id = userId;
    }
    
    // Check if subscription already exists - get the most recent one
    const { data: existingSubs, error: subCheckError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (subCheckError) {
      console.error('Error checking for existing subscription:', subCheckError.message);
      process.exit(1);
    }
    
    // Get the first item if it exists
    const existingSub = existingSubs && existingSubs.length > 0 ? existingSubs[0] : null;
    
    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSub.id);
      
      if (updateError) {
        console.error('Error updating subscription:', updateError.message);
        process.exit(1);
      }
      
      console.log(`✅ Updated existing subscription (ID: ${existingSub.id})`);
      console.log(`✅ Subscription is now active until: ${expirationDate.toISOString()}`);
    } else {
      // Create new subscription
      const { data: newSub, error: createSubError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();
      
      if (createSubError) {
        console.error('Error creating subscription:', createSubError.message);
        process.exit(1);
      }
      
      console.log(`✅ Created new subscription with ID: ${newSub.id}`);
      console.log(`✅ Subscription is active until: ${expirationDate.toISOString()}`);
    }
    console.log('Test subscription creation successful!');
  } catch (error) {
    console.error('Error creating test subscription:', error.message);
    process.exit(1);
  }
}

activateSubscription();
