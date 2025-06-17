import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiKeyManager, MemoryAdapter } from '../src/index.js';

describe('ApiKeyManager', () => {
  let apiKeyManager;
  let mockAdapter;
  
  beforeEach(() => {
    // Create a mock adapter with spies
    mockAdapter = new MemoryAdapter();
    vi.spyOn(mockAdapter, 'saveKey');
    vi.spyOn(mockAdapter, 'getKeysByUserId');
    vi.spyOn(mockAdapter, 'getKeyById');
    vi.spyOn(mockAdapter, 'getKeyByValue');
    vi.spyOn(mockAdapter, 'updateKey');
    vi.spyOn(mockAdapter, 'deleteKey');
    vi.spyOn(mockAdapter, 'checkRateLimit');
    vi.spyOn(mockAdapter, 'clear');
    
    // Create a new ApiKeyManager instance for each test
    apiKeyManager = new ApiKeyManager({
      adapter: mockAdapter,
      prefix: 'test_',
      keyLength: 16,
      rateLimit: {
        windowMs: 1000,
        maxRequests: 5
      }
    });
  });
  
  describe('constructor', () => {
    it('should use default options when none are provided', () => {
      const defaultManager = new ApiKeyManager();
      
      expect(defaultManager.prefix).toBe('api_');
      expect(defaultManager.keyLength).toBe(32);
      expect(defaultManager.rateLimit.windowMs).toBe(60 * 1000);
      expect(defaultManager.rateLimit.maxRequests).toBe(60);
      expect(defaultManager.adapter).toBeInstanceOf(MemoryAdapter);
    });
    
    it('should use provided options', () => {
      expect(apiKeyManager.prefix).toBe('test_');
      expect(apiKeyManager.keyLength).toBe(16);
      expect(apiKeyManager.rateLimit.windowMs).toBe(1000);
      expect(apiKeyManager.rateLimit.maxRequests).toBe(5);
      expect(apiKeyManager.adapter).toBe(mockAdapter);
    });
  });
  
  describe('createKey', () => {
    it('should create a new API key', async () => {
      const keyOptions = {
        userId: 'user123',
        name: 'Test Key',
        permissions: { read: true, write: false },
        metadata: { purpose: 'testing' }
      };
      
      const apiKey = await apiKeyManager.createKey(keyOptions);
      
      expect(apiKey.userId).toBe('user123');
      expect(apiKey.name).toBe('Test Key');
      expect(apiKey.permissions).toEqual({ read: true, write: false });
      expect(apiKey.metadata).toEqual({ purpose: 'testing' });
      expect(apiKey.isActive).toBe(true);
      expect(apiKey.key.startsWith('test_')).toBe(true);
      expect(apiKey.id).toBeDefined();
      expect(apiKey.createdAt).toBeDefined();
      expect(apiKey.lastUsedAt).toBeNull();
      expect(apiKey.expiresAt).toBeNull();
      
      expect(mockAdapter.saveKey).toHaveBeenCalledWith(apiKey);
    });
    
    it('should create a key with an expiration date', async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
      
      const keyOptions = {
        userId: 'user123',
        name: 'Expiring Key',
        expiresAt
      };
      
      const apiKey = await apiKeyManager.createKey(keyOptions);
      
      expect(apiKey.expiresAt).toBe(expiresAt.toISOString());
    });
    
    it('should throw an error if userId is not provided', async () => {
      await expect(apiKeyManager.createKey({ name: 'Test Key' }))
        .rejects.toThrow('User ID is required');
    });
    
    it('should throw an error if name is not provided', async () => {
      await expect(apiKeyManager.createKey({ userId: 'user123' }))
        .rejects.toThrow('API key name is required');
    });
  });
  
  describe('getKeys', () => {
    it('should get all keys for a user', async () => {
      const mockKeys = [
        { id: 'key1', key: 'secret1', userId: 'user123', name: 'Key 1' },
        { id: 'key2', key: 'secret2', userId: 'user123', name: 'Key 2' }
      ];
      
      mockAdapter.getKeysByUserId.mockResolvedValue(mockKeys);
      
      const keys = await apiKeyManager.getKeys('user123');
      
      expect(mockAdapter.getKeysByUserId).toHaveBeenCalledWith('user123');
      expect(keys).toHaveLength(2);
      expect(keys[0].id).toBe('key1');
      expect(keys[0].name).toBe('Key 1');
      expect(keys[0].key).toBeUndefined(); // Key should be sanitized
      expect(keys[1].id).toBe('key2');
      expect(keys[1].name).toBe('Key 2');
      expect(keys[1].key).toBeUndefined(); // Key should be sanitized
    });
    
    it('should throw an error if userId is not provided', async () => {
      await expect(apiKeyManager.getKeys())
        .rejects.toThrow('User ID is required');
    });
  });
  
  describe('getKeyById', () => {
    it('should get a key by ID', async () => {
      const mockKey = {
        id: 'key1',
        key: 'secret1',
        userId: 'user123',
        name: 'Key 1'
      };
      
      mockAdapter.getKeyById.mockResolvedValue(mockKey);
      
      const key = await apiKeyManager.getKeyById('key1', 'user123');
      
      expect(mockAdapter.getKeyById).toHaveBeenCalledWith('key1');
      expect(key.id).toBe('key1');
      expect(key.name).toBe('Key 1');
      expect(key.userId).toBe('user123');
      expect(key.key).toBeUndefined(); // Key should be sanitized
    });
    
    it('should return null if key is not found', async () => {
      mockAdapter.getKeyById.mockResolvedValue(null);
      
      const key = await apiKeyManager.getKeyById('nonexistent', 'user123');
      
      expect(key).toBeNull();
    });
    
    it('should return null if key does not belong to user', async () => {
      const mockKey = {
        id: 'key1',
        key: 'secret1',
        userId: 'otherUser',
        name: 'Key 1'
      };
      
      mockAdapter.getKeyById.mockResolvedValue(mockKey);
      
      const key = await apiKeyManager.getKeyById('key1', 'user123');
      
      expect(key).toBeNull();
    });
    
    it('should throw an error if keyId is not provided', async () => {
      await expect(apiKeyManager.getKeyById(null, 'user123'))
        .rejects.toThrow('API key ID is required');
    });
  });
  
  describe('validateKey', () => {
    it('should validate a valid key', async () => {
      const mockKey = {
        id: 'key1',
        key: 'test_validkey',
        userId: 'user123',
        name: 'Valid Key',
        isActive: true,
        expiresAt: null
      };
      
      mockAdapter.getKeyByValue.mockResolvedValue(mockKey);
      mockAdapter.updateKey.mockResolvedValue(mockKey);
      
      const keyInfo = await apiKeyManager.validateKey('test_validkey');
      
      expect(mockAdapter.getKeyByValue).toHaveBeenCalledWith('test_validkey');
      expect(keyInfo.id).toBe('key1');
      expect(keyInfo.userId).toBe('user123');
      expect(keyInfo.name).toBe('Valid Key');
      expect(keyInfo.key).toBeUndefined(); // Key should be sanitized
      
      // Should update lastUsedAt
      expect(mockAdapter.updateKey).toHaveBeenCalled();
      expect(mockAdapter.updateKey.mock.calls[0][0]).toBe('key1');
      expect(mockAdapter.updateKey.mock.calls[0][1].lastUsedAt).toBeDefined();
    });
    
    it('should return null for an invalid key', async () => {
      mockAdapter.getKeyByValue.mockResolvedValue(null);
      
      const keyInfo = await apiKeyManager.validateKey('test_invalidkey');
      
      expect(keyInfo).toBeNull();
    });
    
    it('should return null for an inactive key', async () => {
      const mockKey = {
        id: 'key1',
        key: 'test_inactivekey',
        userId: 'user123',
        name: 'Inactive Key',
        isActive: false
      };
      
      mockAdapter.getKeyByValue.mockResolvedValue(mockKey);
      
      const keyInfo = await apiKeyManager.validateKey('test_inactivekey');
      
      expect(keyInfo).toBeNull();
    });
    
    it('should return null for an expired key', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const mockKey = {
        id: 'key1',
        key: 'test_expiredkey',
        userId: 'user123',
        name: 'Expired Key',
        isActive: true,
        expiresAt: yesterday.toISOString()
      };
      
      mockAdapter.getKeyByValue.mockResolvedValue(mockKey);
      
      const keyInfo = await apiKeyManager.validateKey('test_expiredkey');
      
      expect(keyInfo).toBeNull();
    });
  });
  
  describe('checkRateLimit', () => {
    it('should check rate limit for a key', async () => {
      mockAdapter.checkRateLimit.mockResolvedValue(true);
      
      const result = await apiKeyManager.checkRateLimit('key1');
      
      expect(mockAdapter.checkRateLimit).toHaveBeenCalledWith('key1', apiKeyManager.rateLimit);
      expect(result).toBe(true);
    });
    
    it('should return false if keyId is not provided', async () => {
      const result = await apiKeyManager.checkRateLimit();
      
      expect(result).toBe(false);
    });
  });
});