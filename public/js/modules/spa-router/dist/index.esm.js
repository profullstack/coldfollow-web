/**
 * Utility functions for the router
 */

/**
 * Convert a route path to a regular expression
 * @param {string} path - Route path
 * @returns {Object} - Regex and param names
 */
const pathToRegex = (path) => {
  // Skip if not a dynamic route
  if (!path.includes(':')) {
    return {
      regex: new RegExp(`^${path}$`),
      paramNames: []
    };
  }
  
  // Extract param names
  const paramNames = (path.match(/:[^\s/]+/g) || [])
    .map(param => param.slice(1)); // Remove the colon
  
  // Convert route path to regex
  const pattern = path
    .replace(/:[^\s/]+/g, '([^/]+)')
    .replace(/\//g, '\\/');
  
  return {
    regex: new RegExp(`^${pattern}$`),
    paramNames
  };
};

/**
 * Extract params from a path using a regex and param names
 * @param {string} path - Current path
 * @param {RegExp} regex - Route regex
 * @param {Array} paramNames - Parameter names
 * @returns {Object|null} - Extracted params or null if no match
 */
const extractParams = (path, regex, paramNames) => {
  const match = path.match(regex);
  
  if (!match) {
    return null;
  }
  
  // Extract params
  const params = {};
  
  paramNames.forEach((paramName, index) => {
    params[paramName] = match[index + 1];
  });
  
  return params;
};

/**
 * Normalize a path
 * @param {string} path - Path to normalize
 * @returns {string} - Normalized path
 */
const normalizePath = (path) => {
  // Default to home if no path
  path = path || '/';
  
  // Remove trailing slash except for root
  if (path !== '/' && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  
  // Ensure root path is always '/'
  if (path === '') {
    path = '/';
  }
  
  return path;
};

/**
 * Find the first anchor element in an event path
 * @param {Event} event - Click event
 * @returns {HTMLAnchorElement|null} - Anchor element or null
 */
const findAnchorInPath = (event) => {
  // Get the event path (works for both regular DOM and shadow DOM)
  const path = event.composedPath();
  
  // Find the first anchor element in the event path
  for (let i = 0; i < path.length; i++) {
    if (path[i].tagName === 'A') {
      return path[i];
    }
  }
  
  return null;
};

/**
 * Check if a link should be handled by the router
 * @param {HTMLAnchorElement} anchor - Anchor element
 * @returns {boolean} - Whether the link should be handled
 */
const shouldHandleLink = (anchor) => {
  // Get the href attribute
  const href = anchor.getAttribute('href');
  
  // Skip if no href
  if (!href) {
    return false;
  }
  
  // Skip if it's an external link
  if (href.startsWith('http') || href.startsWith('//')) {
    return false;
  }
  
  // Skip if it has a target
  if (anchor.hasAttribute('target')) {
    return false;
  }
  
  // Skip if it's a download link
  if (anchor.hasAttribute('download')) {
    return false;
  }
  
  // Skip if it's an anchor link
  if (href.startsWith('#')) {
    return false;
  }
  
  // Skip if it's a file link (has extension)
  if (href.match(/\.\w+$/)) {
    return false;
  }
  
  return true;
};

var utils = {
  pathToRegex,
  extractParams,
  normalizePath,
  findAnchorInPath,
  shouldHandleLink
};

var utils$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: utils,
  extractParams: extractParams,
  findAnchorInPath: findAnchorInPath,
  normalizePath: normalizePath,
  pathToRegex: pathToRegex,
  shouldHandleLink: shouldHandleLink
});

/**
 * Transition effects for page changes
 */

/**
 * No transition effect
 * @returns {Function} Transition function
 */
const none = () => {
  return async (oldContent, newContent, rootElement) => {
    rootElement.innerHTML = newContent;
    return Promise.resolve();
  };
};

/**
 * Fade transition effect
 * @param {Object} options - Transition options
 * @param {number} options.duration - Transition duration in ms
 * @returns {Function} Transition function
 */
