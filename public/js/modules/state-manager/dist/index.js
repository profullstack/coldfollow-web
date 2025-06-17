/**
 * @profullstack/state-manager
 *
 * Enhanced state manager with web component integration, persistence, and subscription management
 */

import { EventEmitter } from './event-emitter.js';
import { createPersistenceManager } from './persistence.js';
import { createWebComponentIntegration } from './web-components.js';
import { createMiddlewareManager } from './middleware.js';
import logger from '../logger.js';

logger.info('Initializing state-manager module');

/**
 * Enhanced State Manager
 * @extends EventEmitter
 */
class StateManager extends EventEmitter {
  /**
   * Create a new StateManager
   * @param {Object} initialState - Initial state
   * @param {Object} options - Configuration options
   * @param {boolean} options.enablePersistence - Whether to enable persistence (default: false)
   * @param {string} options.persistenceKey - Key for persistence storage (default: 'app_state')
   * @param {Object} options.persistenceAdapter - Persistence adapter (default: localStorage)
   * @param {string[]} options.persistentKeys - Keys to persist (default: all)
   * @param {boolean} options.immutable - Whether to use immutable state (default: true)
   * @param {boolean} options.debug - Whether to enable debug logging (default: false)
   */
  constructor(initialState = {}, options = {}) {
    super();
    
    logger.debug('StateManager constructor called with options:', options);
    
    // Default options
    this.options = {
      enablePersistence: false,
      persistenceKey: 'app_state',
      persistenceAdapter: null,
      persistentKeys: null,
      immutable: true,
      debug: false,
      ...options
    };
    
    // Initialize state
    this._state = this._clone(initialState);
    logger.debug('Initial state cloned');
    
    // Initialize subscribers
    this._subscribers = new Map();
    this._globalSubscribers = [];
    logger.debug('Subscribers initialized');
    
    // Initialize persistence
    logger.debug('Initializing persistence manager');
    this.persistence = createPersistenceManager({
      enabled: this.options.enablePersistence,
      key: this.options.persistenceKey,
      adapter: this.options.persistenceAdapter,
      persistentKeys: this.options.persistentKeys
    });
    
    // Initialize middleware manager
    logger.debug('Initializing middleware manager');
    this.middleware = createMiddlewareManager();
    
    // Initialize web component integration
    logger.debug('Initializing web component integration');
    this.webComponents = createWebComponentIntegration(this);
    
    // Load persisted state if enabled
    if (this.options.enablePersistence) {
      logger.debug('Loading persisted state');
      const persistedState = this.persistence.load();
      if (persistedState) {
        logger.debug('Persisted state found, merging with initial state');
        this._state = this._merge(this._state, persistedState);
      }
    }
    
    // Bind methods to ensure correct 'this' context
    this.getState = this.getState.bind(this);
    this.setState = this.setState.bind(this);
    this.resetState = this.resetState.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.use = this.use.bind(this);
    
    this._log('StateManager initialized with state:', this._state);
    logger.info('StateManager instance created');
  }
  
  /**
   * Get the current state or a specific part of the state
   * @param {string|string[]} [path] - Optional path to get a specific part of the state
   * @returns {any} The requested state
   */
  getState(path) {
    // If no path, return the entire state
    if (path === undefined) {
      return this._clone(this._state);
    }
    
    // Handle array path
    if (Array.isArray(path)) {
      return this._getNestedValue(this._state, path);
    }
    
    // Handle string path (dot notation)
    if (typeof path === 'string') {
      const pathArray = path.split('.');
      return this._getNestedValue(this._state, pathArray);
    }
    
    // Invalid path
    return undefined;
  }
  
