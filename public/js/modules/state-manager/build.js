#!/usr/bin/env node

/**
 * Simple build script for the state manager module
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

// Copy the source file to the dist directory
const srcFile = path.join(__dirname, 'src', 'index.js');
const destFile = path.join(distDir, 'index.js');

fs.copyFileSync(srcFile, destFile);

console.log('Build completed successfully!');
console.log(`Source: ${srcFile}`);
console.log(`Destination: ${destFile}`);