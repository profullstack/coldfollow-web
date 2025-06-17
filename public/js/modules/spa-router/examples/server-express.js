/**
 * Example Express.js server with SPA routing support (ESM version)
 * 
 * To run this example:
 * 1. Install dependencies: npm install express
 * 2. Run with Node.js: node server-express.js
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file directory with ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(join(__dirname)));

// SPA fallback - redirect all unmatched routes to index.html
app.get('*', (req, res) => {
  // Check if the request is for a file with extension
  if (req.path.match(/\.\w+$/)) {
    // Let Express handle 404 for missing files
    return res.status(404).send('Not found');
  }
  
  // Otherwise serve index.html for SPA routing
  res.sendFile(join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}`);
});

/**
 * For production environments, you might want to add:
 * 
 * 1. Compression for better performance:
 * 
 * import compression from 'compression';
 * app.use(compression());
 * 
 * 2. Security headers:
 * 
 * import helmet from 'helmet';
 * app.use(helmet({
 *   contentSecurityPolicy: {
 *     directives: {
 *       // Customize CSP for your needs
 *       defaultSrc: ["'self'"],
 *       scriptSrc: ["'self'", "'unsafe-inline'"],
 *       styleSrc: ["'self'", "'unsafe-inline'"],
 *       imgSrc: ["'self'", "data:"],
 *     },
 *   },
 * }));
 * 
 * 3. Rate limiting for API routes:
 * 
 * import rateLimit from 'express-rate-limit';
 * app.use('/api', rateLimit({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   max: 100 // limit each IP to 100 requests per windowMs
 * }));
 */