/**
 * Persistence Manager for State Manager
 * 
 * Provides functionality for persisting state to various storage mechanisms.
 */

/**
 * Create a persistence manager
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether persistence is enabled
 * @param {string} options.key - Key for storage
 * @param {Object} options.adapter - Storage adapter (default: localStorage)
 * @param {string[]} options.persistentKeys - Keys to persist (default: all)
 * @returns {Object} Persistence manager
 */
export function createPersistenceManager(options = {}) {
  // Default options
  const config = {
    enabled: false,
    key: 'app_state',
    adapter: null,
    persistentKeys: null,
    ...options
  };
  
  // Use localStorage as default adapter if available
  if (!config.adapter && typeof localStorage !== 'undefined') {
    config.adapter = createLocalStorageAdapter();
  } else if (!config.adapter && typeof sessionStorage !== 'undefined') {
    config.adapter = createSessionStorageAdapter();
  } else if (!config.adapter) {
    config.adapter = createMemoryAdapter();
  }
  
  /**
   * Save state to storage
   * @param {Object} state - State to save
   * @returns {boolean} Whether the save was successful
   */
  function save(state) {
    if (!config.enabled) {
      return false;
    }
    
    try {
      // If persistentKeys is specified, only save those keys
      let stateToSave = state;
      
      if (Array.isArray(config.persistentKeys) && config.persistentKeys.length > 0) {
        stateToSave = {};
        
        for (const key of config.persistentKeys) {
          if (typeof key === 'string' && key.includes('.')) {
            // Handle nested keys
            const parts = key.split('.');
            let currentState = state;
            let currentSaveState = stateToSave;
            
            for (let i = 0; i < parts.length - 1; i++) {
              const part = parts[i];
              
              if (currentState[part] === undefined) {
                break;
              }
              
              if (currentSaveState[part] === undefined) {
                currentSaveState[part] = {};
              }
              
              currentState = currentState[part];
              currentSaveState = currentSaveState[part];
            }
            
            const lastPart = parts[parts.length - 1];
            if (currentState[lastPart] !== undefined) {
              currentSaveState[lastPart] = currentState[lastPart];
            }
          } else if (state[key] !== undefined) {
            // Handle top-level keys
            stateToSave[key] = state[key];
          }
        }
      }
      
      config.adapter.setItem(config.key, JSON.stringify(stateToSave));
      return true;
    } catch (error) {
      console.error('Error saving state to storage:', error);
      return false;
    }
  }
  
  /**
   * Load state from storage
   * @returns {Object|null} Loaded state or null if not found
   */
  function load() {
    if (!config.enabled) {
      return null;
    }
    
    try {
      const savedState = config.adapter.getItem(config.key);
      
      if (!savedState) {
        return null;
      }
      
      return JSON.parse(savedState);
    } catch (error) {
      console.error('Error loading state from storage:', error);
      return null;
    }
  }
  
  /**
   * Clear persisted state
   * @returns {boolean} Whether the clear was successful
   */
  function clear() {
    if (!config.enabled) {
      return false;
    }
    
    try {
      config.adapter.removeItem(config.key);
      return true;
    } catch (error) {
      console.error('Error clearing state from storage:', error);
      return false;
    }
  }
  
  /**
   * Check if state exists in storage
   * @returns {boolean} Whether state exists
   */
  function exists() {
    if (!config.enabled) {
      return false;
    }
    
    try {
      return config.adapter.getItem(config.key) !== null;
    } catch (error) {
      console.error('Error checking if state exists in storage:', error);
      return false;
    }
  }
  
  /**
   * Get the persistence key
   * @returns {string} Persistence key
   */
  function getKey() {
    return config.key;
  }
  
  /**
   * Set the persistence key
   * @param {string} key - New persistence key
   */
  function setKey(key) {
    config.key = key;
  }
  
  /**
   * Enable or disable persistence
   * @param {boolean} enabled - Whether persistence is enabled
   */
  function setEnabled(enabled) {
    config.enabled = enabled;
  }
  
  /**
   * Check if persistence is enabled
   * @returns {boolean} Whether persistence is enabled
   */
  function isEnabled() {
    return config.enabled;
  }
  
  /**
   * Set the persistent keys
   * @param {string[]} keys - Keys to persist
   */
  function setPersistentKeys(keys) {
    config.persistentKeys = Array.isArray(keys) ? keys : null;
  }
  
  /**
   * Get the persistent keys
   * @returns {string[]|null} Persistent keys
   */
  function getPersistentKeys() {
    return config.persistentKeys;
  }
  
  /**
   * Set the storage adapter
   * @param {Object} adapter - Storage adapter
   */
  function setAdapter(adapter) {
    config.adapter = adapter;
  }
  
  /**
   * Get the storage adapter
   * @returns {Object} Storage adapter
   */
  function getAdapter() {
    return config.adapter;
  }
  
  // Return the persistence manager
  return {
    save,
    load,
    clear,
    exists,
    getKey,
    setKey,
    setEnabled,
    isEnabled,
    setPersistentKeys,
    getPersistentKeys,
    setAdapter,
    getAdapter
  };
}

