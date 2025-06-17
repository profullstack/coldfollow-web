# @profullstack/enhanced-router

An enhanced SPA router with transition management, layout management, and i18n integration. Built on top of [@profullstack/spa-router](https://github.com/profullstack/spa-router).

## Features

- **Layout Management**: Apply consistent layouts to your routes
- **Transition Effects**: Smooth transitions between routes with proper cleanup
- **i18n Integration**: Seamless integration with internationalization
- **Middleware Support**: Add custom middleware for authentication, logging, etc.
- **Error Handling**: Customizable error pages with layout support

## Installation

```bash
npm install @profullstack/enhanced-router
```

## Basic Usage

```javascript
import { createRouter } from '@profullstack/enhanced-router';

// Create the router
const router = createRouter({
  rootElement: '#app',
  transition: {
    type: 'fade',
    duration: 300
  }
});

// Define routes
const routes = {
  '/': {
    view: () => '<h1>Home</h1><p>Welcome to the home page</p>',
    layout: 'default'
  },
  '/about': {
    view: () => '<h1>About</h1><p>This is the about page</p>',
    layout: 'default'
  },
  '/contact': {
    view: () => '<h1>Contact</h1><p>This is the contact page</p>',
    layout: 'minimal'
  }
};

// Register routes
router.registerRoutes(routes);

// Initialize the router
router.init();
```

## API Reference

### Creating a Router

```javascript
import { createRouter } from '@profullstack/enhanced-router';

const router = createRouter({
  // Root element selector (required)
  rootElement: '#app',
  
  // Transition options (optional)
  transition: {
    type: 'fade', // 'fade', 'slide', or 'none'
    duration: 300, // Duration in milliseconds
    easing: 'ease', // CSS easing function
    preventClicks: true // Prevent clicks during transition
  },
  
  // Layout options (optional)
  layouts: {
    // Custom layouts
    custom: content => {
      // Create and return a DocumentFragment with the content
    }
  },
  
  // i18n options (optional)
  i18n: {
    localizer: myLocalizer, // Your localizer object
    defaultLanguage: 'en',
    languages: ['en', 'fr', 'es'],
    rtlLanguages: ['ar', 'he']
  },
  
  // Other options
  disableAutoInit: false, // Disable auto-initialization
  errorHandler: (path, error) => {
    // Custom error handler
  }
});
```

### Defining Routes

```javascript
const routes = {
  '/': {
    // View function that returns HTML string, DocumentFragment, or Node
    view: () => '<h1>Home</h1>',
    
    // Layout to use (optional, defaults to 'default')
    layout: 'default',
    
    // Before enter hook (optional)
    beforeEnter: (to, from, next) => {
      // Check authentication, etc.
      next(); // Continue to the route
      // Or redirect: next('/login');
    },
    
    // After render hook (optional)
    afterRender: () => {
      // Initialize components, etc.
    }
  },
  
  // Dynamic route parameters
  '/users/:id': {
    view: (params) => `<h1>User ${params.id}</h1>`,
    layout: 'default'
  }
};

// Register routes
router.registerRoutes(routes);
```

### Navigation

```javascript
// Navigate to a path
router.navigate('/about');

// Navigate with options
router.navigate('/users/123', {
  replace: true, // Replace current history entry
  data: { foo: 'bar' } // Custom data to pass to the route
});
```

### Middleware

```javascript
// Add middleware
router.use((to, from, next) => {
  // Log navigation
  console.log(`Navigating from ${from} to ${to.path}`);
  
  // Continue to the next middleware or route
  next();
  
  // Or redirect
  // next('/login');
});
```

## Layout Management

The enhanced router provides a powerful layout management system that allows you to apply consistent layouts to your routes.

### Default Layouts

The router comes with three default layouts:

- `default`: Standard layout with header, content, and footer
- `minimal`: Minimal layout with just the content
- `error`: Error layout for error pages

### Custom Layouts

You can define custom layouts when creating the router:

```javascript
const router = createRouter({
  layouts: {
    custom: content => {
      // Create a document fragment with the custom layout
      const fragment = document.createDocumentFragment();
      
      // Create header
      const header = document.createElement('header');
      header.className = 'custom-header';
      fragment.appendChild(header);
      
      // Create content container
      const contentDiv = document.createElement('main');
      contentDiv.className = 'custom-content';
      
      // Add the content
      if (typeof content === 'string') {
        const range = document.createRange();
        const parsedContent = range.createContextualFragment(content);
        contentDiv.appendChild(parsedContent);
      } else if (content instanceof DocumentFragment) {
        contentDiv.appendChild(content);
      } else if (content instanceof Node) {
        contentDiv.appendChild(content);
      }
      
      fragment.appendChild(contentDiv);
      
      // Create footer
      const footer = document.createElement('footer');
      footer.className = 'custom-footer';
      fragment.appendChild(footer);
      
      return fragment;
    }
  }
});
```

You can also register layouts after creating the router:

```javascript
router.getLayoutManager().registerLayout('dashboard', content => {
  // Create and return a DocumentFragment with the content
});
```

### Using Layouts in Routes

```javascript
const routes = {
  '/': {
    view: () => '<h1>Home</h1>',
    layout: 'default' // Use the default layout
  },
  '/dashboard': {
    view: () => '<h1>Dashboard</h1>',
    layout: 'dashboard' // Use the dashboard layout
  }
};
```

## Transition Effects

The enhanced router provides smooth transition effects between routes.

### Built-in Transitions

- `fade`: Fade out the old content and fade in the new content
- `slide`: Slide out the old content to the left and slide in the new content from the right
- `none`: No transition effect

### Custom Transitions

You can define custom transitions:

```javascript
import { createTransitions } from '@profullstack/enhanced-router';

const customTransition = (fromEl, toEl) => {
  return new Promise(resolve => {
    // Implement your custom transition
    // ...
    
    // Resolve the promise when the transition is complete
    setTimeout(resolve, 500);
  });
};

const router = createRouter({
  transition: {
    transition: customTransition
  }
});
```

## i18n Integration

The enhanced router provides seamless integration with internationalization.

### Basic Integration

```javascript
const router = createRouter({
  i18n: {
    localizer: myLocalizer, // Your localizer object
    defaultLanguage: 'en',
    languages: ['en', 'fr', 'es'],
    rtlLanguages: ['ar', 'he']
  }
});
```

### Using i18n in Routes

```javascript
const routes = {
  '/': {
    view: () => {
      const content = document.createDocumentFragment();
      
      const heading = document.createElement('h1');
      heading.textContent = 'Home';
      heading.setAttribute('data-i18n', 'home.title');
      content.appendChild(heading);
      
      const paragraph = document.createElement('p');
      paragraph.textContent = 'Welcome to the home page';
      paragraph.setAttribute('data-i18n', 'home.welcome');
      content.appendChild(paragraph);
      
      return content;
    }
  }
};
```

## Examples

See the [examples](./examples) directory for complete usage examples.

## License

MIT