const fade = (options = {}) => {
  const duration = options.duration || 150;
  const onComplete = options.onComplete || (() => {});
  
  return async (oldContent, newContent, rootElement) => {
    return new Promise((resolve) => {
      // Create a full-screen overlay to hide everything during transition
      const transitionOverlay = document.createElement('div');
      transitionOverlay.className = 'transition-overlay';
      transitionOverlay.style.position = 'fixed';
      transitionOverlay.style.top = '0';
      transitionOverlay.style.left = '0';
      transitionOverlay.style.width = '100vw';
      transitionOverlay.style.height = '100vh';
      transitionOverlay.style.backgroundColor = 'var(--background-color, #ffffff)';
      transitionOverlay.style.zIndex = '9999';
      transitionOverlay.style.opacity = '0';
      transitionOverlay.style.transition = `opacity ${duration}ms ease-in-out`;
      
      // Add the overlay to the body
      document.body.appendChild(transitionOverlay);
      
      // Fade in the overlay
      setTimeout(() => {
        transitionOverlay.style.opacity = '1';
      }, 0);
      
      // Wait for the fade-in to complete
      setTimeout(() => {
        // Replace the content
        if (newContent instanceof DocumentFragment) {
          // Clear the root element
          rootElement.innerHTML = '';
          // Append the DocumentFragment
          rootElement.appendChild(newContent.cloneNode(true));
        } else if (typeof newContent === 'string') {
          // Set the HTML content
          rootElement.innerHTML = newContent;
        } else {
          console.error('Unsupported content type:', typeof newContent);
          rootElement.innerHTML = String(newContent);
        }
        
        // Fade out the overlay
        transitionOverlay.style.opacity = '0';
        
        // Remove the overlay after the transition completes
        setTimeout(() => {
          if (document.body.contains(transitionOverlay)) {
            document.body.removeChild(transitionOverlay);
          }
          
          // Call the onComplete callback
          onComplete();
          
          // Clean up any other transition overlays that might be stuck
          const overlays = document.querySelectorAll('.transition-overlay');
          overlays.forEach(overlay => {
            if (document.body.contains(overlay) && overlay !== transitionOverlay) {
              console.log('Removing stale transition overlay');
              document.body.removeChild(overlay);
            }
          });
          
          resolve();
        }, duration);
      }, duration);
      
      // Safety timeout to ensure overlay is removed even if something goes wrong
      setTimeout(() => {
        if (document.body.contains(transitionOverlay)) {
          console.log('Safety timeout: removing transition overlay');
          document.body.removeChild(transitionOverlay);
        }
      }, duration * 3);
    });
  };
};

/**
 * Slide transition effect
 * @param {Object} options - Transition options
 * @param {string} options.direction - Slide direction ('left', 'right', 'up', 'down')
 * @param {number} options.duration - Transition duration in ms
 * @returns {Function} Transition function
 */
