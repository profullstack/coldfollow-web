/**
 * @profullstack/storage-service
 * 
 * A flexible storage service abstraction for file storage, retrieval, and metadata management
 */

import { MemoryAdapter } from './adapters/memory.js';
import { createMetadataManager } from './utils/metadata.js';
import { createPathUtils } from './utils/path.js';
import { createContentTypeUtils } from './utils/content-type.js';

/**
 * Storage Service
 */
class StorageService {
  /**
   * Create a new Storage Service
   * @param {Object} options - Configuration options
   * @param {Object} options.adapter - Storage adapter (defaults to in-memory)
   * @param {string} options.defaultBucket - Default bucket name (default: 'default')
   * @param {Object} options.bucketConfig - Configuration for buckets
   * @param {Object} options.metadataOptions - Metadata configuration
   * @param {boolean} options.generateUniqueFilenames - Whether to generate unique filenames (default: true)
   * @param {Function} options.filenameGenerator - Custom filename generator function
   */
  constructor(options = {}) {
    // Set up adapter
    this.adapter = options.adapter || new MemoryAdapter();
    
    // Set up default bucket
    this.defaultBucket = options.defaultBucket || 'default';
    
    // Set up bucket configuration
    this.bucketConfig = options.bucketConfig || {};
    
    // Set up metadata manager
    this.metadataManager = createMetadataManager(options.metadataOptions);
    
    // Set up path utilities
    this.pathUtils = createPathUtils();
    
    // Set up content type utilities
    this.contentTypeUtils = createContentTypeUtils();
    
    // Set up filename generation
    this.generateUniqueFilenames = options.generateUniqueFilenames !== false;
    this.filenameGenerator = options.filenameGenerator || this._defaultFilenameGenerator;
    
    // Bind methods to ensure correct 'this' context
    this.createBucket = this.createBucket.bind(this);
    this.listBuckets = this.listBuckets.bind(this);
    this.deleteBucket = this.deleteBucket.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.downloadFile = this.downloadFile.bind(this);
    this.getFileInfo = this.getFileInfo.bind(this);
    this.listFiles = this.listFiles.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
    this.copyFile = this.copyFile.bind(this);
    this.moveFile = this.moveFile.bind(this);
    this.getFileUrl = this.getFileUrl.bind(this);
    this.getSignedUrl = this.getSignedUrl.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
    this.searchFiles = this.searchFiles.bind(this);
  }

