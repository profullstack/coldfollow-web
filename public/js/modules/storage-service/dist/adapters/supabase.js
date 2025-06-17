/**
 * Supabase adapter for @profullstack/storage-service
 */

/**
 * Supabase Storage Adapter
 */
export class SupabaseAdapter {
  /**
   * Create a new Supabase adapter
   * @param {Object} options - Supabase options
   * @param {Object} options.supabaseClient - Initialized Supabase client
   * @param {string} options.defaultBucket - Default bucket name (default: 'default')
   */
  constructor(options = {}) {
    if (!options.supabaseClient) {
      throw new Error('Supabase client is required');
    }

    this.supabase = options.supabaseClient;
    this.defaultBucket = options.defaultBucket || 'default';
  }

  /**
   * Create a bucket
   * @param {string} bucketName - Bucket name
   * @param {Object} options - Bucket options
   * @returns {Promise<Object>} - Bucket information
   */
  async createBucket(bucketName, options = {}) {
    try {
      // Create bucket in Supabase Storage
      const { data, error } = await this.supabase.storage.createBucket(bucketName, {
        public: options.public || false,
        fileSizeLimit: options.fileSizeLimit,
        allowedMimeTypes: options.allowedMimeTypes
      });

      if (error) {
        throw error;
      }

      return {
        name: bucketName,
        ...options,
        createdAt: new Date().toISOString()
      };
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
      const { data, error } = await this.supabase.storage.listBuckets();

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a bucket
   * @param {string} bucketName - Bucket name
   * @param {Object} options - Delete options
   * @returns {Promise<boolean>} - Whether the bucket was deleted
   */
  async deleteBucket(bucketName, options = {}) {
    try {
      // Check if bucket is empty if not force deleting
      if (!options.force) {
        const { data: files, error: listError } = await this.supabase.storage
          .from(bucketName)
          .list();

        if (listError) {
          throw listError;
        }

        if (files && files.length > 0) {
          throw new Error('Bucket is not empty. Use force option to delete anyway.');
        }
      }

      // Delete bucket
      const { error } = await this.supabase.storage.deleteBucket(bucketName);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload a file
   * @param {Object} options - Upload options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.path - File path
   * @param {Buffer|Blob|string} options.data - File data
   * @param {string} options.contentType - Content type
   * @param {Object} options.metadata - File metadata
   * @param {boolean} options.upsert - Whether to overwrite existing file
   * @param {boolean} options.public - Whether the file is public
   * @returns {Promise<Object>} - Upload result
   */
  async uploadFile(options) {
    try {
      const {
        bucketName,
        path: filePath,
        data,
        contentType,
        metadata,
        upsert = false,
        public: isPublic
      } = options;

      // Upload file
      const { data: uploadData, error } = await this.supabase.storage
        .from(bucketName)
        .upload(filePath, data, {
          contentType,
          upsert,
          cacheControl: '3600',
          ...(metadata && { metadata })
        });

      if (error) {
        throw error;
      }

      // Set public access if needed
      if (isPublic) {
        await this._setPublicAccess(bucketName, filePath, true);
      }

      // Get file URL
      const { data: publicUrl } = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return {
        path: filePath,
        url: publicUrl?.publicUrl || null,
        metadata,
        contentType,
        size: data.length || (data.size || 0),
        isPublic,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download a file
   * @param {Object} options - Download options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.path - File path
   * @param {string} options.responseType - Response type
   * @returns {Promise<Object>} - Download result with data and metadata
   */
  async downloadFile(options) {
    try {
      const {
        bucketName,
        path: filePath,
        responseType = 'arraybuffer'
      } = options;

      // Download file
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .download(filePath);

      if (error) {
        throw error;
      }

      // Get file metadata
      const fileInfo = await this.getFileInfo({
        bucketName,
        path: filePath
      });

      // Convert to requested response type
      let responseData = data;
      if (responseType === 'text' && data instanceof Blob) {
        responseData = await data.text();
      } else if (responseType === 'json' && data instanceof Blob) {
        const text = await data.text();
        responseData = JSON.parse(text);
      }

      return {
        data: responseData,
        metadata: fileInfo.metadata,
        contentType: fileInfo.contentType,
        size: fileInfo.size
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get file information
   * @param {Object} options - File info options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.path - File path
   * @returns {Promise<Object>} - File information
   */
  async getFileInfo(options) {
    try {
      const {
        bucketName,
        path: filePath
      } = options;

      // Get file metadata
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (error) {
        throw error;
      }

      // Get file metadata
      const { data: metadata, error: metadataError } = await this.supabase.storage
        .from(bucketName)
        .getMetadata(filePath);

      if (metadataError) {
        throw metadataError;
      }

      return {
        path: filePath,
        url: data?.publicUrl || null,
        metadata: metadata?.metadata || {},
        contentType: metadata?.contentType || 'application/octet-stream',
        size: metadata?.size || 0,
        createdAt: metadata?.created_at || new Date().toISOString(),
        lastModified: metadata?.last_modified || new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * List files in a bucket
   * @param {Object} options - List options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.prefix - Path prefix
   * @param {number} options.limit - Maximum number of files
   * @param {string} options.cursor - Pagination cursor
   * @param {string} options.sortBy - Sort field
   * @param {boolean} options.sortDescending - Sort direction
   * @returns {Promise<Object>} - List result
   */
  async listFiles(options) {
    try {
      const {
        bucketName,
        prefix = '',
        limit = 100,
        cursor,
        sortBy = 'name',
        sortDescending = false
      } = options;

      // List files
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .list(prefix, {
          limit,
          offset: cursor ? parseInt(cursor, 10) : 0,
          sortBy: {
            column: sortBy,
            order: sortDescending ? 'desc' : 'asc'
          }
        });

      if (error) {
        throw error;
      }

      // Format files
      const files = await Promise.all(
        (data || []).map(async (file) => {
          const filePath = prefix ? `${prefix}/${file.name}` : file.name;
          
          // Get file URL
          const { data: urlData } = this.supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

          return {
            path: filePath,
            url: urlData?.publicUrl || null,
            metadata: file.metadata || {},
            contentType: file.metadata?.contentType || 'application/octet-stream',
            size: file.metadata?.size || 0,
            createdAt: file.created_at || new Date().toISOString(),
            lastModified: file.last_modified || new Date().toISOString()
          };
        })
      );

      // Calculate next cursor
      const nextCursor = data && data.length === limit
        ? (cursor ? parseInt(cursor, 10) : 0) + limit
        : null;

      return {
        files,
        cursor: nextCursor ? nextCursor.toString() : null
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a file
   * @param {Object} options - Delete options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.path - File path
   * @returns {Promise<boolean>} - Whether the file was deleted
   */
  async deleteFile(options) {
    try {
      const {
        bucketName,
        path: filePath
      } = options;

      // Delete file
      const { error } = await this.supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Copy a file
   * @param {Object} options - Copy options
   * @param {string} options.sourceBucket - Source bucket
   * @param {string} options.sourcePath - Source path
   * @param {string} options.destinationBucket - Destination bucket
   * @param {string} options.destinationPath - Destination path
   * @param {boolean} options.overwrite - Whether to overwrite
   * @returns {Promise<Object>} - Copy result
   */
  async copyFile(options) {
    try {
      const {
        sourceBucket,
        sourcePath,
        destinationBucket,
        destinationPath,
        overwrite = false
      } = options;

      // Check if destination exists and we're not overwriting
      if (!overwrite) {
        try {
          const destInfo = await this.getFileInfo({
            bucketName: destinationBucket,
            path: destinationPath
          });

          if (destInfo) {
            throw new Error('Destination file already exists');
          }
        } catch (error) {
          // If error is because file doesn't exist, that's fine
          if (!error.message.includes('not found')) {
            throw error;
          }
        }
      }

      // Download source file
      const sourceFile = await this.downloadFile({
        bucketName: sourceBucket,
        path: sourcePath
      });

      // Upload to destination
      return await this.uploadFile({
        bucketName: destinationBucket,
        path: destinationPath,
        data: sourceFile.data,
        contentType: sourceFile.contentType,
        metadata: sourceFile.metadata,
        upsert: overwrite
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Move a file
   * @param {Object} options - Move options
   * @param {string} options.sourceBucket - Source bucket
   * @param {string} options.sourcePath - Source path
   * @param {string} options.destinationBucket - Destination bucket
   * @param {string} options.destinationPath - Destination path
   * @param {boolean} options.overwrite - Whether to overwrite
   * @returns {Promise<Object>} - Move result
   */
  async moveFile(options) {
    try {
      const {
        sourceBucket,
        sourcePath,
        destinationBucket,
        destinationPath,
        overwrite = false
      } = options;

      // Copy the file
      const copyResult = await this.copyFile({
        sourceBucket,
        sourcePath,
        destinationBucket,
        destinationPath,
        overwrite
      });

      // Delete the source file
      await this.deleteFile({
        bucketName: sourceBucket,
        path: sourcePath
      });

      return copyResult;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a public URL for a file
   * @param {Object} options - URL options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.path - File path
   * @returns {Promise<string>} - Public URL
   */
  async getFileUrl(options) {
    try {
      const {
        bucketName,
        path: filePath
      } = options;

      // Get public URL
      const { data, error } = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (error) {
        throw error;
      }

      return data?.publicUrl || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a signed URL for a file
   * @param {Object} options - Signed URL options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.path - File path
   * @param {number} options.expiresIn - Expiration time in seconds
   * @param {string} options.action - Action (read, write, delete)
   * @returns {Promise<string>} - Signed URL
   */
  async getSignedUrl(options) {
    try {
      const {
        bucketName,
        path: filePath,
        expiresIn = 3600,
        action = 'read'
      } = options;

      // Map action to Supabase action
      const supabaseAction = action === 'write' ? 'upload' : action;

      // Get signed URL
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn, {
          download: action === 'read'
        });

      if (error) {
        throw error;
      }

      return data?.signedUrl || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update file metadata
   * @param {Object} options - Metadata options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.path - File path
   * @param {Object} options.metadata - Metadata to update
   * @returns {Promise<Object>} - Updated metadata
   */
  async updateMetadata(options) {
    try {
      const {
        bucketName,
        path: filePath,
        metadata
      } = options;

      // Supabase doesn't have a direct method to update metadata
      // We need to download and re-upload the file with new metadata
      
      // Download file
      const file = await this.downloadFile({
        bucketName,
        path: filePath
      });

      // Upload with new metadata
      await this.uploadFile({
        bucketName,
        path: filePath,
        data: file.data,
        contentType: file.contentType,
        metadata,
        upsert: true
      });

      return metadata;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search for files
   * @param {Object} options - Search options
   * @param {string} options.bucketName - Bucket name
   * @param {string} options.prefix - Path prefix
   * @param {Object} options.metadata - Metadata to filter by
   * @param {number} options.limit - Maximum number of files
   * @param {string} options.cursor - Pagination cursor
   * @returns {Promise<Object>} - Search result
   */
  async searchFiles(options) {
    try {
      const {
        bucketName,
        prefix = '',
        metadata = {},
        limit = 100,
        cursor
      } = options;

      // List files
      const { files, cursor: nextCursor } = await this.listFiles({
        bucketName,
        prefix,
        limit,
        cursor
      });

      // Filter by metadata
      const filteredFiles = files.filter(file => {
        // Check if file metadata matches all criteria
        return Object.entries(metadata).every(([key, value]) => {
          return file.metadata && file.metadata[key] === value;
        });
      });

      return {
        files: filteredFiles,
        cursor: nextCursor
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set public access for a file
   * @private
   * @param {string} bucketName - Bucket name
   * @param {string} filePath - File path
   * @param {boolean} isPublic - Whether the file should be public
   * @returns {Promise<void>}
   */
  async _setPublicAccess(bucketName, filePath, isPublic) {
    try {
      // Supabase doesn't have a direct method to set public access for individual files
      // Public access is controlled at the bucket level
      // This is a placeholder for future implementation
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Create a Supabase adapter
 * @param {Object} options - Supabase options
 * @returns {SupabaseAdapter} Supabase adapter
 */
export function createSupabaseAdapter(options = {}) {
  return new SupabaseAdapter(options);
}

export default createSupabaseAdapter;