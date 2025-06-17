/**
 * SPA Router using the History API
 */
import { pathToRegex, extractParams, normalizePath, findAnchorInPath, shouldHandleLink } from './utils.js';
import { fade } from './transitions.js';

/**
 * Router class for handling SPA navigation
 */
export class Router {
  /**
   * Create a new router
   * @param {Object} options - Router options
   * @param {Object} options.routes - Route definitions (optional)
   * @param {string} options.rootElement - Root element selector
   * @param {Function} options.errorHandler - 404 error handler
   * @param {Function} options.transition - Transition function
   */
  constructor(options = {}) {
    this.routes = {};
    this.rootElement = options.rootElement || '#app';
    this.errorHandler = options.errorHandler || this.defaultErrorHandler;
    this.transition = options.transition || fade({ duration: 150 });
    this.currentRoute = null;
    this.loading = false;
    this.middlewares = [];
    
    // Register initial routes if provided
    if (options.routes) {
      this.registerRoutes(options.routes);
    }
    
    // Initialize
    this.init();
  }

  /**
   * Initialize the router
   */
  init() {
    console.log('Router initializing...');
    
    // Handle initial route immediately if document is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      console.log('Document already loaded, navigating to:', window.location.pathname);
      this.navigate(window.location.pathname, false);
    }
    
    // Also handle when DOM is fully loaded
    window.addEventListener('DOMContentLoaded', () => {
      console.log('DOMContentLoaded event, navigating to:', window.location.pathname);
      this.navigate(window.location.pathname, false);
    });
    
    // Handle popstate events (browser back/forward)
    window.addEventListener('popstate', (e) => {
      console.log('Popstate event, navigating to:', window.location.pathname);
      this.navigate(window.location.pathname, false);
    });
    
