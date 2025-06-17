/**
 * Route Helper Utilities
 * 
 * This module provides helper functions to simplify route creation and registration
 * for the SPA router.
 */
import { loadPage } from './router.js';

/**
 * Check if a user has access based on subscription status or admin privileges
 * @param {Object} user - User object
 * @returns {boolean} - Whether the user has access
 */
function hasAccess(user) {
  if (!user) return false;
  
  // Admin users always have access
  if (user.is_admin === true) return true;
  
  // Otherwise, check for active subscription
  return user.subscription?.status === 'active';
}

/**
 * Create a route configuration object with common patterns
 * 
 * @param {string} viewPath - Path to the view HTML file
 * @param {Object} options - Route options
 * @param {Function} options.afterRender - Function to run after rendering
 * @param {Function} options.beforeEnter - Function to run before entering route
 * @param {boolean} options.requireAuth - Whether the route requires authentication
 * @param {boolean} options.requireSubscription - Whether the route requires an active subscription
 * @returns {Object} Route configuration object
 */
export function createRoute(viewPath, options = {}) {
  const route = {
    view: () => loadPage(viewPath)
  };
  
  // Add afterRender hook if provided
  if (options.afterRender) {
    route.afterRender = options.afterRender;
  }
  
  // Add beforeEnter hook if provided or if auth/subscription is required
  if (options.requireAuth || options.requireSubscription || options.beforeEnter) {
    route.beforeEnter = async (to, from, next) => {
      try {
        // Check authentication if required
        if (options.requireAuth || options.requireSubscription) {
          const { checkAuthStatus } = await import('./utils/auth-status.js');
          const status = await checkAuthStatus();
          
          if (!status.authenticated) {
            console.log('Authentication required, redirecting to login');
            return next('/login');
          }
          
          // Check subscription if required
          if (options.requireSubscription) {
            const userJson = localStorage.getItem('user');
            if (userJson) {
              const user = JSON.parse(userJson);

              const hasAccess = await apiKeyService.hasAccess(user.email);
              
              if (!hasAccess) {
                console.log('Subscription required, redirecting to subscription page');
                alert('You need an active subscription to access this page.');
                return next('/subscription');
              }
            } else {
              console.log('No user data found, redirecting to subscription page');
              return next('/subscription');
            }
          }
        }
        
        // Call original beforeEnter if provided
        if (options.beforeEnter) {
          return options.beforeEnter(to, from, next);
        }
        
        next();
      } catch (error) {
        console.error('Error in route guard:', error);
        return next('/login');
      }
    };
  }
  
  return route;
}

/**
 * Register multiple routes at once
 * 
 * @param {Object} routeDefinitions - Object mapping paths to route definitions
 * @returns {Object} Routes object ready for registration
 */
export function createRoutes(routeDefinitions) {
  const routes = {};
  
  // Process each route definition
  Object.entries(routeDefinitions).forEach(([path, definition]) => {
    // If definition is a string, treat it as a view path
    if (typeof definition === 'string') {
      routes[path] = createRoute(definition);
    } 
    // If definition is an object with a viewPath property
    else if (definition.viewPath) {
      routes[path] = createRoute(definition.viewPath, {
        afterRender: definition.afterRender,
        beforeEnter: definition.beforeEnter,
        requireAuth: definition.requireAuth,
        requireSubscription: definition.requireSubscription
      });
    } 
    // If definition is already a route config object
    else {
      routes[path] = definition;
    }
    
    // Add alias with .html extension (except for root path)
    if (path !== '/') {
      routes[`${path}.html`] = routes[path];
    }
  });
  
  return routes;
}