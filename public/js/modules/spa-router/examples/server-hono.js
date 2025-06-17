/**
 * Example Hono.js server with SPA routing support
 * 
 * To run this example:
 * 1. Install dependencies: npm install hono
 * 2. Run with Bun: bun run server-hono.js
 */

import { Hono } from 'hono';
import { serveStatic } from 'hono/serve-static';
import { join } from 'path';
import { readFileSync } from 'fs';

const app = new Hono();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use('/*', serveStatic({ root: './' }));

// SPA fallback - redirect all unmatched routes to index.html
app.get('*', async (c) => {
  // Check if the request is for a file with extension
  const path = c.req.path;
  if (path.match(/\.\w+$/)) {
    // Let the static middleware handle it
    return c.next();
  }
  
  // Otherwise serve index.html for SPA routing
  try {
    // Using readFileSync for simplicity in this example
    // In production, you might want to use async file reading
    const indexHtml = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');
    return c.html(indexHtml);
  } catch (error) {
    console.error('Error serving index.html:', error);
    return c.text('Server Error', 500);
  }
});

console.log(`Starting Hono server on http://localhost:${PORT}`);

// For Bun
export default {
  port: PORT,
  fetch: app.fetch
};

// For Node.js with Hono's serve helper
// import { serve } from '@hono/node-server';
// serve({
//   fetch: app.fetch,
//   port: PORT
// });