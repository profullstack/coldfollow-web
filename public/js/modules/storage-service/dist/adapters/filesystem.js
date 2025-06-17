/**
 * Filesystem adapter for @profullstack/storage-service
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';

// Promisify fs functions
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

/**
 * Filesystem Storage Adapter
 */
export class FilesystemAdapter {
  /**
   * Create a new Filesystem adapter
   * @param {Object} options - Filesystem options
   * @param {string} options.rootDir - Root directory for storage
   * @param {string} options.baseUrl - Base URL for public access
   */
  constructor(options = {}) {
    if (!options.rootDir) {
      throw new Error('Root directory is required');
    }

    this.rootDir = options.rootDir;
    this.baseUrl = options.baseUrl || null;
    this.metadataDir = path.join(this.rootDir, '.metadata');

    // Create root directory if it doesn't exist
    this._ensureDirectoryExists(this.rootDir);
    this._ensureDirectoryExists(this.metadataDir);
  }

  /**
   * Create a bucket
   * @param {string} bucketName - Bucket name
   * @param {Object} options - Bucket options
   * @returns {Promise<Object>} - Bucket information
   */
  async createBucket(bucketName, options = {}) {
    try {
      // Validate bucket name
      this._validateBucketName(bucketName);

      // Create bucket directory
      const bucketDir = this._getBucketPath(bucketName);
      await this._ensureDirectoryExists(bucketDir);

      // Create metadata directory for the bucket
      const bucketMetadataDir = this._getBucketMetadataPath(bucketName);
      await this._ensureDirectoryExists(bucketMetadataDir);

      // Save bucket metadata
      const bucketMetadata = {
        name: bucketName,
        createdAt: new Date().toISOString(),
        ...options
      };

      await this._saveBucketMetadata(bucketName, bucketMetadata);

      return bucketMetadata;
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
      // Get all directories in the root directory
      const entries = await readdir(this.rootDir, { withFileTypes: true });
      const bucketDirs = entries.filter(entry => 
        entry.isDirectory() && !entry.name.startsWith('.')
      );

      // Get metadata for each bucket
      const buckets = await Promise.all(
        bucketDirs.map(async dir => {
          try {
            return await this._getBucketMetadata(dir.name);
          } catch (error) {
            // If metadata doesn't exist, return basic info
            return {
              name: dir.name,
              createdAt: new Date().toISOString()
            };
          }
        })
      );

      return buckets;
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
      // Validate bucket name
      this._validateBucketName(bucketName);

      // Get bucket directory
      const bucketDir = this._getBucketPath(bucketName);
      const bucketMetadataDir = this._getBucketMetadataPath(bucketName);

      // Check if bucket exists
      if (!await this._directoryExists(bucketDir)) {
        throw new Error(`Bucket ${bucketName} does not exist`);
      }

      // Check if bucket is empty if not force deleting
      if (!options.force) {
        const files = await readdir(bucketDir);
        if (files.length > 0) {
          throw new Error('Bucket is not empty. Use force option to delete anyway.');
        }
      }

      // Delete bucket directory recursively
      await this._removeDirectory(bucketDir);

      // Delete bucket metadata directory
      if (await this._directoryExists(bucketMetadataDir)) {
        await this._removeDirectory(bucketMetadataDir);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload a file
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} - Upload result
   */
  async uploadFile(options) {
    try {
      const {
        bucketName,
        path: filePath,
        data,
        contentType,
        metadata = {},
        upsert = false
      } = options;

      // Validate bucket name and file path
      this._validateBucketName(bucketName);
      this._validateFilePath(filePath);

      // Get file path
      const fullPath = this._getFilePath(bucketName, filePath);
      const dirPath = path.dirname(fullPath);

      // Check if file exists and we're not upserting
      if (!upsert && await this._fileExists(fullPath)) {
        throw new Error(`File ${filePath} already exists in bucket ${bucketName}`);
      }

      // Create directory if it doesn't exist
      await this._ensureDirectoryExists(dirPath);

      // Write file
      await writeFile(fullPath, data);

      // Save metadata
      const fileMetadata = {
        path: filePath,
        contentType,
        size: Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data),
        metadata,
        uploadedAt: new Date().toISOString()
      };

      await this._saveFileMetadata(bucketName, filePath, fileMetadata);

      // Generate URL if base URL is provided
      let url = null;
      if (this.baseUrl) {
        url = `${this.baseUrl}/${bucketName}/${filePath}`;
      }

      return {
        path: filePath,
        url,
        contentType,
        size: fileMetadata.size,
        metadata
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download a file
   * @param {Object} options - Download options
   * @returns {Promise<Object>} - Download result with data and metadata
   */
  async downloadFile(options) {
    try {
      const {
        bucketName,
        path: filePath,
        responseType = 'buffer'
      } = options;

      // Validate bucket name and file path
      this._validateBucketName(bucketName);
      this._validateFilePath(filePath);

      // Get file path
      const fullPath = this._getFilePath(bucketName, filePath);

      // Check if file exists
      if (!await this._fileExists(fullPath)) {
        throw new Error(`File ${filePath} does not exist in bucket ${bucketName}`);
      }

      // Get file metadata
      const metadata = await this._getFileMetadata(bucketName, filePath);

      // Read file
      let data = await readFile(fullPath);

      // Convert to requested response type
      if (responseType === 'text') {
        data = data.toString('utf8');
      } else if (responseType === 'json') {
        data = JSON.parse(data.toString('utf8'));
      } else if (responseType === 'stream') {
        data = fs.createReadStream(fullPath);
      }

      return {
        data,
        metadata: metadata.metadata || {},
        contentType: metadata.contentType || 'application/octet-stream',
        size: metadata.size || 0
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get file information
   * @param {Object} options - File info options
   * @returns {Promise<Object>} - File information
   */
  async getFileInfo(options) {
    try {
      const {
        bucketName,
        path: filePath
      } = options;

      // Validate bucket name and file path
      this._validateBucketName(bucketName);
      this._validateFilePath(filePath);

      // Get file path
      const fullPath = this._getFilePath(bucketName, filePath);

      // Check if file exists
      if (!await this._fileExists(fullPath)) {
        throw new Error(`File ${filePath} does not exist in bucket ${bucketName}`);
      }

      // Get file stats
      const stats = await stat(fullPath);

      // Get file metadata
      const metadata = await this._getFileMetadata(bucketName, filePath);

      // Generate URL if base URL is provided
      let url = null;
      if (this.baseUrl) {
        url = `${this.baseUrl}/${bucketName}/${filePath}`;
      }

      return {
        path: filePath,
        url,
        size: stats.size,
        contentType: metadata.contentType || 'application/octet-stream',
        metadata: metadata.metadata || {},
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Helper methods
   */
  _validateBucketName(bucketName) {
    if (!bucketName) {
      throw new Error('Bucket name is required');
    }

    if (!/^[a-z0-9-_.]+$/.test(bucketName)) {
      throw new Error('Bucket name can only contain lowercase letters, numbers, hyphens, underscores, and periods');
    }
  }

  _validateFilePath(filePath) {
    if (!filePath) {
      throw new Error('File path is required');
    }

    if (filePath.startsWith('/') || filePath.includes('..')) {
      throw new Error('Invalid file path');
    }
  }

  _getBucketPath(bucketName) {
    return path.join(this.rootDir, bucketName);
  }

  _getBucketMetadataPath(bucketName) {
    return path.join(this.metadataDir, bucketName);
  }

  _getFilePath(bucketName, filePath) {
    return path.join(this._getBucketPath(bucketName), filePath);
  }

  _getFileMetadataPath(bucketName, filePath) {
    // Hash the file path to avoid issues with special characters and long paths
    const hashedPath = crypto.createHash('md5').update(filePath).digest('hex');
    return path.join(this._getBucketMetadataPath(bucketName), `${hashedPath}.json`);
  }

  async _directoryExists(dirPath) {
    try {
      const stats = await stat(dirPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  async _fileExists(filePath) {
    try {
      const stats = await stat(filePath);
      return stats.isFile();
    } catch (error) {
      return false;
    }
  }

  async _ensureDirectoryExists(dirPath) {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Ignore error if directory already exists
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async _removeDirectory(dirPath) {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      // Remove all files and subdirectories
      await Promise.all(entries.map(async entry => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          await this._removeDirectory(fullPath);
        } else {
          await unlink(fullPath);
        }
      }));

      // Remove the directory itself
      await rmdir(dirPath);
    } catch (error) {
      throw error;
    }
  }

  async _saveBucketMetadata(bucketName, metadata) {
    const metadataPath = path.join(this._getBucketMetadataPath(bucketName), 'bucket.json');
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  async _getBucketMetadata(bucketName) {
    const metadataPath = path.join(this._getBucketMetadataPath(bucketName), 'bucket.json');
    try {
      const data = await readFile(metadataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // If metadata doesn't exist, return basic info
      return {
        name: bucketName,
        createdAt: new Date().toISOString()
      };
    }
  }

  async _saveFileMetadata(bucketName, filePath, metadata) {
    const metadataPath = this._getFileMetadataPath(bucketName, filePath);
    const metadataDir = path.dirname(metadataPath);
    await this._ensureDirectoryExists(metadataDir);
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  async _getFileMetadata(bucketName, filePath) {
    const metadataPath = this._getFileMetadataPath(bucketName, filePath);
    try {
      const data = await readFile(metadataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // If metadata doesn't exist, return empty metadata
      return {
        path: filePath,
        contentType: 'application/octet-stream',
        metadata: {}
      };
    }
  }
}

/**
 * Create a Filesystem adapter
 * @param {Object} options - Filesystem options
 * @returns {FilesystemAdapter} Filesystem adapter
 */
export function createFilesystemAdapter(options = {}) {
  return new FilesystemAdapter(options);
}

export default createFilesystemAdapter;