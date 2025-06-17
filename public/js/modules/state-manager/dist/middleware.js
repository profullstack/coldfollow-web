/**
 * Middleware Manager for State Manager
 * 
 * Provides middleware functionality for intercepting and modifying state updates.
 */

/**
 * Create a middleware manager
 * @returns {Object} Middleware manager
 */
export function createMiddlewareManager() {
  // Middleware arrays for different types
  const middleware = {
    beforeUpdate: [],
    afterUpdate: [],
    beforeReset: [],
    afterReset: []
  };
  
  /**
   * Add middleware
   * @param {string} type - Middleware type ('beforeUpdate', 'afterUpdate', 'beforeReset', 'afterReset')
   * @param {Function} fn - Middleware function
   * @returns {Function} Function to remove the middleware
   */
  function use(type, fn) {
    if (!middleware[type]) {
      throw new Error(`Invalid middleware type: ${type}`);
    }
    
    if (typeof fn !== 'function') {
      throw new Error('Middleware must be a function');
    }
    
    middleware[type].push(fn);
    
    // Return function to remove the middleware
    return () => {
      const index = middleware[type].indexOf(fn);
      if (index !== -1) {
        middleware[type].splice(index, 1);
      }
    };
  }
  
  /**
   * Apply middleware
   * @param {string} type - Middleware type
   * @param {any} value - Value to pass to middleware
   * @param {any} [extra] - Extra data to pass to middleware
   * @returns {any} Result of applying middleware
   */
  function applyMiddleware(type, value, extra) {
    if (!middleware[type]) {
      throw new Error(`Invalid middleware type: ${type}`);
    }
    
    // Apply middleware functions in sequence
    return middleware[type].reduce((result, fn) => {
      try {
        return fn(result, extra);
      } catch (error) {
        console.error(`Error in ${type} middleware:`, error);
        return result;
      }
    }, value);
  }
  
  /**
   * Get middleware count
   * @param {string} [type] - Middleware type (optional)
   * @returns {number|Object} Middleware count
   */
  function getMiddlewareCount(type) {
    if (type) {
      return middleware[type] ? middleware[type].length : 0;
    }
    
    // Return counts for all types
    const counts = {};
    for (const [type, middlewareArray] of Object.entries(middleware)) {
      counts[type] = middlewareArray.length;
    }
    
    return counts;
  }
  
  /**
   * Clear middleware
   * @param {string} [type] - Middleware type (optional)
   */
  function clearMiddleware(type) {
    if (type) {
      if (!middleware[type]) {
        throw new Error(`Invalid middleware type: ${type}`);
      }
      
      middleware[type] = [];
      return;
    }
    
    // Clear all middleware
    for (const type in middleware) {
      middleware[type] = [];
    }
  }
  
  // Return the middleware manager
  return {
    use,
    applyMiddleware,
    getMiddlewareCount,
    clearMiddleware
  };
}

/**
 * Create a logger middleware
 * @param {Object} options - Logger options
 * @param {boolean} options.logBefore - Whether to log before updates (default: true)
 * @param {boolean} options.logAfter - Whether to log after updates (default: true)
 * @param {Function} options.logger - Logger function (default: console.log)
 * @returns {Object} Logger middleware
 */
export function createLoggerMiddleware(options = {}) {
  // Default options
  const config = {
    logBefore: true,
    logAfter: true,
    logger: console.log,
    ...options
  };
  
  /**
   * Before update middleware
   * @param {Object} update - Update object
   * @param {Object} state - Current state
   * @returns {Object} Update object
   */
  function beforeUpdate(update, state) {
    if (config.logBefore) {
      config.logger('[StateManager] Before update:', {
        currentState: state,
        update
      });
    }
    
    return update;
  }
  
  /**
   * After update middleware
   * @param {Object} state - New state
   * @param {string[]} changedPaths - Changed paths
   * @returns {Object} New state
   */
  function afterUpdate(state, changedPaths) {
    if (config.logAfter) {
      config.logger('[StateManager] After update:', {
        newState: state,
        changedPaths
      });
    }
    
    return state;
  }
  
  /**
   * Before reset middleware
   * @param {Object} initialState - Initial state
   * @returns {Object} Initial state
   */
  function beforeReset(initialState) {
    if (config.logBefore) {
      config.logger('[StateManager] Before reset:', {
        initialState
      });
    }
    
    return initialState;
  }
  
  /**
   * After reset middleware
   * @param {Object} state - New state
   * @returns {Object} New state
   */
  function afterReset(state) {
    if (config.logAfter) {
      config.logger('[StateManager] After reset:', {
        newState: state
      });
    }
    
    return state;
  }
  
  // Return middleware functions
  return {
    beforeUpdate,
    afterUpdate,
    beforeReset,
    afterReset
  };
}

