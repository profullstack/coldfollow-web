/**
 * @profullstack/spa-router
 * A lightweight, feature-rich SPA router with smooth transitions and Shadow DOM support
 */

import Router from './router.js';
import * as transitions from './transitions.js';
import * as utils from './utils.js';
import * as renderer from './renderer.js';
import * as componentLoader from './component-loader.js';

// Export the main components
export { Router, transitions, utils, renderer, componentLoader };

// Export a default object for UMD builds
export default {
  Router,
  transitions,
  utils,
  renderer,
  componentLoader
};