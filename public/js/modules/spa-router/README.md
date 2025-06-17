# @profullstack/spa-router

A lightweight, feature-rich SPA router with smooth transitions and Shadow DOM support.

## Features

- Simple API for defining routes
- Support for dynamic routes with parameters
- Smooth page transitions with customizable effects
- Shadow DOM support for intercepting clicks
- History API integration
- Route guards and middleware
- Lazy loading support
- Web component integration
- Enhanced renderer with component preservation and translation support

## Installation

```bash
npm install @profullstack/spa-router
```

Or with yarn:

```bash
yarn add @profullstack/spa-router
```

## Client-Side Installation

For browser environments, you can use CDNs to import the router directly without npm:

### Using ESM.sh (Recommended for better source maps)

```html
<script type="module">
  import { Router, transitions, renderer } from 'https://esm.sh/@profullstack/spa-router@1.5.0';
  
  // Initialize router
  const router = new Router({
    rootElement: '#app',
    transition: transitions.fade({ duration: 150 }),
    renderer: renderer.createRenderer()
  });
  
  // Define routes...
</script>
```

### Using jsDelivr (Direct file path for better debugging)

```html
<script type="module">
  import { Router, transitions, renderer } from 'https://cdn.jsdelivr.net/npm/@profullstack/spa-router@1.5.0/dist/index.esm.js';
  
  // Initialize router
  const router = new Router({
    rootElement: '#app',
    transition: transitions.fade({ duration: 150 }),
    renderer: renderer.createRenderer()
  });
  
  // Define routes...
</script>
```

## Basic Usage

```javascript
// Using npm package
import { Router, transitions } from '@profullstack/spa-router';

// Or using CDN
// import { Router, transitions } from 'https://esm.sh/@profullstack/spa-router@1.5.0';

// Or using jsDelivr
// import { Router, transitions } from 'https://cdn.jsdelivr.net/npm/@profullstack/spa-router@1.5.0/dist/index.esm.js';

// Initialize router
const router = new Router({
  rootElement: '#app',
  transition: transitions.fade({ duration: 150 })
});

// Define routes
router.registerRoutes({
  '/': {
    view: () => '<h1>Home Page</h1>'
  },
  '/about': {
    view: () => '<h1>About Page</h1>'
  },
  '/users/:id': {
    view: (params) => `<h1>User Profile: ${params.id}</h1>`
  }
});

// Programmatic navigation
document.querySelector('#nav-about').addEventListener('click', () => {
  router.navigate('/about');
});
```

## Advanced Usage

### Custom Transitions

```javascript
import { Router, transitions } from '@profullstack/spa-router';

const router = new Router({
  rootElement: '#app',
  transition: transitions.slide({ direction: 'left', duration: 300 })
});
```

### Enhanced Renderer

The router includes an enhanced renderer that supports component preservation and translations:

```javascript
import { Router, transitions, renderer } from '@profullstack/spa-router';

// Create a custom renderer with translation support
const customRenderer = renderer.createRenderer({
  // Function to translate a container
  translateContainer: (container) => {
    // Your translation logic here
    container.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = translate(key);
    });
  },
  
  // Function to apply RTL direction to document
  applyRTLToDocument: () => {
    // Your RTL logic here
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }
});

const router = new Router({
  rootElement: '#app',
  transition: transitions.fade({ duration: 300 }),
  renderer: customRenderer
});
```

### Route Guards

```javascript
router.registerRoutes({
  '/admin': {
    view: () => '<h1>Admin Dashboard</h1>',
    beforeEnter: (to, from, next) => {
      if (!isAuthenticated()) {
        return next('/login');
      }
      next();
    }
  }
});
```

### Middleware

```javascript
router.use(async (to, from, next) => {
  // Log all navigation
  console.log(`Navigating from ${from} to ${to.path}`);
  next();
});
```

### Lazy Loading Components

```javascript
router.registerRoutes({
  '/dashboard': {
    component: () => import('./components/dashboard.js')
  }
});
```

### Web Component Integration

```javascript
router.registerRoutes({
  '/api-keys': {
    component: 'api-key-manager',
    props: { apiVersion: 'v1' }
  }
});
```

## Server-Side Configuration

For SPA routing to work properly with direct URL access, you need to configure your server to redirect all requests to your index.html file. Here are examples for popular Node.js frameworks:

### Hono.js

```javascript
import { Hono } from 'hono';
import { serveStatic } from 'hono/serve-static';
import { join } from 'path';

const app = new Hono();

// Serve static files from the 'public' directory
app.use('/*', serveStatic({ root: './public' }));

// SPA fallback - redirect all unmatched routes to index.html
app.get('*', async (c) => {
  // Check if the request is for a file with extension
  const path = c.req.path;
  if (path.match(/\.\w+$/)) {
    // Let the static middleware handle it
    return c.next();
  }
  
  // Otherwise serve index.html for SPA routing
  return c.html(
    await Bun.file(join(process.cwd(), 'public', 'index.html')).text()
  );
});

export default app;
```

### Express.js

```javascript
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file directory with ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Serve static files from the 'public' directory
app.use(express.static(join(__dirname, 'public')));

// SPA fallback - redirect all unmatched routes to index.html
app.get('*', (req, res) => {
  // Check if the request is for a file with extension
  if (req.path.match(/\.\w+$/)) {
    // Let Express handle 404 for missing files
    return res.status(404).send('Not found');
  }
  
  // Otherwise serve index.html for SPA routing
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Koa.js

```javascript
import Koa from 'koa';
import serve from 'koa-static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createReadStream } from 'fs';

// Get current file directory with ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = new Koa();

// Serve static files from the 'public' directory
app.use(serve(join(__dirname, 'public')));

// SPA fallback - redirect all unmatched routes to index.html
app.use(async (ctx) => {
  // Check if the request is for a file with extension
  if (ctx.path.match(/\.\w+$/)) {
    // Let koa-static handle 404 for missing files
    return;
  }
  
  // Otherwise serve index.html for SPA routing
  ctx.type = 'html';
  ctx.body = createReadStream(join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## API Reference

### Router

#### Constructor Options

- `rootElement`: CSS selector for the root element where content will be rendered
- `transition`: Transition effect to use for page changes
- `renderer`: Custom renderer function for content rendering
- `errorHandler`: Custom 404 error handler

#### Methods

- `navigate(path, pushState = true)`: Navigate to a path
- `registerRoutes(routes)`: Register multiple routes
- `addRoute(path, routeConfig)`: Add a single route
- `removeRoute(path)`: Remove a route
- `getCurrentRoute()`: Get the current route
- `back()`: Go back in history
- `forward()`: Go forward in history
- `use(middleware)`: Add middleware

### Transitions

- `fade(options)`: Fade transition
- `slide(options)`: Slide transition
- `none()`: No transition
- `custom(fn)`: Custom transition function

### Renderer

- `createRenderer(options)`: Create a custom renderer with component preservation and translation support
- `createErrorHandler(options)`: Create a custom error handler

## License

MIT