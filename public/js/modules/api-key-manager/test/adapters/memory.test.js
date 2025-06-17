import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryAdapter } from '../../src/adapters/memory.js';

describe('MemoryAdapter', () => {
  let adapter;
  
  beforeEach(() => {
    adapter = new MemoryAdapter();
  });
  
  describe('saveKey', () => {
    it('should save a key', async () => {
      const apiKey = {
        id: 'key1',
        key: 'test_key1',
        userId: 'user123',
        name: 'Test Key'
      };
      
      const result = await adapter.saveKey(apiKey);
      
      expect(result).toEqual(apiKey);
      expect(adapter.keys.get('key1')).toEqual(apiKey);
      expect(adapter.keysByValue.get('test_key1')).toEqual(apiKey);
      expect(adapter.keysByUser.get('user123').has('key1')).toBe(true);
    });
    
    it('should handle multiple keys for the same user', async () => {
      const apiKey1 = {
        id: 'key1',
        key: 'test_key1',
        userId: 'user123',
        name: 'Test Key 1'
      };
      
      const apiKey2 = {
        id: 'key2',
        key: 'test_key2',
        userId: 'user123',
        name: 'Test Key 2'
      };
      
      await adapter.saveKey(apiKey1);
      await adapter.saveKey(apiKey2);
      
      expect(adapter.keysByUser.get('user123').size).toBe(2);
      expect(adapter.keysByUser.get('user123').has('key1')).toBe(true);
      expect(adapter.keysByUser.get('user123').has('key2')).toBe(true);
    });
  });
  
  describe('getKeyById', () => {
    it('should get a key by ID', async () => {
      const apiKey = {
        id: 'key1',
        key: 'test_key1',
        userId: 'user123',
        name: 'Test Key'
      };
      
      await adapter.saveKey(apiKey);
      
      const result = await adapter.getKeyById('key1');
      
      expect(result).toEqual(apiKey);
    });
    
    it('should return null if key is not found', async () => {
      const result = await adapter.getKeyById('nonexistent');
      
      expect(result).toBeNull();
    });
  });
  
  describe('getKeyByValue', () => {
    it('should get a key by value', async () => {
      const apiKey = {
        id: 'key1',
        key: 'test_key1',
        userId: 'user123',
        name: 'Test Key'
      };
      
      await adapter.saveKey(apiKey);
      
      const result = await adapter.getKeyByValue('test_key1');
      
      expect(result).toEqual(apiKey);
    });
    
    it('should return null if key value is not found', async () => {
      const result = await adapter.getKeyByValue('nonexistent');
      
      expect(result).toBeNull();
    });
  });
  
  describe('getKeysByUserId', () => {
    it('should get all keys for a user', async () => {
      const apiKey1 = {
        id: 'key1',
        key: 'test_key1',
        userId: 'user123',
        name: 'Test Key 1'
      };
      
      const apiKey2 = {
        id: 'key2',
        key: 'test_key2',
        userId: 'user123',
        name: 'Test Key 2'
      };
      
      await adapter.saveKey(apiKey1);
      await adapter.saveKey(apiKey2);
      
      const result = await adapter.getKeysByUserId('user123');
      
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(apiKey1);
      expect(result).toContainEqual(apiKey2);
    });
    
    it('should return an empty array if user has no keys', async () => {
      const result = await adapter.getKeysByUserId('nonexistent');
      
      expect(result).toEqual([]);
    });
  });
  
  describe('updateKey', () => {
    it('should update a key', async () => {
      const apiKey = {
        id: 'key1',
        key: 'test_key1',
        userId: 'user123',
        name: 'Original Name'
      };
      
      await adapter.saveKey(apiKey);
      
      const updatedKey = {
        ...apiKey,
        name: 'Updated Name'
      };
      
      const result = await adapter.updateKey('key1', updatedKey);
      
      expect(result).toEqual(updatedKey);
      expect(adapter.keys.get('key1')).toEqual(updatedKey);
      expect(adapter.keysByValue.get('test_key1')).toEqual(updatedKey);
    });
    
    it('should update key value index if key value changes', async () => {
      const apiKey = {
        id: 'key1',
        key: 'test_key1',
        userId: 'user123',
        name: 'Test Key'
      };
      
      await adapter.saveKey(apiKey);
      
      const updatedKey = {
        ...apiKey,
        key: 'test_key1_updated'
      };
      
      await adapter.updateKey('key1', updatedKey);
      
      expect(adapter.keysByValue.has('test_key1')).toBe(false);
      expect(adapter.keysByValue.get('test_key1_updated')).toEqual(updatedKey);
    });
    
    it('should return null if key is not found', async () => {
      const result = await adapter.updateKey('nonexistent', {});
      
      expect(result).toBeNull();
    });
  });
  
  describe('deleteKey', () => {
    it('should delete a key', async () => {
      const apiKey = {
        id: 'key1',
        key: 'test_key1',
        userId: 'user123',
        name: 'Test Key'
      };
      
      await adapter.saveKey(apiKey);
      
      const result = await adapter.deleteKey('key1');
      
      expect(result).toBe(true);
      expect(adapter.keys.has('key1')).toBe(false);
      expect(adapter.keysByValue.has('test_key1')).toBe(false);
      expect(adapter.keysByUser.has('user123')).toBe(false);
    });
    
    it('should remove user entry if no more keys for user', async () => {
      const apiKey = {
        id: 'key1',
        key: 'test_key1',
        userId: 'user123',
        name: 'Test Key'
      };
      
      await adapter.saveKey(apiKey);
      await adapter.deleteKey('key1');
      
      expect(adapter.keysByUser.has('user123')).toBe(false);
    });
    
    it('should return false if key is not found', async () => {
      const result = await adapter.deleteKey('nonexistent');
      
      expect(result).toBe(false);
    });
  });
  
  describe('checkRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      const rateLimit = {
        windowMs: 1000,
        maxRequests: 3
      };
      
      // First request
      let result = await adapter.checkRateLimit('key1', rateLimit);
      expect(result).toBe(true);
      
      // Second request
      result = await adapter.checkRateLimit('key1', rateLimit);
      expect(result).toBe(true);
      
      // Third request
      result = await adapter.checkRateLimit('key1', rateLimit);
      expect(result).toBe(true);
      
      // Fourth request (exceeds limit)
      result = await adapter.checkRateLimit('key1', rateLimit);
      expect(result).toBe(false);
    });
    
    it('should reset rate limit after window expires', async () => {
      const rateLimit = {
        windowMs: 50, // Very short window for testing
        maxRequests: 1
      };
      
      // First request
      let result = await adapter.checkRateLimit('key1', rateLimit);
      expect(result).toBe(true);
      
      // Second request (exceeds limit)
      result = await adapter.checkRateLimit('key1', rateLimit);
      expect(result).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should be allowed again
      result = await adapter.checkRateLimit('key1', rateLimit);
      expect(result).toBe(true);
    });
    
    it('should track rate limits separately for different keys', async () => {
      const rateLimit = {
        windowMs: 1000,
        maxRequests: 1
      };
      
      // First key
      let result = await adapter.checkRateLimit('key1', rateLimit);
      expect(result).toBe(true);
      
      result = await adapter.checkRateLimit('key1', rateLimit);
      expect(result).toBe(false);
      
      // Second key (should be allowed)
      result = await adapter.checkRateLimit('key2', rateLimit);
      expect(result).toBe(true);
    });
  });
  
  describe('clear', () => {
    it('should clear all data', async () => {
      const apiKey = {
        id: 'key1',
        key: 'test_key1',
        userId: 'user123',
        name: 'Test Key'
      };
      
      await adapter.saveKey(apiKey);
      await adapter.checkRateLimit('key1', { windowMs: 1000, maxRequests: 5 });
      
      adapter.clear();
      
      expect(adapter.keys.size).toBe(0);
      expect(adapter.keysByUser.size).toBe(0);
      expect(adapter.keysByValue.size).toBe(0);
      expect(adapter.rateLimits.size).toBe(0);
    });
  });
});