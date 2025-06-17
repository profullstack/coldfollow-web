import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenvFlow from 'dotenv-flow';
import fs from 'fs';
import { WebSocketServer } from 'ws';

import { registerRoutes } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { enableSafeHttpDebugging } from './utils/safe-http-debug.js';

// Enable HTTP debugging for detailed request/response logging
console.log('Enabling HTTP debugging for detailed request/response logging');
enableSafeHttpDebugging();

// Load environment variables
dotenvFlow.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.resolve(__dirname, '../public');

console.log('Starting server...');
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Public directory:', publicPath);
console.log('Public directory exists:', fs.existsSync(publicPath));

if (fs.existsSync(publicPath)) {
  console.log('Files in public directory:');
  fs.readdirSync(publicPath).forEach(file => {
    console.log(`- ${file}`);
  });
}

// Create Hono app for both static files and API endpoints
const app = new Hono();

// Add CORS middleware
app.use('*', async (c, next) => {
  // Add CORS headers to all responses
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  c.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle OPTIONS requests (preflight)
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }
  
  await next();
});

// Log when requests are received and add cache control headers
app.use('*', async (c, next) => {
  console.log(`Request for: ${c.req.path}`);
  
  // Add cache control headers to prevent caching for SPA routes
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');
  c.header('Surrogate-Control', 'no-store');
  
  // Handle SPA routes (paths without extensions)
  const reqPath = c.req.path;
  
  // First check if this is a request for a view HTML file
  if (reqPath.startsWith('/views/') && reqPath.endsWith('.html')) {
    console.log(`View HTML file request detected: ${reqPath}`);
    // Let this pass through to the static file middleware
    await next();
    return;
  }
  
  // Then handle SPA routes
  if (reqPath !== '/' && !reqPath.includes('.') && !reqPath.startsWith('/api/')) {
    console.log(`SPA route detected: ${reqPath}`);
    try {
      const indexPath = path.resolve(__dirname, '../public/index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      return c.html(content);
    } catch (error) {
      console.error(`Error serving index.html: ${error.message}`);
    }
  }
  
  await next();
});

// Global error handler middleware
app.use('*', errorHandler);

// Register all API routes
registerRoutes(app);

// Add a direct Stripe checkout handler for emergencies
import Stripe from 'stripe';

// Initialize Stripe with minimal configuration
const stripeDirectClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Ultra-minimal Stripe checkout using pure fetch - no packages, no database, just API calls
app.post('/api/stripe-simple/create-checkout', async (c) => {
  try {
    console.log('Creating simple checkout session using fetch...');
    
    // Parse request
    const body = await c.req.json();
    const { email, plan } = body;
    
    // Get price ID from environment variables
    const priceId = plan === 'monthly' 
      ? process.env.STRIPE_MONTHLY_PRICE_ID 
      : process.env.STRIPE_YEARLY_PRICE_ID;
    
    if (!priceId) {
      throw new Error('Price ID not configured');
    }
    
    // Use fetch to directly call Stripe API - don't use any Stripe packages
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'success_url': 'https://convert2doc.com/dashboard?success=true',
        'cancel_url': 'https://convert2doc.com/register?canceled=true',
        'customer_email': email, // Pre-fill customer email in checkout
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Stripe API error: ${errorData.error?.message || response.statusText}`);
    }
    
    // Parse the Stripe API response
    const session = await response.json();
    
    // Return minimal response with just ID and URL
    return c.json({
      id: session.id,
      checkout_url: session.url,
      url: session.url
    });
  } catch (error) {
    console.error('Simple checkout error:', error.message);
    return c.json({
      error: 'Payment processing error',
      message: error.message
    }, 500);
  }
});

// Keep the direct checkout as a fallback
app.post('/api/stripe-direct/create-checkout', async (c) => {
  try {
    console.log('Creating direct checkout session...');
    
    // Parse request
    const body = await c.req.json();
    const { email, plan } = body;
    
    // Get price ID
    const priceId = plan === 'monthly' 
      ? process.env.STRIPE_MONTHLY_PRICE_ID 
      : process.env.STRIPE_YEARLY_PRICE_ID;
    
    // Directly create session with minimal params
    const session = await stripeDirectClient.checkout.sessions.create({
      mode: 'subscription',
      success_url: 'https://convert2doc.com/dashboard?success=true',
      cancel_url: 'https://convert2doc.com/register?canceled=true',
      customer_email: email, // Pre-fill customer email in checkout
      line_items: [{ price: priceId, quantity: 1 }]
    });
    
    // Return minimal response with just ID and URL
    return c.json({
      id: session.id,
      checkout_url: session.url,
      url: session.url
    });
  } catch (error) {
    console.error('Direct checkout error:', error.message);
    return c.json({
      error: 'Payment processing error',
      message: error.message
    }, 500);
  }
});

// Health check endpoint
app.get('/', async (c) => {
  // If the request accepts HTML, serve the index.html file directly
  if (c.req.header('accept')?.includes('text/html')) {
    try {
      const indexPath = path.resolve(__dirname, '../public/index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      return c.html(content);
    } catch (error) {
      console.error(`Error serving index.html: ${error.message}`);
      return c.text('Internal Server Error', 500);
    }
  }
  
  // Otherwise, return a JSON response
  return c.json({
    status: 'ok',
    message: 'Document generation service is running',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Serve static files from the public directory, but skip API routes
app.use('*', async (c, next) => {
  const reqPath = c.req.path;
  
  // Skip API routes
  if (reqPath.startsWith('/api/')) {
    return next();
  }
  
  // Use the static file middleware for non-API routes
  console.log(`Attempting to serve static file: ${reqPath} from ./public`);
  
  // Check if the file exists before serving it
  const filePath = path.join(process.cwd(), 'public', reqPath);
  if (fs.existsSync(filePath)) {
    console.log(`File exists: ${filePath}`);
  } else {
    console.log(`File does not exist: ${filePath}`);
  }
  
  return serveStatic({
    root: './public',
    rewriteRequestPath: (path) => {
      console.log(`Static file request for: ${path}`);
      return path;
    }
  })(c, next);
});

// SPA fallback for routes that don't match any static files
app.get('*', async (c) => {
  const reqPath = c.req.path;
  
  // Add detailed logging for API routes
  if (reqPath.startsWith('/api/')) {
    console.log(`API route not found: ${reqPath}`);
    return c.json({
      error: 'API endpoint not found',
      path: reqPath
    }, 404);
  }
  
  // Skip files with extensions
  if (reqPath.includes('.')) {
    return c.notFound();
  }
  
  console.log(`SPA fallback for: ${reqPath}`);
  
  // Serve index.html for client-side routes
  try {
    const indexPath = path.resolve(__dirname, '../public/index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');
    return c.html(content);
  } catch (error) {
    console.error(`Error serving index.html: ${error.message}`);
    return c.text('Internal Server Error', 500);
  }
});

// Start the server
const port = process.env.PORT || 3000;
serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Server running at http://localhost:${info.port}`);
  console.log('Available endpoints:');
  console.log(`- HTML to PDF: http://localhost:${info.port}/api/1/html-to-pdf`);
  console.log(`- HTML to DOC: http://localhost:${info.port}/api/1/html-to-doc`);
  console.log(`- HTML to Excel: http://localhost:${info.port}/api/1/html-to-excel`);
  console.log(`- HTML to PowerPoint: http://localhost:${info.port}/api/1/html-to-ppt`);
  console.log(`- HTML to EPUB: http://localhost:${info.port}/api/1/html-to-epub`);
  console.log(`- HTML to Markdown: http://localhost:${info.port}/api/1/html-to-markdown`);
  console.log(`- Markdown to HTML: http://localhost:${info.port}/api/1/markdown-to-html`);
  console.log(`- PDF to Markdown: http://localhost:${info.port}/api/1/pdf-to-markdown`);
  console.log(`- DOCX to Markdown: http://localhost:${info.port}/api/1/docx-to-markdown`);
  console.log(`- DOC to Markdown: http://localhost:${info.port}/api/1/doc-to-markdown`);
  console.log(`- EPUB to Markdown: http://localhost:${info.port}/api/1/epub-to-markdown`);
  console.log(`- Text to Markdown: http://localhost:${info.port}/api/1/text-to-markdown`);
  console.log(`- PPTX to Markdown: http://localhost:${info.port}/api/1/pptx-to-markdown`);
  console.log(`- XLSX to Markdown: http://localhost:${info.port}/api/1/xlsx-to-markdown`);
  console.log(`- Document History: http://localhost:${info.port}/api/1/document-history`);
  console.log(`- Subscription: http://localhost:${info.port}/api/1/subscription`);
  console.log(`- Subscription Status: http://localhost:${info.port}/api/1/subscription-status`);
  console.log(`- Stripe Checkout: http://localhost:${info.port}/api/1/payments/stripe/create-checkout-session`);
  console.log(`- Stripe Webhook: http://localhost:${info.port}/api/1/payments/stripe/webhook`);
  console.log(`- Stripe Subscription: http://localhost:${info.port}/api/1/payments/stripe/subscription`);
  console.log(`- Stripe Cancel: http://localhost:${info.port}/api/1/payments/stripe/cancel-subscription`);
  console.log(`- Payment Callback: http://localhost:${info.port}/api/1/payments/cryptapi/callback`);
  console.log(`- Payment Logs: http://localhost:${info.port}/api/1/payments/cryptapi/logs`);
  console.log(`- WebSocket: http://localhost:${info.port}/api/1/ws`);
  console.log(`- Web interface: http://localhost:${info.port}`);
});

// Create a separate WebSocket server on a different port
const wsPort = parseInt(port) + 1;
const wss = new WebSocketServer({ port: wsPort });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('WebSocket connection established');
  
  // Send a welcome message
  ws.send('Connected to WebSocket server');
  
  // Handle messages
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    ws.send(`Echo: ${message}`);
  });
  
  // Handle connection close
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`WebSocket server running at ws://localhost:${wsPort}`);