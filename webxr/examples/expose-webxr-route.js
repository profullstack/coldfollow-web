/**
 * How to Expose the /webxr Route to the Main App
 * 
 * This example shows the minimal code needed to expose the WebXR experience
 * at the /webxr route in your main application.
 */

// Step 1: Import the necessary modules in your main app's index.js
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import { fileURLToPath } from 'url';

// Step 2: Create your main Hono app instance
const mainApp = new Hono();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Step 3: Create a sub-router for the WebXR experience
const webxrRouter = new Hono();

// Step 4: Configure the WebXR router to serve the WebXR files
// Serve the WebXR index.html for the root path
webxrRouter.get('/', async (c) => {
  const indexPath = path.join(__dirname, '..', 'webxr', 'index.html');
  try {
    const indexContent = await fs.readFile(indexPath, 'utf-8');
    return c.html(indexContent);
  } catch (error) {
    console.error(`Error serving WebXR index.html: ${error.message}`);
    return c.text('Internal Server Error', 500);
  }
});

// Serve static files from the WebXR directory
webxrRouter.use('/*', serveStatic({ root: './webxr' }));

// Step 5: Mount the WebXR router at the /webxr path in your main app
mainApp.route('/webxr', webxrRouter);

// Step 6: Make sure your SPA routing middleware doesn't interfere with WebXR routes
mainApp.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  const pathname = url.pathname;
  
  // Skip API routes and WebXR routes
  if (pathname.startsWith('/api/') || pathname.startsWith('/webxr/')) {
    return next();
  }
  
  // Handle other SPA routes...
  // ...
  
  return next();
});

// Rest of your main app code...
// ...

/**
 * Alternative: Using the provided integration helper
 * 
 * Instead of the steps above, you can use the provided integration helper:
 */

// Import the integration helper
import { integrateWebXR } from '../hono-integration.js';

// Create your main Hono app
const exampleApp = new Hono();

// Integrate WebXR with one line of code
integrateWebXR(exampleApp);

// Rest of your main app code...
// ...

/**
 * How It Works
 * 
 * 1. The WebXR router is created to handle requests to the /webxr path
 * 2. It serves the WebXR index.html file for the root path (/webxr/)
 * 3. It serves all static files from the WebXR directory for other paths (/webxr/*)
 * 4. The WebXR router is mounted at the /webxr path in the main app
 * 5. The SPA routing middleware is configured to skip WebXR routes
 * 
 * This ensures that:
 * - The WebXR experience is accessible at http://your-domain.com/webxr
 * - All WebXR assets (JS, CSS, etc.) are properly served
 * - The WebXR routes don't interfere with the main app's routing
 */