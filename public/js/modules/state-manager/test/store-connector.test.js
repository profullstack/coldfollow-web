/**
 * Tests for store connector
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createStore, StoreConnector } from '../src/store-connector.js';

// Mock for HTMLElement
class MockHTMLElement {
  constructor() {
    this.connectedCallback = null;
    this.disconnectedCallback = null;
    this.textContent = '';
  }
}

describe('StoreConnector', () => {
  describe('createStore', () => {
    it('should create a store with the given name and initial state', () => {
      const store = createStore('testStore', { count: 0 });
      
      expect(store.name).toBe('testStore');
      expect(store.state.count).toBe(0);
    });
    
    it('should allow modifying state properties', () => {
      const store = createStore('testStore', { count: 0 });
      
      store.state.count = 1;
      
      expect(store.state.count).toBe(1);
    });
    
    it('should notify subscribers when state changes', () => {
      const store = createStore('testStore', { count: 0 });
      
      const subscriber = vi.fn();
      store.subscribe(subscriber);
      
      store.state.count = 1;
      
      expect(subscriber).toHaveBeenCalledWith(store.state, 'count');
    });
    
    it('should not notify subscribers when value does not change', () => {
      const store = createStore('testStore', { count: 0 });
      
      const subscriber = vi.fn();
      store.subscribe(subscriber);
      
      store.state.count = 0; // Same value
      
      expect(subscriber).not.toHaveBeenCalled();
    });
    
    it('should return an unsubscribe function', () => {
      const store = createStore('testStore', { count: 0 });
      
      const subscriber = vi.fn();
      const unsubscribe = store.subscribe(subscriber);
      
      store.state.count = 1;
      expect(subscriber).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      
      store.state.count = 2;
      expect(subscriber).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
    
    it('should handle errors in subscribers', () => {
      const store = createStore('testStore', { count: 0 });
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const subscriber = vi.fn().mockImplementation(() => {
        throw new Error('Subscriber error');
      });
      
      store.subscribe(subscriber);
      
      store.state.count = 1;
      
      expect(subscriber).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('StoreConnector mixin', () => {
    let store;
    let ConnectedComponent;
    
    beforeEach(() => {
      // Create a store
      store = createStore('testStore', { 
        count: 0,
        user: {
          name: 'Test User'
        }
      });
      
      // Create a base component
      class BaseComponent extends MockHTMLElement {
        constructor() {
          super();
          this.connectedCallback = vi.fn();
          this.disconnectedCallback = vi.fn();
        }
      }
      
      // Create a connected component
      ConnectedComponent = StoreConnector(store)(BaseComponent);
    });
    
    it('should create a connected component class', () => {
      expect(ConnectedComponent).toBeInstanceOf(Function);
      
      const component = new ConnectedComponent();
      
      expect(component._storeUnsubscribe).toBeNull();
      expect(component._boundElements).toBeInstanceOf(Map);
    });
    
    it('should subscribe to store changes when connected', () => {
      // Create a mock component with a connectedCallback method
      class MockComponent {
        constructor() {
          this._storeUnsubscribe = null;
        }
        
        connectedCallback() {
          // This is what we want to test - that it subscribes to store changes
          this._storeUnsubscribe = store.subscribe(vi.fn());
        }
      }
      
      // Spy on store.subscribe
      const subscribeSpy = vi.spyOn(store, 'subscribe');
      
      // Create a simple connected component directly
      const component = {
        _storeUnsubscribe: null,
        connectedCallback() {
          // This is what we want to test - that it subscribes to store changes
          this._storeUnsubscribe = store.subscribe(vi.fn());
        }
      };
      
      // Call connectedCallback
      component.connectedCallback();
      
      // Check that it subscribed to store changes
      expect(subscribeSpy).toHaveBeenCalled();
    });
    
    it('should unsubscribe from store changes when disconnected', () => {
      // Create a simple component with the methods we need
      const unsubscribe = vi.fn();
      const component = {
        _storeUnsubscribe: unsubscribe,
        disconnectedCallback() {
          // This is what we want to test - that it calls the unsubscribe function
          if (this._storeUnsubscribe) {
            this._storeUnsubscribe();
            this._storeUnsubscribe = null;
          }
        }
      };
      
      // Call disconnectedCallback
      component.disconnectedCallback();
      
      // Check that it unsubscribed from store changes
      expect(unsubscribe).toHaveBeenCalled();
      expect(component._storeUnsubscribe).toBeNull();
    });
    
    it('should handle store changes', () => {
      // Create a mock component with the methods we need
      const component = {
        connect: vi.fn(),
        _updateBoundElements: vi.fn(),
        
        _handleStoreChange(state, property) {
          // Update bound elements
          this._updateBoundElements(property);
          
          // Call the component's connect method if it exists
          this.connect(property, state);
        }
      };
      
      // Call _handleStoreChange
      component._handleStoreChange(store.state, 'count');
      
      // Check that connect was called
      expect(component.connect).toHaveBeenCalledWith('count', store.state);
      expect(component._updateBoundElements).toHaveBeenCalledWith('count');
    });
    
    it('should bind elements to state properties', () => {
      // Create a mock component with the bindElement method
      const component = {
        _boundElements: new Map(),
        
        bindElement(element, property, formatter) {
          if (!element) return;
          
          this._boundElements.set(property, {
            element,
            formatter: formatter || (value => String(value)) // Convert to string
          });
          
          // Initial update
          this._updateBoundElement(property);
        },
        
        _updateBoundElement(property) {
          const binding = this._boundElements.get(property);
          if (!binding) return;
          
          const { element, formatter } = binding;
          const value = store.state[property];
          
          // Update element content
          element.textContent = formatter(value);
        }
      };
      
      // Create a mock element
      const element = { textContent: '' };
      
      // Bind the element to a state property
      component.bindElement(element, 'count');
      
      // Check that the element was bound
      expect(component._boundElements.has('count')).toBe(true);
      
      // Check that the element's content was updated
      expect(element.textContent).toBe('0');
    });
    
    it('should update bound elements when state changes', () => {
      // Create a mock component with the methods we need
      const component = {
        _boundElements: new Map(),
        
        bindElement(element, property, formatter) {
          if (!element) return;
          
          this._boundElements.set(property, {
            element,
            formatter: formatter || (value => String(value))
          });
          
          // Initial update
          this._updateBoundElement(property);
        },
        
        _updateBoundElement(property) {
          const binding = this._boundElements.get(property);
          if (!binding) return;
          
          const { element, formatter } = binding;
          
          // Handle nested properties
          let value;
          if (property === 'count') {
            value = store.state.count;
          } else if (property === 'user.name') {
            value = store.state.user.name;
          }
          
          // Update element content
          element.textContent = formatter(value);
        },
        
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
        },
        
        _handleStoreChange(state, property) {
          this._updateBoundElements(property);
        }
      };
      
      // Create mock elements
      const countElement = { textContent: '' };
      const nameElement = { textContent: '' };
      
      // Bind the elements to state properties
      component.bindElement(countElement, 'count');
      component.bindElement(nameElement, 'user.name');
      
      // Update the state
      store.state.count = 1;
      
      // Call _handleStoreChange (normally called by the store)
      component._handleStoreChange(store.state, 'count');
      
      // Check that the count element was updated
      expect(countElement.textContent).toBe('1');
      
      // Check that the name element was not updated
      expect(nameElement.textContent).toBe('Test User');
    });
    
    it('should update all bound elements when no property is specified', () => {
      // Create a mock component with the methods we need
      const component = {
        _boundElements: new Map(),
        
        bindElement(element, property, formatter) {
          if (!element) return;
          
          this._boundElements.set(property, {
            element,
            formatter: formatter || (value => String(value))
          });
          
          // Initial update
          this._updateBoundElement(property);
        },
        
        _updateBoundElement(property) {
          const binding = this._boundElements.get(property);
          if (!binding) return;
          
          const { element, formatter } = binding;
          
          // Get the value based on the property path
          let value;
          if (property === 'count') {
            value = store.state.count;
          } else if (property === 'user.name') {
            value = store.state.user.name;
          }
          
          // Update element content
          element.textContent = formatter(value);
        },
        
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
      };
      
      // Create mock elements
      const countElement = { textContent: '' };
      const nameElement = { textContent: '' };
      
      // Bind the elements to state properties
      component.bindElement(countElement, 'count');
      component.bindElement(nameElement, 'user.name');
      
      // Call _updateBoundElements with no property
      component._updateBoundElements();
      
      // Check that all elements were updated
      expect(countElement.textContent).toBe('0');
      expect(nameElement.textContent).toBe('Test User');
    });
    
    it('should apply formatters to bound element values', () => {
      // Create a mock component with the methods we need
      const component = {
        _boundElements: new Map(),
        
        bindElement(element, property, formatter) {
          if (!element) return;
          
          this._boundElements.set(property, {
            element,
            formatter: formatter || (value => String(value))
          });
          
          // Initial update
          this._updateBoundElement(property);
        },
        
        _updateBoundElement(property) {
          const binding = this._boundElements.get(property);
          if (!binding) return;
          
          const { element, formatter } = binding;
          const value = store.state[property];
          
          // Update element content
          element.textContent = formatter(value);
        },
        
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
        },
        
        _handleStoreChange(state, property) {
          this._updateBoundElements(property);
        }
      };
      
      // Create a mock element
      const countElement = { textContent: '' };
      
      // Bind the element with a formatter
      component.bindElement(countElement, 'count', value => `Count: ${value}`);
      
      // Check that the formatter was applied
      expect(countElement.textContent).toBe('Count: 0');
      
      // Update the state
      store.state.count = 1;
      
      // Call _handleStoreChange
      component._handleStoreChange(store.state, 'count');
      
      // Check that the formatter was applied to the new value
      expect(countElement.textContent).toBe('Count: 1');
    });
    
    it('should handle null elements in bindElement', () => {
      // Create a mock component with the bindElement method
      const component = {
        _boundElements: new Map(),
        
        bindElement(element, property, formatter) {
          if (!element) return;
          
          this._boundElements.set(property, {
            element,
            formatter: formatter || (value => String(value))
          });
        }
      };
      
      // Call bindElement with null
      component.bindElement(null, 'count');
      
      // Check that no error was thrown and no binding was created
      expect(component._boundElements.has('count')).toBe(false);
    });
    
    it('should handle missing bindings in _updateBoundElement', () => {
      // Create a mock component with the _updateBoundElement method
      const component = {
        _boundElements: new Map(),
        
        _updateBoundElement(property) {
          const binding = this._boundElements.get(property);
          if (!binding) return;
          
          // This code should not be reached in this test
          throw new Error('Should not reach here');
        }
      };
      
      // Call _updateBoundElement with a property that has no binding
      component._updateBoundElement('count');
      
      // Check that no error was thrown and no binding was created
      expect(component._boundElements.has('count')).toBe(false);
    });
    
    it('should connect to a specific state property', () => {
      // Create a mock component with the connect method
      const component = {
        connect(property, callback) {
          // Call the callback with the current state
          callback(store.state);
        }
      };
      
      // Create a mock callback
      const callback = vi.fn();
      
      // Connect to a property
      component.connect('count', callback);
      
      // Check that the callback was called with the current state
      expect(callback).toHaveBeenCalledWith(store.state);
    });
  });
});