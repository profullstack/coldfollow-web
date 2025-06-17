/**
 * In-Memory Storage Adapter for Storage Service
 * 
 * This adapter stores files in memory, suitable for development or testing.
 * For production use, consider using the Filesystem, S3, or Supabase adapters.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * In-Memory Storage Adapter
 */
export class MemoryAdapter {
  /**
   * Create a new Memory Adapter
   */
  constructor() {
    // Initialize storage
    this.buckets = new Map();
    this.files = new Map();
    this.metadata = new Map();
  }

  /**
   * Create a bucket
   * @param {string} bucketName - Bucket name
   * @param {Object} options - Bucket options
   * @returns {Promise<Object>} - Bucket information
   */
  async createBucket(bucketName, options = {}) {
    // Check if bucket already exists
    if (this.buckets.has(bucketName)) {
      throw new Error(`Bucket "${bucketName}" already exists`);
    }
    
    // Create bucket
    const bucket = {
      name: bucketName,
      createdAt: new Date().toISOString(),
      ...options
    };
    
    // Store bucket
    this.buckets.set(bucketName, bucket);
    this.files.set(bucketName, new Map());
    
    return { ...bucket };
  }

  /**
   * List all buckets
   * @returns {Promise<Array>} - List of buckets
   */
  async listBuckets() {
    return Array.from(this.buckets.values()).map(bucket => ({ ...bucket }));
  }

  /**
   * Delete a bucket
   * @param {string} bucketName - Bucket name
   * @param {Object} options - Delete options
   * @param {boolean} options.force - Whether to force deletion even if the bucket is not empty
   * @returns {Promise<boolean>} - Whether the bucket was deleted
   */
  async deleteBucket(bucketName, options = {}) {
    // Check if bucket exists
    if (!this.buckets.has(bucketName)) {
      throw new Error(`Bucket "${bucketName}" does not exist`);
    }
    
    // Check if bucket is empty
    const bucketFiles = this.files.get(bucketName);
    if (bucketFiles.size > 0 && !options.force) {
      throw new Error(`Bucket "${bucketName}" is not empty`);
    }
    
    // Delete bucket
    this.buckets.delete(bucketName);
    this.files.delete(bucketName);
    
    // Delete all files in bucket from metadata
    for (const [key] of this.metadata.entries()) {
      if (key.startsWith(`${bucketName}:`)) {
        this.metadata.delete(key);
      }
    }
    
    return true;
  }

  /**
   * Upload a file
   * @param {Object} options - Upload options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.path - File path within the bucket
   * @param {Buffer|Blob|string} options.data - File data
   * @param {string} options.contentType - Content type
   * @param {Object} options.metadata - File metadata
   * @param {boolean} options.upsert - Whether to overwrite existing file
   * @param {boolean} options.public - Whether the file is public
   * @returns {Promise<Object>} - Upload result
   */
  async uploadFile(options) {
    const {
      bucketName,
      path: filePath,
      data,
      contentType,
      metadata = {},
      upsert = false,
      public: isPublic = false
    } = options;
    
    // Check if bucket exists
    if (!this.buckets.has(bucketName)) {
      throw new Error(`Bucket "${bucketName}" does not exist`);
    }
    
    // Get bucket files
    const bucketFiles = this.files.get(bucketName);
    
    // Check if file already exists
    if (bucketFiles.has(filePath) && !upsert) {
      throw new Error(`File "${filePath}" already exists in bucket "${bucketName}"`);
    }
    
    // Convert data to Buffer if needed
    let fileData;
    if (typeof data === 'string') {
      fileData = Buffer.from(data);
    } else if (data instanceof Buffer) {
      fileData = data;
    } else if (data instanceof Blob) {
      fileData = Buffer.from(await data.arrayBuffer());
    } else {
      fileData = Buffer.from(data);
    }
    
    // Create file object
    const file = {
      id: uuidv4(),
      name: filePath.split('/').pop(),
      path: filePath,
      size: fileData.length,
      contentType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      public: isPublic
    };
    
    // Store file
    bucketFiles.set(filePath, {
      ...file,
      data: fileData
    });
    
    // Store metadata
    const metadataKey = `${bucketName}:${filePath}`;
    this.metadata.set(metadataKey, {
      ...metadata,
      contentType,
      size: fileData.length,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt
    });
    
    return {
      ...file,
      metadata: { ...metadata }
    };
  }

