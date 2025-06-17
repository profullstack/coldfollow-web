/**
 * Dependencies module for WebXR
 * 
 * This file centralizes all external ESM dependencies to make them easier to manage
 * and update. It also allows for potential future bundling or local hosting of these
 * dependencies if needed.
 */

// Import and re-export spa-router with a different name to avoid conflicts
import { Router as VRRouter } from 'https://esm.sh/@profullstack/spa-router@1.12.13';
import * as transitions from 'https://esm.sh/@profullstack/spa-router@1.12.13/src/transitions.js';
import * as renderer from 'https://esm.sh/@profullstack/spa-router@1.12.13/src/renderer.js';
import * as componentLoader from 'https://esm.sh/@profullstack/spa-router@1.12.13/src/component-loader.js';
export { VRRouter, transitions, renderer, componentLoader };

// Import and re-export enhanced-router
export * as enhancedRouter from 'https://esm.sh/@profullstack/enhanced-router@0.2.15';

// Import and re-export state-manager
export { StoreConnector, createStore } from 'https://esm.sh/@profullstack/state-manager@0.5.19';