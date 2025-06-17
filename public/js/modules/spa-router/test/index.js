/**
 * Test suite for @profullstack/spa-router
 */

import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

// Set up JSDOM for browser environment simulation
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
  url: 'http://localhost/',
  contentType: 'text/html',
  includeNodeLocations: true,
  storageQuota: 10000000,
  runScripts: 'dangerously'
});

// Set up global browser environment
global.window = dom.window;
global.document = dom.window.document;
// Use Object.defineProperty to avoid issues with read-only properties
Object.defineProperty(global, 'navigator', {
  get: function() { return dom.window.navigator; }
});
global.HTMLElement = dom.window.HTMLElement;
global.CustomEvent = dom.window.CustomEvent;
global.Event = dom.window.Event;
global.Node = dom.window.Node;
global.NodeFilter = dom.window.NodeFilter;
global.DocumentFragment = dom.window.DocumentFragment;

// Fix for JSDOM not implementing composedPath
if (!Event.prototype.composedPath) {
  Event.prototype.composedPath = function() {
    const path = [];
    let el = this.target;
    while (el) {
      path.push(el);
      el = el.parentElement;
    }
    return path;
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('@profullstack/spa-router', function() {
  it('should have a package.json file', function() {
    const pkgPath = path.join(__dirname, '../package.json');
    expect(fs.existsSync(pkgPath)).to.be.true;
    
    const pkgContent = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgContent);
    expect(pkg).to.be.an('object');
    expect(pkg.name).to.equal('@profullstack/spa-router');
  });
  
  it('should have a src directory', function() {
    const srcDir = path.join(__dirname, '../src');
    expect(fs.existsSync(srcDir)).to.be.true;
  });

  // Basic tests for the module structure
  // The actual tests are in separate files that will be run by Mocha
});