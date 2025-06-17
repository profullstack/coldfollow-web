#!/usr/bin/env node

/**
 * Script to link a subscription to a user profile
 * 
 * Example:
 * node bin/link-subscription.js --email user@example.com
 */

import { supabase } from '../src/utils/supabase.js';

console.log('Supabase configuration:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY exists:', !!process.env.SUPABASE_KEY);
console.log('SUPABASE_KEY from process.env:', !!process.env.SUPABASE_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY from process.env:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
if (process.env.SUPABASE_KEY) {
  console.log('SUPABASE_KEY length:', process.env.SUPABASE_KEY.length);
  console.log('Using service role key:', process.env.SUPABASE_KEY === process.env.SUPABASE_SERVICE_ROLE_KEY);
}

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
  }
  
  return options;
}

// Parse command line arguments
const { email, help } = parseCommandLineArgs();

// Show help if requested or no email provided
if (help || !email) {
  console.log(`
  Link Subscription to User Profile
  ===============================
  This script links an existing subscription to a user profile in the database.

  Usage:
    node bin/link-subscription.js --email <email>

  Options:
    --email, -e      User's email address (required)
    --help, -h       Show this help message

  Examples:
    node bin/link-subscription.js --email user@example.com
  `);
  process.exit(0);
}

async function linkSubscription() {
  try {
    console.log(`Linking subscription for ${email}...`);
    
    // 1. Get the user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    if (userError) {
      console.error('Error finding user:', userError.message);
      process.exit(1);
    }
    
    if (!user) {
      console.log(`User with email ${email} not found. Creating a new user record...`);
      
      // Create a new user record
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: email
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating user:', createError.message);
        process.exit(1);
      }
      
      console.log(`Created new user with ID: ${newUser.id}`);
      user = newUser;
    } else {
      console.log(`Found user with ID: ${user.id}`);
    }
    
    // 2. Get the most recent active subscription for this email
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('id, status, expiration_date')
      .eq('email', email)
      .eq('status', 'active')
      .gte('expiration_date', new Date().toISOString())
      .order('expiration_date', { ascending: false })
      .limit(1);
    
    if (subError) {
      console.error('Error finding subscription:', subError.message);
      process.exit(1);
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.error(`No active subscription found for ${email}`);
      process.exit(1);
    }
    
    const subscription = subscriptions[0];
    console.log(`Found active subscription with ID: ${subscription.id}`);
    console.log(`Subscription expires: ${subscription.expiration_date}`);
    
    // First check what fields are available in the users table
    const { data: userSchema, error: schemaError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('Error getting user schema:', schemaError.message);
      process.exit(1);
    }
    
    // Get available columns
    const availableColumns = userSchema && userSchema.length > 0 ? Object.keys(userSchema[0]) : [];
    console.log('Available columns in users table:', availableColumns.join(', '));
    
    // Prepare update object with only valid fields
    const updateData = {};
    
    // Always include subscription_id as it's the main field we need
    updateData.subscription_id = subscription.id;
    
    // Add other fields only if they exist in the schema
    if (availableColumns.includes('subscription_status')) {
      updateData.subscription_status = subscription.status;
    }
    
    if (availableColumns.includes('subscription_plan')) {
      updateData.subscription_plan = 'monthly'; // or get this from subscription record
    }
    
    if (availableColumns.includes('updated_at')) {
      updateData.updated_at = new Date().toISOString();
    }
    
    console.log('Updating user with data:', updateData);
    
    // 3. Update the user profile with the subscription ID
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Error updating user profile:', updateError.message);
      process.exit(1);
    }
    
    console.log(`✅ Successfully linked subscription ${subscription.id} to user ${user.id}`);
    console.log(`✅ User profile updated with subscription details`);
    
  } catch (error) {
    console.error('Error linking subscription:', error.message);
    process.exit(1);
  }
}

linkSubscription();
