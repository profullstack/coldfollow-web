# @profullstack/api-key-manager

A simple, flexible API key management system with generation, validation, and rate limiting.

## Features

- Generate and manage API keys
- Validate API keys
- Rate limiting
- Customizable storage adapters (memory, Redis, database)
- Permission-based access control
- Key expiration
- Express/Connect/Hono middleware

## Installation

```bash
npm install @profullstack/api-key-manager
```

## Basic Usage

```javascript
import { createApiKeyManager } from '@profullstack/api-key-manager';

// Create an API key manager with default options (in-memory storage)
const apiKeyManager = createApiKeyManager();

// Create an API key
const apiKey = await apiKeyManager.createKey({
  userId: 'user123',
  name: 'Development API Key',
  permissions: {
    read: true,
    write: true
  }
});

console.log(`API Key: ${apiKey.key}`);

// Validate an API key
const keyInfo = await apiKeyManager.validateKey('api_1234567890abcdef');

if (keyInfo) {
  console.log(`Valid API key for user: ${keyInfo.userId}`);
  console.log(`Permissions: ${JSON.stringify(keyInfo.permissions)}`);
} else {
  console.log('Invalid API key');
}
```

## API Reference

### Creating an API Key Manager

```javascript
import { createApiKeyManager, MemoryAdapter } from '@profullstack/api-key-manager';

// With default options (in-memory storage)
const apiKeyManager = createApiKeyManager();

// With custom options
const customApiKeyManager = createApiKeyManager({
  adapter: new MemoryAdapter(), // Or use a custom adapter
  prefix: 'myapp_', // Custom API key prefix
  keyLength: 24, // Custom key length in bytes
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 requests per minute
  }
});
```

### Managing API Keys

#### Creating an API Key

```javascript
const apiKey = await apiKeyManager.createKey({
  userId: 'user123', // Required
  name: 'Development API Key', // Required
  permissions: { // Optional
    read: true,
    write: true,
    admin: false
  },
  expiresAt: '2025-12-31T23:59:59Z', // Optional
  metadata: { // Optional
    environment: 'development',
    createdBy: 'admin'
  }
});
```

#### Getting API Keys for a User

```javascript
const keys = await apiKeyManager.getKeys('user123');

keys.forEach(key => {
  console.log(`${key.name} (${key.id})`);
  console.log(`Active: ${key.isActive}`);
  console.log(`Created: ${key.createdAt}`);
  console.log(`Permissions: ${JSON.stringify(key.permissions)}`);
});
```

#### Getting an API Key by ID

```javascript
const key = await apiKeyManager.getKeyById('key123', 'user123');

if (key) {
  console.log(`Found key: ${key.name}`);
} else {
  console.log('Key not found or does not belong to user');
}
```

#### Updating an API Key

```javascript
const updatedKey = await apiKeyManager.updateKey('key123', 'user123', {
  name: 'Updated API Key',
  isActive: true,
  permissions: {
    read: true,
    write: false
  },
  expiresAt: new Date('2026-01-01'),
  metadata: {
    environment: 'production'
  }
});
```

#### Deleting an API Key

```javascript
const deleted = await apiKeyManager.deleteKey('key123', 'user123');

if (deleted) {
  console.log('API key deleted successfully');
} else {
  console.log('API key not found or does not belong to user');
}
```

### Validating API Keys

```javascript
const keyInfo = await apiKeyManager.validateKey('api_1234567890abcdef');

if (keyInfo) {
  // API key is valid
  console.log(`User ID: ${keyInfo.userId}`);
  console.log(`Permissions: ${JSON.stringify(keyInfo.permissions)}`);
  
  // Check specific permissions
  if (keyInfo.permissions.admin) {
    // Allow admin actions
  }
} else {
  // API key is invalid, expired, or inactive
}
```

### Rate Limiting

```javascript
// Check if a request is within rate limits
const allowed = await apiKeyManager.checkRateLimit('key123');

if (allowed) {
  // Process the request
} else {
  // Return rate limit exceeded error
}
```

### Using as Middleware

```javascript
import express from 'express';
import { createApiKeyManager } from '@profullstack/api-key-manager';

const app = express();
const apiKeyManager = createApiKeyManager();

// Add API key middleware to routes that require authentication
app.use('/api', apiKeyManager.middleware());

app.get('/api/data', (req, res) => {
  // The API key info is available in req.apiKey
  const userId = req.apiKey.userId;
  const permissions = req.apiKey.permissions;
  
  // Check permissions
  if (!permissions.read) {
    return res.status(403).json({ error: 'Permission denied' });
  }
  
  // Process the request
  res.json({ data: 'Some protected data' });
});

app.listen(3000);
```

## Storage Adapters

### Memory Adapter (Default)

Stores API keys in memory. Suitable for development or testing.

```javascript
import { createApiKeyManager, MemoryAdapter } from '@profullstack/api-key-manager';

const apiKeyManager = createApiKeyManager({
  adapter: new MemoryAdapter()
});
```

### Redis Adapter

Stores API keys in Redis. Suitable for production use.

```javascript
import { createApiKeyManager } from '@profullstack/api-key-manager';
import { RedisAdapter } from '@profullstack/api-key-manager/redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://localhost:6379'
});

await redisClient.connect();

const apiKeyManager = createApiKeyManager({
  adapter: new RedisAdapter(redisClient)
});
```

### Database Adapter

Stores API keys in a database. Suitable for production use.

```javascript
import { createApiKeyManager } from '@profullstack/api-key-manager';
import { DatabaseAdapter } from '@profullstack/api-key-manager/database';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://user:password@localhost:5432/database'
});

const apiKeyManager = createApiKeyManager({
  adapter: new DatabaseAdapter(pool)
});
```

## Creating Custom Adapters

You can create custom adapters by implementing the adapter interface:

```javascript
class CustomAdapter {
  async saveKey(apiKey) { /* ... */ }
  async getKeyById(keyId) { /* ... */ }
  async getKeyByValue(keyValue) { /* ... */ }
  async getKeysByUserId(userId) { /* ... */ }
  async updateKey(keyId, updatedKey) { /* ... */ }
  async deleteKey(keyId) { /* ... */ }
  async checkRateLimit(keyId, rateLimit) { /* ... */ }
}
```

## Examples

See the [examples](./examples) directory for complete usage examples.

## License

MIT