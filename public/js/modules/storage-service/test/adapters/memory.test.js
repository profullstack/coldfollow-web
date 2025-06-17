import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryAdapter } from '../../src/adapters/memory.js';

describe('MemoryAdapter', () => {
  let adapter;
  
  beforeEach(() => {
    adapter = new MemoryAdapter();
  });
  
  describe('bucket operations', () => {
    it('should create a bucket', async () => {
      const result = await adapter.createBucket('test-bucket');
      
      expect(result).toHaveProperty('name', 'test-bucket');
      expect(result).toHaveProperty('createdAt');
    });
    
    it('should throw an error when creating a bucket that already exists', async () => {
      await adapter.createBucket('existing-bucket');
      
      await expect(adapter.createBucket('existing-bucket'))
        .rejects.toThrow('Bucket "existing-bucket" already exists');
    });
    
    it('should list buckets', async () => {
      await adapter.createBucket('bucket1');
      await adapter.createBucket('bucket2');
      
      const buckets = await adapter.listBuckets();
      
      expect(buckets).toHaveLength(2);
      expect(buckets[0].name).toBe('bucket1');
      expect(buckets[1].name).toBe('bucket2');
    });
    
    it('should delete a bucket', async () => {
      await adapter.createBucket('bucket-to-delete');
      
      const result = await adapter.deleteBucket('bucket-to-delete');
      
      expect(result).toBe(true);
      
      const buckets = await adapter.listBuckets();
      expect(buckets).toHaveLength(0);
    });
    
    it('should throw an error when deleting a non-existent bucket', async () => {
      await expect(adapter.deleteBucket('non-existent-bucket'))
        .rejects.toThrow('Bucket "non-existent-bucket" does not exist');
    });
    
    it('should throw an error when deleting a non-empty bucket without force option', async () => {
      await adapter.createBucket('non-empty-bucket');
      
      await adapter.uploadFile({
        bucketName: 'non-empty-bucket',
        path: 'test-file.txt',
        data: 'test content',
        contentType: 'text/plain'
      });
      
      await expect(adapter.deleteBucket('non-empty-bucket'))
        .rejects.toThrow('Bucket "non-empty-bucket" is not empty');
      
      // Should succeed with force option
      const result = await adapter.deleteBucket('non-empty-bucket', { force: true });
      expect(result).toBe(true);
    });
  });
  
  describe('file operations', () => {
    beforeEach(async () => {
      await adapter.createBucket('test-bucket');
    });
    
    it('should upload a file', async () => {
      const result = await adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'test-file.txt',
        data: 'test content',
        contentType: 'text/plain',
        metadata: { test: true }
      });
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'test-file.txt');
      expect(result).toHaveProperty('path', 'test-file.txt');
      expect(result).toHaveProperty('size', 12); // 'test content' length
      expect(result).toHaveProperty('contentType', 'text/plain');
      expect(result).toHaveProperty('metadata.test', true);
    });
    
    it('should throw an error when uploading to a non-existent bucket', async () => {
      await expect(adapter.uploadFile({
        bucketName: 'non-existent-bucket',
        path: 'test-file.txt',
        data: 'test content'
      })).rejects.toThrow('Bucket "non-existent-bucket" does not exist');
    });
    
    it('should throw an error when uploading a file that already exists without upsert', async () => {
      await adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'existing-file.txt',
        data: 'original content'
      });
      
      await expect(adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'existing-file.txt',
        data: 'new content'
      })).rejects.toThrow('File "existing-file.txt" already exists in bucket "test-bucket"');
      
      // Should succeed with upsert option
      const result = await adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'existing-file.txt',
        data: 'new content',
        upsert: true
      });
      
      expect(result).toHaveProperty('path', 'existing-file.txt');
    });
    
    it('should download a file', async () => {
      // Upload a file first
      await adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'download-test.txt',
        data: 'content to download',
        contentType: 'text/plain',
        metadata: { testKey: 'testValue' }
      });
      
      // Download as text
      const textResult = await adapter.downloadFile({
        bucketName: 'test-bucket',
        path: 'download-test.txt',
        responseType: 'text'
      });
      
      expect(textResult).toHaveProperty('data', 'content to download');
      expect(textResult).toHaveProperty('contentType', 'text/plain');
      expect(textResult).toHaveProperty('metadata.testKey', 'testValue');
      
      // Download as arraybuffer
      const bufferResult = await adapter.downloadFile({
        bucketName: 'test-bucket',
        path: 'download-test.txt',
        responseType: 'arraybuffer'
      });
      
      expect(bufferResult.data).toBeInstanceOf(ArrayBuffer);
      expect(new TextDecoder().decode(new Uint8Array(bufferResult.data))).toBe('content to download');
    });
    
    it('should throw an error when downloading from a non-existent bucket', async () => {
      await expect(adapter.downloadFile({
        bucketName: 'non-existent-bucket',
        path: 'test-file.txt'
      })).rejects.toThrow('Bucket "non-existent-bucket" does not exist');
    });
    
    it('should throw an error when downloading a non-existent file', async () => {
      await expect(adapter.downloadFile({
        bucketName: 'test-bucket',
        path: 'non-existent-file.txt'
      })).rejects.toThrow('File "non-existent-file.txt" does not exist in bucket "test-bucket"');
    });
    
    it('should get file info', async () => {
      // Upload a file first
      await adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'info-test.txt',
        data: 'test content',
        contentType: 'text/plain',
        metadata: { testKey: 'testValue' }
      });
      
      // Get file info
      const fileInfo = await adapter.getFileInfo({
        bucketName: 'test-bucket',
        path: 'info-test.txt'
      });
      
      expect(fileInfo).toHaveProperty('name', 'info-test.txt');
      expect(fileInfo).toHaveProperty('path', 'info-test.txt');
      expect(fileInfo).toHaveProperty('size', 12); // 'test content' length
      expect(fileInfo).toHaveProperty('contentType', 'text/plain');
      expect(fileInfo).toHaveProperty('metadata.testKey', 'testValue');
      expect(fileInfo).not.toHaveProperty('data'); // Should not include file data
    });
    
    it('should list files', async () => {
      // Upload some files
      await adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'file1.txt',
        data: 'content 1'
      });
      
      await adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'file2.txt',
        data: 'content 2'
      });
      
      await adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'subdir/file3.txt',
        data: 'content 3'
      });
      
      // List all files
      const allFiles = await adapter.listFiles({
        bucketName: 'test-bucket'
      });
      
      expect(allFiles.files).toHaveLength(3);
      
      // List files with prefix
      const subdirFiles = await adapter.listFiles({
        bucketName: 'test-bucket',
        prefix: 'subdir/'
      });
      
      expect(subdirFiles.files).toHaveLength(1);
      expect(subdirFiles.files[0].path).toBe('subdir/file3.txt');
      
      // Test pagination
      const paginatedFiles = await adapter.listFiles({
        bucketName: 'test-bucket',
        limit: 2
      });
      
      expect(paginatedFiles.files).toHaveLength(2);
      expect(paginatedFiles.hasMore).toBe(true);
      expect(paginatedFiles.cursor).toBeDefined();
      
      // Get next page
      const nextPage = await adapter.listFiles({
        bucketName: 'test-bucket',
        limit: 2,
        cursor: paginatedFiles.cursor
      });
      
      expect(nextPage.files).toHaveLength(1);
      expect(nextPage.hasMore).toBe(false);
    });
    
    it('should delete a file', async () => {
      // Upload a file first
      await adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'delete-test.txt',
        data: 'content to delete'
      });
      
      // Delete the file
      const deleteResult = await adapter.deleteFile({
        bucketName: 'test-bucket',
        path: 'delete-test.txt'
      });
      
      expect(deleteResult).toBe(true);
      
      // Verify file is deleted
      await expect(adapter.getFileInfo({
        bucketName: 'test-bucket',
        path: 'delete-test.txt'
      })).rejects.toThrow('File "delete-test.txt" does not exist in bucket "test-bucket"');
    });
    
    it('should copy a file', async () => {
      // Upload a file first
      await adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'source-file.txt',
        data: 'content to copy',
        metadata: { source: true }
      });
      
      // Create another bucket
      await adapter.createBucket('destination-bucket');
      
      // Copy the file to another bucket
      const copyResult = await adapter.copyFile({
        sourceBucket: 'test-bucket',
        sourcePath: 'source-file.txt',
        destinationBucket: 'destination-bucket',
        destinationPath: 'destination-file.txt'
      });
      
      expect(copyResult).toHaveProperty('path', 'destination-file.txt');
      
      // Verify both files exist
      const sourceInfo = await adapter.getFileInfo({
        bucketName: 'test-bucket',
        path: 'source-file.txt'
      });
      
      const destInfo = await adapter.getFileInfo({
        bucketName: 'destination-bucket',
        path: 'destination-file.txt'
      });
      
      expect(sourceInfo).toHaveProperty('metadata.source', true);
      expect(destInfo).toHaveProperty('metadata.source', true);
    });
    
    it('should move a file', async () => {
      // Upload a file first
      await adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'move-source.txt',
        data: 'content to move'
      });
      
      // Create another bucket
      await adapter.createBucket('move-destination-bucket');
      
      // Move the file
      const moveResult = await adapter.moveFile({
        sourceBucket: 'test-bucket',
        sourcePath: 'move-source.txt',
        destinationBucket: 'move-destination-bucket',
        destinationPath: 'move-destination.txt'
      });
      
      expect(moveResult).toHaveProperty('path', 'move-destination.txt');
      
      // Verify source is gone and destination exists
      await expect(adapter.getFileInfo({
        bucketName: 'test-bucket',
        path: 'move-source.txt'
      })).rejects.toThrow();
      
      const destInfo = await adapter.getFileInfo({
        bucketName: 'move-destination-bucket',
        path: 'move-destination.txt'
      });
      
      expect(destInfo).toHaveProperty('path', 'move-destination.txt');
    });
    
    it('should update metadata', async () => {
      // Upload a file first
      await adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'metadata-test.txt',
        data: 'test content',
        metadata: { initial: 'value' }
      });
      
      // Update metadata
      const updateResult = await adapter.updateMetadata({
        bucketName: 'test-bucket',
        path: 'metadata-test.txt',
        metadata: { 
          updated: true,
          initial: 'new-value'
        }
      });
      
      expect(updateResult).toHaveProperty('updated', true);
      expect(updateResult).toHaveProperty('initial', 'new-value');
      
      // Verify metadata was updated
      const fileInfo = await adapter.getFileInfo({
        bucketName: 'test-bucket',
        path: 'metadata-test.txt'
      });
      
      expect(fileInfo.metadata).toHaveProperty('updated', true);
      expect(fileInfo.metadata).toHaveProperty('initial', 'new-value');
    });
    
    it('should search files by metadata', async () => {
      // Upload files with different metadata
      await adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'search1.txt',
        data: 'content 1',
        metadata: { category: 'A', tag: 'test' }
      });
      
      await adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'search2.txt',
        data: 'content 2',
        metadata: { category: 'B', tag: 'test' }
      });
      
      await adapter.uploadFile({
        bucketName: 'test-bucket',
        path: 'search3.txt',
        data: 'content 3',
        metadata: { category: 'A', tag: 'production' }
      });
      
      // Search by category
      const categoryResults = await adapter.searchFiles({
        bucketName: 'test-bucket',
        metadata: { category: 'A' }
      });
      
      expect(categoryResults.files).toHaveLength(2);
      
      // Search by tag
      const tagResults = await adapter.searchFiles({
        bucketName: 'test-bucket',
        metadata: { tag: 'test' }
      });
      
      expect(tagResults.files).toHaveLength(2);
      
      // Search by multiple criteria
      const multiResults = await adapter.searchFiles({
        bucketName: 'test-bucket',
        metadata: { category: 'A', tag: 'test' }
      });
      
      expect(multiResults.files).toHaveLength(1);
    });
    
    it('should clear all data', () => {
      adapter.clear();
      
      expect(adapter.buckets.size).toBe(0);
      expect(adapter.files.size).toBe(0);
      expect(adapter.metadata.size).toBe(0);
    });
  });
});