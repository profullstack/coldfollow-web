/**
 * Tests for persistence manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  createPersistenceManager, 
  createLocalStorageAdapter, 
  createSessionStorageAdapter, 
  createMemoryAdapter 
} from '../src/persistence.js';

describe('PersistenceManager', () => {
  let persistenceManager;
  let mockAdapter;
  
  beforeEach(() => {
    // Create a mock adapter
    mockAdapter = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    
    // Create a persistence manager with the mock adapter
    persistenceManager = createPersistenceManager({
      enabled: true,
      key: 'test_state',
      adapter: mockAdapter
    });
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('save', () => {
    it('should save state to the adapter', () => {
      const state = { user: { name: 'Test User' }, counter: 0 };
      
      persistenceManager.save(state);
      
      expect(mockAdapter.setItem).toHaveBeenCalledWith('test_state', JSON.stringify(state));
    });
    
    it('should not save state when persistence is disabled', () => {
      persistenceManager.setEnabled(false);
      
      const state = { user: { name: 'Test User' }, counter: 0 };
      const result = persistenceManager.save(state);
      
      expect(result).toBe(false);
      expect(mockAdapter.setItem).not.toHaveBeenCalled();
    });
    
    it('should only save specified keys when persistentKeys is set', () => {
      persistenceManager.setPersistentKeys(['user']);
      
      const state = { 
        user: { name: 'Test User' }, 
        counter: 0,
        todos: [{ id: 1, text: 'Test' }]
      };
      
      persistenceManager.save(state);
      
      expect(mockAdapter.setItem).toHaveBeenCalledWith(
        'test_state', 
        JSON.stringify({ user: { name: 'Test User' } })
      );
    });
    
    it('should handle nested persistent keys', () => {
      persistenceManager.setPersistentKeys(['user.name']);
      
      const state = { 
        user: { 
          name: 'Test User',
          email: 'test@example.com' 
        }, 
        counter: 0
      };
      
      persistenceManager.save(state);
      
      expect(mockAdapter.setItem).toHaveBeenCalledWith(
        'test_state', 
        JSON.stringify({ user: { name: 'Test User' } })
      );
    });
    
    it('should handle errors when saving', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAdapter.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const state = { user: { name: 'Test User' }, counter: 0 };
      const result = persistenceManager.save(state);
      
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('load', () => {
    it('should load state from the adapter', () => {
      const state = { user: { name: 'Test User' }, counter: 0 };
      mockAdapter.getItem.mockReturnValue(JSON.stringify(state));
      
      const loadedState = persistenceManager.load();
      
      expect(mockAdapter.getItem).toHaveBeenCalledWith('test_state');
      expect(loadedState).toEqual(state);
    });
    
    it('should return null when no state is found', () => {
      mockAdapter.getItem.mockReturnValue(null);
      
      const loadedState = persistenceManager.load();
      
      expect(loadedState).toBeNull();
    });
    
    it('should not load state when persistence is disabled', () => {
      persistenceManager.setEnabled(false);
      
      const loadedState = persistenceManager.load();
      
      expect(loadedState).toBeNull();
      expect(mockAdapter.getItem).not.toHaveBeenCalled();
    });
    
    it('should handle errors when loading', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAdapter.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const loadedState = persistenceManager.load();
      
      expect(loadedState).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('clear', () => {
    it('should clear state from the adapter', () => {
      persistenceManager.clear();
      
      expect(mockAdapter.removeItem).toHaveBeenCalledWith('test_state');
    });
    
    it('should not clear state when persistence is disabled', () => {
      persistenceManager.setEnabled(false);
      
      const result = persistenceManager.clear();
      
      expect(result).toBe(false);
      expect(mockAdapter.removeItem).not.toHaveBeenCalled();
    });
    
    it('should handle errors when clearing', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAdapter.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const result = persistenceManager.clear();
      
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('exists', () => {
    it('should check if state exists in the adapter', () => {
      mockAdapter.getItem.mockReturnValue(JSON.stringify({ user: { name: 'Test User' } }));
      
      const exists = persistenceManager.exists();
      
      expect(exists).toBe(true);
      expect(mockAdapter.getItem).toHaveBeenCalledWith('test_state');
    });
    
    it('should return false when no state is found', () => {
      mockAdapter.getItem.mockReturnValue(null);
      
      const exists = persistenceManager.exists();
      
      expect(exists).toBe(false);
    });
    
    it('should not check when persistence is disabled', () => {
      persistenceManager.setEnabled(false);
      
      const exists = persistenceManager.exists();
      
      expect(exists).toBe(false);
      expect(mockAdapter.getItem).not.toHaveBeenCalled();
    });
    
    it('should handle errors when checking', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAdapter.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const exists = persistenceManager.exists();
      
      expect(exists).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('configuration', () => {
    it('should get and set the persistence key', () => {
      expect(persistenceManager.getKey()).toBe('test_state');
      
      persistenceManager.setKey('new_key');
      expect(persistenceManager.getKey()).toBe('new_key');
    });
    
    it('should get and set the enabled state', () => {
      expect(persistenceManager.isEnabled()).toBe(true);
      
      persistenceManager.setEnabled(false);
      expect(persistenceManager.isEnabled()).toBe(false);
    });
    
    it('should get and set the persistent keys', () => {
      expect(persistenceManager.getPersistentKeys()).toBeNull();
      
      persistenceManager.setPersistentKeys(['user', 'counter']);
      expect(persistenceManager.getPersistentKeys()).toEqual(['user', 'counter']);
      
      // Should handle non-array input
      persistenceManager.setPersistentKeys('user');
      expect(persistenceManager.getPersistentKeys()).toBeNull();
    });
    
    it('should get and set the adapter', () => {
      const newAdapter = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
      
      expect(persistenceManager.getAdapter()).toBe(mockAdapter);
      
      persistenceManager.setAdapter(newAdapter);
      expect(persistenceManager.getAdapter()).toBe(newAdapter);
    });
  });
});

describe('Storage Adapters', () => {
  describe('MemoryAdapter', () => {
    it('should store and retrieve values', () => {
      const adapter = createMemoryAdapter();
      
      adapter.setItem('key', 'value');
      expect(adapter.getItem('key')).toBe('value');
      
      adapter.removeItem('key');
      expect(adapter.getItem('key')).toBeNull();
    });
  });
  
  describe('LocalStorageAdapter', () => {
    it('should create an adapter that uses localStorage', () => {
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
      
      // Save original localStorage
      const originalLocalStorage = global.localStorage;
      
      // Replace with mock
      global.localStorage = localStorageMock;
      
      try {
        const adapter = createLocalStorageAdapter();
        
        adapter.setItem('key', 'value');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('key', 'value');
        
        adapter.getItem('key');
        expect(localStorageMock.getItem).toHaveBeenCalledWith('key');
        
        adapter.removeItem('key');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('key');
      } finally {
        // Restore original localStorage
        global.localStorage = originalLocalStorage;
      }
    });
  });
  
  describe('SessionStorageAdapter', () => {
    it('should create an adapter that uses sessionStorage', () => {
      // Mock sessionStorage
      const sessionStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
      
      // Save original sessionStorage
      const originalSessionStorage = global.sessionStorage;
      
      // Replace with mock
      global.sessionStorage = sessionStorageMock;
      
      try {
        const adapter = createSessionStorageAdapter();
        
        adapter.setItem('key', 'value');
        expect(sessionStorageMock.setItem).toHaveBeenCalledWith('key', 'value');
        
        adapter.getItem('key');
        expect(sessionStorageMock.getItem).toHaveBeenCalledWith('key');
        
        adapter.removeItem('key');
        expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('key');
      } finally {
        // Restore original sessionStorage
        global.sessionStorage = originalSessionStorage;
      }
    });
  });
});