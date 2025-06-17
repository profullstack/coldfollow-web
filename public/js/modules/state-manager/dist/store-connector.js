/**
 * StoreConnector
 *
 * A higher-order function that connects a component to a store.
 * This implementation is compatible with the usage in simple-counter.js.
 */

import defaultStateManager from './index.js';

/**
 * Create a store for state management
 * @param {string} name - Store name
 * @param {object} initialState - Initial state
 * @returns {object} Store object
 */
export function createStore(name, initialState = {}) {
  // Create a proxy to intercept property access and modification
  const state = new Proxy(initialState, {
    set(target, property, value) {
      const oldValue = target[property];
      target[property] = value;
      
      // Only notify if value actually changed
      if (oldValue !== value) {
        store.notify(property);
      }
      
      return true;
    }
  });
  
  // Subscribers for state changes
  const subscribers = new Set();
  
  // Store object
  const store = {
    name,
    state,
    
    // Subscribe to state changes
    subscribe(callback) {
      subscribers.add(callback);
      
      // Return unsubscribe function
      return () => {
        subscribers.delete(callback);
      };
    },
    
    // Notify subscribers of state changes
    notify(property) {
      subscribers.forEach(callback => {
        try {
          callback(state, property);
        } catch (error) {
          console.error(`Error in store subscriber callback:`, error);
        }
      });
    }
  };
  
  return store;
}

/**
 * StoreConnector function
 * Creates a mixin that connects a component to a store
 * @param {object} store - Store object
 * @returns {function} Mixin function
 */
export function StoreConnector(store) {
  return (BaseComponent) => {
    return class extends BaseComponent {
      constructor() {
        super();
        this._storeUnsubscribe = null;
        this._boundElements = new Map();
      }
      
      connectedCallback() {
        // Call the parent connectedCallback if it exists
        if (super.connectedCallback) {
          super.connectedCallback();
        }
        
        // Subscribe to store changes
        this._storeUnsubscribe = store.subscribe(this._handleStoreChange.bind(this));
      }
      
      disconnectedCallback() {
        // Unsubscribe from store changes
        if (this._storeUnsubscribe) {
          this._storeUnsubscribe();
          this._storeUnsubscribe = null;
        }
        
        // Call the parent disconnectedCallback if it exists
        if (super.disconnectedCallback) {
          super.disconnectedCallback();
        }
      }
      
      /**
       * Handle store changes
       * @param {object} state - Store state
       * @param {string} property - Changed property
       * @private
       */
      _handleStoreChange(state, property) {
        // Update bound elements
        this._updateBoundElements(property);
        
        // Call the component's connect method if it exists
        if (typeof this.connect === 'function') {
          this.connect(property, state);
        }
      }
      
      /**
       * Bind an element to a state property
       * @param {Element} element - Element to bind
       * @param {string} property - State property to bind to
       * @param {function} [formatter] - Optional formatter function
       */
      bindElement(element, property, formatter) {
        if (!element) return;
        
        this._boundElements.set(property, {
          element,
          formatter: formatter || (value => value)
        });
        
        // Initial update
        this._updateBoundElement(property);
      }
      
      /**
       * Update bound elements when state changes
       * @param {string} changedProperty - Changed property
       * @private
       */
      _updateBoundElements(changedProperty) {
        // Update specific property if provided
        if (changedProperty && this._boundElements.has(changedProperty)) {
          this._updateBoundElement(changedProperty);
          return;
        }
        
        // Otherwise update all bound elements
        for (const property of this._boundElements.keys()) {
          this._updateBoundElement(property);
        }
      }
      
      /**
       * Update a specific bound element
       * @param {string} property - Property to update
       * @private
       */
      _updateBoundElement(property) {
        const binding = this._boundElements.get(property);
        if (!binding) return;
        
        const { element, formatter } = binding;
        const value = store.state[property];
        
        // Update element content
        element.textContent = formatter(value);
      }
      
      /**
       * Connect to a specific state property
       * @param {string} property - Property to connect to
       * @param {function} callback - Callback function
       */
      connect(property, callback) {
        // Initial call with current state
        callback(store.state);
        
        // Store the connection for future updates
        if (!this._connections) {
          this._connections = new Map();
        }
        
        this._connections.set(property, callback);
      }
    };
  };
}

export default StoreConnector;