  /**
   * Download a file
   * @param {Object} options - Download options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.path - File path within the bucket
   * @param {string} options.responseType - Response type ('arraybuffer', 'blob', 'text', 'json', 'stream')
   * @returns {Promise<Object>} - Download result with data and metadata
   */
  async downloadFile(options) {
    const {
      bucketName,
      path: filePath,
      responseType = 'arraybuffer'
    } = options;
    
    // Check if bucket exists
    if (!this.buckets.has(bucketName)) {
      throw new Error(`Bucket "${bucketName}" does not exist`);
    }
    
    // Get bucket files
    const bucketFiles = this.files.get(bucketName);
    
    // Check if file exists
    if (!bucketFiles.has(filePath)) {
      throw new Error(`File "${filePath}" does not exist in bucket "${bucketName}"`);
    }
    
    // Get file
    const file = bucketFiles.get(filePath);
    
    // Get metadata
    const metadataKey = `${bucketName}:${filePath}`;
    const metadata = this.metadata.get(metadataKey) || {};
    
    // Convert data based on response type
    let responseData;
    switch (responseType) {
      case 'arraybuffer':
        responseData = file.data.buffer.slice(
          file.data.byteOffset,
          file.data.byteOffset + file.data.byteLength
        );
        break;
      case 'blob':
        responseData = new Blob([file.data], { type: file.contentType });
        break;
      case 'text':
        responseData = file.data.toString('utf-8');
        break;
      case 'json':
        try {
          responseData = JSON.parse(file.data.toString('utf-8'));
        } catch (error) {
          throw new Error('File is not valid JSON');
        }
        break;
      case 'stream':
        // In memory adapter, we don't have real streams, so we create a simple readable stream
        const { Readable } = await import('stream');
        responseData = new Readable();
        responseData.push(file.data);
        responseData.push(null);
        break;
      default:
        responseData = file.data;
    }
    
    return {
      data: responseData,
      contentType: file.contentType,
      size: file.size,
      metadata: { ...metadata }
    };
  }

  /**
   * Get file information
   * @param {Object} options - File info options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.path - File path within the bucket
   * @returns {Promise<Object>} - File information
   */
  async getFileInfo(options) {
    const {
      bucketName,
      path: filePath
    } = options;
    
    // Check if bucket exists
    if (!this.buckets.has(bucketName)) {
      throw new Error(`Bucket "${bucketName}" does not exist`);
    }
    
    // Get bucket files
    const bucketFiles = this.files.get(bucketName);
    
    // Check if file exists
    if (!bucketFiles.has(filePath)) {
      throw new Error(`File "${filePath}" does not exist in bucket "${bucketName}"`);
    }
    
    // Get file
    const file = bucketFiles.get(filePath);
    
    // Get metadata
    const metadataKey = `${bucketName}:${filePath}`;
    const metadata = this.metadata.get(metadataKey) || {};
    
    // Return file info without data
    const { data, ...fileInfo } = file;
    return {
      ...fileInfo,
      metadata: { ...metadata }
    };
  }