const slide = (options = {}) => {
  const direction = options.direction || 'left';
  const duration = options.duration || 300;
  
  return async (oldContent, newContent, rootElement) => {
    return new Promise((resolve) => {
      // Create a container for the old content
      const oldContainer = document.createElement('div');
      oldContainer.style.position = 'absolute';
      oldContainer.style.top = '0';
      oldContainer.style.left = '0';
      oldContainer.style.width = '100%';
      oldContainer.style.height = '100%';
      oldContainer.style.transition = `transform ${duration}ms ease-in-out`;
      
      // Set old content
      if (typeof oldContent === 'string') {
        oldContainer.innerHTML = oldContent;
      } else {
        console.warn('Old content is not a string, using empty content');
        oldContainer.innerHTML = '';
      }
      
      // Create a container for the new content
      const newContainer = document.createElement('div');
      newContainer.style.position = 'absolute';
      newContainer.style.top = '0';
      newContainer.style.left = '0';
      newContainer.style.width = '100%';
      newContainer.style.height = '100%';
      newContainer.style.transition = `transform ${duration}ms ease-in-out`;
      
      // Set new content
      if (newContent instanceof DocumentFragment) {
        newContainer.appendChild(newContent.cloneNode(true));
      } else if (typeof newContent === 'string') {
        newContainer.innerHTML = newContent;
      } else {
        console.error('Unsupported content type:', typeof newContent);
        newContainer.innerHTML = String(newContent);
      }
      let finalTransform = '';
      
      switch (direction) {
        case 'left':
          finalTransform = 'translateX(-100%)';
          break;
        case 'right':
          finalTransform = 'translateX(100%)';
          break;
        case 'up':
          finalTransform = 'translateY(-100%)';
          break;
        case 'down':
          finalTransform = 'translateY(100%)';
          break;
      }
      
      // Clear the root element and add both containers
      rootElement.innerHTML = '';
      rootElement.style.position = 'relative';
      rootElement.style.overflow = 'hidden';
      rootElement.appendChild(oldContainer);
      rootElement.appendChild(newContainer);
      
      // Force a reflow to ensure the initial styles are applied
      newContainer.getBoundingClientRect();
      
      // Set initial transform for the new container
      newContainer.style.transform = 'translateX(0)';
      
      // Trigger the transition after a short delay
      setTimeout(() => {
        // Set the transform for the old container
        oldContainer.style.transform = finalTransform;
        
        // Clean up after the transition
        setTimeout(() => {
          // Clear the root element
          rootElement.innerHTML = '';
          
          // Add the new content
          if (newContent instanceof DocumentFragment) {
            rootElement.appendChild(newContent.cloneNode(true));
          } else if (typeof newContent === 'string') {
            rootElement.innerHTML = newContent;
          } else {
            console.error('Unsupported content type:', typeof newContent);
            rootElement.innerHTML = String(newContent);
          }
          
          // Reset styles
          rootElement.style.position = '';
          rootElement.style.overflow = '';
          resolve();
        }, duration);
      }, 10);
    });
  };
};

/**
 * Custom transition effect
 * @param {Function} fn - Custom transition function
 * @returns {Function} Transition function
 */
const custom = (fn) => {
  return async (oldContent, newContent, rootElement) => {
    return fn(oldContent, newContent, rootElement);
  };
};

var transitions = {
  none,
  fade,
  slide,
  custom
};

var transitions$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  custom: custom,
  default: transitions,
  fade: fade,
  none: none,
  slide: slide
});

/**
 * SPA Router using the History API
 */

/**
 * Router class for handling SPA navigation
 */
class Router {
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

/**
 * Component Loader Utility
 *
 * Handles automatic detection and loading of web components from HTML content
 */

/**
 * Extracts module script sources from HTML content
 * @param {Document} doc - Parsed HTML document
 * @returns {string[]} - Array of script sources
 */
function extractModuleScriptSources(doc) {
  // Extract script tags from both body and the entire document
  // This ensures we catch scripts at the root level of HTML fragments
  const bodyScriptTags = Array.from(doc.body.querySelectorAll('script[type="module"]'));
  const allScriptTags = Array.from(doc.querySelectorAll('script[type="module"]'));
  
  // Combine and deduplicate script tags
  const scriptTags = [...new Set([...bodyScriptTags, ...allScriptTags])];
  
  // Extract src attributes
  const scriptSources = scriptTags.map(script => script.getAttribute('src')).filter(src => src);
  
  if (scriptSources.length > 0) {
    console.log(`Found ${scriptSources.length} module scripts:`, scriptSources);
  }
  
  return scriptSources;
}

/**
 * Executes inline script tags from HTML content
 * @param {Document} doc - Parsed HTML document
 * @returns {Promise<number>} - Number of executed inline scripts
 */
/**
 * Execute inline scripts by replacing them with new script elements
 * This forces the browser to execute the scripts
 * @param {Document} doc - Parsed HTML document
 * @returns {number} - Number of executed inline scripts
 */
async function executeInlineScripts(doc) {
  return function reexecuteInlineScripts(container) {
    // Execute inline scripts only (ignore scripts with src)
    const scripts = container.querySelectorAll('script:not([src])');
    let count = scripts.length;
    
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      [...oldScript.attributes].forEach(attr =>
        newScript.setAttribute(attr.name, attr.value)
      );
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript); // Maintains position in DOM
    });
    
    return count;
  };
}

