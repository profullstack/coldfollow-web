/**
 * @profullstack/enhanced-router
 * 
 * Enhanced SPA router with transition management, i18n integration, and layout management
 * Built on top of @profullstack/spa-router
 */

import { Router } from '@profullstack/spa-router';
import { createTransitions } from './transitions.js';
import { createLayoutManager } from './layouts.js';
import { createI18nIntegration } from './i18n.js';

/**
 * Enhanced Router class that extends the base Router with additional features
 */
class EnhancedRouter {
  /**
   * Create a new EnhancedRouter
   * @param {Object} options - Router options
   * @param {string} options.rootElement - CSS selector for the root element
   * @param {Object} options.transition - Transition configuration
   * @param {Object} options.renderer - Custom renderer
   * @param {Function} options.errorHandler - Custom error handler
   * @param {Object} options.layouts - Layout configuration
   * @param {Object} options.i18n - i18n configuration
   * @param {boolean} options.disableAutoInit - Whether to disable auto-initialization
   */
  constructor(options = {}) {
    // Extract options
    const {
      rootElement = '#app',
      transition,
      renderer,
      errorHandler,
      layouts = {},
      i18n = {},
      disableAutoInit = false,
      ...routerOptions
    } = options;

    // Create transition manager
    this.transitions = createTransitions(transition);
    
    // Create layout manager
    this.layouts = createLayoutManager(layouts);
    
    // Register any custom layouts passed in the options
    if (layouts && typeof layouts === 'object') {
      Object.entries(layouts).forEach(([name, layoutFn]) => {
        if (typeof layoutFn === 'function') {
          this.layouts.registerLayout(name, layoutFn);
        }
      });
    }
    
    // Create i18n integration
    this.i18n = createI18nIntegration(i18n);
    
    // Create base router
    this.router = new Router({
      rootElement,
      transition: this.transitions.getTransition(),
      renderer: this.i18n.enhanceRenderer(renderer),
      errorHandler: this._enhanceErrorHandler(errorHandler),
      disableAutoInit,
      ...routerOptions
    });
    
    // Bind methods to ensure correct 'this' context
    this.registerRoutes = this.registerRoutes.bind(this);
    this.navigate = this.navigate.bind(this);
    this.init = this.init.bind(this);
    this.use = this.use.bind(this);
    
    // Set up event listeners for cleanup
    this._setupEventListeners();
  }
  
  /**
   * Enhance the error handler with layout support
   * @private
   * @param {Function} customErrorHandler - Custom error handler
   * @returns {Function} Enhanced error handler
   */
  _enhanceErrorHandler(customErrorHandler) {
    return (path, error) => {
      // Clean up any transition overlays
      this.transitions.cleanupOverlays();
      
      if (customErrorHandler) {
        // Use custom error handler
        const errorContent = customErrorHandler(path, error);
        
        // Wrap in default layout if it's not already wrapped
        return this.layouts.wrapInLayout(errorContent, 'error');
      }
      
      // Default error handler
      const errorContent = document.createDocumentFragment();
      
      // Create error container
      const errorContainer = document.createElement('div');
      errorContainer.className = 'error-container';
      
      // Create error heading
      const heading = document.createElement('h1');
      heading.textContent = '404 - Page Not Found';
      heading.setAttribute('data-i18n', 'errors.page_not_found');
      errorContainer.appendChild(heading);
      
      // Create error message
      const message = document.createElement('p');
      message.textContent = `The page "${path}" could not be found.`;
      message.setAttribute('data-i18n-params', JSON.stringify({ path }));
      message.setAttribute('data-i18n', 'errors.page_not_found_message');
      errorContainer.appendChild(message);
      
      // Create back link
      const backLink = document.createElement('a');
      backLink.href = '/';
      backLink.className = 'back-link';
      backLink.textContent = 'Go back to home';
      backLink.setAttribute('data-i18n', 'errors.go_back_home');
      errorContainer.appendChild(backLink);
      
      // Add to fragment
      errorContent.appendChild(errorContainer);
      
      // Wrap in error layout
      return this.layouts.wrapInLayout(errorContent, 'error');
    };
  }
  
  /**
   * Set up event listeners for cleanup
   * @private
   */
  _setupEventListeners() {
    // Listen for transition end events
    document.addEventListener('spa-transition-end', () => {
      // Clean up any overlays
      this.transitions.cleanupOverlays();
      
      // Apply translations if i18n is enabled
      if (this.i18n.isEnabled()) {
        this.i18n.translateDOM();
      }
    });
  }
  
  /**
   * Register routes with the router
   * @param {Object} routes - Routes configuration
   */
  registerRoutes(routes) {
    // Enhance routes with layout support
    const enhancedRoutes = {};
    
    Object.entries(routes).forEach(([path, routeConfig]) => {
      enhancedRoutes[path] = {
        ...routeConfig,
        // Enhance view function to wrap content in layout
        view: async (...args) => {
          const content = await routeConfig.view(...args);
          const layoutName = routeConfig.layout || 'default';
          return this.layouts.wrapInLayout(content, layoutName);
        }
      };
    });
    
    // Register enhanced routes with the base router
    this.router.registerRoutes(enhancedRoutes);
    
    return this;
  }
  
  /**
   * Navigate to a path
   * @param {string} path - Path to navigate to
   * @param {Object} options - Navigation options
   * @returns {Promise} Navigation promise
   */
  navigate(path, options = {}) {
    // Dispatch pre-navigation event
    document.dispatchEvent(new CustomEvent('pre-navigation', {
      detail: { 
        fromPath: window.location.pathname, 
        toPath: path,
        options
      }
    }));
    
    // Use the base router's navigate method
    return this.router.navigate(path, options);
  }
  
  /**
   * Initialize the router
   */
  init() {
    // Initialize the base router
    this.router.init();
    
    // Initialize i18n if enabled
    if (this.i18n.isEnabled()) {
      this.i18n.init();
    }
    
    return this;
  }
  
  /**
   * Add middleware to the router
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.router.use(middleware);
    return this;
  }
  
  /**
   * Get the base router instance
   * @returns {Router} Base router instance
   */
  getBaseRouter() {
    return this.router;
  }
  
  /**
   * Get the transition manager
   * @returns {Object} Transition manager
   */
  getTransitionManager() {
    return this.transitions;
  }
  
  /**
   * Get the layout manager
   * @returns {Object} Layout manager
   */
  getLayoutManager() {
    return this.layouts;
  }
  
  /**
   * Get the i18n integration
   * @returns {Object} i18n integration
   */
  getI18nIntegration() {
    return this.i18n;
  }
}

/**
 * Create a new EnhancedRouter
 * @param {Object} options - Router options
 * @returns {EnhancedRouter} Enhanced router instance
 */
export function createRouter(options = {}) {
  return new EnhancedRouter(options);
}

// Export the EnhancedRouter class
export { EnhancedRouter };

// Export transitions, layouts, and i18n
export { createTransitions } from './transitions.js';
export { createLayoutManager } from './layouts.js';
export { createI18nIntegration } from './i18n.js';

// Default export
export default createRouter;