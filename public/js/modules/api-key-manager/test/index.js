/**
 * Main test file for @profullstack/api-key-manager
 *
 * This file imports all test modules to ensure they are run by Vitest
 */

// Import all test files
import './api-key-manager.test.js';
import './middleware.test.js';
import './adapters/memory.test.js';

// Basic package tests
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('@profullstack/api-key-manager', () => {
  it('should have a package.json file', () => {
    const pkgPath = path.join(__dirname, '../package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);
    
    const pkgContent = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgContent);
    expect(pkg).toBeTypeOf('object');
    expect(pkg.name).toBe('@profullstack/api-key-manager');
  });
  
  it('should have a src directory', () => {
    const srcDir = path.join(__dirname, '../src');
    expect(fs.existsSync(srcDir)).toBe(true);
  });
});