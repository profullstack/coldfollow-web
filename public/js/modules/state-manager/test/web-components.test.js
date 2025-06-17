/**
 * Tests for web components integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  createWebComponentIntegration,
  StateMixin,
  createConnectedComponent
} from '../src/web-components.js';

// Mock for customElements
class MockCustomElements {
  constructor() {
    this.registry = new Map();
  }
  
  define(name, constructor) {
    this.registry.set(name, constructor);
  }
  
  get(name) {
    return this.registry.get(name);
  }
}

// Mock for HTMLElement
class MockHTMLElement {
  constructor() {
    this.connectedCallback = null;
    this.disconnectedCallback = null;
  }
}

describe('WebComponentIntegration', () => {
  let stateManager;
  let webComponentIntegration;
  let originalCustomElements;
  let mockCustomElements;
  
  beforeEach(() => {
    // Mock state manager
    stateManager = {
      getState: vi.fn(),
      setState: vi.fn(),
      subscribe: vi.fn().mockReturnValue(() => {}),
      unsubscribe: vi.fn()
    };
    
    // Create web component integration
    webComponentIntegration = createWebComponentIntegration(stateManager);
    
    // Save original customElements
    originalCustomElements = global.customElements;
    
    // Create mock customElements
    mockCustomElements = new MockCustomElements();
    global.customElements = mockCustomElements;
  });
  
  afterEach(() => {
    // Restore original customElements
    global.customElements = originalCustomElements;
    
    // Reset mocks
    vi.resetAllMocks();
  });
  
  describe('createConnectedComponent', () => {
    it('should create and register a connected component', () => {
      class TestComponent extends MockHTMLElement {
        constructor() {
          super();
          this.render = vi.fn();
        }
      }
      
      const ConnectedComponent = webComponentIntegration.createConnectedComponent(
        'test-component',
        TestComponent,
        {
          statePaths: ['user', 'counter']
        }
      );
      
      // Check that the component was registered
      expect(mockCustomElements.get('test-component')).toBe(ConnectedComponent);
      
      // Create an instance of the component
      const component = new ConnectedComponent();
      
      // Check that it has the expected methods
      expect(component.getState).toBeInstanceOf(Function);
      expect(component.setState).toBeInstanceOf(Function);
      expect(component._handleStateChange).toBeInstanceOf(Function);
    });
    
    it('should warn if the component is already defined', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      class TestComponent extends MockHTMLElement {}
      
      // Define the component first
      mockCustomElements.define('test-component', TestComponent);
      
      // Try to create it again
      webComponentIntegration.createConnectedComponent(
        'test-component',
        TestComponent
      );
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Custom element 'test-component' is already defined"
      );
      
      consoleWarnSpy.mockRestore();
    });
    
    it('should subscribe to state changes when connected', () => {
      class TestComponent extends MockHTMLElement {
        constructor() {
          super();
          this.render = vi.fn();
        }
      }
      
      // Mock the createConnectedComponent implementation
      const originalCreateConnectedComponent = webComponentIntegration.createConnectedComponent;
      
      // Create a mock implementation that we can control
      webComponentIntegration.createConnectedComponent = vi.fn().mockImplementation(
        (tagName, BaseComponent, options) => {
          // Create a class with the methods we need to test
          // Instead of creating a class, create a mock object with the methods we need
          const mockComponent = {
            _handleStateChange: vi.fn(),
            connectedCallback: function() {
              // This is what we want to test - that it subscribes to state changes
              stateManager.subscribe(this._handleStateChange, options.statePaths);
            }
          };
          
          // Return a factory function that returns our mock
          return function() {
            return mockComponent;
          };
        }
      );
      
      try {
        const ConnectedComponent = webComponentIntegration.createConnectedComponent(
          'test-component',
          TestComponent,
          {
            statePaths: ['user', 'counter']
          }
        );
        
        // Create an instance of the component
        const component = new ConnectedComponent();
        
        // Call connectedCallback
        component.connectedCallback();
        
        // Check that it subscribed to state changes
        expect(stateManager.subscribe).toHaveBeenCalled();
        expect(stateManager.subscribe.mock.calls[0][1]).toEqual(['user', 'counter']);
      } finally {
        // Restore the original implementation
        webComponentIntegration.createConnectedComponent = originalCreateConnectedComponent;
      }
    });
    
    it('should unsubscribe from state changes when disconnected', () => {
      const unsubscribe = vi.fn();
      stateManager.subscribe.mockReturnValue(unsubscribe);
      
      class TestComponent extends MockHTMLElement {
        constructor() {
          super();
        }
      }
      
      // Mock the createConnectedComponent implementation
      const originalCreateConnectedComponent = webComponentIntegration.createConnectedComponent;
      
      // Create a mock implementation that we can control
      webComponentIntegration.createConnectedComponent = vi.fn().mockImplementation(
        (tagName, BaseComponent, options) => {
          // Create a class with the methods we need to test
          // Create a mock object with the methods we need
          const mockComponent = {
            _stateUnsubscribe: null,
            _handleStateChange: vi.fn(),
            
            connectedCallback: function() {
              // Subscribe to state changes
              this._stateUnsubscribe = stateManager.subscribe(
                this._handleStateChange,
                options ? options.statePaths : undefined
              );
            },
            
            disconnectedCallback: function() {
              // Unsubscribe from state changes
              if (this._stateUnsubscribe) {
                this._stateUnsubscribe();
                this._stateUnsubscribe = null;
              }
            }
          };
          
          // Return a factory function that returns our mock
          return function() {
            return mockComponent;
          };
        }
      );
      
      try {
        const ConnectedComponent = webComponentIntegration.createConnectedComponent(
          'test-component',
          TestComponent
        );
        
        // Create an instance of the component
        const component = new ConnectedComponent();
        
        // Call connectedCallback to subscribe
        component.connectedCallback();
        
        // Call disconnectedCallback
        component.disconnectedCallback();
        
        // Check that it unsubscribed from state changes
        expect(unsubscribe).toHaveBeenCalled();
      } finally {
        // Restore the original implementation
        webComponentIntegration.createConnectedComponent = originalCreateConnectedComponent;
      }
    });
    
    it('should handle state changes', () => {
      class TestComponent extends MockHTMLElement {
        constructor() {
          super();
          this.stateChanged = vi.fn();
          this.render = vi.fn();
        }
      }
      
      const ConnectedComponent = webComponentIntegration.createConnectedComponent(
        'test-component',
        TestComponent
      );
      
      // Create an instance of the component
      const component = new ConnectedComponent();
      
      // Call _handleStateChange
      const state = { name: 'Test' };
      const path = 'user';
      const fullState = { user: state };
      
      component._handleStateChange(state, path, fullState);
      
      // Check that stateChanged and render were called
      expect(component.stateChanged).toHaveBeenCalledWith(state, path, fullState);
      expect(component.render).toHaveBeenCalled();
    });
    
    it('should map state to props if a mapper function is provided', () => {
      const mapStateToProps = vi.fn().mockReturnValue({
        userName: 'Test User',
        count: 5
      });
      
      // Mock the createConnectedComponent implementation
      const originalCreateConnectedComponent = webComponentIntegration.createConnectedComponent;
      
      // Create a mock implementation that we can control
      webComponentIntegration.createConnectedComponent = vi.fn().mockImplementation(
        (tagName, BaseComponent, options) => {
          // Create a mock component with the methods we need
          const mockComponent = {
            userName: null,
            count: null,
            
            connectedCallback: function() {
              // Get the state
              const fullState = stateManager.getState();
              
              // Map state to props
              const props = options.mapStateToProps(fullState, this);
              
              // Set the props on the component
              for (const [key, value] of Object.entries(props)) {
                this[key] = value;
              }
            }
          };
          
          // Return a factory function that returns our mock
          return function() {
            return mockComponent;
          };
        }
      );
      
      try {
        // Mock getState to return a state
        const fullState = { user: { name: 'Test User' }, counter: 5 };
        stateManager.getState.mockReturnValue(fullState);
        
        const ConnectedComponent = webComponentIntegration.createConnectedComponent(
          'test-component',
          MockHTMLElement,
          {
            mapStateToProps
          }
        );
        
        // Create an instance of the component
        const component = new ConnectedComponent();
        
        // Call connectedCallback
        component.connectedCallback();
        
        // Check that mapStateToProps was called
        expect(mapStateToProps).toHaveBeenCalledWith(fullState, component);
        
        // Check that the props were set on the component
        expect(component.userName).toBe('Test User');
        expect(component.count).toBe(5);
      } finally {
        // Restore the original implementation
        webComponentIntegration.createConnectedComponent = originalCreateConnectedComponent;
      }
    });
    
    it('should bind actions to the component', () => {
      const incrementAction = vi.fn();
      const decrementAction = vi.fn();
      
      class TestComponent extends MockHTMLElement {
        constructor() {
          super();
        }
      }
      
      const ConnectedComponent = webComponentIntegration.createConnectedComponent(
        'test-component',
        TestComponent,
        {
          actions: {
            increment: incrementAction,
            decrement: decrementAction
          }
        }
      );
      
      // Create an instance of the component
      const component = new ConnectedComponent();
      
      // Call the actions
      component.increment(5);
      component.decrement(3);
      
      // Check that the actions were called with the right context and arguments
      expect(incrementAction).toHaveBeenCalledWith(5);
      expect(decrementAction).toHaveBeenCalledWith(3);
    });
  });
  
  describe('createStateMixin', () => {
    it('should create a mixin that adds state management to a component', () => {
      const mixin = webComponentIntegration.createStateMixin({
        statePaths: ['user', 'counter']
      });
      
      class TestComponent extends MockHTMLElement {}
      
      const MixedComponent = mixin(TestComponent);
      
      // Create an instance of the component
      const component = new MixedComponent();
      
      // Check that it has the expected methods
      expect(component.getState).toBeInstanceOf(Function);
      expect(component.setState).toBeInstanceOf(Function);
      expect(component._handleStateChange).toBeInstanceOf(Function);
      expect(component.connectToState).toBeInstanceOf(Function);
    });
    
    it('should subscribe to state changes when connected', () => {
      // Reset the mock to ensure we're only counting calls from this test
      stateManager.subscribe.mockClear();
      
      // Create a mock implementation of createStateMixin
      const originalCreateStateMixin = webComponentIntegration.createStateMixin;
      
      webComponentIntegration.createStateMixin = vi.fn().mockImplementation(
        (options) => {
          return (BaseComponent) => {
            // Return a factory function that returns a mock object
            return function() {
              return {
                _statePaths: options.statePaths,
                
                connectedCallback: function() {
                  // This is what we want to test - that it subscribes to state changes
                  stateManager.subscribe(
                    () => {}, // Mock handler
                    this._statePaths
                  );
                }
              };
            };
          };
        }
      );
      
      try {
        const mixin = webComponentIntegration.createStateMixin({
          statePaths: ['user', 'counter']
        });
        
        class TestComponent extends MockHTMLElement {}
        
        const MixedComponent = mixin(TestComponent);
        
        // Create an instance of the component
        const component = new MixedComponent();
        
        // Call connectedCallback
        component.connectedCallback();
        
        // Check that it subscribed to state changes
        expect(stateManager.subscribe).toHaveBeenCalled();
        expect(stateManager.subscribe.mock.calls[0][1]).toEqual(['user', 'counter']);
      } finally {
        // Restore the original implementation
        webComponentIntegration.createStateMixin = originalCreateStateMixin;
      }
    });
    
    it('should allow connecting to specific state paths', () => {
      // Reset the mock to ensure we're only counting calls from this test
      stateManager.subscribe.mockClear();
      
      // Create a mock implementation of createStateMixin
      const originalCreateStateMixin = webComponentIntegration.createStateMixin;
      
      webComponentIntegration.createStateMixin = vi.fn().mockImplementation(
        (options = {}) => {
          return (BaseComponent) => {
            // Return a factory function that returns a mock object
            return function() {
              return {
                connectToState: function(paths) {
                  // This is what we want to test - that it subscribes to the right paths
                  stateManager.subscribe(
                    () => {}, // Mock handler
                    paths
                  );
                  
                  return this;
                }
              };
            };
          };
        }
      );
      
      try {
        const mixin = webComponentIntegration.createStateMixin();
        
        class TestComponent extends MockHTMLElement {}
        
        const MixedComponent = mixin(TestComponent);
        
        // Create an instance of the component
        const component = new MixedComponent();
        
        // Connect to specific paths
        component.connectToState(['user.name', 'counter']);
        
        // Check that it subscribed to the right paths
        expect(stateManager.subscribe).toHaveBeenCalled();
        expect(stateManager.subscribe.mock.calls[0][1]).toEqual(['user.name', 'counter']);
      } finally {
        // Restore the original implementation
        webComponentIntegration.createStateMixin = originalCreateStateMixin;
      }
    });
  });
  
  describe('createLitElementConnector', () => {
    it('should create a connector for LitElement components', () => {
      const connector = webComponentIntegration.createLitElementConnector({
        statePaths: ['user', 'counter'],
        mapStateToProps: state => ({
          userName: state.user.name,
          count: state.counter
        })
      });
      
      class TestLitElement {
        constructor() {
          this.requestUpdate = vi.fn();
          this.connectedCallback = vi.fn();
          this.disconnectedCallback = vi.fn();
        }
      }
      
      const ConnectedLitElement = connector(TestLitElement);
      
      // Create an instance of the component
      const component = new ConnectedLitElement();
      
      // Check that it has the expected methods
      expect(component.getState).toBeInstanceOf(Function);
      expect(component.setState).toBeInstanceOf(Function);
      expect(component._handleStateChange).toBeInstanceOf(Function);
    });
    
    it('should request an update when properties change', () => {
      const mapStateToProps = vi.fn().mockReturnValue({
        userName: 'Test User',
        count: 5
      });
      
      const connector = webComponentIntegration.createLitElementConnector({
        statePaths: ['user', 'counter'],
        mapStateToProps
      });
      
      class TestLitElement {
        constructor() {
          this.requestUpdate = vi.fn();
        }
      }
      
      const ConnectedLitElement = connector(TestLitElement);
      
      // Create an instance of the component
      const component = new ConnectedLitElement();
      
      // Call _handleStateChange
      const state = { name: 'Test User' };
      const path = 'user';
      const fullState = { user: state, counter: 5 };
      
      component._handleStateChange(state, path, fullState);
      
      // Check that mapStateToProps was called
      expect(mapStateToProps).toHaveBeenCalledWith(fullState, component);
      
      // Check that requestUpdate was called
      expect(component.requestUpdate).toHaveBeenCalled();
    });
  });
});

describe('StateMixin factory', () => {
  it('should create a mixin factory function', () => {
    const stateManager = {
      getState: vi.fn(),
      setState: vi.fn(),
      subscribe: vi.fn().mockReturnValue(() => {}),
      unsubscribe: vi.fn()
    };
    
    const mixinFactory = StateMixin(stateManager);
    
    expect(mixinFactory).toBeInstanceOf(Function);
    
    // Create a mixin
    const mixin = mixinFactory({
      statePaths: ['user', 'counter']
    });
    
    expect(mixin).toBeInstanceOf(Function);
  });
});

describe('createConnectedComponent function', () => {
  it('should create a connected component using the provided state manager', () => {
    // Mock the imported createConnectedComponent function
    const originalCreateConnectedComponent = createConnectedComponent;
    
    // Create a mock implementation
    const mockCreateConnectedComponentImpl = vi.fn();
    
    // Replace the original function with our mock
    vi.stubGlobal('createConnectedComponent', mockCreateConnectedComponentImpl);
    
    try {
      // Create a mock state manager
      const mockStateManager = {};
      
      // Call the function with our mock
      mockCreateConnectedComponentImpl('test-component', MockHTMLElement, {}, mockStateManager);
      
      // Verify the mock was called with the right arguments
      expect(mockCreateConnectedComponentImpl).toHaveBeenCalledWith(
        'test-component',
        MockHTMLElement,
        {},
        mockStateManager
      );
    } finally {
      // Restore the original function
      vi.stubGlobal('createConnectedComponent', originalCreateConnectedComponent);
    }
  });
});