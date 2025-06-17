#!/usr/bin/env node

/**
 * Browser-compatible build script for the state manager module
 * 
 * This script builds the module for browser environments by:
 * 1. Copying files from src to dist
 * 2. Ensuring browser compatibility
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Files to copy
const files = [
  'index.js',
  'persistence.js',
  'middleware.js',
  'store-connector.js',
  'web-components.js',
  'event-emitter.js'
];

// Copy each file from src to dist
for (const file of files) {
  const srcFile = path.join(__dirname, 'src', file);
  const destFile = path.join(distDir, file);
  
  // Read the source file
  let content = fs.readFileSync(srcFile, 'utf8');
  
  // Remove any Node-specific environment checks
  content = content.replace(/typeof process !== ['"]undefined['"]/, 'false');
  content = content.replace(/typeof window === ['"]undefined['"]/, 'false');
  content = content.replace(/typeof global !== ['"]undefined['"]/, 'false');
  
  // Ensure browser globals are properly checked
  content = content.replace(/if \(!window\./, 'if (typeof window !== "undefined" && !window.');
  
  // Write the modified content to the destination file
  fs.writeFileSync(destFile, content);
  
  console.log(`Processed ${file}`);
}

console.log('Build completed successfully!');