# Adding a New Route/Page/Component

This guide explains how to add a new route, page, or component to the application using our router setup.

## Overview

Our application uses a Single Page Application (SPA) router with helper utilities that simplify adding and managing routes. The router handles page transitions, authentication checks, and subscription requirements with minimal code.

## Step-by-Step Guide

### 1. Create the HTML View File

First, create an HTML file for your new page in the `/views` directory:

```html
<!-- /views/my-new-feature.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My New Feature</title>
  <link rel="stylesheet" href="/css/main.css">
</head>
<body>
  <div class="my-feature-container">
    <h1 data-i18n="my_feature.title">My New Feature</h1>
    <p data-i18n="my_feature.description">This is my new feature page.</p>
    
    <!-- Your page content here -->
    <div class="feature-content">
      <form id="my-feature-form">
        <!-- Form fields -->
        <button type="submit" data-i18n="my_feature.submit">Submit</button>
      </form>
    </div>
  </div>
</body>
</html>
```

### 2. Create an Initializer Function (Optional)

If your page needs JavaScript initialization (event listeners, data loading, etc.), create an initializer function in `page-initializers.js`:

```javascript
/**
 * Initialize the new feature page
 */
export function initMyNewFeaturePage() {
  console.log('Initializing my new feature page');
  
  // Get elements
  const form = document.getElementById('my-feature-form');
  if (!form) {
    console.error('My feature form not found');
    return;
  }
  
  // Add event listeners
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Form submission logic
    console.log('Form submitted');
    
    // Get form data
    const formData = new FormData(form);
    const formDataObj = Object.fromEntries(formData.entries());
    
    // Process the form data
    console.log('Form data:', formDataObj);
    
    // Additional logic...
  });
  
  // Other initialization code...
}
```

Don't forget to export the initializer function at the top of the file:

```javascript
export {
  // ... existing exports
  initMyNewFeaturePage
} from './page-initializers.js';
```

### 3. Add the Route to the Router

#### Approach 1: Add Directly to router.js

Open `router.js` and add your new route to the `createRoutes` call in the `defineRoutes` function:

```javascript
// In router.js
export function defineRoutes(router) {
  console.log('Defining routes...');
  
  // Define routes using the createRoutes helper
  const routes = createRoutes({
    // Existing routes...
    '/': '/views/home.html',
    
    // Add your new route
    '/my-new-feature': {
      viewPath: '/views/my-new-feature.html',
      afterRender: initMyNewFeaturePage, // Optional
      requireAuth: true  // If the route requires authentication
    }
  });
  
  // Rest of the function...
}
```

#### Approach 2: Create a Separate Routes File

For better organization in larger applications, you can create a separate file for related routes:

```javascript
// feature-routes.js
import { createRoutes } from './route-helpers.js';
import { initMyNewFeaturePage } from './page-initializers.js';

export const featureRoutes = createRoutes({
  '/my-new-feature': {
    viewPath: '/views/my-new-feature.html',
    afterRender: initMyNewFeaturePage,
    requireAuth: true
  },
  '/my-new-feature/settings': {
    viewPath: '/views/my-new-feature-settings.html',
    requireAuth: true
  }
});
```

Then import and merge these routes in `router.js`:

```javascript
// In router.js
import { featureRoutes } from './feature-routes.js';

export function defineRoutes(router) {
  console.log('Defining routes...');
  
  // Define core routes
  const coreRoutes = createRoutes({
    // Existing routes...
  });
  
  // Merge all routes
  const routes = {
    ...coreRoutes,
    ...featureRoutes
    // Add more route collections as needed
  };
  
  // Register routes with the router
  router.registerRoutes(routes);
  
  // Rest of the function...
}
```

## Route Configuration Options

When adding a route, you can use these options:

| Option | Type | Description |
|--------|------|-------------|
| `viewPath` | String | Path to the HTML view file |
| `afterRender` | Function | Function to run after the page is rendered |
| `beforeEnter` | Function | Function to run before entering the route |
| `requireAuth` | Boolean | Whether the route requires authentication |
| `requireSubscription` | Boolean | Whether the route requires an active subscription |

## Examples

### Basic Route

```javascript
'/about': '/views/about.html'
```

### Route with Initialization

```javascript
'/profile': {
  viewPath: '/views/profile.html',
  afterRender: initProfilePage
}
```

### Protected Route (Requires Authentication)

```javascript
'/dashboard': {
  viewPath: '/views/dashboard.html',
  requireAuth: true
}
```

### Premium Route (Requires Subscription)

```javascript
'/premium-feature': {
  viewPath: '/views/premium-feature.html',
  requireSubscription: true
}
```

### Route with Custom Guard

```javascript
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
```

## Testing Your New Route

After adding the route, you can test it by navigating to the URL in your browser:

```
http://localhost:3000/my-new-feature
```

The router will handle loading the HTML, running the initializer function, and checking authentication if required.

## Best Practices

1. **Organize Related Routes**: Keep related routes together, either in the same section of `router.js` or in a separate routes file.

2. **Use Descriptive Route Names**: Choose route paths that clearly describe the feature or page.

