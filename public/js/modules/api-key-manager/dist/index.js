/**
 * @profullstack/api-key-manager
 * 
 * A simple, flexible API key management system with generation, validation, and rate limiting
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { MemoryAdapter } from './adapters/memory.js';

/**
 * API Key Manager
 */
class ApiKeyManager {
  /**
   * Create a new API Key Manager
   * @param {Object} options - Configuration options
   * @param {Object} options.adapter - Storage adapter (defaults to in-memory)
   * @param {string} options.prefix - API key prefix (defaults to 'api_')
   * @param {number} options.keyLength - API key length in bytes (defaults to 32)
   * @param {Object} options.rateLimit - Rate limiting options
   * @param {number} options.rateLimit.windowMs - Rate limit window in milliseconds
   * @param {number} options.rateLimit.maxRequests - Maximum requests per window
   */
  constructor(options = {}) {
    this.adapter = options.adapter || new MemoryAdapter();
    this.prefix = options.prefix || 'api_';
    this.keyLength = options.keyLength || 32;
    this.rateLimit = options.rateLimit || {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60 // 60 requests per minute
    };
  }

  /**
   * Generate a new API key
   * @private
   * @returns {string} - Generated API key
   */
  _generateKey() {
    return `${this.prefix}${crypto.randomBytes(this.keyLength).toString('hex')}`;
  }

  /**
   * Create a new API key
   * @param {Object} options - API key options
   * @param {string} options.userId - User ID
   * @param {string} options.name - API key name
   * @param {Object} options.permissions - API key permissions
   * @param {Date|string} options.expiresAt - Expiration date (optional)
   * @param {Object} options.metadata - Additional metadata (optional)
   * @returns {Promise<Object>} - Created API key
   */
  async createKey(options) {
    const { userId, name, permissions = {}, expiresAt = null, metadata = {} } = options;

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!name) {
      throw new Error('API key name is required');
    }

    const key = this._generateKey();
    const id = uuidv4();
    const now = new Date();

    const apiKey = {
      id,
      key,
      userId,
      name,
      permissions,
      isActive: true,
      createdAt: now.toISOString(),
      lastUsedAt: null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      metadata
    };

    await this.adapter.saveKey(apiKey);

    return apiKey;
  }

  /**
   * Get API keys for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of API keys
   */
  async getKeys(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const keys = await this.adapter.getKeysByUserId(userId);
    
    // Return sanitized keys (without the actual key value)
    return keys.map(key => {
      const { key: _, ...sanitizedKey } = key;
      return sanitizedKey;
    });
  }

  /**
   * Get API key by ID
   * @param {string} keyId - API key ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} - API key or null if not found
   */
  async getKeyById(keyId, userId) {
    if (!keyId) {
      throw new Error('API key ID is required');
    }

    const key = await this.adapter.getKeyById(keyId);

    if (!key) {
      return null;
    }

    // Check if the key belongs to the user
    if (userId && key.userId !== userId) {
      return null;
    }

    // Return sanitized key (without the actual key value)
    const { key: _, ...sanitizedKey } = key;
    return sanitizedKey;
  }

  /**
   * Update an API key
   * @param {string} keyId - API key ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} updates - Updates to apply
   * @param {string} updates.name - New name
   * @param {boolean} updates.isActive - Active status
   * @param {Object} updates.permissions - New permissions
   * @param {Date|string} updates.expiresAt - New expiration date
   * @param {Object} updates.metadata - New metadata
   * @returns {Promise<Object|null>} - Updated API key or null if not found
   */
  async updateKey(keyId, userId, updates) {
    if (!keyId) {
      throw new Error('API key ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get the existing key
    const existingKey = await this.adapter.getKeyById(keyId);

    if (!existingKey) {
      return null;
    }

    // Check if the key belongs to the user
    if (existingKey.userId !== userId) {
      return null;
    }

    // Apply updates
    const updatedKey = {
      ...existingKey,
      ...updates,
      // Ensure these fields can't be overridden
      id: existingKey.id,
      key: existingKey.key,
      userId: existingKey.userId,
      createdAt: existingKey.createdAt
    };

    // Convert expiresAt to ISO string if it's a Date
    if (updates.expiresAt) {
      updatedKey.expiresAt = new Date(updates.expiresAt).toISOString();
    }

    await this.adapter.updateKey(keyId, updatedKey);

    // Return sanitized key (without the actual key value)
    const { key: _, ...sanitizedKey } = updatedKey;
    return sanitizedKey;
  }

  /**
   * Delete an API key
   * @param {string} keyId - API key ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} - Whether the key was deleted
   */
  async deleteKey(keyId, userId) {
    if (!keyId) {
      throw new Error('API key ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get the existing key
    const existingKey = await this.adapter.getKeyById(keyId);

    if (!existingKey) {
      return false;
    }

    // Check if the key belongs to the user
    if (existingKey.userId !== userId) {
      return false;
    }

    return await this.adapter.deleteKey(keyId);
  }

  /**
   * Validate an API key
   * @param {string} key - API key to validate
   * @returns {Promise<Object|null>} - API key info if valid, null otherwise
   */
  async validateKey(key) {
    if (!key) {
      return null;
    }

    // Get the key from the adapter
    const apiKey = await this.adapter.getKeyByValue(key);

    if (!apiKey) {
      return null;
    }

    // Check if the key is active
    if (!apiKey.isActive) {
      return null;
    }

    // Check if the key has expired
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return null;
    }

    // Update last used timestamp
    const now = new Date();
    await this.adapter.updateKey(apiKey.id, {
      ...apiKey,
      lastUsedAt: now.toISOString()
    });

    // Return key info (without the actual key value)
    const { key: _, ...keyInfo } = apiKey;
    return keyInfo;
  }

  /**
   * Check if a request is within rate limits
   * @param {string} keyId - API key ID
   * @returns {Promise<boolean>} - Whether the request is allowed
   */
  async checkRateLimit(keyId) {
    if (!keyId) {
      return false;
    }

    return await this.adapter.checkRateLimit(keyId, this.rateLimit);
  }

  /**
   * Middleware for Express/Connect/Hono to validate API keys
   * @returns {Function} - Middleware function
   */
  middleware() {
    return async (req, res, next) => {
      // Get API key from header or query parameter
      const apiKey = req.headers['x-api-key'] || req.query.api_key;

      if (!apiKey) {
        return res.status(401).json({ error: 'API key is required' });
      }

      // Validate the API key
      const keyInfo = await this.validateKey(apiKey);

      if (!keyInfo) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      // Check rate limit
      const withinLimit = await this.checkRateLimit(keyInfo.id);

      if (!withinLimit) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      // Attach key info to request
      req.apiKey = keyInfo;

      // Continue to next middleware
      next();
    };
  }
}

// Create adapters
export { MemoryAdapter } from './adapters/memory.js';

// Export the API Key Manager class
export { ApiKeyManager };

// Export a factory function for convenience
export function createApiKeyManager(options = {}) {
  return new ApiKeyManager(options);
}

// Default export
export default createApiKeyManager;