  /**
   * Create a bucket
   * @param {string} bucketName - Bucket name
   * @param {Object} options - Bucket options
   * @param {boolean} options.public - Whether the bucket is public (default: false)
   * @param {number} options.fileSizeLimit - Maximum file size in bytes (default: 100MB)
   * @param {string[]} options.allowedMimeTypes - Allowed MIME types (default: all)
   * @returns {Promise<Object>} - Bucket information
   */
  async createBucket(bucketName, options = {}) {
    try {
      // Validate bucket name
      if (!bucketName) {
        throw new Error('Bucket name is required');
      }
      
      // Default options
      const bucketOptions = {
        public: false,
        fileSizeLimit: 104857600, // 100MB
        allowedMimeTypes: [],
        ...options
      };
      
      // Store bucket configuration
      this.bucketConfig[bucketName] = bucketOptions;
      
      // Create bucket in adapter
      return await this.adapter.createBucket(bucketName, bucketOptions);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List all buckets
   * @returns {Promise<Array>} - List of buckets
   */
  async listBuckets() {
    try {
      return await this.adapter.listBuckets();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a bucket
   * @param {string} bucketName - Bucket name
   * @param {Object} options - Delete options
   * @param {boolean} options.force - Whether to force deletion even if the bucket is not empty
   * @returns {Promise<boolean>} - Whether the bucket was deleted
   */
  async deleteBucket(bucketName, options = {}) {
    try {
      // Validate bucket name
      if (!bucketName) {
        throw new Error('Bucket name is required');
      }
      
      // Delete bucket in adapter
      const result = await this.adapter.deleteBucket(bucketName, options);
      
      // Remove bucket configuration
      if (result) {
        delete this.bucketConfig[bucketName];
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload a file
   * @param {Object} options - Upload options
   * @param {string} options.bucketName - Bucket name (default: this.defaultBucket)
   * @param {string} options.path - File path within the bucket
   * @param {Buffer|Blob|string} options.data - File data
   * @param {string} options.contentType - Content type (default: auto-detect)
   * @param {Object} options.metadata - File metadata
   * @param {boolean} options.upsert - Whether to overwrite existing file (default: false)
   * @param {boolean} options.public - Whether the file is public (default: bucket setting)
   * @returns {Promise<Object>} - Upload result
   */
  async uploadFile(options) {
    try {
      const {
        bucketName = this.defaultBucket,
        path: filePath,
        data,
        contentType,
        metadata = {},
        upsert = false,
        public: isPublic
      } = options;
      
      // Validate required parameters
      if (!filePath) {
        throw new Error('File path is required');
      }
      
      if (!data) {
        throw new Error('File data is required');
      }
      
      // Get bucket configuration
      const bucketConfig = this.bucketConfig[bucketName] || {};
      
      // Generate unique path if enabled
      let finalPath = filePath;
      if (this.generateUniqueFilenames) {
        finalPath = this.filenameGenerator(filePath);
      }
      
      // Determine content type
      const finalContentType = contentType || this.contentTypeUtils.detectContentType(finalPath, data);
      
      // Validate file size
      if (bucketConfig.fileSizeLimit) {
        const fileSize = data.length || (data.size || 0);
        if (fileSize > bucketConfig.fileSizeLimit) {
          throw new Error(`File size exceeds limit of ${bucketConfig.fileSizeLimit} bytes`);
        }
      }
      
      // Validate MIME type
      if (bucketConfig.allowedMimeTypes && bucketConfig.allowedMimeTypes.length > 0) {
        if (!bucketConfig.allowedMimeTypes.includes(finalContentType)) {
          throw new Error(`Content type ${finalContentType} is not allowed in this bucket`);
        }
      }
      
      // Prepare metadata
      const finalMetadata = this.metadataManager.prepareMetadata(metadata, {
        contentType: finalContentType,
        size: data.length || (data.size || 0),
        uploadedAt: new Date().toISOString()
      });
      
      // Determine public access
      const finalIsPublic = isPublic !== undefined ? isPublic : bucketConfig.public;
      
      // Upload file
      const result = await this.adapter.uploadFile({
        bucketName,
        path: finalPath,
        data,
        contentType: finalContentType,
        metadata: finalMetadata,
        upsert,
        public: finalIsPublic
      });
      
      return {
        ...result,
        path: finalPath,
        contentType: finalContentType,
        metadata: finalMetadata
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download a file
   * @param {Object} options - Download options
   * @param {string} options.bucketName - Bucket name (default: this.defaultBucket)
   * @param {string} options.path - File path within the bucket
   * @param {string} options.responseType - Response type ('arraybuffer', 'blob', 'text', 'json', 'stream')
   * @returns {Promise<Object>} - Download result with data and metadata
   */
  async downloadFile(options) {
    try {
      const {
        bucketName = this.defaultBucket,
        path: filePath,
        responseType = 'arraybuffer'
      } = options;
      
      // Validate required parameters
      if (!filePath) {
        throw new Error('File path is required');
      }
      
      // Download file
      return await this.adapter.downloadFile({
        bucketName,
        path: filePath,
        responseType
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get file information
   * @param {Object} options - File info options
   * @param {string} options.bucketName - Bucket name (default: this.defaultBucket)
   * @param {string} options.path - File path within the bucket
   * @returns {Promise<Object>} - File information
   */
  async getFileInfo(options) {
    try {
      const {
        bucketName = this.defaultBucket,
        path: filePath
      } = options;
      
      // Validate required parameters
      if (!filePath) {
        throw new Error('File path is required');
      }
      
      // Get file info
      return await this.adapter.getFileInfo({
        bucketName,
        path: filePath
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * List files in a bucket
   * @param {Object} options - List options
   * @param {string} options.bucketName - Bucket name (default: this.defaultBucket)
   * @param {string} options.prefix - Path prefix to filter by
   * @param {number} options.limit - Maximum number of files to return
   * @param {string} options.cursor - Pagination cursor
   * @param {string} options.sortBy - Sort field
   * @param {boolean} options.sortDescending - Whether to sort in descending order
   * @returns {Promise<Object>} - List result with files and pagination info
   */
  async listFiles(options = {}) {
    try {
      const {
        bucketName = this.defaultBucket,
        prefix = '',
        limit = 100,
        cursor,
        sortBy = 'name',
        sortDescending = false
      } = options;
      
      // List files
      return await this.adapter.listFiles({
        bucketName,
        prefix,
        limit,
        cursor,
        sortBy,
        sortDescending
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a file
   * @param {Object} options - Delete options
   * @param {string} options.bucketName - Bucket name (default: this.defaultBucket)
   * @param {string} options.path - File path within the bucket
   * @returns {Promise<boolean>} - Whether the file was deleted
   */
  async deleteFile(options) {
    try {
      const {
        bucketName = this.defaultBucket,
        path: filePath
      } = options;
      
      // Validate required parameters
      if (!filePath) {
        throw new Error('File path is required');
      }
      
      // Delete file
      return await this.adapter.deleteFile({
        bucketName,
        path: filePath
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Copy a file
   * @param {Object} options - Copy options
   * @param {string} options.sourceBucket - Source bucket name (default: this.defaultBucket)
   * @param {string} options.sourcePath - Source file path
   * @param {string} options.destinationBucket - Destination bucket name (default: sourceBucket)
   * @param {string} options.destinationPath - Destination file path
   * @param {boolean} options.overwrite - Whether to overwrite existing file (default: false)
   * @returns {Promise<Object>} - Copy result
   */
  async copyFile(options) {
    try {
      const {
        sourceBucket = this.defaultBucket,
        sourcePath,
        destinationBucket = sourceBucket,
        destinationPath,
        overwrite = false
      } = options;
      
      // Validate required parameters
      if (!sourcePath) {
        throw new Error('Source path is required');
      }
      
      if (!destinationPath) {
        throw new Error('Destination path is required');
      }
      
      // Copy file
      return await this.adapter.copyFile({
        sourceBucket,
        sourcePath,
        destinationBucket,
        destinationPath,
        overwrite
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Move a file
   * @param {Object} options - Move options
   * @param {string} options.sourceBucket - Source bucket name (default: this.defaultBucket)
   * @param {string} options.sourcePath - Source file path
   * @param {string} options.destinationBucket - Destination bucket name (default: sourceBucket)
   * @param {string} options.destinationPath - Destination file path
   * @param {boolean} options.overwrite - Whether to overwrite existing file (default: false)
   * @returns {Promise<Object>} - Move result
   */
  async moveFile(options) {
    try {
      const {
        sourceBucket = this.defaultBucket,
        sourcePath,
        destinationBucket = sourceBucket,
        destinationPath,
        overwrite = false
      } = options;
      
      // Validate required parameters
      if (!sourcePath) {
        throw new Error('Source path is required');
      }
      
      if (!destinationPath) {
        throw new Error('Destination path is required');
      }
      
      // Move file
      return await this.adapter.moveFile({
        sourceBucket,
        sourcePath,
        destinationBucket,
        destinationPath,
        overwrite
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a public URL for a file
   * @param {Object} options - URL options
   * @param {string} options.bucketName - Bucket name (default: this.defaultBucket)
   * @param {string} options.path - File path within the bucket
   * @returns {Promise<string>} - Public URL
   */
  async getFileUrl(options) {
    try {
      const {
        bucketName = this.defaultBucket,
        path: filePath
      } = options;
      
      // Validate required parameters
      if (!filePath) {
        throw new Error('File path is required');
      }
      
      // Get file URL
      return await this.adapter.getFileUrl({
        bucketName,
        path: filePath
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a signed URL for a file
   * @param {Object} options - Signed URL options
   * @param {string} options.bucketName - Bucket name (default: this.defaultBucket)
   * @param {string} options.path - File path within the bucket
   * @param {number} options.expiresIn - Expiration time in seconds (default: 3600)
   * @param {string} options.action - Action ('read', 'write', 'delete')
   * @returns {Promise<string>} - Signed URL
   */
  async getSignedUrl(options) {
    try {
      const {
        bucketName = this.defaultBucket,
        path: filePath,
        expiresIn = 3600,
        action = 'read'
      } = options;
      
      // Validate required parameters
      if (!filePath) {
        throw new Error('File path is required');
      }
      
      // Get signed URL
      return await this.adapter.getSignedUrl({
        bucketName,
        path: filePath,
        expiresIn,
        action
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update file metadata
   * @param {Object} options - Metadata options
   * @param {string} options.bucketName - Bucket name (default: this.defaultBucket)
   * @param {string} options.path - File path within the bucket
   * @param {Object} options.metadata - Metadata to update
   * @param {boolean} options.merge - Whether to merge with existing metadata (default: true)
   * @returns {Promise<Object>} - Updated metadata
   */
  async updateMetadata(options) {
    try {
      const {
        bucketName = this.defaultBucket,
        path: filePath,
        metadata = {},
        merge = true
      } = options;
      
      // Validate required parameters
      if (!filePath) {
        throw new Error('File path is required');
      }
      
      // Prepare metadata
      const finalMetadata = merge
        ? await this._mergeMetadata(bucketName, filePath, metadata)
        : this.metadataManager.prepareMetadata(metadata);
      
      // Update metadata
      return await this.adapter.updateMetadata({
        bucketName,
        path: filePath,
        metadata: finalMetadata
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search for files
   * @param {Object} options - Search options
   * @param {string} options.bucketName - Bucket name (default: this.defaultBucket)
   * @param {string} options.prefix - Path prefix to filter by
   * @param {Object} options.metadata - Metadata to filter by
   * @param {number} options.limit - Maximum number of files to return
   * @param {string} options.cursor - Pagination cursor
   * @returns {Promise<Object>} - Search result with files and pagination info
   */
  async searchFiles(options = {}) {
    try {
      const {
        bucketName = this.defaultBucket,
        prefix = '',
        metadata = {},
        limit = 100,
        cursor
      } = options;
      
      // Search files
      return await this.adapter.searchFiles({
        bucketName,
        prefix,
        metadata,
        limit,
        cursor
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Default filename generator
   * @private
   * @param {string} originalPath - Original file path
   * @returns {string} - Unique file path
   */
  _defaultFilenameGenerator(originalPath) {
    const { dir, name, ext } = this.pathUtils.parsePath(originalPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueName = `${name}_${timestamp}${ext}`;
    return this.pathUtils.joinPath(dir, uniqueName);
  }

  /**
   * Merge metadata with existing metadata
   * @private
   * @param {string} bucketName - Bucket name
   * @param {string} filePath - File path
   * @param {Object} newMetadata - New metadata
   * @returns {Promise<Object>} - Merged metadata
   */
  async _mergeMetadata(bucketName, filePath, newMetadata) {
    try {
      // Get existing metadata
      const fileInfo = await this.adapter.getFileInfo({
        bucketName,
        path: filePath
      });
      
      // Merge metadata
      return this.metadataManager.prepareMetadata({
        ...fileInfo.metadata,
        ...newMetadata
      });
    } catch (error) {
      // If file doesn't exist, just return the new metadata
      return this.metadataManager.prepareMetadata(newMetadata);
    }
  }
}

// Export adapters
export { MemoryAdapter } from './adapters/memory.js';
export { FilesystemAdapter } from './adapters/filesystem.js';
export { S3Adapter } from './adapters/s3.js';
export { SupabaseAdapter } from './adapters/supabase.js';

// Export utilities
export { createMetadataManager } from './utils/metadata.js';
export { createPathUtils } from './utils/path.js';
export { createContentTypeUtils } from './utils/content-type.js';

// Export the StorageService class
export { StorageService };

// Export a factory function for convenience
export function createStorageService(options = {}) {
  return new StorageService(options);
}

// Default export
export default createStorageService;