/**
 * Create a localStorage adapter
 * @returns {Object} localStorage adapter
 */
export function createLocalStorageAdapter() {
  return {
    getItem(key) {
      return localStorage.getItem(key);
    },
    setItem(key, value) {
      localStorage.setItem(key, value);
    },
    removeItem(key) {
      localStorage.removeItem(key);
    }
  };
}

/**
 * Create a sessionStorage adapter
 * @returns {Object} sessionStorage adapter
 */
export function createSessionStorageAdapter() {
  return {
    getItem(key) {
      return sessionStorage.getItem(key);
    },
    setItem(key, value) {
      sessionStorage.setItem(key, value);
    },
    removeItem(key) {
      sessionStorage.removeItem(key);
    }
  };
}

/**
 * Create an in-memory adapter
 * @returns {Object} In-memory adapter
 */
export function createMemoryAdapter() {
  const storage = new Map();
  
  return {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, value);
    },
    removeItem(key) {
      storage.delete(key);
    }
  };
}

/**
 * Create an IndexedDB adapter
 * @param {string} dbName - Database name
 * @param {string} storeName - Store name
 * @returns {Object} IndexedDB adapter
 */
export function createIndexedDBAdapter(dbName = 'stateManagerDB', storeName = 'state') {
  let db = null;
  
  // Initialize the database
  const initPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }
    
    const request = window.indexedDB.open(dbName, 1);
    
    request.onerror = (event) => {
      reject(new Error('Error opening IndexedDB'));
    };
    
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore(storeName);
    };
  });
  
  return {
    async getItem(key) {
      try {
        await initPromise;
        
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.get(key);
          
          request.onsuccess = (event) => {
            resolve(request.result);
          };
          
          request.onerror = (event) => {
            reject(new Error('Error getting item from IndexedDB'));
          };
        });
      } catch (error) {
        console.error('Error getting item from IndexedDB:', error);
        return null;
      }
    },
    async setItem(key, value) {
      try {
        await initPromise;
        
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.put(value, key);
          
          request.onsuccess = (event) => {
            resolve();
          };
          
          request.onerror = (event) => {
            reject(new Error('Error setting item in IndexedDB'));
          };
        });
      } catch (error) {
        console.error('Error setting item in IndexedDB:', error);
      }
    },
    async removeItem(key) {
      try {
        await initPromise;
        
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.delete(key);
          
          request.onsuccess = (event) => {
            resolve();
          };
          
          request.onerror = (event) => {
            reject(new Error('Error removing item from IndexedDB'));
          };
        });
      } catch (error) {
        console.error('Error removing item from IndexedDB:', error);
      }
    }
  };
}

export default createPersistenceManager;