/**
 * Filters out script tags from HTML content
 * @param {HTMLElement} element - Element to filter scripts from
 * @param {boolean} keepScripts - Whether to keep script tags in the output (default: false)
 * @returns {DocumentFragment} - Document fragment with scripts removed or preserved
 */
function filterScriptTags(element, keepScripts = false) {
  const tempDiv = document.createElement('div');
  
  // Clone all child nodes, optionally excluding script tags
  Array.from(element.children).forEach(child => {
    if (keepScripts || child.tagName !== 'SCRIPT') {
      tempDiv.appendChild(child.cloneNode(true));
    }
  });
  
  return tempDiv;
}

/**
 * Extracts all script tags from a document and creates new script elements
 * that will be executed when added to the DOM
 * @param {Document} doc - Parsed HTML document
 * @returns {Array<HTMLScriptElement>} - Array of new script elements
 */
function extractAndCloneScripts(doc) {
  // Get all script tags from the document
  const scriptTags = Array.from(doc.querySelectorAll('script'));
  
  if (scriptTags.length > 0) {
    console.log(`Found ${scriptTags.length} script tags to clone`);
  }
  
  // Create new script elements with the same attributes and content
  return scriptTags.map(oldScript => {
    const newScript = document.createElement('script');
    
    // Copy all attributes
    Array.from(oldScript.attributes).forEach(attr => {
      newScript.setAttribute(attr.name, attr.value);
    });
    
    // Copy the content
    newScript.textContent = oldScript.textContent;
    
    // If it's a src script, ensure the URL is absolute
    if (newScript.src && !newScript.src.startsWith('http://') && !newScript.src.startsWith('https://')) {
      const baseUrl = window.location.origin;
      const absoluteSrc = newScript.src.startsWith('/')
        ? `${baseUrl}${newScript.src}`
        : `${baseUrl}/${newScript.src}`;
      newScript.src = absoluteSrc;
    }
    
    return newScript;
  });
}

/**
 * Creates a document fragment from HTML content and ensures scripts are properly handled
 * @param {Document} doc - Parsed HTML document
 * @returns {DocumentFragment} - Document fragment with content and scripts that will execute
 */
function createFragmentWithScripts(doc) {
  // Create a fragment to hold the content
  const fragment = document.createDocumentFragment();
  
  // Clone all children from the body
  Array.from(doc.body.children).forEach(child => {
    // Skip script tags, we'll handle them separately
    if (child.tagName !== 'SCRIPT') {
      fragment.appendChild(child.cloneNode(true));
    }
  });
  
  // Extract and clone script tags
  const scriptElements = extractAndCloneScripts(doc);
  
  // Add the script elements to the fragment
  scriptElements.forEach(script => {
    fragment.appendChild(script);
  });
  
  // Extract module script sources
  const moduleScripts = extractModuleScriptSources(doc);
  
  // Create and add module scripts to the fragment
  if (moduleScripts && moduleScripts.length > 0) {
    console.log(`Adding ${moduleScripts.length} module scripts to the fragment`);
    
    moduleScripts.forEach(src => {
      // Create a new script element
      const script = document.createElement('script');
      script.type = 'module';
      
      // Convert to absolute URL if needed
      if (src.startsWith('http://') || src.startsWith('https://')) {
        script.src = src;
      } else {
        // For local scripts, create absolute URL based on current origin
        const baseUrl = window.location.origin;
        const absoluteSrc = src.startsWith('/')
          ? `${baseUrl}${src}`
          : `${baseUrl}/${src}`;
        script.src = absoluteSrc;
      }
      
      console.log(`Adding module script: ${script.src}`);
      fragment.appendChild(script);
    });
  }
  
  return fragment;
}

var componentLoader = {
  extractModuleScriptSources,
  executeInlineScripts,
  filterScriptTags,
  extractAndCloneScripts,
  createFragmentWithScripts
};

var componentLoader$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  createFragmentWithScripts: createFragmentWithScripts,
  default: componentLoader,
  executeInlineScripts: executeInlineScripts,
  extractAndCloneScripts: extractAndCloneScripts,
  extractModuleScriptSources: extractModuleScriptSources,
  filterScriptTags: filterScriptTags
});