  /**
   * Update the state
   * @param {Object|Function} update - Object to merge with state or function that returns an update object
   * @param {Object} options - Update options
   * @param {boolean} options.silent - Whether to suppress notifications (default: false)
   * @param {boolean} options.persist - Whether to persist the update (default: true if persistence is enabled)
   * @returns {Object} The new state
   */
  setState(update, options = {}) {
    logger.debug('setState called with options:', options);
    
    // Default options
    const updateOptions = {
      silent: false,
      persist: this.options.enablePersistence,
      ...options
    };
    
    // Handle function updates (for state that depends on previous state)
    const updateObj = typeof update === 'function'
      ? update(this._clone(this._state))
      : update;
    
    logger.debug('Update object prepared:', typeof updateObj === 'object' ? 'object' : updateObj);
    
    // Apply middleware
    logger.debug('Applying beforeUpdate middleware');
    const processedUpdate = this.middleware.applyMiddleware('beforeUpdate', updateObj, this._state);
    
    // Track changed paths
    const changedPaths = [];
    
    // Create new state by merging the update
    logger.debug('Merging state with update');
    const newState = this._merge(this._state, processedUpdate, '', changedPaths);
    
    // If no changes, return current state
    if (changedPaths.length === 0) {
      this._log('No state changes detected');
      logger.debug('No state changes detected');
      return this._clone(this._state);
    }
    
    // Update the state
    this._state = newState;
    
    // Apply middleware after update
    logger.debug('Applying afterUpdate middleware');
    this.middleware.applyMiddleware('afterUpdate', this._state, changedPaths);
    
    this._log('State updated with paths:', changedPaths);
    logger.debug('State updated with paths:', changedPaths);
    
    // Persist state if enabled
    if (updateOptions.persist && this.options.enablePersistence) {
      logger.debug('Persisting updated state');
      this.persistence.save(this._state);
    }
    
    // Emit update event
    logger.debug('Emitting update event');
    this.emit('update', this._clone(this._state), changedPaths);
    
    // Notify subscribers if not silent
    if (!updateOptions.silent) {
      logger.debug('Notifying subscribers');
      this._notifySubscribers(changedPaths);
    }
    
    return this._clone(this._state);
  }
  
