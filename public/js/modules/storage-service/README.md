# @profullstack/storage-service

A flexible storage service abstraction for file storage, retrieval, and metadata management.

## Features

- **Multiple Adapters**: Support for memory, filesystem, S3, and Supabase storage
- **Bucket Management**: Create, list, and delete storage buckets
- **File Operations**: Upload, download, copy, move, and delete files
- **Metadata Management**: Store and retrieve custom metadata with files
- **Content Type Detection**: Automatic content type detection from file data
- **URL Generation**: Generate public and signed URLs for file access
- **Search Capabilities**: Search files by path prefix and metadata
- **Customizable**: Configurable filename generation, content types, and more

## Installation

```bash
npm install @profullstack/storage-service
```

## Basic Usage

```javascript
import { createStorageService, MemoryAdapter } from '@profullstack/storage-service';

// Create a storage service with in-memory adapter
const storage = createStorageService({
  adapter: new MemoryAdapter(),
  defaultBucket: 'documents'
});

// Create a bucket
await storage.createBucket('documents', {
  public: false,
  fileSizeLimit: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['application/pdf', 'text/plain']
});

// Upload a file
const uploadResult = await storage.uploadFile({
  bucketName: 'documents',
  path: 'hello.txt',
  data: Buffer.from('Hello, world!'),
  contentType: 'text/plain',
  metadata: {
    description: 'A simple text file',
    author: 'ProFullStack'
  }
});

console.log(`File uploaded: ${uploadResult.path}`);

// Download a file
const downloadResult = await storage.downloadFile({
  bucketName: 'documents',
  path: 'hello.txt',
  responseType: 'text'
});

console.log(`File content: ${downloadResult.data}`);
```

## API Reference

### Creating a Storage Service

```javascript
import { createStorageService, MemoryAdapter } from '@profullstack/storage-service';

const storage = createStorageService({
  // Storage adapter (required)
  adapter: new MemoryAdapter(),
  
  // Default bucket name (default: 'default')
  defaultBucket: 'documents',
  
  // Bucket configuration (optional)
  bucketConfig: {
    documents: {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['application/pdf', 'text/plain']
    }
  },
  
  // Metadata options (optional)
  metadataOptions: {
    reservedKeys: ['contentType', 'size', 'createdAt', 'updatedAt'],
    defaultMetadata: {
      application: 'my-app'
    }
  },
  
  // Whether to generate unique filenames (default: true)
  generateUniqueFilenames: true,
  
  // Custom filename generator (optional)
  filenameGenerator: (originalPath) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${originalPath}_${timestamp}`;
  }
});
```

### Bucket Management

#### Creating a Bucket

```javascript
await storage.createBucket('images', {
  public: true,
  fileSizeLimit: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif']
});
```

#### Listing Buckets

```javascript
const buckets = await storage.listBuckets();
console.log('Buckets:', buckets.map(bucket => bucket.name));
```

#### Deleting a Bucket

```javascript
// Delete a bucket (must be empty)
await storage.deleteBucket('temp');

// Force delete a bucket (even if not empty)
await storage.deleteBucket('temp', { force: true });
```

### File Operations

#### Uploading a File

```javascript
// Upload a text file
const textUploadResult = await storage.uploadFile({
  bucketName: 'documents',
  path: 'notes/hello.txt',
  data: Buffer.from('Hello, world!'),
  contentType: 'text/plain',
  metadata: {
    description: 'A simple text file',
    author: 'ProFullStack',
    tags: ['example', 'text']
  },
  upsert: false, // Don't overwrite if exists (default)
  public: false // Not publicly accessible (default)
});

// Upload a JSON file
const jsonUploadResult = await storage.uploadFile({
  bucketName: 'documents',
  path: 'config.json',
  data: Buffer.from(JSON.stringify({ key: 'value' })),
  contentType: 'application/json'
});

// Upload an image file
const imageData = await fs.readFile('image.jpg');
const imageUploadResult = await storage.uploadFile({
  bucketName: 'images',
  path: 'profile.jpg',
  data: imageData,
  contentType: 'image/jpeg',
  metadata: {
    width: 800,
    height: 600
  },
  public: true // Make publicly accessible
});
```

#### Downloading a File

```javascript
// Download as buffer (default)
const bufferResult = await storage.downloadFile({
  bucketName: 'documents',
  path: 'hello.txt'
});

// Download as text
const textResult = await storage.downloadFile({
  bucketName: 'documents',
  path: 'hello.txt',
  responseType: 'text'
});

// Download as JSON
const jsonResult = await storage.downloadFile({
  bucketName: 'documents',
  path: 'config.json',
  responseType: 'json'
});

// Download as stream
const streamResult = await storage.downloadFile({
  bucketName: 'documents',
  path: 'large-file.pdf',
  responseType: 'stream'
});
```

#### Getting File Information

```javascript
const fileInfo = await storage.getFileInfo({
  bucketName: 'documents',
  path: 'hello.txt'
});

console.log(`File: ${fileInfo.path}`);
console.log(`Size: ${fileInfo.size} bytes`);
console.log(`Content Type: ${fileInfo.contentType}`);
console.log(`Created At: ${fileInfo.createdAt}`);
console.log(`Metadata: ${JSON.stringify(fileInfo.metadata)}`);
```

#### Listing Files

```javascript
// List all files in a bucket
const allFiles = await storage.listFiles({
  bucketName: 'documents',
  limit: 100
});

