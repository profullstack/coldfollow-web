import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiKeyManager, MemoryAdapter } from '../src/index.js';

describe('ApiKeyManager Middleware', () => {
  let apiKeyManager;
  let mockAdapter;
  let middleware;
  
  beforeEach(() => {
    // Create a mock adapter
    mockAdapter = new MemoryAdapter();
    
    // Create a new ApiKeyManager instance
    apiKeyManager = new ApiKeyManager({
      adapter: mockAdapter
    });
    
    // Create the middleware
    middleware = apiKeyManager.middleware();
    
    // Spy on validateKey and checkRateLimit methods
    vi.spyOn(apiKeyManager, 'validateKey');
    vi.spyOn(apiKeyManager, 'checkRateLimit');
  });
  
  it('should validate API key from header', async () => {
    // Mock request and response
    const req = {
      headers: { 'x-api-key': 'api_validkey' },
      query: {}
    };
    
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    
    const next = vi.fn();
    
    // Mock validateKey to return a valid key
    const keyInfo = {
      id: 'key1',
      userId: 'user123',
      name: 'Test Key'
    };
    
    apiKeyManager.validateKey.mockResolvedValue(keyInfo);
    apiKeyManager.checkRateLimit.mockResolvedValue(true);
    
    // Call middleware
    await middleware(req, res, next);
    
    // Assertions
    expect(apiKeyManager.validateKey).toHaveBeenCalledWith('api_validkey');
    expect(apiKeyManager.checkRateLimit).toHaveBeenCalledWith('key1');
    expect(req.apiKey).toEqual(keyInfo);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
  
  it('should validate API key from query parameter', async () => {
    // Mock request and response
    const req = {
      headers: {},
      query: { api_key: 'api_validkey' }
    };
    
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    
    const next = vi.fn();
    
    // Mock validateKey to return a valid key
    const keyInfo = {
      id: 'key1',
      userId: 'user123',
      name: 'Test Key'
    };
    
    apiKeyManager.validateKey.mockResolvedValue(keyInfo);
    apiKeyManager.checkRateLimit.mockResolvedValue(true);
    
    // Call middleware
    await middleware(req, res, next);
    
    // Assertions
    expect(apiKeyManager.validateKey).toHaveBeenCalledWith('api_validkey');
    expect(req.apiKey).toEqual(keyInfo);
    expect(next).toHaveBeenCalled();
  });
  
  it('should return 401 if API key is missing', async () => {
    // Mock request and response
    const req = {
      headers: {},
      query: {}
    };
    
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    
    const next = vi.fn();
    
    // Call middleware
    await middleware(req, res, next);
    
    // Assertions
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'API key is required' });
    expect(next).not.toHaveBeenCalled();
  });
  
  it('should return 401 if API key is invalid', async () => {
    // Mock request and response
    const req = {
      headers: { 'x-api-key': 'api_invalidkey' },
      query: {}
    };
    
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    
    const next = vi.fn();
    
    // Mock validateKey to return null (invalid key)
    apiKeyManager.validateKey.mockResolvedValue(null);
    
    // Call middleware
    await middleware(req, res, next);
    
    // Assertions
    expect(apiKeyManager.validateKey).toHaveBeenCalledWith('api_invalidkey');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid API key' });
    expect(next).not.toHaveBeenCalled();
  });
  
  it('should return 429 if rate limit is exceeded', async () => {
    // Mock request and response
    const req = {
      headers: { 'x-api-key': 'api_validkey' },
      query: {}
    };
    
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    
    const next = vi.fn();
    
    // Mock validateKey to return a valid key
    const keyInfo = {
      id: 'key1',
      userId: 'user123',
      name: 'Test Key'
    };
    
    apiKeyManager.validateKey.mockResolvedValue(keyInfo);
    
    // Mock checkRateLimit to return false (rate limit exceeded)
    apiKeyManager.checkRateLimit.mockResolvedValue(false);
    
    // Call middleware
    await middleware(req, res, next);
    
    // Assertions
    expect(apiKeyManager.validateKey).toHaveBeenCalledWith('api_validkey');
    expect(apiKeyManager.checkRateLimit).toHaveBeenCalledWith('key1');
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ error: 'Rate limit exceeded' });
    expect(next).not.toHaveBeenCalled();
  });
});