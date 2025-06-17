/**
 * Browser-native EventEmitter implementation
 * 
 * This provides a simple EventEmitter implementation using the browser's
 * native EventTarget API, eliminating the need for the eventemitter3 dependency.
 */

/**
 * Custom EventEmitter class using browser's native EventTarget
 */
export class EventEmitter {
  constructor() {
    this._eventTarget = new EventTarget();
    this._listeners = new Map();
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   * @returns {this} This instance for chaining
   */
  on(event, listener) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    
    const listeners = this._listeners.get(event);
    listeners.add(listener);
    
    const eventListener = (e) => {
      listener(...e.detail);
    };
    
    // Store the mapping between the original listener and the event listener
    listener._eventListener = eventListener;
    
    this._eventTarget.addEventListener(event, eventListener);
    
    return this;
  }

  /**
   * Add a one-time event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   * @returns {this} This instance for chaining
   */
  once(event, listener) {
    const onceListener = (...args) => {
      this.off(event, onceListener);
      listener(...args);
    };
    
    return this.on(event, onceListener);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   * @returns {this} This instance for chaining
   */
  off(event, listener) {
    if (!this._listeners.has(event)) {
      return this;
    }
    
    const listeners = this._listeners.get(event);
    
    if (listeners.has(listener)) {
      listeners.delete(listener);
      
      // Get the mapped event listener
      const eventListener = listener._eventListener;
      
      if (eventListener) {
        this._eventTarget.removeEventListener(event, eventListener);
      }
    }
    
    return this;
  }

  /**
   * Remove all listeners for an event
   * @param {string} [event] - Event name (optional, if not provided, removes all listeners)
   * @returns {this} This instance for chaining
   */
  removeAllListeners(event) {
    if (event) {
      if (this._listeners.has(event)) {
        const listeners = this._listeners.get(event);
        
        for (const listener of listeners) {
          const eventListener = listener._eventListener;
          
          if (eventListener) {
            this._eventTarget.removeEventListener(event, eventListener);
          }
        }
        
        this._listeners.delete(event);
      }
    } else {
      // Remove all listeners for all events
      for (const [event, listeners] of this._listeners.entries()) {
        for (const listener of listeners) {
          const eventListener = listener._eventListener;
          
          if (eventListener) {
            this._eventTarget.removeEventListener(event, eventListener);
          }
        }
      }
      
      this._listeners.clear();
    }
    
    return this;
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   * @returns {boolean} Whether the event had listeners
   */
  emit(event, ...args) {
    const customEvent = new CustomEvent(event, {
      detail: args
    });
    
    this._eventTarget.dispatchEvent(customEvent);
    
    return this._listeners.has(event) && this._listeners.get(event).size > 0;
  }

  /**
   * Get the number of listeners for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    if (!this._listeners.has(event)) {
      return 0;
    }
    
    return this._listeners.get(event).size;
  }

  /**
   * Get the event names with listeners
   * @returns {string[]} Event names
   */
  eventNames() {
    return Array.from(this._listeners.keys());
  }
}

export default EventEmitter;