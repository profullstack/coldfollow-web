/**
 * Basic usage examples for @profullstack/storage-service
 */

import { createStorageService, MemoryAdapter } from '../src/index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Run the examples
 */
async function runExamples() {
  try {
    console.log('Running storage service examples...\n');
    
    // Create a storage service with in-memory adapter
    const storage = createStorageService({
      adapter: new MemoryAdapter(),
      defaultBucket: 'documents',
      generateUniqueFilenames: true
    });
    
    // Example 1: Create buckets
    console.log('Example 1: Creating buckets');
    
    await storage.createBucket('documents', {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    });
    
    await storage.createBucket('images', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ]
    });
    
    const buckets = await storage.listBuckets();
    console.log('Buckets:', buckets.map(bucket => bucket.name));
    console.log();
    
    // Example 2: Upload files
    console.log('Example 2: Uploading files');
    
    // Upload a text file
    const textContent = 'Hello, world! This is a test file.';
    const textUploadResult = await storage.uploadFile({
      bucketName: 'documents',
      path: 'test.txt',
      data: Buffer.from(textContent),
      contentType: 'text/plain',
      metadata: {
        description: 'A simple text file',
        author: 'ProFullStack',
        tags: ['test', 'example']
      }
    });
    
    console.log('Text file uploaded:', textUploadResult.path);
    
    // Upload a JSON file
    const jsonContent = JSON.stringify({
      name: 'Test Object',
      value: 42,
      nested: {
        property: 'value'
      }
    }, null, 2);
    
    const jsonUploadResult = await storage.uploadFile({
      bucketName: 'documents',
      path: 'data/config.json',
      data: Buffer.from(jsonContent),
      contentType: 'application/json',
      metadata: {
        description: 'Configuration file',
        version: '1.0.0'
      }
    });
    
    console.log('JSON file uploaded:', jsonUploadResult.path);
    
    // Upload an image file (read from disk)
    try {
      // Try to read a sample image file
      const imagePath = path.join(__dirname, 'sample-image.jpg');
      const imageData = await fs.readFile(imagePath);
      
      const imageUploadResult = await storage.uploadFile({
        bucketName: 'images',
        path: 'sample.jpg',
        data: imageData,
        contentType: 'image/jpeg',
        metadata: {
          description: 'Sample image',
          width: 800,
          height: 600
        }
      });
      
      console.log('Image file uploaded:', imageUploadResult.path);
    } catch (error) {
      // If the sample image doesn't exist, create a simple text file instead
      console.log('Sample image not found, creating a placeholder instead');
      
      const placeholderUploadResult = await storage.uploadFile({
        bucketName: 'images',
        path: 'placeholder.txt',
        data: Buffer.from('This is a placeholder for an image file'),
        contentType: 'text/plain',
        metadata: {
          description: 'Placeholder for sample image'
        }
      });
      
      console.log('Placeholder file uploaded:', placeholderUploadResult.path);
    }
    
    console.log();
    
    // Example 3: List files
    console.log('Example 3: Listing files');
    
    const documentsResult = await storage.listFiles({
      bucketName: 'documents',
      limit: 10
    });
    
    console.log('Documents:');
    documentsResult.files.forEach(file => {
      console.log(`- ${file.path} (${file.contentType}, ${file.size} bytes)`);
    });
    
    const imagesResult = await storage.listFiles({
      bucketName: 'images',
      limit: 10
    });
    
    console.log('\nImages:');
    imagesResult.files.forEach(file => {
      console.log(`- ${file.path} (${file.contentType}, ${file.size} bytes)`);
    });
    
    console.log();
    
    // Example 4: Get file info
    console.log('Example 4: Getting file info');
    
    const textFileInfo = await storage.getFileInfo({
      bucketName: 'documents',
      path: textUploadResult.path
    });
    
    console.log('Text file info:');
    console.log(`- Path: ${textFileInfo.path}`);
    console.log(`- Size: ${textFileInfo.size} bytes`);
    console.log(`- Content Type: ${textFileInfo.contentType}`);
    console.log(`- Created At: ${textFileInfo.createdAt}`);
    console.log(`- Metadata: ${JSON.stringify(textFileInfo.metadata)}`);
    
    console.log();
    
    // Example 5: Download files
    console.log('Example 5: Downloading files');
    
    const textDownloadResult = await storage.downloadFile({
      bucketName: 'documents',
      path: textUploadResult.path,
      responseType: 'text'
    });
    
    console.log('Downloaded text file content:');
    console.log(textDownloadResult.data);
    
    const jsonDownloadResult = await storage.downloadFile({
      bucketName: 'documents',
      path: jsonUploadResult.path,
      responseType: 'json'
    });
    
    console.log('\nDownloaded JSON file content:');
    console.log(JSON.stringify(jsonDownloadResult.data, null, 2));
    
    console.log();
    
    // Example 6: Update metadata
    console.log('Example 6: Updating metadata');
    
    const updatedMetadata = await storage.updateMetadata({
      bucketName: 'documents',
      path: textUploadResult.path,
      metadata: {
        description: 'Updated description',
        version: '1.1.0',
        tags: ['test', 'example', 'updated']
      }
    });
    
    console.log('Updated metadata:');
    console.log(JSON.stringify(updatedMetadata, null, 2));
    
    console.log();
    
    // Example 7: Copy and move files
    console.log('Example 7: Copying and moving files');
    
    // Copy a file
    const copyResult = await storage.copyFile({
      sourceBucket: 'documents',
      sourcePath: textUploadResult.path,
      destinationBucket: 'documents',
      destinationPath: 'backup/test-copy.txt'
    });
    
    console.log('File copied to:', copyResult.path);
    
    // Move a file
    const moveResult = await storage.moveFile({
      sourceBucket: 'documents',
      sourcePath: jsonUploadResult.path,
      destinationBucket: 'documents',
      destinationPath: 'backup/config-moved.json'
    });
    
    console.log('File moved to:', moveResult.path);
    
    console.log();
    
    // Example 8: Search files
    console.log('Example 8: Searching files');
    
    const searchResult = await storage.searchFiles({
      bucketName: 'documents',
      metadata: {
        version: '1.1.0'
      }
    });
    
    console.log('Search results:');
    searchResult.files.forEach(file => {
      console.log(`- ${file.path} (${file.contentType})`);
    });
    
    console.log();
    
    // Example 9: Delete files
    console.log('Example 9: Deleting files');
    
    // Delete the copied file
    const deleteResult = await storage.deleteFile({
      bucketName: 'documents',
      path: copyResult.path
    });
    
    console.log(`File deleted: ${deleteResult ? 'Yes' : 'No'}`);
    
    console.log();
    
    // Example 10: Get URLs
    console.log('Example 10: Getting URLs');
    
    try {
      // Try to get a public URL for an image
      const publicUrl = await storage.getFileUrl({
        bucketName: 'images',
        path: imagesResult.files[0].path
      });
      
      console.log('Public URL:', publicUrl);
    } catch (error) {
      console.log('Could not get public URL:', error.message);
    }
    
    // Get a signed URL
    const signedUrl = await storage.getSignedUrl({
      bucketName: 'documents',
      path: textUploadResult.path,
      expiresIn: 3600,
      action: 'read'
    });
    
    console.log('Signed URL:', signedUrl);
    
    console.log();
    
    console.log('All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples
runExamples();