  /**
   * Reset the state to initial values
   * @param {Object} initialState - New initial state
   * @param {Object} options - Reset options
   * @param {boolean} options.silent - Whether to suppress notifications (default: false)
   * @param {boolean} options.persist - Whether to persist the reset (default: true if persistence is enabled)
   * @returns {Object} The new state
   */
  resetState(initialState = {}, options = {}) {
    // Default options
    const resetOptions = {
      silent: false,
      persist: this.options.enablePersistence,
      ...options
    };
    
    // Apply middleware
    const processedState = this.middleware.applyMiddleware('beforeReset', initialState);
    
    // Get all paths in current state
    const allPaths = this._getAllPaths(this._state);
    
    // Update the state
    this._state = this._clone(processedState);
    
    // Apply middleware after reset
    this.middleware.applyMiddleware('afterReset', this._state);
    
    this._log('State reset to:', this._state);
    
    // Persist state if enabled
    if (resetOptions.persist && this.options.enablePersistence) {
      this.persistence.save(this._state);
    }
    
    // Emit reset event
    this.emit('reset', this._clone(this._state));
    
    // Notify subscribers if not silent
    if (!resetOptions.silent) {
      this._notifySubscribers(allPaths);
    }
    
    return this._clone(this._state);
  }
  
  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback function
   * @param {string|string[]} [paths] - Specific state path(s) to subscribe to
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback, paths) {
    logger.debug('subscribe called with paths:', paths);
    
    if (typeof callback !== 'function') {
      const error = new Error('Subscriber callback must be a function');
      logger.error('Subscribe error:', error);
      throw error;
    }
    
    // If no paths specified, subscribe to all state changes
    if (paths === undefined) {
      this._globalSubscribers.push(callback);
      this._log('Added global subscriber');
      logger.debug('Added global subscriber');
      
      // Return unsubscribe function
      return () => {
        const index = this._globalSubscribers.indexOf(callback);
        if (index !== -1) {
          this._globalSubscribers.splice(index, 1);
          this._log('Removed global subscriber');
          logger.debug('Removed global subscriber');
        }
      };
    }
    
    // Handle array of paths or single path
    const pathArray = Array.isArray(paths) ? paths : [paths];
    
    // Normalize paths (convert dot notation to arrays)
    const normalizedPaths = pathArray.map(path =>
      typeof path === 'string' ? path.split('.') : path
    );
    
    logger.debug('Normalized paths:', normalizedPaths.map(p => Array.isArray(p) ? p.join('.') : p));
    
    // Add subscriber for each path
    normalizedPaths.forEach(path => {
      const pathKey = Array.isArray(path) ? path.join('.') : path;
      
      if (!this._subscribers.has(pathKey)) {
        this._subscribers.set(pathKey, []);
      }
      
      this._subscribers.get(pathKey).push(callback);
      this._log(`Added subscriber for path: ${pathKey}`);
      logger.debug(`Added subscriber for path: ${pathKey}`);
    });
    
    // Return unsubscribe function
    return () => {
      normalizedPaths.forEach(path => {
        const pathKey = Array.isArray(path) ? path.join('.') : path;
        const subscribers = this._subscribers.get(pathKey);
        
        if (subscribers) {
          const index = subscribers.indexOf(callback);
          if (index !== -1) {
            subscribers.splice(index, 1);
            this._log(`Removed subscriber for path: ${pathKey}`);
            logger.debug(`Removed subscriber for path: ${pathKey}`);
          }
        }
      });
    };
  }
  
  /**
   * Unsubscribe a callback from all subscriptions
   * @param {Function} callback - The callback to unsubscribe
   */
  unsubscribe(callback) {
    // Remove from global subscribers
    const globalIndex = this._globalSubscribers.indexOf(callback);
    if (globalIndex !== -1) {
      this._globalSubscribers.splice(globalIndex, 1);
      this._log('Removed global subscriber');
    }
    
    // Remove from path-specific subscribers
    this._subscribers.forEach((subscribers, path) => {
      const index = subscribers.indexOf(callback);
      if (index !== -1) {
        subscribers.splice(index, 1);
        this._log(`Removed subscriber for path: ${path}`);
      }
    });
  }
  
  /**
   * Add middleware to the state manager
   * @param {string} type - Middleware type ('beforeUpdate', 'afterUpdate', 'beforeReset', 'afterReset')
   * @param {Function} middleware - Middleware function
   * @returns {Function} Function to remove the middleware
   */
  use(type, middleware) {
    return this.middleware.use(type, middleware);
  }
  
  /**
   * Create a selector function that memoizes the result
   * @param {Function} selectorFn - Selector function that takes the state and returns a derived value
   * @param {Function} [equalityFn] - Function to compare previous and current results
   * @returns {Function} Memoized selector function
   */
  createSelector(selectorFn, equalityFn = (a, b) => a === b) {
    let lastState = null;
    let lastResult = null;
    
    return (...args) => {
      const state = this.getState();
      
      // If state hasn't changed, return memoized result
      if (lastState && this._shallowEqual(state, lastState)) {
        return lastResult;
      }
      
      // Calculate new result
      const result = selectorFn(state, ...args);
      
      // If result is equal to last result, return last result
      if (lastResult !== null && equalityFn(result, lastResult)) {
        return lastResult;
      }
      
      // Update memoized values
      lastState = state;
      lastResult = result;
      
      return result;
    };
  }
  
  /**
   * Notify subscribers of state changes
   * @param {string[]} changedPaths - Paths that changed
   * @private
   */
  _notifySubscribers(changedPaths) {
    this._log('Notifying subscribers for paths:', changedPaths);
    logger.debug('Notifying subscribers for paths:', changedPaths);
    
    // Set to track which subscribers have been notified
    const notifiedSubscribers = new Set();
    
    // First notify path-specific subscribers
    changedPaths.forEach(path => {
      // Convert array path to string
      const pathKey = Array.isArray(path) ? path.join('.') : path;
      
      // Get subscribers for this exact path
      const exactSubscribers = this._subscribers.get(pathKey);
      if (exactSubscribers && exactSubscribers.length > 0) {
        this._log(`Notifying ${exactSubscribers.length} subscribers for exact path: ${pathKey}`);
        logger.debug(`Notifying ${exactSubscribers.length} subscribers for exact path: ${pathKey}`);
        
        exactSubscribers.forEach(callback => {
          if (!notifiedSubscribers.has(callback)) {
            try {
              const value = this.getState(pathKey);
              callback(value, pathKey, this._clone(this._state));
              notifiedSubscribers.add(callback);
            } catch (error) {
              logger.error(`Error in subscriber callback for path ${pathKey}:`, error);
              console.error(`Error in subscriber callback for path ${pathKey}:`, error);
            }
          }
        });
      }
      
      // Also notify subscribers of parent paths
      if (typeof pathKey === 'string' && pathKey.includes('.')) {
        const parts = pathKey.split('.');
        
        for (let i = 1; i < parts.length; i++) {
          const parentPath = parts.slice(0, -i).join('.');
          const parentSubscribers = this._subscribers.get(parentPath);
          
          if (parentSubscribers && parentSubscribers.length > 0) {
            this._log(`Notifying ${parentSubscribers.length} subscribers for parent path: ${parentPath}`);
            logger.debug(`Notifying ${parentSubscribers.length} subscribers for parent path: ${parentPath}`);
            
            parentSubscribers.forEach(callback => {
              if (!notifiedSubscribers.has(callback)) {
                try {
                  const value = this.getState(parentPath);
                  callback(value, parentPath, this._clone(this._state));
                  notifiedSubscribers.add(callback);
                } catch (error) {
                  logger.error(`Error in subscriber callback for parent path ${parentPath}:`, error);
                  console.error(`Error in subscriber callback for parent path ${parentPath}:`, error);
                }
              }
            });
          }
        }
      }
    });
    
    // Then notify global subscribers
    if (this._globalSubscribers.length > 0) {
      this._log(`Notifying ${this._globalSubscribers.length} global subscribers`);
      logger.debug(`Notifying ${this._globalSubscribers.length} global subscribers`);
      
      this._globalSubscribers.forEach(callback => {
        if (!notifiedSubscribers.has(callback)) {
          try {
            callback(this._clone(this._state), changedPaths);
          } catch (error) {
            logger.error('Error in global subscriber callback:', error);
            console.error('Error in global subscriber callback:', error);
          }
        }
      });
    }
  }
  
  /**
   * Get a nested value from an object using a path array
   * @param {Object} obj - Object to get value from
   * @param {string[]} path - Path to the value
   * @returns {any} The value at the path
   * @private
   */
  _getNestedValue(obj, path) {
    let current = obj;
    
    for (let i = 0; i < path.length; i++) {
      if (current === null || current === undefined) {
        return undefined;
      }
      
      current = current[path[i]];
    }
    
    return this._clone(current);
  }
  
  /**
   * Set a nested value in an object using a path array
   * @param {Object} obj - Object to set value in
   * @param {string[]} path - Path to the value
   * @param {any} value - Value to set
   * @returns {Object} New object with the value set
   * @private
   */
  _setNestedValue(obj, path, value) {
    // Clone the object to avoid mutations
    const result = this._clone(obj);
    
    if (path.length === 0) {
      return value;
    }
    
    let current = result;
    
    // Navigate to the parent of the property to set
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      
      // If the current key doesn't exist or is not an object, create it
      if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
        current[key] = {};
      }
      
      current = current[key];
    }
    
    // Set the value at the final key
    const lastKey = path[path.length - 1];
    current[lastKey] = this._clone(value);
    
    return result;
  }
  
  /**
   * Merge two objects deeply
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @param {string} currentPath - Current path (for tracking changes)
   * @param {string[]} changedPaths - Array to collect changed paths
   * @returns {Object} Merged object
   * @private
   */
  _merge(target, source, currentPath = '', changedPaths = []) {
    // If source is not an object or is null, replace target
    if (source === null || typeof source !== 'object' || Array.isArray(source)) {
      // Check if the value has changed
      if (!this._deepEqual(target, source)) {
        changedPaths.push(currentPath);
      }
      return this._clone(source);
    }
    
    // Clone the target to avoid mutations
    const result = this._clone(target) || {};
    
    // Merge properties from source
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceProp = source[key];
        const targetProp = result[key];
        const propPath = currentPath ? `${currentPath}.${key}` : key;
        
        // If target property is an object and source property is an object, merge recursively
        if (
          targetProp !== null && 
          typeof targetProp === 'object' && 
          !Array.isArray(targetProp) &&
          sourceProp !== null && 
          typeof sourceProp === 'object' && 
          !Array.isArray(sourceProp)
        ) {
          result[key] = this._merge(targetProp, sourceProp, propPath, changedPaths);
        } else {
          // Otherwise, replace the target property
          if (!this._deepEqual(targetProp, sourceProp)) {
            changedPaths.push(propPath);
          }
          result[key] = this._clone(sourceProp);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Get all paths in an object
   * @param {Object} obj - Object to get paths from
   * @param {string} [currentPath=''] - Current path
   * @param {string[]} [paths=[]] - Array to collect paths
   * @returns {string[]} Array of paths
   * @private
   */
  _getAllPaths(obj, currentPath = '', paths = []) {
    // If not an object or null, add the current path
    if (obj === null || typeof obj !== 'object') {
      if (currentPath) {
        paths.push(currentPath);
      }
      return paths;
    }
    
    // Add the current path if it's not empty
    if (currentPath) {
      paths.push(currentPath);
    }
    
    // Recursively get paths for all properties
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const propPath = currentPath ? `${currentPath}.${key}` : key;
        this._getAllPaths(obj[key], propPath, paths);
      }
    }
    
    return paths;
  }
  
  /**
   * Clone an object or value
   * @param {any} value - Value to clone
   * @returns {any} Cloned value
   * @private
   */
  _clone(value) {
    // If not using immutable state, return the value as is
    if (!this.options.immutable) {
      return value;
    }
    
    // Handle null and undefined
    if (value === null || value === undefined) {
      return value;
    }
    
    // Handle primitive types
    if (typeof value !== 'object') {
      return value;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => this._clone(item));
    }
    
    // Handle dates
    if (value instanceof Date) {
      return new Date(value);
    }
    
    // Handle regular expressions
    if (value instanceof RegExp) {
      return new RegExp(value.source, value.flags);
    }
    
    // Handle objects
    const result = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[key] = this._clone(value[key]);
      }
    }
    
    return result;
  }
  
  /**
   * Check if two values are deeply equal
   * @param {any} a - First value
   * @param {any} b - Second value
   * @returns {boolean} Whether the values are equal
   * @private
   */
  _deepEqual(a, b) {
    // Handle identical values
    if (a === b) {
      return true;
    }
    
    // Handle null and undefined
    if (a === null || b === null || a === undefined || b === undefined) {
      return a === b;
    }
    
    // Handle primitive types
    if (typeof a !== 'object' || typeof b !== 'object') {
      return a === b;
    }
    
    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      
      for (let i = 0; i < a.length; i++) {
        if (!this._deepEqual(a[i], b[i])) {
          return false;
        }
      }
      
      return true;
    }
    
    // Handle dates
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }
    
    // Handle regular expressions
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.source === b.source && a.flags === b.flags;
    }
    
    // Handle objects
    if (!Array.isArray(a) && !Array.isArray(b)) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) {
        return false;
      }
      
      for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) {
          return false;
        }
        
        if (!this._deepEqual(a[key], b[key])) {
          return false;
        }
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if two objects are shallowly equal
   * @param {Object} a - First object
   * @param {Object} b - Second object
   * @returns {boolean} Whether the objects are equal
   * @private
   */
  _shallowEqual(a, b) {
    if (a === b) {
      return true;
    }
    
    if (a === null || b === null || a === undefined || b === undefined) {
      return a === b;
    }
    
    if (typeof a !== 'object' || typeof b !== 'object') {
      return a === b;
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) {
      return false;
    }
    
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key) || a[key] !== b[key]) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Log debug messages if debug is enabled
   * @private
   */
  _log(...args) {
    if (this.options.debug) {
      console.log('[StateManager]', ...args);
    }
  }
}

/**
 * Create a new StateManager
 * @param {Object} initialState - Initial state
 * @param {Object} options - Configuration options
 * @returns {StateManager} StateManager instance
 */
export function createStateManager(initialState = {}, options = {}) {
  logger.debug('Creating state manager with options:', options);
  return new StateManager(initialState, options);
}

// Create a default instance
logger.info('Creating default state manager instance');
export const defaultStateManager = createStateManager({}, {
  enablePersistence: true,
  persistenceKey: 'app_state',
  debug: false
});

// Export the StateManager class
export { StateManager };

// Export utilities
export { createPersistenceManager } from './persistence.js';
export { createWebComponentIntegration, StateMixin, createConnectedComponent } from './web-components.js';
export { createMiddlewareManager } from './middleware.js';
export { StoreConnector, createStore } from './store-connector.js';

// Default export
export default defaultStateManager;