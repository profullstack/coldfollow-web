import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService, MemoryAdapter } from '../src/index.js';

describe('StorageService', () => {
  let storageService;
  
  beforeEach(() => {
    storageService = new StorageService();
  });
  
  describe('constructor', () => {
    it('should create a storage service with default options', () => {
      expect(storageService).toBeInstanceOf(StorageService);
      expect(storageService.adapter).toBeInstanceOf(MemoryAdapter);
      expect(storageService.defaultBucket).toBe('default');
      expect(storageService.generateUniqueFilenames).toBe(true);
    });
    
    it('should create a storage service with custom options', () => {
      const customAdapter = new MemoryAdapter();
      const customService = new StorageService({
        adapter: customAdapter,
        defaultBucket: 'custom-bucket',
        generateUniqueFilenames: false
      });
      
      expect(customService.adapter).toBe(customAdapter);
      expect(customService.defaultBucket).toBe('custom-bucket');
      expect(customService.generateUniqueFilenames).toBe(false);
    });
  });
  
  describe('bucket operations', () => {
    it('should create a bucket', async () => {
      const result = await storageService.createBucket('test-bucket');
      
      expect(result).toHaveProperty('name', 'test-bucket');
      expect(result).toHaveProperty('createdAt');
      
      const buckets = await storageService.listBuckets();
      expect(buckets).toHaveLength(1);
      expect(buckets[0].name).toBe('test-bucket');
    });
    
    it('should list buckets', async () => {
      await storageService.createBucket('bucket1');
      await storageService.createBucket('bucket2');
      
      const buckets = await storageService.listBuckets();
      
      expect(buckets).toHaveLength(2);
      expect(buckets[0].name).toBe('bucket1');
      expect(buckets[1].name).toBe('bucket2');
    });
    
    it('should delete a bucket', async () => {
      await storageService.createBucket('bucket-to-delete');
      
      const result = await storageService.deleteBucket('bucket-to-delete');
      
      expect(result).toBe(true);
      
      const buckets = await storageService.listBuckets();
      expect(buckets).toHaveLength(0);
    });
    
    it('should throw an error when deleting a non-empty bucket without force option', async () => {
      await storageService.createBucket('non-empty-bucket');
      
      await storageService.uploadFile({
        bucketName: 'non-empty-bucket',
        path: 'test-file.txt',
        data: 'test content'
      });
      
      await expect(storageService.deleteBucket('non-empty-bucket'))
        .rejects.toThrow('Bucket "non-empty-bucket" is not empty');
      
      // Should succeed with force option
      const result = await storageService.deleteBucket('non-empty-bucket', { force: true });
      expect(result).toBe(true);
    });
  });
  
  describe('file operations', () => {
    beforeEach(async () => {
      await storageService.createBucket('test-bucket');
    });
    
    it('should upload a file', async () => {
      const result = await storageService.uploadFile({
        bucketName: 'test-bucket',
        path: 'test-file.txt',
        data: 'test content',
        contentType: 'text/plain'
      });
      
      expect(result).toHaveProperty('path');
      expect(result.path).toMatch(/test-file_.*\.txt/); // Should have timestamp in name
      expect(result).toHaveProperty('contentType', 'text/plain');
      expect(result).toHaveProperty('metadata');
    });
    
    it('should upload a file with custom path when generateUniqueFilenames is false', async () => {
      const customService = new StorageService({
        generateUniqueFilenames: false
      });
      
      await customService.createBucket('test-bucket');
      
      const result = await customService.uploadFile({
        bucketName: 'test-bucket',
        path: 'custom-path.txt',
        data: 'test content'
      });
      
      expect(result.path).toBe('custom-path.txt');
    });
    
    it('should download a file', async () => {
      // Upload a file first
      const uploadResult = await storageService.uploadFile({
        bucketName: 'test-bucket',
        path: 'download-test.txt',
        data: 'content to download',
        contentType: 'text/plain',
        metadata: { testKey: 'testValue' }
      });
      
      // Download the file
      const downloadResult = await storageService.downloadFile({
        bucketName: 'test-bucket',
        path: uploadResult.path,
        responseType: 'text'
      });
      
      expect(downloadResult).toHaveProperty('data', 'content to download');
      expect(downloadResult).toHaveProperty('contentType', 'text/plain');
      expect(downloadResult).toHaveProperty('metadata.testKey', 'testValue');
    });
    
    it('should get file info', async () => {
      // Upload a file first
      const uploadResult = await storageService.uploadFile({
        bucketName: 'test-bucket',
        path: 'info-test.txt',
        data: 'test content',
        metadata: { testKey: 'testValue' }
      });
      
      // Get file info
      const fileInfo = await storageService.getFileInfo({
        bucketName: 'test-bucket',
        path: uploadResult.path
      });
      
      expect(fileInfo).toHaveProperty('path', uploadResult.path);
      expect(fileInfo).toHaveProperty('size', 12); // 'test content' length
      expect(fileInfo).toHaveProperty('metadata.testKey', 'testValue');
    });
    
    it('should list files', async () => {
      // Upload some files
      await storageService.uploadFile({
        bucketName: 'test-bucket',
        path: 'file1.txt',
        data: 'content 1'
      });
      
      await storageService.uploadFile({
        bucketName: 'test-bucket',
        path: 'file2.txt',
        data: 'content 2'
      });
      
      await storageService.uploadFile({
        bucketName: 'test-bucket',
        path: 'subdir/file3.txt',
        data: 'content 3'
      });
      
      // List all files
      const allFiles = await storageService.listFiles({
        bucketName: 'test-bucket'
      });
      
      expect(allFiles.files).toHaveLength(3);
      
      // List files with prefix
      const subdirFiles = await storageService.listFiles({
        bucketName: 'test-bucket',
        prefix: 'subdir/'
      });
      
      expect(subdirFiles.files).toHaveLength(1);
      expect(subdirFiles.files[0].path).toMatch(/subdir\/file3/);
    });
    
    it('should delete a file', async () => {
      // Upload a file first
      const uploadResult = await storageService.uploadFile({
        bucketName: 'test-bucket',
        path: 'delete-test.txt',
        data: 'content to delete'
      });
      
      // Delete the file
      const deleteResult = await storageService.deleteFile({
        bucketName: 'test-bucket',
        path: uploadResult.path
      });
      
      expect(deleteResult).toBe(true);
      
      // Verify file is deleted
      await expect(storageService.getFileInfo({
        bucketName: 'test-bucket',
        path: uploadResult.path
      })).rejects.toThrow();
    });
    
    it('should copy a file', async () => {
      // Upload a file first
      const uploadResult = await storageService.uploadFile({
        bucketName: 'test-bucket',
        path: 'source-file.txt',
        data: 'content to copy',
        metadata: { source: true }
      });
      
      // Copy the file
      const copyResult = await storageService.copyFile({
        sourceBucket: 'test-bucket',
        sourcePath: uploadResult.path,
        destinationBucket: 'test-bucket',
        destinationPath: 'destination-file.txt'
      });
      
      expect(copyResult).toHaveProperty('path', 'destination-file.txt');
      
      // Verify both files exist
      const sourceInfo = await storageService.getFileInfo({
        bucketName: 'test-bucket',
        path: uploadResult.path
      });
      
      const destInfo = await storageService.getFileInfo({
        bucketName: 'test-bucket',
        path: 'destination-file.txt'
      });
      
      expect(sourceInfo).toHaveProperty('metadata.source', true);
      expect(destInfo).toHaveProperty('metadata.source', true);
    });
    
    it('should move a file', async () => {
      // Upload a file first
      const uploadResult = await storageService.uploadFile({
        bucketName: 'test-bucket',
        path: 'move-source.txt',
        data: 'content to move'
      });
      
      // Move the file
      const moveResult = await storageService.moveFile({
        sourceBucket: 'test-bucket',
        sourcePath: uploadResult.path,
        destinationBucket: 'test-bucket',
        destinationPath: 'move-destination.txt'
      });
      
      expect(moveResult).toHaveProperty('path', 'move-destination.txt');
      
      // Verify source is gone and destination exists
      await expect(storageService.getFileInfo({
        bucketName: 'test-bucket',
        path: uploadResult.path
      })).rejects.toThrow();
      
      const destInfo = await storageService.getFileInfo({
        bucketName: 'test-bucket',
        path: 'move-destination.txt'
      });
      
      expect(destInfo).toHaveProperty('path', 'move-destination.txt');
    });
    
    it('should update metadata', async () => {
      // Upload a file first
      const uploadResult = await storageService.uploadFile({
        bucketName: 'test-bucket',
        path: 'metadata-test.txt',
        data: 'test content',
        metadata: { initial: 'value' }
      });
      
      // Update metadata
      const updateResult = await storageService.updateMetadata({
        bucketName: 'test-bucket',
        path: uploadResult.path,
        metadata: { 
          updated: true,
          initial: 'new-value'
        }
      });
      
      expect(updateResult).toHaveProperty('updated', true);
      expect(updateResult).toHaveProperty('initial', 'new-value');
      
      // Verify metadata was updated
      const fileInfo = await storageService.getFileInfo({
        bucketName: 'test-bucket',
        path: uploadResult.path
      });
      
      expect(fileInfo.metadata).toHaveProperty('updated', true);
      expect(fileInfo.metadata).toHaveProperty('initial', 'new-value');
    });
    
    it('should search files by metadata', async () => {
      // Upload files with different metadata
      await storageService.uploadFile({
        bucketName: 'test-bucket',
        path: 'search1.txt',
        data: 'content 1',
        metadata: { category: 'A', tag: 'test' }
      });
      
      await storageService.uploadFile({
        bucketName: 'test-bucket',
        path: 'search2.txt',
        data: 'content 2',
        metadata: { category: 'B', tag: 'test' }
      });
      
      await storageService.uploadFile({
        bucketName: 'test-bucket',
        path: 'search3.txt',
        data: 'content 3',
        metadata: { category: 'A', tag: 'production' }
      });
      
      // Search by category
      const categoryResults = await storageService.searchFiles({
        bucketName: 'test-bucket',
        metadata: { category: 'A' }
      });
      
      expect(categoryResults.files).toHaveLength(2);
      
      // Search by tag
      const tagResults = await storageService.searchFiles({
        bucketName: 'test-bucket',
        metadata: { tag: 'test' }
      });
      
      expect(tagResults.files).toHaveLength(2);
      
      // Search by multiple criteria
      const multiResults = await storageService.searchFiles({
        bucketName: 'test-bucket',
        metadata: { category: 'A', tag: 'test' }
      });
      
      expect(multiResults.files).toHaveLength(1);
    });
  });
});