    // Intercept all clicks at the document level (including those from Shadow DOM)
    document.addEventListener('click', (e) => {
      // Skip if modifier keys are pressed
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      
      // Find anchor element in the event path
      const anchor = findAnchorInPath(e);
      
      // Skip if no anchor found
      if (!anchor) return;
      
      // Check if the link should be handled by the router
      if (!shouldHandleLink(anchor)) return;
      
      // Get the href attribute
      const href = anchor.getAttribute('href');
      
      // Prevent default behavior
      e.preventDefault();
      
      // Navigate to the link
      this.navigate(href);
      
      console.log('Intercepted click on link:', href);
    }, { capture: true }); // Use capture to get events before they reach the shadow DOM
  }

  /**
   * Register multiple routes
   * @param {Object} routes - Route definitions
   */
  registerRoutes(routes) {
    Object.entries(routes).forEach(([path, routeConfig]) => {
      this.addRoute(path, routeConfig);
    });
  }

  /**
   * Add a single route
   * @param {string} path - Route path
   * @param {Object} routeConfig - Route configuration
   */
  addRoute(path, routeConfig) {
    // Convert path to regex for matching
    const { regex, paramNames } = pathToRegex(path);
    
    // Store the route with its regex and param names
    this.routes[path] = {
      ...routeConfig,
      regex,
      paramNames,
      path
    };
  }

  /**
   * Remove a route
   * @param {string} path - Route path
   */
  removeRoute(path) {
    delete this.routes[path];
  }

  /**
   * Get the current route
   * @returns {Object|null} - Current route
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Go back in history
   */
  back() {
    window.history.back();
  }

  /**
   * Go forward in history
   */
  forward() {
    window.history.forward();
  }

  /**
   * Add middleware
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Navigate to a route
   * @param {string} path - Route path
   * @param {boolean} pushState - Whether to push state to history
   */
  async navigate(path, pushState = true) {
    console.log(`Router navigating to: ${path}`);
    
    // Store the original path before normalization
    const originalPath = path;
    
    // Normalize path
    path = normalizePath(path);
    
    // Update history if needed - do this before any potential early returns
    if (pushState) {
      console.log('Updating history with path:', path);
      window.history.pushState({ path }, document.title, path);
    }
    
    // Skip if already loading
    if (this.loading) {
      console.log('Already loading, skipping navigation');
      return;
    }
    
    // Set loading state
    this.loading = true;
    
    // Find matching route
    const route = this.findRoute(path);
    console.log('Found route:', route ? 'yes' : 'no');
    
    // Get root element
    const rootElement = document.querySelector(this.rootElement);
    if (!rootElement) {
      console.error(`Root element "${this.rootElement}" not found`);
      this.loading = false;
      return;
    }
    
    try {
      // Get the current content for transitions
      const oldContent = rootElement.innerHTML;
      
      // If route exists, run middleware
      if (route) {
        // Run middleware
        const from = this.currentRoute ? this.currentRoute.path : null;
        const to = { path, params: route.params };
        
        // Create a next function for middleware
        let index = 0;
        const next = async (nextPath) => {
          // If nextPath is provided, navigate to it instead
          if (nextPath) {
            this.loading = false;
            return this.navigate(nextPath);
          }
          
          // Run the next middleware
          if (index < this.middlewares.length) {
            const middleware = this.middlewares[index++];
            return middleware(to, from, next);
          }
          
          // No more middleware, continue with navigation
          return this.renderRoute(route, rootElement, oldContent);
        };
        
        // Start middleware chain
        await next();
      } else {
        // Handle 404
        console.log('Route not found, showing 404 page for path:', originalPath);
        
        try {
          // Call the error handler with the original path
          const errorContent = this.errorHandler(originalPath, rootElement);
          
          // Apply transition
          await this.transition(oldContent, errorContent, rootElement);
        } catch (error) {
          console.error('Error in error handler or transition:', error);
        }
        
        // Ensure any transition overlays are removed
        setTimeout(() => {
          const overlays = document.querySelectorAll('.transition-overlay');
          overlays.forEach(overlay => {
            if (document.body.contains(overlay)) {
              document.body.removeChild(overlay);
            }
          });
          
          // Dispatch a custom event to signal that the error page has been rendered
          document.dispatchEvent(new CustomEvent('error-page-rendered', {
            detail: { path }
          }));
        }, 100);
      }
    } catch (error) {
      console.error('Error rendering route:', error);
      
      // Handle errors
      rootElement.innerHTML = `<div class="error">Error loading page: ${error.message}</div>`;
    } finally {
      // Clear loading state
      this.loading = false;
    }
  }

  /**
   * Render a route
   * @param {Object} route - Route to render
   * @param {HTMLElement} rootElement - Root element
   * @param {string} oldContent - Old content for transitions
   */
  async renderRoute(route, rootElement, oldContent) {
    // Set current route
    this.currentRoute = route;
    
    // Get view content
    let content;
    
    // Check for beforeEnter guard
    if (route.beforeEnter) {
      // Create a next function for the guard
      const next = (nextPath) => {
        if (nextPath) {
          this.loading = false;
          return this.navigate(nextPath);
        }
        return true;
      };
      
      // Run the guard
      const result = await route.beforeEnter(route, this.currentRoute, next);
      
      // If the guard returned false or a promise that resolves to false, abort
      if (result === false) {
        this.loading = false;
        return;
      }
    }
    
    try {
      if (typeof route.view === 'function') {
        // If view is a function, call it with params
        console.log('Calling view function with params:', route.params);
        content = await route.view(route.params);
      } else if (typeof route.view === 'string') {
        // If view is a string, treat it as HTML
        console.log('Using string view');
        content = route.view;
      } else if (route.component) {
        // If route has a component, handle it
        console.log('Creating component:', route.component);
        
        if (typeof route.component === 'string') {
          // If component is a string, create the element
          const component = document.createElement(route.component);
          
          // Add props if provided
          if (route.props) {
            Object.entries(route.props).forEach(([key, value]) => {
              component[key] = value;
            });
          }
          
          content = component.outerHTML;
        } else if (typeof route.component === 'function') {
          // If component is a function, it's a dynamic import
          const module = await route.component();
          const Component = module.default || module;
          
          // Create the component
          const component = new Component(route.props);
          content = component.render ? component.render() : component.outerHTML;
        }
      } else {
        // Default to empty content
        console.log('No view or component found, using empty content');
        content = '';
      }
      
      // Apply transition
      await this.transition(oldContent, content, rootElement);
      
      // Call afterRender if provided
      if (route.afterRender) {
        console.log('Calling afterRender function');
        try {
          route.afterRender(route.params);
        } catch (error) {
          console.error('Error in afterRender:', error);
        }
      }
      
      // Dispatch route changed event
      window.dispatchEvent(new CustomEvent('route-changed', {
        detail: { path: route.path, route }
      }));
      
      // Remove the initial loading overlay if it exists
      const initialOverlay = document.getElementById('initial-loading-overlay');
      if (initialOverlay) {
        initialOverlay.style.opacity = '0';
        setTimeout(() => {
          if (initialOverlay.parentNode) {
            initialOverlay.parentNode.removeChild(initialOverlay);
          }
        }, 150);
      }
    } catch (error) {
      console.error('Error rendering route content:', error);
      throw error;
    }
  }

  /**
   * Find a route that matches the path
   * @param {string} path - Route path
   * @returns {Object|null} - Matching route or null
   */
  findRoute(path) {
    // Check for exact match
    if (this.routes[path]) {
      return { ...this.routes[path] };
    }
    
    // Special case for root path
    if (path === '/' && this.routes['/']) {
      return { ...this.routes['/'] };
    }
    
    // Check for dynamic routes
    for (const routePath in this.routes) {
      const route = this.routes[routePath];
      
      // Skip if not a dynamic route
      if (!routePath.includes(':')) continue;
      
      // Extract params
      const params = extractParams(path, route.regex, route.paramNames);
      
      if (params) {
        // Return route with params
        return {
          ...route,
          params
        };
      }
    }
    
    return null;
  }

  /**
   * Default 404 error handler
   * @param {string} path - Route path
   * @param {HTMLElement} rootElement - Root element
   * @returns {string} - Error page HTML
   */
  defaultErrorHandler(path) {
    return `
      <div class="error-page">
        <h1>404 - Page Not Found</h1>
        <p>The page "${path}" could not be found.</p>
        <a href="/" class="back-link">Go back to home</a>
      </div>
    `;
  }
}

export default Router;