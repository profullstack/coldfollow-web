# Route Helper Utilities

This document explains how to use the route helper utilities to simplify adding and managing routes in the SPA application.

## Overview

The route helper utilities provide a more concise and maintainable way to define routes for the SPA router. They handle common patterns like authentication checks, subscription requirements, and page initialization.

## Key Features

- **Simplified Route Definition**: Define routes with minimal code
- **Authentication Handling**: Built-in support for protected routes
- **Subscription Checks**: Easy way to require active subscriptions for premium routes
- **Modular Route Organization**: Support for organizing routes in separate files
- **Consistent Route Behavior**: Standardized handling of route transitions and guards

## Usage

### Basic Route Definition

The simplest way to define a route is to provide just the path to the view HTML file:

```javascript
import { createRoutes } from './route-helpers.js';

const routes = createRoutes({
  '/about': '/views/about.html'
});
```

### Route with Initialization Function

To run code after a route is rendered, use the `afterRender` option:

```javascript
const routes = createRoutes({
  '/profile': {
    viewPath: '/views/profile.html',
    afterRender: () => initProfilePage()
  }
});
```

### Protected Routes

To require authentication for a route, use the `requireAuth` option:

```javascript
const routes = createRoutes({
  '/dashboard': {
    viewPath: '/views/dashboard.html',
    requireAuth: true
  }
});
```

### Premium Routes

To require an active subscription, use the `requireSubscription` option:

```javascript
const routes = createRoutes({
  '/premium-feature': {
    viewPath: '/views/premium-feature.html',
    requireSubscription: true
  }
});
```

### Custom Route Guards

For more complex access control, use the `beforeEnter` option:

```javascript
const routes = createRoutes({
  '/admin': {
    viewPath: '/views/admin.html',
    beforeEnter: (to, from, next) => {
      const userRole = localStorage.getItem('user_role');
      if (userRole === 'admin') {
        next();
      } else {
        next('/access-denied');
      }
    }
  }
});
```

## Organizing Routes

For larger applications, you can organize routes in separate files:

### Feature-specific Routes

```javascript
// feature-routes.js
import { createRoutes } from './route-helpers.js';
import { initFeaturePage } from './page-initializers.js';

export const featureRoutes = createRoutes({
  '/feature': {
    viewPath: '/views/feature.html',
    afterRender: initFeaturePage
  },
  '/feature/settings': {
    viewPath: '/views/feature-settings.html',
    requireAuth: true
  }
});
```

### Merging Routes

```javascript
// router.js
import { createRoutes } from './route-helpers.js';
import { featureRoutes } from './feature-routes.js';
import { adminRoutes } from './admin-routes.js';

export function defineRoutes(router) {
  // Define core routes
  const coreRoutes = createRoutes({
    '/': '/views/home.html',
    '/login': {
      viewPath: '/views/login.html',
      afterRender: initLoginPage
    }
  });
  
  // Merge all routes
  const routes = {
    ...coreRoutes,
    ...featureRoutes,
    ...adminRoutes
  };
  
  // Register routes with the router
  router.registerRoutes(routes);
  router.init();
  
  return router;
}
```

## Adding a New Route

To add a new route to the application:

1. Create the HTML view file in the `/views` directory
2. If needed, create an initialization function in `page-initializers.js`
3. Add the route to the routes object in `router.js` using the `createRoutes` helper

Example:

```javascript
// In router.js
const routes = createRoutes({
  // ... existing routes
  
  // Add your new route
  '/new-feature': {
    viewPath: '/views/new-feature.html',
    afterRender: initNewFeaturePage,
    requireAuth: true  // If the route requires authentication
  }
});
```

For more detailed examples, see the `examples/add-new-route-example.js` file.

## API Reference

### `createRoute(viewPath, options)`

Creates a single route configuration object.

Parameters:
- `viewPath`: Path to the view HTML file
- `options`: Route options
  - `afterRender`: Function to run after rendering
  - `beforeEnter`: Function to run before entering route
  - `requireAuth`: Whether the route requires authentication
  - `requireSubscription`: Whether the route requires an active subscription

### `createRoutes(routeDefinitions)`

Creates multiple route configuration objects.

Parameters:
- `routeDefinitions`: Object mapping paths to route definitions
  - Keys are route paths
  - Values can be:
    - String: Path to view HTML file
    - Object: Route configuration with `viewPath` and options