/**
 * Tests for middleware manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  createMiddlewareManager, 
  createLoggerMiddleware,
  createPersistenceMiddleware,
  createValidationMiddleware,
  createThrottleMiddleware,
  createDebounceMiddleware
} from '../src/middleware.js';

describe('MiddlewareManager', () => {
  let middlewareManager;
  
  beforeEach(() => {
    middlewareManager = createMiddlewareManager();
  });
  
  describe('use', () => {
    it('should add middleware to the specified type', () => {
      const middleware = () => {};
      
      middlewareManager.use('beforeUpdate', middleware);
      
      expect(middlewareManager.getMiddlewareCount('beforeUpdate')).toBe(1);
    });
    
    it('should throw an error for invalid middleware type', () => {
      const middleware = () => {};
      
      expect(() => {
        middlewareManager.use('invalidType', middleware);
      }).toThrow('Invalid middleware type: invalidType');
    });
    
    it('should throw an error if middleware is not a function', () => {
      expect(() => {
        middlewareManager.use('beforeUpdate', {});
      }).toThrow('Middleware must be a function');
    });
    
    it('should return a function to remove the middleware', () => {
      const middleware = () => {};
      
      const remove = middlewareManager.use('beforeUpdate', middleware);
      expect(middlewareManager.getMiddlewareCount('beforeUpdate')).toBe(1);
      
      remove();
      expect(middlewareManager.getMiddlewareCount('beforeUpdate')).toBe(0);
    });
  });
  
  describe('applyMiddleware', () => {
    it('should apply middleware to the value', () => {
      const middleware1 = vi.fn(value => value + 1);
      const middleware2 = vi.fn(value => value * 2);
      
      middlewareManager.use('beforeUpdate', middleware1);
      middlewareManager.use('beforeUpdate', middleware2);
      
      const result = middlewareManager.applyMiddleware('beforeUpdate', 1);
      
      expect(middleware1).toHaveBeenCalledWith(1, undefined);
      expect(middleware2).toHaveBeenCalledWith(2, undefined);
      expect(result).toBe(4);
    });
    
    it('should pass extra data to middleware', () => {
      const middleware = vi.fn((value, extra) => {
        return { ...value, extra };
      });
      
      middlewareManager.use('beforeUpdate', middleware);
      
      const result = middlewareManager.applyMiddleware(
        'beforeUpdate', 
        { value: 1 }, 
        { data: 'extra' }
      );
      
      expect(middleware).toHaveBeenCalledWith({ value: 1 }, { data: 'extra' });
      expect(result).toEqual({ value: 1, extra: { data: 'extra' } });
    });
    
    it('should handle errors in middleware', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const middleware1 = vi.fn(value => {
        throw new Error('Middleware error');
      });
      
      const middleware2 = vi.fn(value => value * 2);
      
      middlewareManager.use('beforeUpdate', middleware1);
      middlewareManager.use('beforeUpdate', middleware2);
      
      const result = middlewareManager.applyMiddleware('beforeUpdate', 1);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(middleware2).toHaveBeenCalledWith(1, undefined);
      expect(result).toBe(2);
      
      consoleErrorSpy.mockRestore();
    });
    
    it('should throw an error for invalid middleware type', () => {
      expect(() => {
        middlewareManager.applyMiddleware('invalidType', {});
      }).toThrow('Invalid middleware type: invalidType');
    });
  });
  
  describe('getMiddlewareCount', () => {
    it('should return the count for a specific type', () => {
      const middleware1 = () => {};
      const middleware2 = () => {};
      
      middlewareManager.use('beforeUpdate', middleware1);
      middlewareManager.use('beforeUpdate', middleware2);
      middlewareManager.use('afterUpdate', middleware1);
      
      expect(middlewareManager.getMiddlewareCount('beforeUpdate')).toBe(2);
      expect(middlewareManager.getMiddlewareCount('afterUpdate')).toBe(1);
      expect(middlewareManager.getMiddlewareCount('beforeReset')).toBe(0);
    });
    
    it('should return counts for all types when no type is specified', () => {
      const middleware1 = () => {};
      const middleware2 = () => {};
      
      middlewareManager.use('beforeUpdate', middleware1);
      middlewareManager.use('beforeUpdate', middleware2);
      middlewareManager.use('afterUpdate', middleware1);
      
      const counts = middlewareManager.getMiddlewareCount();
      
      expect(counts).toEqual({
        beforeUpdate: 2,
        afterUpdate: 1,
        beforeReset: 0,
        afterReset: 0
      });
    });
  });
  
  describe('clearMiddleware', () => {
    it('should clear middleware for a specific type', () => {
      const middleware1 = () => {};
      const middleware2 = () => {};
      
      middlewareManager.use('beforeUpdate', middleware1);
      middlewareManager.use('beforeUpdate', middleware2);
      middlewareManager.use('afterUpdate', middleware1);
      
      middlewareManager.clearMiddleware('beforeUpdate');
      
      expect(middlewareManager.getMiddlewareCount('beforeUpdate')).toBe(0);
      expect(middlewareManager.getMiddlewareCount('afterUpdate')).toBe(1);
    });
    
    it('should clear all middleware when no type is specified', () => {
      const middleware1 = () => {};
      const middleware2 = () => {};
      
      middlewareManager.use('beforeUpdate', middleware1);
      middlewareManager.use('beforeUpdate', middleware2);
      middlewareManager.use('afterUpdate', middleware1);
      middlewareManager.use('beforeReset', middleware2);
      
      middlewareManager.clearMiddleware();
      
      expect(middlewareManager.getMiddlewareCount('beforeUpdate')).toBe(0);
      expect(middlewareManager.getMiddlewareCount('afterUpdate')).toBe(0);
      expect(middlewareManager.getMiddlewareCount('beforeReset')).toBe(0);
      expect(middlewareManager.getMiddlewareCount('afterReset')).toBe(0);
    });
    
    it('should throw an error for invalid middleware type', () => {
      expect(() => {
        middlewareManager.clearMiddleware('invalidType');
      }).toThrow('Invalid middleware type: invalidType');
    });
  });
});

describe('LoggerMiddleware', () => {
  let loggerMiddleware;
  let loggerSpy;
  
  beforeEach(() => {
    loggerSpy = vi.fn();
    loggerMiddleware = createLoggerMiddleware({
      logger: loggerSpy
    });
  });
  
  it('should log before updates', () => {
    const update = { value: 1 };
    const state = { value: 0 };
    
    const result = loggerMiddleware.beforeUpdate(update, state);
    
    expect(loggerSpy).toHaveBeenCalledWith('[StateManager] Before update:', {
      currentState: state,
      update
    });
    expect(result).toBe(update);
  });
  
  it('should log after updates', () => {
    const state = { value: 1 };
    const changedPaths = ['value'];
    
    const result = loggerMiddleware.afterUpdate(state, changedPaths);
    
    expect(loggerSpy).toHaveBeenCalledWith('[StateManager] After update:', {
      newState: state,
      changedPaths
    });
    expect(result).toBe(state);
  });
  
  it('should log before resets', () => {
    const initialState = { value: 0 };
    
    const result = loggerMiddleware.beforeReset(initialState);
    
    expect(loggerSpy).toHaveBeenCalledWith('[StateManager] Before reset:', {
      initialState
    });
    expect(result).toBe(initialState);
  });
  
  it('should log after resets', () => {
    const state = { value: 0 };
    
    const result = loggerMiddleware.afterReset(state);
    
    expect(loggerSpy).toHaveBeenCalledWith('[StateManager] After reset:', {
      newState: state
    });
    expect(result).toBe(state);
  });
  
  it('should not log when disabled', () => {
    loggerMiddleware = createLoggerMiddleware({
      logBefore: false,
      logAfter: false,
      logger: loggerSpy
    });
    
    loggerMiddleware.beforeUpdate({ value: 1 }, { value: 0 });
    loggerMiddleware.afterUpdate({ value: 1 }, ['value']);
    
    expect(loggerSpy).not.toHaveBeenCalled();
  });
});

describe('PersistenceMiddleware', () => {
  it('should save state after updates', () => {
    const persistenceManager = {
      save: vi.fn()
    };
    
    const persistenceMiddleware = createPersistenceMiddleware(persistenceManager);
    
    const state = { value: 1 };
    const result = persistenceMiddleware.afterUpdate(state);
    
    expect(persistenceManager.save).toHaveBeenCalledWith(state);
    expect(result).toBe(state);
  });
  
  it('should save state after resets', () => {
    const persistenceManager = {
      save: vi.fn()
    };
    
    const persistenceMiddleware = createPersistenceMiddleware(persistenceManager);
    
    const state = { value: 0 };
    const result = persistenceMiddleware.afterReset(state);
    
    expect(persistenceManager.save).toHaveBeenCalledWith(state);
    expect(result).toBe(state);
  });
});

describe('ValidationMiddleware', () => {
  it('should validate state before updates', () => {
    const schema = {
      type: 'object',
      properties: {
        value: { type: 'number' }
      }
    };
    
    const validator = vi.fn().mockReturnValue(true);
    validator.errors = null;
    
    const validationMiddleware = createValidationMiddleware(schema, validator);
    
    const update = { value: 1 };
    const state = { value: 0 };
    
    const result = validationMiddleware.beforeUpdate(update, state);
    
    expect(validator).toHaveBeenCalledWith({ value: 1 }, schema);
    expect(result).toBe(update);
  });
  
  it('should throw an error if validation fails', () => {
    const schema = {
      type: 'object',
      properties: {
        value: { type: 'number' }
      }
    };
    
    const validator = vi.fn().mockReturnValue(false);
    validator.errors = [{ message: 'Invalid value' }];
    
    const validationMiddleware = createValidationMiddleware(schema, validator);
    
    const update = { value: 'not a number' };
    const state = { value: 0 };
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      validationMiddleware.beforeUpdate(update, state);
    }).toThrow('State validation failed');
    
    expect(validator).toHaveBeenCalledWith({ value: 'not a number' }, schema);
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });
  
  it('should validate state before resets', () => {
    const schema = {
      type: 'object',
      properties: {
        value: { type: 'number' }
      }
    };
    
    const validator = vi.fn().mockReturnValue(true);
    validator.errors = null;
    
    const validationMiddleware = createValidationMiddleware(schema, validator);
    
    const initialState = { value: 0 };
    
    const result = validationMiddleware.beforeReset(initialState);
    
    expect(validator).toHaveBeenCalledWith(initialState, schema);
    expect(result).toBe(initialState);
  });
  
  it('should throw an error if reset validation fails', () => {
    const schema = {
      type: 'object',
      properties: {
        value: { type: 'number' }
      }
    };
    
    const validator = vi.fn().mockReturnValue(false);
    validator.errors = [{ message: 'Invalid value' }];
    
    const validationMiddleware = createValidationMiddleware(schema, validator);
    
    const initialState = { value: 'not a number' };
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      validationMiddleware.beforeReset(initialState);
    }).toThrow('State validation failed');
    
    expect(validator).toHaveBeenCalledWith(initialState, schema);
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });
});

// Note: Throttle and Debounce middleware tests would require timer mocking
// which is more complex. We'll add basic tests for them.

describe('ThrottleMiddleware', () => {
  it('should create a throttle middleware', () => {
    const throttleMiddleware = createThrottleMiddleware(100);
    
    expect(throttleMiddleware).toHaveProperty('beforeUpdate');
    expect(typeof throttleMiddleware.beforeUpdate).toBe('function');
  });
  
  it('should allow the first update through', () => {
    vi.useFakeTimers();
    
    const throttleMiddleware = createThrottleMiddleware(100);
    
    const update = { value: 1 };
    const state = { value: 0 };
    
    const result = throttleMiddleware.beforeUpdate(update, state);
    
    expect(result).toBe(update);
    
    vi.useRealTimers();
  });
});

describe('DebounceMiddleware', () => {
  it('should create a debounce middleware', () => {
    const debounceMiddleware = createDebounceMiddleware(100);
    
    expect(debounceMiddleware).toHaveProperty('beforeUpdate');
    expect(typeof debounceMiddleware.beforeUpdate).toBe('function');
  });
  
  it('should return an empty object for the first update', () => {
    vi.useFakeTimers();
    
    const debounceMiddleware = createDebounceMiddleware(100);
    
    const update = { value: 1 };
    const state = { 
      setState: vi.fn()
    };
    
    const result = debounceMiddleware.beforeUpdate(update, state);
    
    expect(result).toEqual({});
    
    vi.useRealTimers();
  });
});