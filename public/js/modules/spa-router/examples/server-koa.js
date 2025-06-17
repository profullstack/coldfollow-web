/**
 * Example Koa.js server with SPA routing support (ESM version)
 * 
 * To run this example:
 * 1. Install dependencies: npm install koa koa-static koa-mount
 * 2. Run with Node.js: node server-koa.js
 */

import Koa from 'koa';
import serve from 'koa-static';
import mount from 'koa-mount';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createReadStream } from 'fs';

// Get current file directory with ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = new Koa();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(serve(join(__dirname)));

// SPA fallback - redirect all unmatched routes to index.html
app.use(async (ctx) => {
  // Check if the request is for a file with extension
  if (ctx.path.match(/\.\w+$/)) {
    // Let koa-static handle 404 for missing files
    return;
  }
  
  // Otherwise serve index.html for SPA routing
  try {
    ctx.type = 'html';
    ctx.body = createReadStream(join(__dirname, 'index.html'));
  } catch (error) {
    console.error('Error serving index.html:', error);
    ctx.status = 500;
    ctx.body = 'Server Error';
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Koa server running at http://localhost:${PORT}`);
});

/**
 * For production environments, you might want to add:
 * 
 * 1. Compression for better performance:
 * 
 * import compress from 'koa-compress';
 * import zlib from 'zlib';
 * 
 * app.use(compress({
 *   threshold: 2048,
 *   gzip: {
 *     flush: zlib.constants.Z_SYNC_FLUSH
 *   },
 *   deflate: {
 *     flush: zlib.constants.Z_SYNC_FLUSH
 *   },
 *   br: false // disable brotli
 * }));
 * 
 * 2. Security headers:
 * 
 * import helmet from 'koa-helmet';
 * app.use(helmet());
 * 
 * 3. Error handling middleware:
 * 
 * app.use(async (ctx, next) => {
 *   try {
 *     await next();
 *   } catch (err) {
 *     ctx.status = err.status || 500;
 *     ctx.body = {
 *       message: err.message
 *     };
 *     ctx.app.emit('error', err, ctx);
 *   }
 * });
 * 
 * app.on('error', (err, ctx) => {
 *   console.error('Server error:', err, ctx);
 * });
 */