// List files with a prefix
const noteFiles = await storage.listFiles({
  bucketName: 'documents',
  prefix: 'notes/',
  limit: 100
});

// List files with pagination
const firstPage = await storage.listFiles({
  bucketName: 'documents',
  limit: 10
});

const secondPage = await storage.listFiles({
  bucketName: 'documents',
  limit: 10,
  cursor: firstPage.cursor
});
```

#### Copying Files

```javascript
const copyResult = await storage.copyFile({
  sourceBucket: 'documents',
  sourcePath: 'hello.txt',
  destinationBucket: 'backup',
  destinationPath: 'hello-backup.txt',
  overwrite: false // Don't overwrite if exists (default)
});
```

#### Moving Files

```javascript
const moveResult = await storage.moveFile({
  sourceBucket: 'documents',
  sourcePath: 'draft.txt',
  destinationBucket: 'documents',
  destinationPath: 'published/final.txt',
  overwrite: true // Overwrite if exists
});
```

#### Deleting Files

```javascript
const deleted = await storage.deleteFile({
  bucketName: 'documents',
  path: 'temp.txt'
});
```

### Metadata Management

#### Updating Metadata

```javascript
const updatedMetadata = await storage.updateMetadata({
  bucketName: 'documents',
  path: 'hello.txt',
  metadata: {
    description: 'Updated description',
    version: '1.1.0',
    tags: ['updated', 'example']
  },
  merge: true // Merge with existing metadata (default)
});
```

### URL Generation

#### Getting a Public URL

```javascript
// Only works for files in public buckets or with public=true
const publicUrl = await storage.getFileUrl({
  bucketName: 'images',
  path: 'profile.jpg'
});
```

#### Getting a Signed URL

```javascript
// Get a signed URL for reading a file
const readUrl = await storage.getSignedUrl({
  bucketName: 'documents',
  path: 'private.pdf',
  expiresIn: 3600, // 1 hour
  action: 'read'
});

// Get a signed URL for writing a file
const writeUrl = await storage.getSignedUrl({
  bucketName: 'documents',
  path: 'uploads/new-file.txt',
  expiresIn: 3600, // 1 hour
  action: 'write'
});
```

### Searching Files

```javascript
// Search by prefix
const prefixResults = await storage.searchFiles({
  bucketName: 'documents',
  prefix: 'notes/',
  limit: 100
});

// Search by metadata
const metadataResults = await storage.searchFiles({
  bucketName: 'documents',
  metadata: {
    author: 'ProFullStack',
    tags: ['example']
  },
  limit: 100
});

// Combined search
const combinedResults = await storage.searchFiles({
  bucketName: 'documents',
  prefix: 'notes/',
  metadata: {
    author: 'ProFullStack'
  },
  limit: 100
});
```

## Storage Adapters

### Memory Adapter

Stores files in memory. Suitable for development or testing.

```javascript
import { createStorageService, MemoryAdapter } from '@profullstack/storage-service';

const storage = createStorageService({
  adapter: new MemoryAdapter()
});
```

### Filesystem Adapter

Stores files on the local filesystem. Suitable for server-side applications.

```javascript
import { createStorageService, FilesystemAdapter } from '@profullstack/storage-service';

const storage = createStorageService({
  adapter: new FilesystemAdapter({
    rootDir: '/path/to/storage'
  })
});
```

### S3 Adapter

Stores files in Amazon S3 or compatible services. Suitable for production use.

```javascript
import { createStorageService, S3Adapter } from '@profullstack/storage-service';

const storage = createStorageService({
  adapter: new S3Adapter({
    region: 'us-west-2',
    credentials: {
      accessKeyId: 'YOUR_ACCESS_KEY',
      secretAccessKey: 'YOUR_SECRET_KEY'
    },
    endpoint: 'https://s3.amazonaws.com' // Optional for non-AWS S3-compatible services
  })
});
```

### Supabase Adapter

Stores files in Supabase Storage. Suitable for applications using Supabase.

```javascript
import { createStorageService, SupabaseAdapter } from '@profullstack/storage-service';
import { createClient } from '@supabase/supabase-js';

const supabaseClient = createClient(
  'https://your-project.supabase.co',
  'your-supabase-key'
);

const storage = createStorageService({
  adapter: new SupabaseAdapter({
    client: supabaseClient
  })
});
```

## Creating Custom Adapters

You can create custom adapters by implementing the adapter interface:

```javascript
class CustomAdapter {
  async createBucket(bucketName, options) { /* ... */ }
  async listBuckets() { /* ... */ }
  async deleteBucket(bucketName, options) { /* ... */ }
  async uploadFile(options) { /* ... */ }
  async downloadFile(options) { /* ... */ }
  async getFileInfo(options) { /* ... */ }
  async listFiles(options) { /* ... */ }
  async deleteFile(options) { /* ... */ }
  async copyFile(options) { /* ... */ }
  async moveFile(options) { /* ... */ }
  async getFileUrl(options) { /* ... */ }
  async getSignedUrl(options) { /* ... */ }
  async updateMetadata(options) { /* ... */ }
  async searchFiles(options) { /* ... */ }
}
```

## Examples

See the [examples](./examples) directory for complete usage examples.

## License

MIT