3. **Follow Naming Conventions**: Use consistent naming for HTML files, initializer functions, and route paths.

4. **Handle Authentication Properly**: Use the `requireAuth` option for protected routes instead of implementing custom checks.

5. **Add Internationalization**: Use `data-i18n` attributes for text that needs to be translated.

6. **Clean Up Event Listeners**: If your initializer adds event listeners, make sure to remove them when the page is unloaded to prevent memory leaks.

7. **Test Thoroughly**: Test your new route with different scenarios (logged in, logged out, with/without subscription) to ensure it behaves correctly.

## Using the Generator Script

The generator script provides tools for creating various components for both client-side and server-side development.

### Prerequisites

Make sure the script is executable:

```bash
chmod +x bin/generator.js
```

### Command Structure

The generator now uses a category-based command structure:

```bash
./bin/generator.js <category> <command> [options]
```

Categories:
- `client`: Client-side generators
- `server`: Server-side generators

### Client-Side Commands

#### Generate a Client Route

```bash
./bin/generator.js client route --route="/my-feature" --name="My Feature" [--auth] [--subscription]
```

Options:
- `--route`: The route path (required, e.g., "/my-feature")
- `--name`: The feature name (required, e.g., "My Feature")
- `--auth`: Add this flag if the route requires authentication
- `--subscription`: Add this flag if the route requires an active subscription

Example:
```bash
./bin/generator.js client route --route="/contact-us" --name="Contact Us"
```

This will:
1. Create a new HTML view file at `public/views/contact-us.html`
2. Add an initializer function `initContactUsPage` to `public/js/page-initializers.js`
3. Add the route to `public/js/router.js`

#### Generate a Client Component

```bash
./bin/generator.js client component --name="MyComponent" [--tag="my-component"] [--description="Description"]
```

Options:
- `--name`: Component name (required, e.g., "UserCard" or "DataTable")
- `--tag`: Custom HTML tag name (optional, default: kebab-case of component name)
- `--description`: Component description (optional)

Example:
```bash
./bin/generator.js client component --name="UserCard" --tag="user-card" --description="A custom component for displaying user information"
```

This will:
1. Create a new web component file at `public/js/components/user-card.js`
2. Set up the component to extend BaseComponent with Shadow DOM
3. Include template, styles, and event handling

### Server-Side Commands

#### Generate a Server Route

```bash
./bin/generator.js server route --path="/api/v1/users" --controller="UserController" --method="get"
```

Options:
- `--path`: The API path (required, e.g., "/api/v1/users")
- `--controller`: The controller name (required, e.g., "UserController")
- `--method`: The HTTP method (required, e.g., "get", "post", "put", "delete", "patch")

Example:
```bash
./bin/generator.js server route --path="/api/v1/users" --controller="User" --method="get"
```

This will add a new route to the appropriate route file in the `src/routes` directory.

#### Generate a Database Migration

```bash
./bin/generator.js server migration --name="add_user_fields"
```

Options:
- `--name`: The migration name (required, e.g., "add_user_fields")

Example:
```bash
./bin/generator.js server migration --name="add_user_profile_fields"
```

This will create a timestamped SQL migration file in the `supabase/migrations` directory. The migration file includes clearly separated sections for "up" migrations (changes to apply) and "down" migrations (how to revert the changes).

#### Generate a Controller

```bash
./bin/generator.js server controller --name="UserController"
```

Options:
- `--name`: The controller name (required, e.g., "UserController" or "User")

Example:
```bash
./bin/generator.js server controller --name="User"
```

This will create a new controller file with standard CRUD methods in the `src/controllers` directory.

### Backward Compatibility

For backward compatibility, the old command format is still supported but will show a deprecation warning:

```bash
./bin/generator.js route --route="/my-feature" --name="My Feature"  # Deprecated
```

### Getting Help

For general help:
```bash
./bin/generator.js --help
```

For command-specific help:
```bash
./bin/generator.js client route --help
./bin/generator.js client component --help
./bin/generator.js server route --help
./bin/generator.js server migration --help
./bin/generator.js server controller --help
```

After running the generator, you can customize the generated files to fit your specific requirements.

## Template-Based Generation

The generator script uses a template-based approach for creating files. Templates are stored in the `templates` directory and are organized by category and type:

```
templates/
├── client/
│   ├── route/
│   │   ├── view.html.template
│   │   ├── view.js.template
│   │   └── initializer.js.template
│   └── component/
│       └── component.js.template
└── server/
    ├── controller.js.template
    ├── route.js.template
    └── migration.sql.template
```

### Benefits of Template-Based Generation

1. **Separation of Concerns**: Templates are separate from the generator code, making maintenance easier
2. **Consistency**: All generated files follow the same structure and style
3. **Customization**: Templates can be modified without changing the generator code
4. **Flexibility**: New templates can be added for additional file types

### Customizing Templates

If you need to modify the structure or content of generated files, you can edit the templates directly. Templates use placeholders like `{{kebabCase}}`, `{{featureName}}`, and `{{controllerName}}` that are replaced with actual values during generation.

For example, to change the structure of generated HTML views, edit `templates/client/route/view.html.template`.