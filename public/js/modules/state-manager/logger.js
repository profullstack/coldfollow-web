/**
 * Logger utility for state-manager module
 * 
 * This provides consistent logging to help with debugging.
 * It wraps console methods with module name prefixing and optional log levels.
 */

/**
 * Create a logger instance for a specific component
 * @param {string} componentName - Name of the component using this logger
 * @returns {Object} - Logger object with log, info, warn, error, debug methods
 */
export function createLogger(componentName) {
  // Get log level from environment or default to 'info'
  const LOG_LEVEL = (typeof process !== 'undefined' && process.env && process.env.LOG_LEVEL) || 
                    (typeof localStorage !== 'undefined' && localStorage.getItem('LOG_LEVEL')) || 
                    'info';
  
  // Log levels and their priorities
  const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    log: 3,
    debug: 4
  };

  // Current log level priority
  const currentLevelPriority = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;
  
  // Module name for all logs from this module
  const MODULE_NAME = 'state-manager';
  
  /**
   * Generic log function that prefixes the module name
   * @param {string} level - Log level (log, info, warn, error, debug)
   * @param {Array} args - Arguments to log
   */
  function logWithLevel(level, ...args) {
    // Check if this level should be logged based on current log level
    if (LOG_LEVELS[level] <= currentLevelPriority) {
      const prefix = componentName 
        ? `[${MODULE_NAME}:${componentName}]` 
        : `[${MODULE_NAME}]`;
      console[level](prefix, ...args);
    }
  }
  
  // Return logger object with methods for each log level
  return {
    log: (...args) => logWithLevel('log', ...args),
    info: (...args) => logWithLevel('info', ...args),
    warn: (...args) => logWithLevel('warn', ...args),
    error: (...args) => logWithLevel('error', ...args),
    debug: (...args) => logWithLevel('debug', ...args),
    
    // Track method calls and execution times
    trackMethod: (methodName, method) => {
      return function(...args) {
        const startTime = performance.now();
        logWithLevel('debug', `${methodName} called with:`, ...args);
        
        try {
          const result = method.apply(this, args);
          
          // Handle promises
          if (result instanceof Promise) {
            return result.then(value => {
              const endTime = performance.now();
              logWithLevel('debug', `${methodName} completed in ${endTime - startTime}ms`);
              return value;
            }).catch(error => {
              logWithLevel('error', `${methodName} failed:`, error);
              throw error;
            });
          }
          
          const endTime = performance.now();
          logWithLevel('debug', `${methodName} completed in ${endTime - startTime}ms`);
          return result;
        } catch (error) {
          logWithLevel('error', `${methodName} failed:`, error);
          throw error;
        }
      };
    }
  };
}

// Create a default logger for the module
const logger = createLogger();

export default logger;