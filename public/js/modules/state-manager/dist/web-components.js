/**
 * Web Component Integration for State Manager
 * 
 * Provides utilities for integrating state management with web components.
 */

/**
 * Create web component integration
 * @param {Object} stateManager - State manager instance
 * @returns {Object} Web component integration utilities
 */
export function createWebComponentIntegration(stateManager) {
  /**
   * Create a connected web component
   * @param {string} tagName - Custom element tag name
   * @param {class} BaseComponent - Base component class (extends HTMLElement)
   * @param {Object} options - Configuration options
   * @param {string|string[]} options.statePaths - State paths to subscribe to
   * @param {Function} options.mapStateToProps - Function to map state to properties
   * @param {Object} options.actions - Actions to bind to the component
   * @returns {class} Connected component class
   */
  function createConnectedComponent(tagName, BaseComponent, options = {}) {
    if (customElements.get(tagName)) {
      console.warn(`Custom element '${tagName}' is already defined`);
      return customElements.get(tagName);
    }
    
    // Default options
    const config = {
      statePaths: [],
      mapStateToProps: null,
      actions: {},
      ...options
    };
    
    // Create a new class that extends the base component
    const ConnectedComponent = class extends BaseComponent {
      constructor() {
        super();
        
        // State management
        this._stateUnsubscribe = null;
        this._boundActions = {};
        
        // Bind actions
        this._bindActions(config.actions);
      }
      
      /**
       * Bind actions to the component
       * @param {Object} actions - Actions to bind
       * @private
       */
      _bindActions(actions) {
        for (const [name, action] of Object.entries(actions)) {
          if (typeof action === 'function') {
            this._boundActions[name] = (...args) => {
              // Call the action with the component as context
              return action.apply(this, args);
            };
          }
        }
      }
      
      /**
       * Get state from the state manager
       * @param {string|string[]} [path] - Optional path to get a specific part of the state
       * @returns {any} The requested state
       */
      getState(path) {
        return stateManager.getState(path);
      }
      
      /**
       * Update state in the state manager
       * @param {Object|Function} update - Object to merge with state or function that returns an update object
       * @param {Object} options - Update options
       * @returns {Object} The new state
       */
      setState(update, options) {
        return stateManager.setState(update, options);
      }
      
      /**
       * Handle state changes
       * @param {any} state - New state
       * @param {string|string[]} path - Path that changed
       * @param {Object} fullState - Full state object
       * @private
       */
      _handleStateChange(state, path, fullState) {
        // Map state to props if a mapper function is provided
        if (typeof config.mapStateToProps === 'function') {
          const props = config.mapStateToProps(fullState, this);
          
          // Update component properties
          for (const [key, value] of Object.entries(props)) {
            if (this[key] !== value) {
              this[key] = value;
            }
          }
        }
        
        // Call the component's stateChanged method if it exists
        if (typeof this.stateChanged === 'function') {
          this.stateChanged(state, path, fullState);
        }
        
        // Call the component's render method if it exists
        if (typeof this.render === 'function') {
          this.render();
        }
      }
      
      /**
       * Called when the element is added to the DOM
       */
      connectedCallback() {
        // Call the parent connectedCallback if it exists
        if (super.connectedCallback) {
          super.connectedCallback();
        }
        
        // Subscribe to state changes
        this._stateUnsubscribe = stateManager.subscribe(
          this._handleStateChange.bind(this),
          config.statePaths
        );
        
        // Initial state update
        if (typeof config.mapStateToProps === 'function') {
          const fullState = stateManager.getState();
          const props = config.mapStateToProps(fullState, this);
          
          // Update component properties
          for (const [key, value] of Object.entries(props)) {
            this[key] = value;
          }
        }
        
        // Call the component's render method if it exists
        if (typeof this.render === 'function') {
          this.render();
        }
      }
      
      /**
       * Called when the element is removed from the DOM
       */
      disconnectedCallback() {
        // Unsubscribe from state changes
        if (this._stateUnsubscribe) {
          this._stateUnsubscribe();
          this._stateUnsubscribe = null;
        }
        
        // Call the parent disconnectedCallback if it exists
        if (super.disconnectedCallback) {
          super.disconnectedCallback();
        }
      }
    };
    
    // Add action methods to the component prototype
    for (const [name, action] of Object.entries(config.actions)) {
      if (typeof action === 'function') {
        ConnectedComponent.prototype[name] = function(...args) {
          return this._boundActions[name](...args);
        };
      }
    }
    
    // Register the custom element
    customElements.define(tagName, ConnectedComponent);
    
    return ConnectedComponent;
  }
  
  /**
   * Create a state mixin for web components
   * @param {Object} options - Configuration options
   * @param {string|string[]} options.statePaths - State paths to subscribe to
   * @param {Function} options.mapStateToProps - Function to map state to properties
   * @param {Object} options.actions - Actions to bind to the component
   * @returns {Function} Mixin function
   */
  function createStateMixin(options = {}) {
    // Default options
    const config = {
      statePaths: [],
      mapStateToProps: null,
      actions: {},
      ...options
    };
    
    return (BaseClass) => {
      return class extends BaseClass {
        constructor() {
          super();
          
          // State management
          this._stateUnsubscribe = null;
          this._statePaths = Array.isArray(config.statePaths) ? config.statePaths : [config.statePaths];
          this._boundActions = {};
          
          // Bind actions
          this._bindActions(config.actions);
        }
        
        /**
         * Bind actions to the component
         * @param {Object} actions - Actions to bind
         * @private
         */
        _bindActions(actions) {
          for (const [name, action] of Object.entries(actions)) {
            if (typeof action === 'function') {
              this._boundActions[name] = (...args) => {
                // Call the action with the component as context
                return action.apply(this, args);
              };
            }
          }
        }
        
        /**
         * Connect to specific state paths
         * @param {string|string[]} paths - State paths to subscribe to
         * @returns {this} The component instance
         */
        connectToState(paths) {
          this._statePaths = Array.isArray(paths) ? paths : [paths];
          
          // If already connected, unsubscribe first
          if (this._stateUnsubscribe) {
            this._stateUnsubscribe();
          }
          
          // Subscribe to state changes
          this._stateUnsubscribe = stateManager.subscribe(
            this._handleStateChange.bind(this),
            this._statePaths
          );
          
          return this;
        }
        
        /**
         * Get state from the state manager
         * @param {string|string[]} [path] - Optional path to get a specific part of the state
         * @returns {any} The requested state
         */
        getState(path) {
          return stateManager.getState(path);
        }
        
        /**
         * Update state in the state manager
         * @param {Object|Function} update - Object to merge with state or function that returns an update object
         * @param {Object} options - Update options
         * @returns {Object} The new state
         */
        setState(update, options) {
          return stateManager.setState(update, options);
        }
        
        /**
         * Handle state changes
         * @param {any} state - New state
         * @param {string|string[]} path - Path that changed
         * @param {Object} fullState - Full state object
         * @private
         */
        _handleStateChange(state, path, fullState) {
          // Map state to props if a mapper function is provided
          if (typeof config.mapStateToProps === 'function') {
            const props = config.mapStateToProps(fullState, this);
            
            // Update component properties
            for (const [key, value] of Object.entries(props)) {
              if (this[key] !== value) {
                this[key] = value;
              }
            }
          }
          
          // Call the component's stateChanged method if it exists
          if (typeof this.stateChanged === 'function') {
            this.stateChanged(state, path, fullState);
          }
          
          // Call the component's render method if it exists
          if (typeof this.render === 'function') {
            this.render();
          }
        }
        
        /**
         * Called when the element is added to the DOM
         */
        connectedCallback() {
          // Call the parent connectedCallback if it exists
          if (super.connectedCallback) {
            super.connectedCallback();
          }
          
          // Subscribe to state changes if not already subscribed
          if (!this._stateUnsubscribe && this._statePaths.length > 0) {
            this._stateUnsubscribe = stateManager.subscribe(
              this._handleStateChange.bind(this),
              this._statePaths
            );
          }
          
          // Initial state update
          if (typeof config.mapStateToProps === 'function') {
            const fullState = stateManager.getState();
            const props = config.mapStateToProps(fullState, this);
            
            // Update component properties
            for (const [key, value] of Object.entries(props)) {
              this[key] = value;
            }
          }
          
          // Call the component's render method if it exists
          if (typeof this.render === 'function') {
            this.render();
          }
        }
        
        /**
         * Called when the element is removed from the DOM
         */
        disconnectedCallback() {
          // Unsubscribe from state changes
          if (this._stateUnsubscribe) {
            this._stateUnsubscribe();
            this._stateUnsubscribe = null;
          }
          
          // Call the parent disconnectedCallback if it exists
          if (super.disconnectedCallback) {
            super.disconnectedCallback();
          }
        }
      };
    };
  }
  
  /**
   * Create a LitElement connector
   * @param {Object} options - Configuration options
   * @param {string|string[]} options.statePaths - State paths to subscribe to
   * @param {Function} options.mapStateToProps - Function to map state to properties
   * @returns {Function} LitElement connector function
   */
  function createLitElementConnector(options = {}) {
    // Default options
    const config = {
      statePaths: [],
      mapStateToProps: null,
      ...options
    };
    
    return (BaseElement) => {
      return class extends BaseElement {
        constructor() {
          super();
          this._stateUnsubscribe = null;
        }
        
        connectedCallback() {
          super.connectedCallback();
          
          // Subscribe to state changes
          this._stateUnsubscribe = stateManager.subscribe(
            this._handleStateChange.bind(this),
            config.statePaths
          );
          
          // Initial state update
          if (typeof config.mapStateToProps === 'function') {
            const state = stateManager.getState();
            const props = config.mapStateToProps(state, this);
            
            // Update component properties
            for (const [key, value] of Object.entries(props)) {
              this[key] = value;
            }
          }
        }
        
        disconnectedCallback() {
          // Unsubscribe from state changes
          if (this._stateUnsubscribe) {
            this._stateUnsubscribe();
            this._stateUnsubscribe = null;
          }
          
          super.disconnectedCallback();
        }
        
        _handleStateChange(state, path, fullState) {
          // Map state to props if a mapper function is provided
          if (typeof config.mapStateToProps === 'function') {
            const props = config.mapStateToProps(fullState, this);
            
            // Update component properties
            let hasChanges = false;
            for (const [key, value] of Object.entries(props)) {
              if (this[key] !== value) {
                this[key] = value;
                hasChanges = true;
              }
            }
            
            // Request an update if properties changed
            if (hasChanges && typeof this.requestUpdate === 'function') {
              this.requestUpdate();
            }
          }
        }
        
        getState(path) {
          return stateManager.getState(path);
        }
        
        setState(update, options) {
          return stateManager.setState(update, options);
        }
      };
    };
  }
  
  // Return the web component integration utilities
  return {
    createConnectedComponent,
    createStateMixin,
    createLitElementConnector
  };
}

/**
 * State mixin factory
 * @param {Object} stateManager - State manager instance
 * @returns {Function} State mixin factory function
 */
export function StateMixin(stateManager) {
  return (options = {}) => {
    const integration = createWebComponentIntegration(stateManager);
    return integration.createStateMixin(options);
  };
}

/**
 * Create a connected component
 * @param {string} tagName - Custom element tag name
 * @param {class} BaseComponent - Base component class
 * @param {Object} options - Configuration options
 * @param {Object} stateManager - State manager instance
 * @returns {class} Connected component class
 */
export function createConnectedComponent(tagName, BaseComponent, options = {}, stateManager) {
  const integration = createWebComponentIntegration(stateManager);
  return integration.createConnectedComponent(tagName, BaseComponent, options);
}

export default createWebComponentIntegration;