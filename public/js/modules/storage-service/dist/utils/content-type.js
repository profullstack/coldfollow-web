/**
 * Content Type Utilities for Storage Service
 * 
 * Provides functions for working with content types (MIME types).
 */

import mime from 'mime-types';

/**
 * Create content type utilities
 * @param {Object} options - Configuration options
 * @param {Object} options.customTypes - Custom MIME type mappings
 * @returns {Object} - Content type utilities
 */
export function createContentTypeUtils(options = {}) {
  // Default options
  const config = {
    customTypes: {},
    ...options
  };
  
  // Register custom MIME types
  for (const [extension, type] of Object.entries(config.customTypes)) {
    mime.define({ [type]: [extension] }, { force: true });
  }
  
  /**
   * Detect content type from file path and/or data
   * @param {string} filePath - File path
   * @param {Buffer|Blob|string} data - File data (optional)
   * @returns {string} - Content type
   */
  function detectContentType(filePath, data) {
    // Try to detect from file extension
    if (filePath) {
      const contentType = mime.lookup(filePath);
      if (contentType) {
        return contentType;
      }
    }
    
    // Try to detect from data
    if (data) {
      // Check for common file signatures (magic numbers)
      if (data instanceof Buffer || (typeof Buffer !== 'undefined' && Buffer.isBuffer(data))) {
        return detectContentTypeFromBuffer(data);
      } else if (typeof Blob !== 'undefined' && data instanceof Blob) {
        // Use Blob's type if available
        if (data.type) {
          return data.type;
        }
      }
    }
    
    // Default to binary data
    return 'application/octet-stream';
  }
  
  /**
   * Detect content type from buffer
   * @private
   * @param {Buffer} buffer - File data buffer
   * @returns {string} - Content type
   */
  function detectContentTypeFromBuffer(buffer) {
    // Check for common file signatures (magic numbers)
    if (buffer.length >= 4) {
      // PDF: %PDF (25 50 44 46)
      if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
        return 'application/pdf';
      }
      
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'image/png';
      }
      
      // JPEG: FF D8 FF
      if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'image/jpeg';
      }
      
      // GIF: GIF87a or GIF89a
      if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && 
          (buffer[3] === 0x38 && (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61)) {
        return 'image/gif';
      }
      
      // WebP: RIFF....WEBP
      if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
          buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
        return 'image/webp';
      }
      
      // ZIP (could be DOCX, XLSX, PPTX, EPUB, etc.)
      if (buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
        // Try to determine specific Office format based on content
        // This is a simplified check and might not be 100% accurate
        if (buffer.length > 30) {
          const content = buffer.toString('utf8', 0, Math.min(buffer.length, 200));
          
          if (content.includes('word/')) {
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          } else if (content.includes('xl/')) {
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          } else if (content.includes('ppt/')) {
            return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          } else if (content.includes('META-INF/container.xml') || content.includes('mimetype') && content.includes('application/epub+zip')) {
            return 'application/epub+zip';
          }
        }
        
        return 'application/zip';
      }
      
      // MP4/M4V/M4A: ftyp
      if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
        return 'video/mp4';
      }
      
      // WebM: 1A 45 DF A3
      if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
        return 'video/webm';
      }
    }
    
    // Try to detect text files
    if (isTextBuffer(buffer)) {
      // Check for common text formats
      const content = buffer.toString('utf8', 0, Math.min(buffer.length, 100));
      
      // HTML
      if (content.match(/<(!DOCTYPE|html|head|body)/i)) {
        return 'text/html';
      }
      
      // XML
      if (content.match(/<\?xml/i)) {
        return 'application/xml';
      }
      
      // JSON
      if (content.match(/^\s*[{\[]/)) {
        return 'application/json';
      }
      
      // CSS
      if (content.match(/@import|@media|@font-face|body\s*{/i)) {
        return 'text/css';
      }
      
      // JavaScript
      if (content.match(/function\s+\w+\s*\(|var\s+\w+\s*=|const\s+\w+\s*=|let\s+\w+\s*=|import\s+/i)) {
        return 'application/javascript';
      }
      
      // Default to plain text
      return 'text/plain';
    }
    
    // Default to binary data
    return 'application/octet-stream';
  }
  
  /**
   * Check if a buffer contains text data
   * @private
   * @param {Buffer} buffer - File data buffer
   * @returns {boolean} - Whether the buffer contains text data
   */
  function isTextBuffer(buffer) {
    // Check for UTF-8 BOM
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      return true;
    }
    
    // Check for UTF-16 BOM
    if (buffer.length >= 2 && 
        ((buffer[0] === 0xFE && buffer[1] === 0xFF) || (buffer[0] === 0xFF && buffer[1] === 0xFE))) {
      return true;
    }
    
    // Check for UTF-32 BOM
    if (buffer.length >= 4 && 
        ((buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0xFE && buffer[3] === 0xFF) || 
         (buffer[0] === 0xFF && buffer[1] === 0xFE && buffer[2] === 0x00 && buffer[3] === 0x00))) {
      return true;
    }
    
    // Check for ASCII or UTF-8 text
    // This is a simple heuristic that checks if the buffer contains mostly printable ASCII characters
    let textCount = 0;
    let binaryCount = 0;
    
    // Check a sample of the buffer
    const sampleSize = Math.min(buffer.length, 1000);
    
    for (let i = 0; i < sampleSize; i++) {
      const byte = buffer[i];
      
      // Printable ASCII or common control characters
      if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
        textCount++;
      } else if (byte < 32 || byte === 127) {
        // Control characters (except tab, LF, CR) are likely binary
        binaryCount++;
      }
    }
    
    // If more than 90% of the sample is text, consider it text
    return textCount > 0 && (textCount / (textCount + binaryCount)) > 0.9;
  }
  
  /**
   * Get file extension from content type
   * @param {string} contentType - Content type
   * @returns {string} - File extension with dot
   */
  function getExtensionFromContentType(contentType) {
    const extension = mime.extension(contentType);
    return extension ? `.${extension}` : '';
  }
  
  /**
   * Check if a content type is of a specific category
   * @param {string} contentType - Content type to check
   * @param {string} category - Category to check ('image', 'text', 'audio', 'video', 'application')
   * @returns {boolean} - Whether the content type is of the specified category
   */
  function isContentTypeCategory(contentType, category) {
    return contentType.startsWith(`${category}/`);
  }
  
  /**
   * Check if a content type is an image
   * @param {string} contentType - Content type to check
   * @returns {boolean} - Whether the content type is an image
   */
  function isImage(contentType) {
    return isContentTypeCategory(contentType, 'image');
  }
  
  /**
   * Check if a content type is text
   * @param {string} contentType - Content type to check
   * @returns {boolean} - Whether the content type is text
   */
  function isText(contentType) {
    return isContentTypeCategory(contentType, 'text');
  }
  
  /**
   * Check if a content type is audio
   * @param {string} contentType - Content type to check
   * @returns {boolean} - Whether the content type is audio
   */
  function isAudio(contentType) {
    return isContentTypeCategory(contentType, 'audio');
  }
  
  /**
   * Check if a content type is video
   * @param {string} contentType - Content type to check
   * @returns {boolean} - Whether the content type is video
   */
  function isVideo(contentType) {
    return isContentTypeCategory(contentType, 'video');
  }
  
  /**
   * Check if a content type is a document
   * @param {string} contentType - Content type to check
   * @returns {boolean} - Whether the content type is a document
   */
  function isDocument(contentType) {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/epub+zip',
      'application/rtf'
    ];
    
    return documentTypes.includes(contentType);
  }
  
  // Return the content type utilities
  return {
    detectContentType,
    getExtensionFromContentType,
    isContentTypeCategory,
    isImage,
    isText,
    isAudio,
    isVideo,
    isDocument
  };
}

export default createContentTypeUtils;