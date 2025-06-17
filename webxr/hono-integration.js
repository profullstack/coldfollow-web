/**
 * WebXR Integration with Hono.js
 * 
 * This file demonstrates how to integrate the WebXR experience with the main application
 * using Hono.js to serve it at the /webxr URL path.
 */

import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Create a Hono router for the WebXR experience
 * @returns {Hono} A Hono router for the WebXR experience
 */
export function createWebXRRouter() {
  const webxrRouter = new Hono();
  
  // Serve the WebXR index.html for the root path
  webxrRouter.get('/', async (c) => {
    const indexPath = path.join(__dirname, 'webxr', 'index.html');
    return c.html(await Bun.file(indexPath).text());
  });
  
  // Serve static files from the WebXR directory
  webxrRouter.use('/*', serveStatic({ root: './webxr' }));
  
  return webxrRouter;
}

/**
 * Integrate the WebXR experience with the main Hono app
 * @param {Hono} app - The main Hono app
 */
export function integrateWebXR(app) {
  // Create the WebXR router
  const webxrRouter = createWebXRRouter();
  
  // Mount the WebXR router at the /webxr path
  app.route('/webxr', webxrRouter);
  
  console.log('WebXR experience integrated at /webxr path');
}

/**
 * Usage example:
 * 
 * import { Hono } from 'hono';
 * import { serve } from '@hono/node-server';
 * import { integrateWebXR } from './webxr/hono-integration.js';
 * 
 * const app = new Hono();
 * 
 * // Integrate WebXR experience
 * integrateWebXR(app);
 * 
 * // Other routes and middleware
 * app.get('/', (c) => c.text('Hello World!'));
 * 
 * // Start the server
 * serve({
 *   fetch: app.fetch,
 *   port: 3000
 * });
 */