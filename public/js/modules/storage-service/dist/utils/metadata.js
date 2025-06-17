/**
 * Metadata Utilities for Storage Service
 * 
 * Provides functions for managing file metadata.
 */

/**
 * Create a metadata manager
 * @param {Object} options - Configuration options
 * @param {string[]} options.reservedKeys - Reserved metadata keys that cannot be modified
 * @param {Object} options.defaultMetadata - Default metadata to include with all files
 * @param {Function} options.sanitizeKey - Function to sanitize metadata keys
 * @param {Function} options.sanitizeValue - Function to sanitize metadata values
 * @returns {Object} - Metadata manager
 */
export function createMetadataManager(options = {}) {
  // Default options
  const config = {
    reservedKeys: ['contentType', 'size', 'createdAt', 'updatedAt'],
    defaultMetadata: {},
    sanitizeKey: key => key,
    sanitizeValue: value => value,
    ...options
  };
  
  /**
   * Prepare metadata for storage
   * @param {Object} metadata - Metadata to prepare
   * @param {Object} systemMetadata - System metadata to include
   * @returns {Object} - Prepared metadata
   */
  function prepareMetadata(metadata = {}, systemMetadata = {}) {
    // Create a new metadata object
    const preparedMetadata = {
      // Include default metadata
      ...config.defaultMetadata,
      // Include user metadata (sanitized)
      ...sanitizeMetadata(metadata),
      // Include system metadata (overrides user metadata)
      ...systemMetadata
    };
    
    return preparedMetadata;
  }
  
  /**
   * Sanitize metadata
   * @param {Object} metadata - Metadata to sanitize
   * @returns {Object} - Sanitized metadata
   */
  function sanitizeMetadata(metadata = {}) {
    const sanitizedMetadata = {};
    
    // Process each metadata key-value pair
    for (const [key, value] of Object.entries(metadata)) {
      // Skip reserved keys
      if (config.reservedKeys.includes(key)) {
        continue;
      }
      
      // Sanitize key and value
      const sanitizedKey = config.sanitizeKey(key);
      const sanitizedValue = config.sanitizeValue(value);
      
      // Add to sanitized metadata
      sanitizedMetadata[sanitizedKey] = sanitizedValue;
    }
    
    return sanitizedMetadata;
  }
  
  /**
   * Filter metadata for public access
   * @param {Object} metadata - Metadata to filter
   * @param {string[]} publicKeys - Keys to include in public metadata
   * @returns {Object} - Filtered metadata
   */
  function filterPublicMetadata(metadata = {}, publicKeys = []) {
    // If no public keys specified, return empty object
    if (!publicKeys.length) {
      return {};
    }
    
    const publicMetadata = {};
    
    // Include only specified public keys
    for (const key of publicKeys) {
      if (metadata.hasOwnProperty(key)) {
        publicMetadata[key] = metadata[key];
      }
    }
    
    return publicMetadata;
  }
  
  /**
   * Extract system metadata
   * @param {Object} metadata - Metadata to extract from
   * @returns {Object} - System metadata
   */
  function extractSystemMetadata(metadata = {}) {
    const systemMetadata = {};
    
    // Extract reserved keys
    for (const key of config.reservedKeys) {
      if (metadata.hasOwnProperty(key)) {
        systemMetadata[key] = metadata[key];
      }
    }
    
    return systemMetadata;
  }
  
  /**
   * Extract user metadata
   * @param {Object} metadata - Metadata to extract from
   * @returns {Object} - User metadata
   */
  function extractUserMetadata(metadata = {}) {
    const userMetadata = {};
    
    // Extract non-reserved keys
    for (const [key, value] of Object.entries(metadata)) {
      if (!config.reservedKeys.includes(key)) {
        userMetadata[key] = value;
      }
    }
    
    return userMetadata;
  }
  
  /**
   * Validate metadata
   * @param {Object} metadata - Metadata to validate
   * @param {Object} schema - Validation schema
   * @returns {Object} - Validation result
   * @returns {boolean} result.valid - Whether the metadata is valid
   * @returns {string} result.error - Error message if invalid
   */
  function validateMetadata(metadata = {}, schema = {}) {
    // Check required fields
    if (schema.required) {
      for (const key of schema.required) {
        if (!metadata.hasOwnProperty(key)) {
          return {
            valid: false,
            error: `Missing required metadata field: ${key}`
          };
        }
      }
    }
    
    // Check field types
    if (schema.types) {
      for (const [key, type] of Object.entries(schema.types)) {
        if (metadata.hasOwnProperty(key)) {
          const value = metadata[key];
          
          // Check type
          if (type === 'string' && typeof value !== 'string') {
            return {
              valid: false,
              error: `Metadata field ${key} must be a string`
            };
          } else if (type === 'number' && typeof value !== 'number') {
            return {
              valid: false,
              error: `Metadata field ${key} must be a number`
            };
          } else if (type === 'boolean' && typeof value !== 'boolean') {
            return {
              valid: false,
              error: `Metadata field ${key} must be a boolean`
            };
          } else if (type === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value))) {
            return {
              valid: false,
              error: `Metadata field ${key} must be an object`
            };
          } else if (type === 'array' && !Array.isArray(value)) {
            return {
              valid: false,
              error: `Metadata field ${key} must be an array`
            };
          }
        }
      }
    }
    
    // Check field patterns
    if (schema.patterns) {
      for (const [key, pattern] of Object.entries(schema.patterns)) {
        if (metadata.hasOwnProperty(key)) {
          const value = metadata[key];
          
          // Check pattern
          if (typeof value === 'string' && !pattern.test(value)) {
            return {
              valid: false,
              error: `Metadata field ${key} does not match required pattern`
            };
          }
        }
      }
    }
    
    // Check field validators
    if (schema.validators) {
      for (const [key, validator] of Object.entries(schema.validators)) {
        if (metadata.hasOwnProperty(key)) {
          const value = metadata[key];
          
          // Run validator
          try {
            const result = validator(value);
            if (result !== true) {
              return {
                valid: false,
                error: result || `Metadata field ${key} failed validation`
              };
            }
          } catch (error) {
            return {
              valid: false,
              error: error.message || `Metadata field ${key} failed validation`
            };
          }
        }
      }
    }
    
    // Metadata is valid
    return {
      valid: true,
      error: null
    };
  }
  
  // Return the metadata manager
  return {
    prepareMetadata,
    sanitizeMetadata,
    filterPublicMetadata,
    extractSystemMetadata,
    extractUserMetadata,
    validateMetadata
  };
}

export default createMetadataManager;