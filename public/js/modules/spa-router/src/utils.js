/**
 * Utility functions for the router
 */

/**
 * Convert a route path to a regular expression
 * @param {string} path - Route path
 * @returns {Object} - Regex and param names
 */
export const pathToRegex = (path) => {
  // Skip if not a dynamic route
  if (!path.includes(':')) {
    return {
      regex: new RegExp(`^${path}$`),
      paramNames: []
    };
  }
  
  // Extract param names
  const paramNames = (path.match(/:[^\s/]+/g) || [])
    .map(param => param.slice(1)); // Remove the colon
  
  // Convert route path to regex
  const pattern = path
    .replace(/:[^\s/]+/g, '([^/]+)')
    .replace(/\//g, '\\/');
  
  return {
    regex: new RegExp(`^${pattern}$`),
    paramNames
  };
};

/**
 * Extract params from a path using a regex and param names
 * @param {string} path - Current path
 * @param {RegExp} regex - Route regex
 * @param {Array} paramNames - Parameter names
 * @returns {Object|null} - Extracted params or null if no match
 */
export const extractParams = (path, regex, paramNames) => {
  const match = path.match(regex);
  
  if (!match) {
    return null;
  }
  
  // Extract params
  const params = {};
  
  paramNames.forEach((paramName, index) => {
    params[paramName] = match[index + 1];
  });
  
  return params;
};

/**
 * Normalize a path
 * @param {string} path - Path to normalize
 * @returns {string} - Normalized path
 */
export const normalizePath = (path) => {
  // Default to home if no path
  path = path || '/';
  
  // Remove trailing slash except for root
  if (path !== '/' && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  
  // Ensure root path is always '/'
  if (path === '') {
    path = '/';
  }
  
  return path;
};

/**
 * Find the first anchor element in an event path
 * @param {Event} event - Click event
 * @returns {HTMLAnchorElement|null} - Anchor element or null
 */
export const findAnchorInPath = (event) => {
  // Get the event path (works for both regular DOM and shadow DOM)
  const path = event.composedPath();
  
  // Find the first anchor element in the event path
  for (let i = 0; i < path.length; i++) {
    if (path[i].tagName === 'A') {
      return path[i];
    }
  }
  
  return null;
};

/**
 * Check if a link should be handled by the router
 * @param {HTMLAnchorElement} anchor - Anchor element
 * @returns {boolean} - Whether the link should be handled
 */
export const shouldHandleLink = (anchor) => {
  // Get the href attribute
  const href = anchor.getAttribute('href');
  
  // Skip if no href
  if (!href) {
    return false;
  }
  
  // Skip if it's an external link
  if (href.startsWith('http') || href.startsWith('//')) {
    return false;
  }
  
  // Skip if it has a target
  if (anchor.hasAttribute('target')) {
    return false;
  }
  
  // Skip if it's a download link
  if (anchor.hasAttribute('download')) {
    return false;
  }
  
  // Skip if it's an anchor link
  if (href.startsWith('#')) {
    return false;
  }
  
  // Skip if it's a file link (has extension)
  if (href.match(/\.\w+$/)) {
    return false;
  }
  
  return true;
};

export default {
  pathToRegex,
  extractParams,
  normalizePath,
  findAnchorInPath,
  shouldHandleLink
};