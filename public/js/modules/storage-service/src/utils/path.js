/**
 * Path Utilities for Storage Service
 * 
 * Provides functions for working with file paths.
 */

/**
 * Create path utilities
 * @returns {Object} - Path utilities
 */
export function createPathUtils() {
  /**
   * Parse a file path into its components
   * @param {string} filePath - File path to parse
   * @returns {Object} - Path components
   * @returns {string} result.dir - Directory path
   * @returns {string} result.base - Base filename with extension
   * @returns {string} result.name - Filename without extension
   * @returns {string} result.ext - File extension with dot
   */
  function parsePath(filePath) {
    // Handle empty or invalid paths
    if (!filePath) {
      return {
        dir: '',
        base: '',
        name: '',
        ext: ''
      };
    }
    
    // Normalize path by replacing backslashes with forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Find the last slash to separate directory from filename
    const lastSlashIndex = normalizedPath.lastIndexOf('/');
    const dir = lastSlashIndex >= 0 ? normalizedPath.slice(0, lastSlashIndex) : '';
    const base = lastSlashIndex >= 0 ? normalizedPath.slice(lastSlashIndex + 1) : normalizedPath;
    
    // Find the last dot to separate filename from extension
    const lastDotIndex = base.lastIndexOf('.');
    const name = lastDotIndex > 0 ? base.slice(0, lastDotIndex) : base;
    const ext = lastDotIndex > 0 ? base.slice(lastDotIndex) : '';
    
    return {
      dir,
      base,
      name,
      ext
    };
  }
  
  /**
   * Join path components into a file path
   * @param {string} dir - Directory path
   * @param {string} base - Base filename with extension
   * @returns {string} - Joined file path
   */
  function joinPath(dir, base) {
    if (!dir) {
      return base;
    }
    
    if (!base) {
      return dir;
    }
    
    // Normalize directory path by removing trailing slashes
    const normalizedDir = dir.replace(/\/+$/, '');
    
    // Normalize base by removing leading slashes
    const normalizedBase = base.replace(/^\/+/, '');
    
    return `${normalizedDir}/${normalizedBase}`;
  }
  
  /**
   * Normalize a file path
   * @param {string} filePath - File path to normalize
   * @returns {string} - Normalized file path
   */
  function normalizePath(filePath) {
    if (!filePath) {
      return '';
    }
    
    // Replace backslashes with forward slashes
    let normalizedPath = filePath.replace(/\\/g, '/');
    
    // Remove duplicate slashes
    normalizedPath = normalizedPath.replace(/\/+/g, '/');
    
    // Remove trailing slash
    normalizedPath = normalizedPath.replace(/\/+$/, '');
    
    return normalizedPath;
  }
  
  /**
   * Get the parent directory of a file path
   * @param {string} filePath - File path
   * @returns {string} - Parent directory
   */
  function getParentDir(filePath) {
    const { dir } = parsePath(filePath);
    return dir;
  }
  
  /**
   * Get the relative path from one path to another
   * @param {string} from - Source path
   * @param {string} to - Destination path
   * @returns {string} - Relative path
   */
  function getRelativePath(from, to) {
    // Normalize paths
    const normalizedFrom = normalizePath(from);
    const normalizedTo = normalizePath(to);
    
    // Split paths into components
    const fromParts = normalizedFrom.split('/').filter(Boolean);
    const toParts = normalizedTo.split('/').filter(Boolean);
    
    // Find common prefix
    let commonPrefixLength = 0;
    const minLength = Math.min(fromParts.length, toParts.length);
    
    for (let i = 0; i < minLength; i++) {
      if (fromParts[i] === toParts[i]) {
        commonPrefixLength++;
      } else {
        break;
      }
    }
    
    // Build relative path
    const upCount = fromParts.length - commonPrefixLength;
    const upPath = Array(upCount).fill('..').join('/');
    const downPath = toParts.slice(commonPrefixLength).join('/');
    
    if (!upPath && !downPath) {
      return '.';
    }
    
    if (!upPath) {
      return downPath;
    }
    
    if (!downPath) {
      return upPath;
    }
    
    return `${upPath}/${downPath}`;
  }
  
  /**
   * Check if a path is a subpath of another path
   * @param {string} parent - Parent path
   * @param {string} child - Child path
   * @returns {boolean} - Whether child is a subpath of parent
   */
  function isSubPath(parent, child) {
    // Normalize paths
    const normalizedParent = normalizePath(parent);
    const normalizedChild = normalizePath(child);
    
    // Empty parent is never a parent of any path
    if (!normalizedParent) {
      return false;
    }
    
    // Child must start with parent path
    if (!normalizedChild.startsWith(normalizedParent)) {
      return false;
    }
    
    // If parent and child are the same, it's not a subpath
    if (normalizedParent === normalizedChild) {
      return false;
    }
    
    // If parent doesn't end with a slash, check that child has a slash after parent
    if (normalizedParent.length < normalizedChild.length) {
      return normalizedChild[normalizedParent.length] === '/';
    }
    
    return true;
  }
  
  /**
   * Generate a unique filename
   * @param {string} filePath - Original file path
   * @param {Function} existsCheck - Function to check if a file exists
   * @returns {string} - Unique file path
   */
  async function generateUniqueFilename(filePath, existsCheck) {
    // Parse path
    const { dir, name, ext } = parsePath(filePath);
    
    // If no exists check function, just return the original path
    if (typeof existsCheck !== 'function') {
      return filePath;
    }
    
    // Check if the original file exists
    const exists = await existsCheck(filePath);
    if (!exists) {
      return filePath;
    }
    
    // Try adding a counter to the filename
    let counter = 1;
    let uniquePath;
    
    do {
      uniquePath = joinPath(dir, `${name}_${counter}${ext}`);
      counter++;
    } while (await existsCheck(uniquePath));
    
    return uniquePath;
  }
  
  /**
   * Get the depth of a path
   * @param {string} filePath - File path
   * @returns {number} - Path depth
   */
  function getPathDepth(filePath) {
    // Normalize path
    const normalizedPath = normalizePath(filePath);
    
    // Count slashes
    return normalizedPath.split('/').filter(Boolean).length;
  }
  
  /**
   * Get a path segment at a specific depth
   * @param {string} filePath - File path
   * @param {number} depth - Segment depth (0-based)
   * @returns {string} - Path segment
   */
  function getPathSegment(filePath, depth) {
    // Normalize path
    const normalizedPath = normalizePath(filePath);
    
    // Get segments
    const segments = normalizedPath.split('/').filter(Boolean);
    
    // Return segment at depth
    return segments[depth] || '';
  }
  
  // Return the path utilities
  return {
    parsePath,
    joinPath,
    normalizePath,
    getParentDir,
    getRelativePath,
    isSubPath,
    generateUniqueFilename,
    getPathDepth,
    getPathSegment
  };
}

export default createPathUtils;