/**
 * Create a persistence middleware
 * @param {Object} persistenceManager - Persistence manager
 * @returns {Object} Persistence middleware
 */
export function createPersistenceMiddleware(persistenceManager) {
  /**
   * After update middleware
   * @param {Object} state - New state
   * @returns {Object} New state
   */
  function afterUpdate(state) {
    // Save state to persistence
    persistenceManager.save(state);
    return state;
  }
  
  /**
   * After reset middleware
   * @param {Object} state - New state
   * @returns {Object} New state
   */
  function afterReset(state) {
    // Save state to persistence
    persistenceManager.save(state);
    return state;
  }
  
  // Return middleware functions
  return {
    afterUpdate,
    afterReset
  };
}

/**
 * Create a validation middleware
 * @param {Object} schema - Validation schema
 * @param {Function} validator - Validation function
 * @returns {Object} Validation middleware
 */
export function createValidationMiddleware(schema, validator) {
  /**
   * Before update middleware
   * @param {Object} update - Update object
   * @param {Object} state - Current state
   * @returns {Object} Update object
   */
  function beforeUpdate(update, state) {
    // Create a preview of the new state
    const newState = { ...state, ...update };
    
    // Validate the new state
    const isValid = validator(newState, schema);
    
    if (!isValid) {
      console.error('[StateManager] Validation failed:', validator.errors);
      throw new Error('State validation failed');
    }
    
    return update;
  }
  
  /**
   * Before reset middleware
   * @param {Object} initialState - Initial state
   * @returns {Object} Initial state
   */
  function beforeReset(initialState) {
    // Validate the initial state
    const isValid = validator(initialState, schema);
    
    if (!isValid) {
      console.error('[StateManager] Validation failed:', validator.errors);
      throw new Error('State validation failed');
    }
    
    return initialState;
  }
  
  // Return middleware functions
  return {
    beforeUpdate,
    beforeReset
  };
}

/**
 * Create a throttle middleware
 * @param {number} wait - Throttle wait time in milliseconds
 * @returns {Object} Throttle middleware
 */
export function createThrottleMiddleware(wait = 100) {
  let lastUpdateTime = 0;
  let pendingUpdate = null;
  let updateTimeout = null;
  
  /**
   * Before update middleware
   * @param {Object} update - Update object
   * @param {Object} state - Current state
   * @returns {Object} Update object
   */
  function beforeUpdate(update, state) {
    const now = Date.now();
    
    // If enough time has passed since the last update, allow this update
    if (now - lastUpdateTime >= wait) {
      lastUpdateTime = now;
      return update;
    }
    
    // Otherwise, store the update and return an empty object
    pendingUpdate = { ...pendingUpdate, ...update };
    
    // Set a timeout to apply the pending update
    if (!updateTimeout) {
      updateTimeout = setTimeout(() => {
        // Apply the pending update
        if (pendingUpdate) {
          // This will trigger another state update
          // The state manager instance needs to be passed to this middleware
          // for this to work properly
          state.setState(pendingUpdate);
          pendingUpdate = null;
        }
        
        updateTimeout = null;
      }, wait - (now - lastUpdateTime));
    }
    
    // Return an empty object to prevent the current update
    return {};
  }
  
  // Return middleware functions
  return {
    beforeUpdate
  };
}

/**
 * Create a debounce middleware
 * @param {number} wait - Debounce wait time in milliseconds
 * @returns {Object} Debounce middleware
 */
export function createDebounceMiddleware(wait = 100) {
  let debounceTimeout = null;
  let pendingUpdate = null;
  
  /**
   * Before update middleware
   * @param {Object} update - Update object
   * @param {Object} state - Current state
   * @returns {Object} Update object
   */
  function beforeUpdate(update, state) {
    // Clear any existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // Store the update
    pendingUpdate = { ...pendingUpdate, ...update };
    
    // Set a timeout to apply the pending update
    debounceTimeout = setTimeout(() => {
      // Apply the pending update
      if (pendingUpdate) {
        // This will trigger another state update
        // The state manager instance needs to be passed to this middleware
        // for this to work properly
        state.setState(pendingUpdate);
        pendingUpdate = null;
      }
      
      debounceTimeout = null;
    }, wait);
    
    // Return an empty object to prevent the current update
    return {};
  }
  
  // Return middleware functions
  return {
    beforeUpdate
  };
}

export default createMiddlewareManager;