  /**
   * List files in a bucket
   * @param {Object} options - List options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.prefix - Path prefix to filter by
   * @param {number} options.limit - Maximum number of files to return
   * @param {string} options.cursor - Pagination cursor
   * @param {string} options.sortBy - Sort field
   * @param {boolean} options.sortDescending - Whether to sort in descending order
   * @returns {Promise<Object>} - List result with files and pagination info
   */
  async listFiles(options) {
    const {
      bucketName,
      prefix = '',
      limit = 100,
      cursor,
      sortBy = 'name',
      sortDescending = false
    } = options;
    
    // Check if bucket exists
    if (!this.buckets.has(bucketName)) {
      throw new Error(`Bucket "${bucketName}" does not exist`);
    }
    
    // Get bucket files
    const bucketFiles = this.files.get(bucketName);
    
    // Filter files by prefix
    let filteredFiles = Array.from(bucketFiles.entries())
      .filter(([path]) => path.startsWith(prefix))
      .map(([path, file]) => {
        const { data, ...fileInfo } = file;
        const metadataKey = `${bucketName}:${path}`;
        const metadata = this.metadata.get(metadataKey) || {};
        return {
          ...fileInfo,
          metadata: { ...metadata }
        };
      });
    
    // Sort files
    filteredFiles.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue < bValue) return sortDescending ? 1 : -1;
      if (aValue > bValue) return sortDescending ? -1 : 1;
      return 0;
    });
    
    // Apply pagination
    let startIndex = 0;
    if (cursor) {
      // Find the index of the cursor
      const cursorIndex = filteredFiles.findIndex(file => file.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }
    
    // Get paginated files
    const paginatedFiles = filteredFiles.slice(startIndex, startIndex + limit);
    
    // Determine next cursor
    const nextCursor = paginatedFiles.length === limit ? paginatedFiles[paginatedFiles.length - 1].id : null;
    
    return {
      files: paginatedFiles,
      cursor: nextCursor,
      hasMore: nextCursor !== null
    };
  }

  /**
   * Delete a file
   * @param {Object} options - Delete options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.path - File path within the bucket
   * @returns {Promise<boolean>} - Whether the file was deleted
   */
  async deleteFile(options) {
    const {
      bucketName,
      path: filePath
    } = options;
    
    // Check if bucket exists
    if (!this.buckets.has(bucketName)) {
      throw new Error(`Bucket "${bucketName}" does not exist`);
    }
    
    // Get bucket files
    const bucketFiles = this.files.get(bucketName);
    
    // Check if file exists
    if (!bucketFiles.has(filePath)) {
      throw new Error(`File "${filePath}" does not exist in bucket "${bucketName}"`);
    }
    
    // Delete file
    bucketFiles.delete(filePath);
    
    // Delete metadata
    const metadataKey = `${bucketName}:${filePath}`;
    this.metadata.delete(metadataKey);
    
    return true;
  }

  /**
   * Copy a file
   * @param {Object} options - Copy options
   * @param {string} options.sourceBucket - Source bucket name
   * @param {string} options.sourcePath - Source file path
   * @param {string} options.destinationBucket - Destination bucket name
   * @param {string} options.destinationPath - Destination file path
   * @param {boolean} options.overwrite - Whether to overwrite existing file
   * @returns {Promise<Object>} - Copy result
   */
  async copyFile(options) {
    const {
      sourceBucket,
      sourcePath,
      destinationBucket,
      destinationPath,
      overwrite = false
    } = options;
    
    // Check if source bucket exists
    if (!this.buckets.has(sourceBucket)) {
      throw new Error(`Source bucket "${sourceBucket}" does not exist`);
    }
    
    // Check if destination bucket exists
    if (!this.buckets.has(destinationBucket)) {
      throw new Error(`Destination bucket "${destinationBucket}" does not exist`);
    }
    
    // Get source bucket files
    const sourceBucketFiles = this.files.get(sourceBucket);
    
    // Check if source file exists
    if (!sourceBucketFiles.has(sourcePath)) {
      throw new Error(`Source file "${sourcePath}" does not exist in bucket "${sourceBucket}"`);
    }
    
    // Get destination bucket files
    const destinationBucketFiles = this.files.get(destinationBucket);
    
    // Check if destination file already exists
    if (destinationBucketFiles.has(destinationPath) && !overwrite) {
      throw new Error(`Destination file "${destinationPath}" already exists in bucket "${destinationBucket}"`);
    }
    
    // Get source file
    const sourceFile = sourceBucketFiles.get(sourcePath);
    
    // Get source metadata
    const sourceMetadataKey = `${sourceBucket}:${sourcePath}`;
    const sourceMetadata = this.metadata.get(sourceMetadataKey) || {};
    
    // Create destination file
    const destinationFile = {
      ...sourceFile,
      id: uuidv4(),
      name: destinationPath.split('/').pop(),
      path: destinationPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store destination file
    destinationBucketFiles.set(destinationPath, {
      ...destinationFile,
      data: Buffer.from(sourceFile.data) // Create a copy of the data
    });
    
    // Store destination metadata
    const destinationMetadataKey = `${destinationBucket}:${destinationPath}`;
    this.metadata.set(destinationMetadataKey, {
      ...sourceMetadata,
      createdAt: destinationFile.createdAt,
      updatedAt: destinationFile.updatedAt
    });
    
    // Return destination file info
    const { data, ...fileInfo } = destinationFile;
    return {
      ...fileInfo,
      metadata: { ...sourceMetadata }
    };
  }

  /**
   * Move a file
   * @param {Object} options - Move options
   * @param {string} options.sourceBucket - Source bucket name
   * @param {string} options.sourcePath - Source file path
   * @param {string} options.destinationBucket - Destination bucket name
   * @param {string} options.destinationPath - Destination file path
   * @param {boolean} options.overwrite - Whether to overwrite existing file
   * @returns {Promise<Object>} - Move result
   */
  async moveFile(options) {
    const {
      sourceBucket,
      sourcePath,
      destinationBucket,
      destinationPath,
      overwrite = false
    } = options;
    
    // Copy file
    const copyResult = await this.copyFile({
      sourceBucket,
      sourcePath,
      destinationBucket,
      destinationPath,
      overwrite
    });
    
    // Delete source file
    await this.deleteFile({
      bucketName: sourceBucket,
      path: sourcePath
    });
    
    return copyResult;
  }

  /**
   * Get a public URL for a file
   * @param {Object} options - URL options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.path - File path within the bucket
   * @returns {Promise<string>} - Public URL
   */
  async getFileUrl(options) {
    const {
      bucketName,
      path: filePath
    } = options;
    
    // Check if bucket exists
    if (!this.buckets.has(bucketName)) {
      throw new Error(`Bucket "${bucketName}" does not exist`);
    }
    
    // Get bucket files
    const bucketFiles = this.files.get(bucketName);
    
    // Check if file exists
    if (!bucketFiles.has(filePath)) {
      throw new Error(`File "${filePath}" does not exist in bucket "${bucketName}"`);
    }
    
    // Get file
    const file = bucketFiles.get(filePath);
    
    // Check if file is public
    if (!file.public) {
      throw new Error(`File "${filePath}" is not public`);
    }
    
    // In memory adapter, we don't have real URLs, so we return a fake URL
    return `memory://${bucketName}/${filePath}`;
  }

  /**
   * Get a signed URL for a file
   * @param {Object} options - Signed URL options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.path - File path within the bucket
   * @param {number} options.expiresIn - Expiration time in seconds
   * @param {string} options.action - Action ('read', 'write', 'delete')
   * @returns {Promise<string>} - Signed URL
   */
  async getSignedUrl(options) {
    const {
      bucketName,
      path: filePath,
      expiresIn = 3600,
      action = 'read'
    } = options;
    
    // Check if bucket exists
    if (!this.buckets.has(bucketName)) {
      throw new Error(`Bucket "${bucketName}" does not exist`);
    }
    
    // Get bucket files
    const bucketFiles = this.files.get(bucketName);
    
    // Check if file exists (except for 'write' action)
    if (action !== 'write' && !bucketFiles.has(filePath)) {
      throw new Error(`File "${filePath}" does not exist in bucket "${bucketName}"`);
    }
    
    // Generate expiration timestamp
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    
    // In memory adapter, we don't have real signed URLs, so we return a fake URL
    return `memory://${bucketName}/${filePath}?action=${action}&expires=${expiresAt}`;
  }

  /**
   * Update file metadata
   * @param {Object} options - Metadata options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.path - File path within the bucket
   * @param {Object} options.metadata - Metadata to update
   * @returns {Promise<Object>} - Updated metadata
   */
  async updateMetadata(options) {
    const {
      bucketName,
      path: filePath,
      metadata = {}
    } = options;
    
    // Check if bucket exists
    if (!this.buckets.has(bucketName)) {
      throw new Error(`Bucket "${bucketName}" does not exist`);
    }
    
    // Get bucket files
    const bucketFiles = this.files.get(bucketName);
    
    // Check if file exists
    if (!bucketFiles.has(filePath)) {
      throw new Error(`File "${filePath}" does not exist in bucket "${bucketName}"`);
    }
    
    // Get file
    const file = bucketFiles.get(filePath);
    
    // Update file's updatedAt
    file.updatedAt = new Date().toISOString();
    
    // Get metadata key
    const metadataKey = `${bucketName}:${filePath}`;
    
    // Get existing metadata
    const existingMetadata = this.metadata.get(metadataKey) || {};
    
    // Update metadata
    const updatedMetadata = {
      ...existingMetadata,
      ...metadata,
      updatedAt: file.updatedAt
    };
    
    // Store updated metadata
    this.metadata.set(metadataKey, updatedMetadata);
    
    return { ...updatedMetadata };
  }

  /**
   * Search for files
   * @param {Object} options - Search options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.prefix - Path prefix to filter by
   * @param {Object} options.metadata - Metadata to filter by
   * @param {number} options.limit - Maximum number of files to return
   * @param {string} options.cursor - Pagination cursor
   * @returns {Promise<Object>} - Search result with files and pagination info
   */
  async searchFiles(options) {
    const {
      bucketName,
      prefix = '',
      metadata = {},
      limit = 100,
      cursor
    } = options;
    
    // Check if bucket exists
    if (!this.buckets.has(bucketName)) {
      throw new Error(`Bucket "${bucketName}" does not exist`);
    }
    
    // Get bucket files
    const bucketFiles = this.files.get(bucketName);
    
    // Filter files by prefix and metadata
    let filteredFiles = Array.from(bucketFiles.entries())
      .filter(([path]) => path.startsWith(prefix))
      .map(([path, file]) => {
        const { data, ...fileInfo } = file;
        const metadataKey = `${bucketName}:${path}`;
        const fileMetadata = this.metadata.get(metadataKey) || {};
        return {
          ...fileInfo,
          metadata: { ...fileMetadata }
        };
      })
      .filter(file => {
        // Check if file metadata matches all search metadata
        for (const [key, value] of Object.entries(metadata)) {
          if (file.metadata[key] !== value) {
            return false;
          }
        }
        return true;
      });
    
    // Apply pagination
    let startIndex = 0;
    if (cursor) {
      // Find the index of the cursor
      const cursorIndex = filteredFiles.findIndex(file => file.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }
    
    // Get paginated files
    const paginatedFiles = filteredFiles.slice(startIndex, startIndex + limit);
    
    // Determine next cursor
    const nextCursor = paginatedFiles.length === limit ? paginatedFiles[paginatedFiles.length - 1].id : null;
    
    return {
      files: paginatedFiles,
      cursor: nextCursor,
      hasMore: nextCursor !== null
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear() {
    this.buckets.clear();
    this.files.clear();
    this.metadata.clear();
  }
}

export default MemoryAdapter;