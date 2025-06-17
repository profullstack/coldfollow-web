/**
 * Basic usage examples for @profullstack/api-key-manager
 */

import { createApiKeyManager, MemoryAdapter } from '../src/index.js';

// Create an API key manager with default options (in-memory storage)
const apiKeyManager = createApiKeyManager();

// Example user IDs
const userId1 = 'user123';
const userId2 = 'user456';

/**
 * Run the examples
 */
async function runExamples() {
  try {
    console.log('Running API key management examples...\n');
    
    // Example 1: Create API keys for users
    console.log('Example 1: Creating API keys');
    
    const key1 = await apiKeyManager.createKey({
      userId: userId1,
      name: 'Development API Key',
      permissions: {
        read: true,
        write: true
      }
    });
    
    console.log(`Created API key for User 1: ${key1.name}`);
    console.log(`Key: ${key1.key}`);
    console.log(`Permissions: ${JSON.stringify(key1.permissions)}`);
    console.log();
    
    const key2 = await apiKeyManager.createKey({
      userId: userId1,
      name: 'Read-only API Key',
      permissions: {
        read: true,
        write: false
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    
    console.log(`Created second API key for User 1: ${key2.name}`);
    console.log(`Key: ${key2.key}`);
    console.log(`Permissions: ${JSON.stringify(key2.permissions)}`);
    console.log(`Expires at: ${key2.expiresAt}`);
    console.log();
    
    const key3 = await apiKeyManager.createKey({
      userId: userId2,
      name: 'Production API Key',
      permissions: {
        read: true,
        write: true,
        admin: true
      },
      metadata: {
        environment: 'production',
        createdBy: 'admin'
      }
    });
    
    console.log(`Created API key for User 2: ${key3.name}`);
    console.log(`Key: ${key3.key}`);
    console.log(`Permissions: ${JSON.stringify(key3.permissions)}`);
    console.log(`Metadata: ${JSON.stringify(key3.metadata)}`);
    console.log();
    
    // Example 2: List API keys for a user
    console.log('Example 2: Listing API keys for User 1');
    
    const user1Keys = await apiKeyManager.getKeys(userId1);
    
    console.log(`User 1 has ${user1Keys.length} API keys:`);
    user1Keys.forEach((key, index) => {
      console.log(`${index + 1}. ${key.name} (${key.id})`);
      console.log(`   Active: ${key.isActive}`);
      console.log(`   Created: ${key.createdAt}`);
      console.log(`   Permissions: ${JSON.stringify(key.permissions)}`);
      if (key.expiresAt) {
        console.log(`   Expires: ${key.expiresAt}`);
      }
      console.log();
    });
    
    // Example 3: Validate an API key
    console.log('Example 3: Validating API keys');
    
    const validationResult1 = await apiKeyManager.validateKey(key1.key);
    console.log(`Validation of key "${key1.name}": ${validationResult1 ? 'Valid' : 'Invalid'}`);
    if (validationResult1) {
      console.log(`User ID: ${validationResult1.userId}`);
      console.log(`Permissions: ${JSON.stringify(validationResult1.permissions)}`);
      console.log(`Last used: ${validationResult1.lastUsedAt}`);
    }
    console.log();
    
    // Example 4: Update an API key
    console.log('Example 4: Updating an API key');
    
    const updatedKey = await apiKeyManager.updateKey(key1.id, userId1, {
      name: 'Updated Development API Key',
      permissions: {
        read: true,
        write: true,
        delete: true
      }
    });
    
    console.log(`Updated API key: ${updatedKey.name}`);
    console.log(`New permissions: ${JSON.stringify(updatedKey.permissions)}`);
    console.log();
    
    // Example 5: Rate limiting
    console.log('Example 5: Rate limiting');
    
    // Configure a strict rate limit for demonstration
    apiKeyManager.rateLimit = {
      windowMs: 5000, // 5 seconds
      maxRequests: 3 // 3 requests per 5 seconds
    };
    
    console.log(`Rate limit: ${apiKeyManager.rateLimit.maxRequests} requests per ${apiKeyManager.rateLimit.windowMs}ms`);
    
    // Make several requests in quick succession
    for (let i = 1; i <= 5; i++) {
      const allowed = await apiKeyManager.checkRateLimit(key1.id);
      console.log(`Request ${i}: ${allowed ? 'Allowed' : 'Rate limited'}`);
    }
    console.log();
    
    // Example 6: Deactivate an API key
    console.log('Example 6: Deactivating an API key');
    
    const deactivatedKey = await apiKeyManager.updateKey(key2.id, userId1, {
      isActive: false
    });
    
    console.log(`Deactivated API key: ${deactivatedKey.name}`);
    console.log(`Active status: ${deactivatedKey.isActive}`);
    
    // Try to validate the deactivated key
    const validationResult2 = await apiKeyManager.validateKey(key2.key);
    console.log(`Validation of deactivated key: ${validationResult2 ? 'Valid' : 'Invalid'}`);
    console.log();
    
    // Example 7: Delete an API key
    console.log('Example 7: Deleting an API key');
    
    const deleteResult = await apiKeyManager.deleteKey(key3.id, userId2);
    console.log(`Deleted API key for User 2: ${deleteResult ? 'Success' : 'Failed'}`);
    
    // Verify deletion
    const user2Keys = await apiKeyManager.getKeys(userId2);
    console.log(`User 2 now has ${user2Keys.length} API keys`);
    console.log();
    
    console.log('All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples
runExamples();