/**
 * In-Memory Storage Adapter for API Key Manager
 * 
 * This adapter stores API keys in memory, suitable for development or testing.
 * For production use, consider using the Redis or Database adapters.
 */

/**
 * In-Memory Storage Adapter
 */
export class MemoryAdapter {
  /**
   * Create a new Memory Adapter
   */
  constructor() {
    // Initialize storage
    this.keys = new Map();
    this.keysByUser = new Map();
    this.keysByValue = new Map();
    this.rateLimits = new Map();
  }

  /**
   * Save an API key
   * @param {Object} apiKey - API key object
   * @returns {Promise<Object>} - Saved API key
   */
  async saveKey(apiKey) {
    // Store by ID
    this.keys.set(apiKey.id, apiKey);
    
    // Store by key value
    this.keysByValue.set(apiKey.key, apiKey);
    
    // Store by user ID
    if (!this.keysByUser.has(apiKey.userId)) {
      this.keysByUser.set(apiKey.userId, new Set());
    }
    this.keysByUser.get(apiKey.userId).add(apiKey.id);
    
    return apiKey;
  }

  /**
   * Get an API key by ID
   * @param {string} keyId - API key ID
   * @returns {Promise<Object|null>} - API key or null if not found
   */
  async getKeyById(keyId) {
    return this.keys.get(keyId) || null;
  }

  /**
   * Get an API key by value
   * @param {string} keyValue - API key value
   * @returns {Promise<Object|null>} - API key or null if not found
   */
  async getKeyByValue(keyValue) {
    return this.keysByValue.get(keyValue) || null;
  }

  /**
   * Get API keys for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of API keys
   */
  async getKeysByUserId(userId) {
    const keyIds = this.keysByUser.get(userId) || new Set();
    const keys = [];
    
    for (const keyId of keyIds) {
      const key = this.keys.get(keyId);
      if (key) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  /**
   * Update an API key
   * @param {string} keyId - API key ID
   * @param {Object} updatedKey - Updated API key
   * @returns {Promise<Object|null>} - Updated API key or null if not found
   */
  async updateKey(keyId, updatedKey) {
    const existingKey = this.keys.get(keyId);
    
    if (!existingKey) {
      return null;
    }
    
    // Update the key
    this.keys.set(keyId, updatedKey);
    
    // Update the key by value index if the key value hasn't changed
    if (existingKey.key === updatedKey.key) {
      this.keysByValue.set(updatedKey.key, updatedKey);
    } else {
      // If the key value has changed, update the index
      this.keysByValue.delete(existingKey.key);
      this.keysByValue.set(updatedKey.key, updatedKey);
    }
    
    return updatedKey;
  }

  /**
   * Delete an API key
   * @param {string} keyId - API key ID
   * @returns {Promise<boolean>} - Whether the key was deleted
   */
  async deleteKey(keyId) {
    const existingKey = this.keys.get(keyId);
    
    if (!existingKey) {
      return false;
    }
    
    // Remove from keys
    this.keys.delete(keyId);
    
    // Remove from keysByValue
    this.keysByValue.delete(existingKey.key);
    
    // Remove from keysByUser
    const userKeys = this.keysByUser.get(existingKey.userId);
    if (userKeys) {
      userKeys.delete(keyId);
      
      // If no more keys for this user, remove the user entry
      if (userKeys.size === 0) {
        this.keysByUser.delete(existingKey.userId);
      }
    }
    
    // Remove from rateLimits
    this.rateLimits.delete(keyId);
    
    return true;
  }

  /**
   * Check if a request is within rate limits
   * @param {string} keyId - API key ID
   * @param {Object} rateLimit - Rate limit configuration
   * @param {number} rateLimit.windowMs - Rate limit window in milliseconds
   * @param {number} rateLimit.maxRequests - Maximum requests per window
   * @returns {Promise<boolean>} - Whether the request is allowed
   */
  async checkRateLimit(keyId, rateLimit) {
    const now = Date.now();
    const windowMs = rateLimit.windowMs;
    const maxRequests = rateLimit.maxRequests;
    
    // Get or create rate limit entry
    if (!this.rateLimits.has(keyId)) {
      this.rateLimits.set(keyId, {
        requests: [],
        windowStart: now
      });
    }
    
    const rateLimitEntry = this.rateLimits.get(keyId);
    
    // Reset window if needed
    if (now - rateLimitEntry.windowStart > windowMs) {
      rateLimitEntry.requests = [];
      rateLimitEntry.windowStart = now;
    }
    
    // Check if rate limit is exceeded
    if (rateLimitEntry.requests.length >= maxRequests) {
      return false;
    }
    
    // Add request to the window
    rateLimitEntry.requests.push(now);
    
    // Clean up old requests
    rateLimitEntry.requests = rateLimitEntry.requests.filter(
      timestamp => now - timestamp < windowMs
    );
    
    return true;
  }

  /**
   * Clear all data (for testing)
   * @returns {Promise<void>}
   */
  async clear() {
    this.keys.clear();
    this.keysByUser.clear();
    this.keysByValue.clear();
    this.rateLimits.clear();
  }
}

export default MemoryAdapter;