/**
 * Enhanced renderer for SPA Router
 * Provides component preservation and translation support
 */

/**
 * Create a content renderer that handles translations and component preservation
 * @param {Object} options - Renderer options
 * @param {Function} options.translateContainer - Function to translate a container
 * @param {Function} options.applyRTLToDocument - Function to apply RTL direction to document
 * @param {Boolean} options.handleScripts - Whether to handle scripts in content (default: true)
 * @param {Boolean} options.keepScripts - Whether to keep script tags in the output (default: false)
 * @returns {Function} Renderer function
 */
function createRenderer(options = {}) {
  const translateContainer = options.translateContainer || ((container) => {});
  const applyRTLToDocument = options.applyRTLToDocument || (() => {});
  const handleScripts = options.handleScripts !== false; // Default to true
  const keepScripts = options.keepScripts === true; // Default to false

  return async (content, element) => {
    // Create a new container with absolute positioning (off-screen)
    const newContainer = document.createElement('div');
    newContainer.style.position = 'absolute';
    newContainer.style.top = '0';
    newContainer.style.left = '0';
    newContainer.style.width = '100%';
    newContainer.style.height = '100%';
    newContainer.style.opacity = '0'; // Start hidden
    newContainer.style.zIndex = '1'; // Above the current content
    
    // Handle different content types
    let doc;
    
    if (content instanceof DocumentFragment) {
      console.log('Received DocumentFragment as content');
      // Create a temporary document to hold the fragment
      doc = document.implementation.createHTMLDocument('');
      
      // Clone the fragment to avoid modifying the original
      const clonedFragment = content.cloneNode(true);
      
      // Append the fragment to the document body
      doc.body.appendChild(clonedFragment);
    } else if (typeof content === 'string') {
      console.log('Received string as content');
      // Parse the content into DOM
      const parser = new DOMParser();
      doc = parser.parseFromString(content, 'text/html');
    } else {
      console.error('Unsupported content type:', typeof content);
      throw new Error('Unsupported content type: ' + typeof content);
    }
    
    // Handle scripts if enabled
    let scriptExecutor;
    let moduleScripts = [];
    let scriptElements = [];
    
    if (handleScripts) {
      // Extract module scripts but don't execute them yet
      // We'll store them to execute after the DOM is updated
      moduleScripts = extractModuleScriptSources(doc);
      
      // Get the script executor function to be called after content is added to DOM
      scriptExecutor = await executeInlineScripts();
      
      // If keepScripts is true, collect all script elements to be properly inserted later
      if (keepScripts) {
        console.log('Collecting script tags to properly insert them later');
        scriptElements = Array.from(doc.querySelectorAll('script')).map(script => {
          // Create a clone of the script element
          const newScript = document.createElement('script');
          
          // Copy all attributes
          Array.from(script.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          
          // Copy the content
          newScript.textContent = script.textContent;
          
          // Remove the original script from the DOM
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
          
          return newScript;
        });
        
        console.log(`Collected ${scriptElements.length} script elements`);
      } else {
        // Filter out script tags from the content
        const bodyWithoutScripts = filterScriptTags(doc.body, false);
        
        // Clear the body and append each child individually
        while (doc.body.firstChild) {
          doc.body.removeChild(doc.body.firstChild);
        }
        
        Array.from(bodyWithoutScripts.children).forEach(child => {
          doc.body.appendChild(child);
        });
      }
    }
    
    // Get all existing web components in the current DOM to preserve
    const existingComponents = {};
    const customElements = element.querySelectorAll('*').filter(el => el.tagName.includes('-'));
    
    customElements.forEach(el => {
      const id = el.tagName.toLowerCase();
      existingComponents[id] = el;
    });
    
    // Process the new content
    Array.from(doc.body.children).forEach(child => {
      // If it's a custom element that already exists, skip it (we'll keep the existing one)
      if (child.tagName.includes('-') && existingComponents[child.tagName.toLowerCase()]) {
        console.log(`Preserving existing component: ${child.tagName.toLowerCase()}`);
      } else {
        // Otherwise, add the new element to the container
        newContainer.appendChild(child);
      }
    });
    
    // Translate all text in new DOM
    if (translateContainer) {
      translateContainer(newContainer);
    }
    
    // Add preserved components back to the new container
    Object.values(existingComponents).forEach(component => {
      newContainer.appendChild(component);
    });
    
    // Add the new container to the DOM
    element.appendChild(newContainer);
    
    // Apply RTL direction if needed
    if (applyRTLToDocument) {
      applyRTLToDocument();
    }
    
    // Short delay to ensure everything is ready, then show new content and remove old
    setTimeout(() => {
      // Remove all old content
      Array.from(element.children).forEach(child => {
        if (child !== newContainer) {
          element.removeChild(child);
        }
      });
      
      // Show the new content by changing position and opacity
      newContainer.style.position = 'relative';
      newContainer.style.opacity = '1';
      
      // Execute inline scripts if we have a script executor
      if (scriptExecutor) {
        console.log('Executing inline scripts');
        scriptExecutor(newContainer);
      }
      
      // Insert collected script elements if keepScripts is true
      if (scriptElements && scriptElements.length > 0) {
        console.log(`Inserting ${scriptElements.length} script elements into the DOM`);
        scriptElements.forEach(script => {
          if (script.type === 'module') {
            console.log(`Inserting module script: ${script.src || 'inline'}`);
          } else {
            console.log(`Inserting regular script: ${script.src || 'inline'}`);
          }
          
          // If it's a src script, ensure the URL is absolute
          if (script.src && !script.src.startsWith('http://') && !script.src.startsWith('https://')) {
            const baseUrl = window.location.origin;
            const absoluteSrc = script.src.startsWith('/')
              ? `${baseUrl}${script.src}`
              : `${baseUrl}/${script.src}`;
            script.src = absoluteSrc;
          }
          
          // Append to the document to execute it
          document.head.appendChild(script);
        });
      }
      
      // Now that the DOM is updated, import and execute module scripts
      if (moduleScripts.length > 0) {
        console.log('Importing module scripts after DOM update');
        
        // Get the base URL of the current application
        const baseUrl = window.location.origin;
        
        // Import each module script
        moduleScripts.forEach(src => {
          // Create a new script element
          const script = document.createElement('script');
          script.type = 'module';
          
          // Convert to absolute URL if needed
          if (src.startsWith('http://') || src.startsWith('https://')) {
            script.src = src;
          } else {
            // For local scripts, create absolute URL based on current origin
            const absoluteSrc = src.startsWith('/')
              ? `${baseUrl}${src}`
              : `${baseUrl}/${src}`;
            script.src = absoluteSrc;
          }
          
          console.log(`Loading module script: ${script.src}`);
          document.head.appendChild(script);
        });
      }
      
      // Dispatch a custom event to notify that the SPA transition is complete
      window.dispatchEvent(new CustomEvent('spa-transition-end'));
    }, 50);
  };
}

/**
 * Create a default error handler
 * @param {Object} options - Error handler options
 * @returns {Function} Error handler function
 */
function createErrorHandler(options = {}) {
  return (path) => {
    return `
      <div class="error-page">
        <h1>404 - Page Not Found</h1>
        <p>The page "${path}" could not be found.</p>
        <a href="/" class="back-link">Go back to home</a>
      </div>
    `;
  };
}

var renderer = {
  createRenderer,
  createErrorHandler
};

var renderer$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  createErrorHandler: createErrorHandler,
  createRenderer: createRenderer,
  default: renderer
});

/**
 * @profullstack/spa-router
 * A lightweight, feature-rich SPA router with smooth transitions and Shadow DOM support
 */


// Export a default object for UMD builds
var index = {
  Router,
  transitions: transitions$1,
  utils: utils$1,
  renderer: renderer$1,
  componentLoader: componentLoader$1
};

export { Router, componentLoader$1 as componentLoader, index as default, renderer$1 as renderer, transitions$1 as transitions, utils$1 as utils };
//# sourceMappingURL=index.esm.js.map
