/**
 * Example of integrating the WebXR experience with the main application
 * 
 * This file shows how to modify the main index.js file to integrate
 * the WebXR experience using Hono.js.
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenvFlow from 'dotenv-flow';
import fs from 'fs/promises';
import { marked } from 'marked';
import * as XLSX from 'xlsx';
import { JSDOM } from 'jsdom';
import PptxGenJS from 'pptxgenjs';
import TurndownService from 'turndown';

// Import the WebXR integration
import { integrateWebXR } from '../hono-integration.js';

// Load environment variables
dotenvFlow.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = new Hono();

// Integrate WebXR experience at /webxr path
integrateWebXR(app);

// SPA routing middleware - all routes without extensions go to index.html
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  const pathname = url.pathname;
  
  // Skip API routes
  if (pathname.startsWith('/api/')) {
    return next();
  }
  
  // Skip WebXR routes (already handled by the WebXR integration)
  if (pathname.startsWith('/webxr/')) {
    return next();
  }
  
  // If the path has no extension, it's an SPA route
  if (pathname !== '/' && !pathname.includes('.')) {
    console.log(`SPA route detected: ${pathname}`);
    // Serve index.html for all SPA routes
    const indexPath = path.join(__dirname, 'public', 'index.html');
    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      return c.html(indexContent);
    } catch (error) {
      console.error(`Error serving index.html: ${error.message}`);
      return c.text('Internal Server Error', 500);
    }
  }
  
  return next();
});

// Serve static files from the public directory
app.use('/*', serveStatic({ root: './public' }));

// Final fallback for any routes that weren't handled
app.get('*', async (c) => {
  const url = new URL(c.req.url);
  const pathname = url.pathname;
  
  console.log(`Fallback handler for: ${pathname}`);
  
  // If we got here and it's not an API route or a file with extension, serve index.html
  if (!pathname.startsWith('/api/') && !pathname.includes('.')) {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      return c.html(indexContent);
    } catch (error) {
      console.error(`Error serving index.html: ${error.message}`);
      return c.text('Internal Server Error', 500);
    }
  }
  
  // If we got here, it's a 404
  return c.text('Not Found', 404);
});

// Health check endpoint
app.get('/', (c) => {
  // If the request accepts HTML, the static file middleware will handle it
  if (c.req.header('accept')?.includes('text/html')) {
    return c.next();
  }
  // Otherwise, return a JSON response
  return c.json({ 
    status: 'ok', 
    message: 'Document generation service is running',
    features: [
      'HTML to PDF',
      'HTML to DOC',
      'HTML to Excel',
      'HTML to PowerPoint',
      'HTML to Markdown',
      'Markdown to HTML',
      'WebXR Experience'
    ]
  });
});

// API endpoints (HTML to PDF, etc.) remain unchanged
// ...

// Start the server
const port = process.env.PORT || 3000;
serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
  console.log(`- HTML to PDF endpoint: http://localhost:${info.port}/api/1/html-to-pdf`);
  console.log(`- HTML to DOC endpoint: http://localhost:${info.port}/api/1/html-to-doc`);
  console.log(`- HTML to Excel endpoint: http://localhost:${info.port}/api/1/html-to-excel`);
  console.log(`- HTML to PowerPoint endpoint: http://localhost:${info.port}/api/1/html-to-ppt`);
  console.log(`- HTML to Markdown endpoint: http://localhost:${info.port}/api/1/html-to-markdown`);
  console.log(`- Markdown to HTML endpoint: http://localhost:${info.port}/api/1/markdown-to-html`);
  console.log(`- WebXR Experience: http://localhost:${info.port}/webxr`);
  console.log(`- Web interface: http://localhost:${info.port}`);
});