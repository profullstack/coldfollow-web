/**
 * Example: Adding a new route to the application
 * 
 * This file demonstrates how to add a new route using the route-helpers.js utilities.
 * This is just an example and is not meant to be included in the application.
 */
import { createRoutes } from '../route-helpers.js';

/**
 * Example function to initialize the new page
 */
function initNewFeaturePage() {
  console.log('Initializing new feature page');
  
  // Add event listeners and other initialization code
  const form = document.getElementById('new-feature-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('Form submitted');
      // Handle form submission
    });
  }
}

/**
 * Example: How to add a new route to the application
 * 
 * There are two main approaches:
 * 
 * 1. Add the route directly to the routes object in router.js
 * 2. Create a separate routes file and import it in router.js
 * 
 * This example demonstrates both approaches.
 */

// Approach 1: Add directly to the routes object in router.js
// In router.js, add to the createRoutes call:
/*
const routes = createRoutes({
  // ... existing routes
  
  // Add your new route
  '/new-feature': {
    viewPath: '/views/new-feature.html',
    afterRender: initNewFeaturePage,
    requireAuth: true  // If the route requires authentication
  }
});
*/

// Approach 2: Create a separate routes file
// Create a new file, e.g., feature-routes.js:
/*
import { createRoutes } from './route-helpers.js';
import { initNewFeaturePage } from './page-initializers.js';

export const featureRoutes = createRoutes({
  '/new-feature': {
    viewPath: '/views/new-feature.html',
    afterRender: initNewFeaturePage,
    requireAuth: true
  },
  '/another-feature': '/views/another-feature.html'
});
*/

// Then in router.js, import and merge the routes:
/*
import { featureRoutes } from './feature-routes.js';

export function defineRoutes(router) {
  console.log('Defining routes...');
  
  // Define core routes
  const coreRoutes = createRoutes({
    // ... existing routes
  });
  
  // Merge all routes
  const routes = {
    ...coreRoutes,
    ...featureRoutes
    // Add more route collections as needed
  };
  
  console.log('Routes defined:', Object.keys(routes));
  
  // Register routes
  if (typeof router.registerRoutes === 'function') {
    try {
      router.registerRoutes(routes);
      
      // Debug: Log registered routes
      if (router.routes) {
        console.log('Routes registered:', Object.keys(router.routes));
      } else {
        console.warn('Router has no routes property after registration');
      }
    } catch (error) {
      console.error('Error registering routes:', error);
    }
  } else {
    console.warn('Router does not have a registerRoutes method');
    
    // Fallback: Set routes directly if possible
    if (router) {
      router.routes = routes;
      console.log('Routes set directly on router object');
    }
  }
  
  // Initialize the router
  console.log('Router initializing...');
  if (typeof router.init === 'function') {
    try {
      router.init();
    } catch (error) {
      console.error('Error initializing router:', error);
    }
  } else {
    console.warn('Router does not have an init method');
  }
  
  return router;
}
*/

/**
 * Example: Creating a new route with different options
 */
const exampleRoutes = createRoutes({
  // Basic route - just specify the view path
  '/simple': '/views/simple.html',
  
  // Route with initialization function
  '/with-init': {
    viewPath: '/views/with-init.html',
    afterRender: () => console.log('Page initialized')
  },
  
  // Protected route requiring authentication
  '/protected': {
    viewPath: '/views/protected.html',
    requireAuth: true
  },
  
  // Route requiring subscription
  '/premium': {
    viewPath: '/views/premium.html',
    requireSubscription: true
  },
  
  // Route with custom guard
  '/custom-guard': {
    viewPath: '/views/custom-guard.html',
    beforeEnter: (to, from, next) => {
      // Custom logic to determine if navigation should proceed
      const userHasAccess = localStorage.getItem('user_role') === 'admin';
      if (userHasAccess) {
        next();
      } else {
        next('/access-denied');
      }
    }
  }
});

// This is just an example - don't export anything
console.log('Example routes defined:', Object.keys(exampleRoutes));