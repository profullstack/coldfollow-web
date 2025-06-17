import { describe, it, expect } from 'vitest';
import { createMetadataManager } from '../../src/utils/metadata.js';

describe('Metadata Manager', () => {
  describe('prepareMetadata', () => {
    it('should prepare metadata with default options', () => {
      const metadataManager = createMetadataManager();
      const metadata = { key1: 'value1', key2: 'value2' };
      const systemMetadata = { contentType: 'text/plain', size: 100 };
      
      const result = metadataManager.prepareMetadata(metadata, systemMetadata);
      
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
        contentType: 'text/plain',
        size: 100
      });
    });
    
    it('should include default metadata', () => {
      const metadataManager = createMetadataManager({
        defaultMetadata: { defaultKey: 'defaultValue' }
      });
      
      const metadata = { key1: 'value1' };
      
      const result = metadataManager.prepareMetadata(metadata);
      
      expect(result).toEqual({
        defaultKey: 'defaultValue',
        key1: 'value1'
      });
    });
    
    it('should override default metadata with user metadata', () => {
      const metadataManager = createMetadataManager({
        defaultMetadata: { key1: 'defaultValue', defaultKey: 'defaultValue' }
      });
      
      const metadata = { key1: 'userValue' };
      
      const result = metadataManager.prepareMetadata(metadata);
      
      expect(result).toEqual({
        key1: 'userValue',
        defaultKey: 'defaultValue'
      });
    });
    
    it('should override user metadata with system metadata', () => {
      const metadataManager = createMetadataManager();
      
      const metadata = { contentType: 'user/type', key1: 'value1' };
      const systemMetadata = { contentType: 'system/type' };
      
      const result = metadataManager.prepareMetadata(metadata, systemMetadata);
      
      expect(result).toEqual({
        contentType: 'system/type',
        key1: 'value1'
      });
    });
  });
  
  describe('sanitizeMetadata', () => {
    it('should sanitize metadata with default options', () => {
      const metadataManager = createMetadataManager();
      
      const metadata = {
        key1: 'value1',
        contentType: 'text/plain', // Reserved key
        size: 100 // Reserved key
      };
      
      const result = metadataManager.sanitizeMetadata(metadata);
      
      expect(result).toEqual({
        key1: 'value1'
      });
      expect(result).not.toHaveProperty('contentType');
      expect(result).not.toHaveProperty('size');
    });
    
    it('should use custom sanitize functions', () => {
      const metadataManager = createMetadataManager({
        sanitizeKey: key => key.toUpperCase(),
        sanitizeValue: value => typeof value === 'string' ? value.toUpperCase() : value
      });
      
      const metadata = {
        key1: 'value1',
        key2: 123
      };
      
      const result = metadataManager.sanitizeMetadata(metadata);
      
      expect(result).toEqual({
        KEY1: 'VALUE1',
        KEY2: 123
      });
    });
    
    it('should handle custom reserved keys', () => {
      const metadataManager = createMetadataManager({
        reservedKeys: ['customReserved', 'anotherReserved']
      });
      
      const metadata = {
        key1: 'value1',
        customReserved: 'reserved value',
        anotherReserved: 'another reserved value',
        contentType: 'text/plain' // Not in reserved keys anymore
      };
      
      const result = metadataManager.sanitizeMetadata(metadata);
      
      expect(result).toEqual({
        key1: 'value1',
        contentType: 'text/plain'
      });
      expect(result).not.toHaveProperty('customReserved');
      expect(result).not.toHaveProperty('anotherReserved');
    });
  });
  
  describe('filterPublicMetadata', () => {
    it('should filter metadata for public access', () => {
      const metadataManager = createMetadataManager();
      
      const metadata = {
        public1: 'public value 1',
        public2: 'public value 2',
        private1: 'private value 1',
        private2: 'private value 2'
      };
      
      const publicKeys = ['public1', 'public2'];
      
      const result = metadataManager.filterPublicMetadata(metadata, publicKeys);
      
      expect(result).toEqual({
        public1: 'public value 1',
        public2: 'public value 2'
      });
      expect(result).not.toHaveProperty('private1');
      expect(result).not.toHaveProperty('private2');
    });
    
    it('should return empty object if no public keys specified', () => {
      const metadataManager = createMetadataManager();
      
      const metadata = {
        key1: 'value1',
        key2: 'value2'
      };
      
      const result = metadataManager.filterPublicMetadata(metadata, []);
      
      expect(result).toEqual({});
    });
    
    it('should handle missing keys', () => {
      const metadataManager = createMetadataManager();
      
      const metadata = {
        key1: 'value1',
        key2: 'value2'
      };
      
      const publicKeys = ['key1', 'missing'];
      
      const result = metadataManager.filterPublicMetadata(metadata, publicKeys);
      
      expect(result).toEqual({
        key1: 'value1'
      });
      expect(result).not.toHaveProperty('missing');
    });
  });
  
  describe('extractSystemMetadata', () => {
    it('should extract system metadata', () => {
      const metadataManager = createMetadataManager();
      
      const metadata = {
        key1: 'value1',
        contentType: 'text/plain',
        size: 100,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z'
      };
      
      const result = metadataManager.extractSystemMetadata(metadata);
      
      expect(result).toEqual({
        contentType: 'text/plain',
        size: 100,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z'
      });
      expect(result).not.toHaveProperty('key1');
    });
    
    it('should handle missing system metadata', () => {
      const metadataManager = createMetadataManager();
      
      const metadata = {
        key1: 'value1',
        contentType: 'text/plain'
        // Missing size, createdAt, updatedAt
      };
      
      const result = metadataManager.extractSystemMetadata(metadata);
      
      expect(result).toEqual({
        contentType: 'text/plain'
      });
      expect(result).not.toHaveProperty('size');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
    });
    
    it('should handle custom reserved keys', () => {
      const metadataManager = createMetadataManager({
        reservedKeys: ['customReserved', 'anotherReserved']
      });
      
      const metadata = {
        key1: 'value1',
        customReserved: 'reserved value',
        anotherReserved: 'another reserved value',
        contentType: 'text/plain' // Not in reserved keys anymore
      };
      
      const result = metadataManager.extractSystemMetadata(metadata);
      
      expect(result).toEqual({
        customReserved: 'reserved value',
        anotherReserved: 'another reserved value'
      });
      expect(result).not.toHaveProperty('contentType');
      expect(result).not.toHaveProperty('key1');
    });
  });
  
  describe('extractUserMetadata', () => {
    it('should extract user metadata', () => {
      const metadataManager = createMetadataManager();
      
      const metadata = {
        key1: 'value1',
        key2: 'value2',
        contentType: 'text/plain',
        size: 100,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z'
      };
      
      const result = metadataManager.extractUserMetadata(metadata);
      
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2'
      });
      expect(result).not.toHaveProperty('contentType');
      expect(result).not.toHaveProperty('size');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
    });
    
    it('should handle metadata with only system fields', () => {
      const metadataManager = createMetadataManager();
      
      const metadata = {
        contentType: 'text/plain',
        size: 100,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z'
      };
      
      const result = metadataManager.extractUserMetadata(metadata);
      
      expect(result).toEqual({});
    });
    
    it('should handle custom reserved keys', () => {
      const metadataManager = createMetadataManager({
        reservedKeys: ['customReserved', 'anotherReserved']
      });
      
      const metadata = {
        key1: 'value1',
        customReserved: 'reserved value',
        anotherReserved: 'another reserved value',
        contentType: 'text/plain' // Not in reserved keys anymore
      };
      
      const result = metadataManager.extractUserMetadata(metadata);
      
      expect(result).toEqual({
        key1: 'value1',
        contentType: 'text/plain'
      });
      expect(result).not.toHaveProperty('customReserved');
      expect(result).not.toHaveProperty('anotherReserved');
    });
  });
  
  describe('validateMetadata', () => {
    it('should validate required fields', () => {
      const metadataManager = createMetadataManager();
      
      const metadata = {
        key1: 'value1',
        key2: 'value2'
      };
      
      const schema = {
        required: ['key1', 'key2', 'key3']
      };
      
      const result = metadataManager.validateMetadata(metadata, schema);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing required metadata field: key3');
    });
    
    it('should validate field types', () => {
      const metadataManager = createMetadataManager();
      
      const metadata = {
        stringField: 'string value',
        numberField: 'not a number',
        booleanField: true,
        objectField: {},
        arrayField: []
      };
      
      const schema = {
        types: {
          stringField: 'string',
          numberField: 'number',
          booleanField: 'boolean',
          objectField: 'object',
          arrayField: 'array'
        }
      };
      
      const result = metadataManager.validateMetadata(metadata, schema);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Metadata field numberField must be a number');
    });
    
    it('should validate field patterns', () => {
      const metadataManager = createMetadataManager();
      
      const metadata = {
        email: 'not-an-email',
        zipCode: '12345'
      };
      
      const schema = {
        patterns: {
          email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          zipCode: /^\d{5}$/
        }
      };
      
      const result = metadataManager.validateMetadata(metadata, schema);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Metadata field email does not match required pattern');
    });
    
    it('should validate with custom validators', () => {
      const metadataManager = createMetadataManager();
      
      const metadata = {
        age: 15,
        score: 75
      };
      
      const schema = {
        validators: {
          age: value => value >= 18 || 'Age must be at least 18',
          score: value => value >= 0 && value <= 100
        }
      };
      
      const result = metadataManager.validateMetadata(metadata, schema);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Age must be at least 18');
    });
    
    it('should return valid result for valid metadata', () => {
      const metadataManager = createMetadataManager();
      
      const metadata = {
        required1: 'value1',
        required2: 'value2',
        stringField: 'string value',
        numberField: 123,
        email: 'test@example.com',
        age: 25
      };
      
      const schema = {
        required: ['required1', 'required2'],
        types: {
          stringField: 'string',
          numberField: 'number'
        },
        patterns: {
          email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        validators: {
          age: value => value >= 18
        }
      };
      
      const result = metadataManager.validateMetadata(metadata, schema);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });
  });
});