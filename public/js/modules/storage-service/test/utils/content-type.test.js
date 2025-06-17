import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createContentTypeUtils } from '../../src/utils/content-type.js';

// Mock mime-types module
vi.mock('mime-types', () => ({
  default: {
    lookup: vi.fn(),
    extension: vi.fn(),
    define: vi.fn()
  }
}));

import mime from 'mime-types';

describe('Content Type Utils', () => {
  let contentTypeUtils;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create content type utils
    contentTypeUtils = createContentTypeUtils();
  });
  
  describe('detectContentType', () => {
    it('should detect content type from file extension', () => {
      mime.lookup.mockReturnValue('text/plain');
      
      const result = contentTypeUtils.detectContentType('file.txt');
      
      expect(result).toBe('text/plain');
      expect(mime.lookup).toHaveBeenCalledWith('file.txt');
    });
    
    it('should detect content type from buffer data when extension is unknown', () => {
      mime.lookup.mockReturnValue(false);
      
      // Create a buffer with PDF signature
      const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46]);
      
      const result = contentTypeUtils.detectContentType('file.unknown', buffer);
      
      expect(result).toBe('application/pdf');
    });
    
    it('should detect PNG image from buffer', () => {
      mime.lookup.mockReturnValue(false);
      
      // Create a buffer with PNG signature
      const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      
      const result = contentTypeUtils.detectContentType('file.unknown', buffer);
      
      expect(result).toBe('image/png');
    });
    
    it('should detect JPEG image from buffer', () => {
      mime.lookup.mockReturnValue(false);
      
      // Create a buffer with JPEG signature
      const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      
      const result = contentTypeUtils.detectContentType('file.unknown', buffer);
      
      expect(result).toBe('image/jpeg');
    });
    
    it('should detect GIF image from buffer', () => {
      mime.lookup.mockReturnValue(false);
      
      // Create a buffer with GIF signature
      const buffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      
      const result = contentTypeUtils.detectContentType('file.unknown', buffer);
      
      expect(result).toBe('image/gif');
    });
    
    it('should detect HTML text from buffer', () => {
      mime.lookup.mockReturnValue(false);
      
      // Create a buffer with HTML content
      const buffer = Buffer.from('<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>');
      
      const result = contentTypeUtils.detectContentType('file.unknown', buffer);
      
      expect(result).toBe('text/html');
    });
    
    it('should detect JSON text from buffer', () => {
      mime.lookup.mockReturnValue(false);
      
      // Create a buffer with JSON content
      const buffer = Buffer.from('{"key": "value"}');
      
      const result = contentTypeUtils.detectContentType('file.unknown', buffer);
      
      expect(result).toBe('application/json');
    });
    
    it('should detect JavaScript text from buffer', () => {
      mime.lookup.mockReturnValue(false);
      
      // Create a buffer with JavaScript content
      const buffer = Buffer.from('function test() { return true; }');
      
      const result = contentTypeUtils.detectContentType('file.unknown', buffer);
      
      expect(result).toBe('application/javascript');
    });
    
    it('should detect plain text from buffer', () => {
      mime.lookup.mockReturnValue(false);
      
      // Create a buffer with plain text content
      const buffer = Buffer.from('This is a plain text file with no special formatting.');
      
      const result = contentTypeUtils.detectContentType('file.unknown', buffer);
      
      expect(result).toBe('text/plain');
    });
    
    it('should return octet-stream for unknown content', () => {
      mime.lookup.mockReturnValue(false);
      
      // Create a buffer with binary content
      const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      
      const result = contentTypeUtils.detectContentType('file.unknown', buffer);
      
      expect(result).toBe('application/octet-stream');
    });
    
    it('should use Blob type if available', () => {
      mime.lookup.mockReturnValue(false);
      
      // Mock Blob
      global.Blob = class Blob {
        constructor() {
          this.type = 'image/png';
        }
      };
      
      const blob = new Blob();
      
      const result = contentTypeUtils.detectContentType('file.unknown', blob);
      
      expect(result).toBe('image/png');
      
      // Clean up
      delete global.Blob;
    });
    
    it('should default to octet-stream when no path or data is provided', () => {
      const result = contentTypeUtils.detectContentType();
      
      expect(result).toBe('application/octet-stream');
    });
  });
  
  describe('getExtensionFromContentType', () => {
    it('should get extension from content type', () => {
      mime.extension.mockReturnValue('txt');
      
      const result = contentTypeUtils.getExtensionFromContentType('text/plain');
      
      expect(result).toBe('.txt');
      expect(mime.extension).toHaveBeenCalledWith('text/plain');
    });
    
    it('should return empty string for unknown content type', () => {
      mime.extension.mockReturnValue(false);
      
      const result = contentTypeUtils.getExtensionFromContentType('application/unknown');
      
      expect(result).toBe('');
    });
  });
  
  describe('isContentTypeCategory', () => {
    it('should identify image content types', () => {
      const result = contentTypeUtils.isContentTypeCategory('image/png', 'image');
      
      expect(result).toBe(true);
    });
    
    it('should identify text content types', () => {
      const result = contentTypeUtils.isContentTypeCategory('text/plain', 'text');
      
      expect(result).toBe(true);
    });
    
    it('should reject non-matching content types', () => {
      const result = contentTypeUtils.isContentTypeCategory('image/png', 'text');
      
      expect(result).toBe(false);
    });
  });
  
  describe('category helper methods', () => {
    it('should identify images with isImage', () => {
      expect(contentTypeUtils.isImage('image/png')).toBe(true);
      expect(contentTypeUtils.isImage('image/jpeg')).toBe(true);
      expect(contentTypeUtils.isImage('text/plain')).toBe(false);
    });
    
    it('should identify text with isText', () => {
      expect(contentTypeUtils.isText('text/plain')).toBe(true);
      expect(contentTypeUtils.isText('text/html')).toBe(true);
      expect(contentTypeUtils.isText('image/png')).toBe(false);
    });
    
    it('should identify audio with isAudio', () => {
      expect(contentTypeUtils.isAudio('audio/mp3')).toBe(true);
      expect(contentTypeUtils.isAudio('audio/wav')).toBe(true);
      expect(contentTypeUtils.isAudio('image/png')).toBe(false);
    });
    
    it('should identify video with isVideo', () => {
      expect(contentTypeUtils.isVideo('video/mp4')).toBe(true);
      expect(contentTypeUtils.isVideo('video/webm')).toBe(true);
      expect(contentTypeUtils.isVideo('image/png')).toBe(false);
    });
  });
  
  describe('isDocument', () => {
    it('should identify document content types', () => {
      expect(contentTypeUtils.isDocument('application/pdf')).toBe(true);
      expect(contentTypeUtils.isDocument('application/msword')).toBe(true);
      expect(contentTypeUtils.isDocument('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
      expect(contentTypeUtils.isDocument('image/png')).toBe(false);
      expect(contentTypeUtils.isDocument('text/plain')).toBe(false);
    });
  });
  
  describe('custom types', () => {
    it('should register custom MIME types', () => {
      // Create content type utils with custom types
      createContentTypeUtils({
        customTypes: {
          'xyz': 'application/x-xyz'
        }
      });
      
      // Verify that mime.define was called with the custom type
      expect(mime.define).toHaveBeenCalledWith({ 'application/x-xyz': ['xyz'] }, { force: true });
    });
  });
});