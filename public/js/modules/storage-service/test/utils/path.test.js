import { describe, it, expect, vi } from 'vitest';
import { createPathUtils } from '../../src/utils/path.js';

describe('Path Utils', () => {
  let pathUtils;
  
  beforeEach(() => {
    pathUtils = createPathUtils();
  });
  
  describe('parsePath', () => {
    it('should parse a simple filename', () => {
      const result = pathUtils.parsePath('file.txt');
      
      expect(result).toEqual({
        dir: '',
        base: 'file.txt',
        name: 'file',
        ext: '.txt'
      });
    });
    
    it('should parse a path with directory', () => {
      const result = pathUtils.parsePath('dir/subdir/file.txt');
      
      expect(result).toEqual({
        dir: 'dir/subdir',
        base: 'file.txt',
        name: 'file',
        ext: '.txt'
      });
    });
    
    it('should parse a path with no extension', () => {
      const result = pathUtils.parsePath('dir/file');
      
      expect(result).toEqual({
        dir: 'dir',
        base: 'file',
        name: 'file',
        ext: ''
      });
    });
    
    it('should handle empty path', () => {
      const result = pathUtils.parsePath('');
      
      expect(result).toEqual({
        dir: '',
        base: '',
        name: '',
        ext: ''
      });
    });
    
    it('should handle path with backslashes', () => {
      const result = pathUtils.parsePath('dir\\subdir\\file.txt');
      
      expect(result).toEqual({
        dir: 'dir/subdir',
        base: 'file.txt',
        name: 'file',
        ext: '.txt'
      });
    });
    
    it('should handle filename with multiple dots', () => {
      const result = pathUtils.parsePath('file.name.with.dots.txt');
      
      expect(result).toEqual({
        dir: '',
        base: 'file.name.with.dots.txt',
        name: 'file.name.with.dots',
        ext: '.txt'
      });
    });
    
    it('should handle path with trailing slash', () => {
      const result = pathUtils.parsePath('dir/subdir/');
      
      expect(result).toEqual({
        dir: 'dir/subdir',
        base: '',
        name: '',
        ext: ''
      });
    });
  });
  
  describe('joinPath', () => {
    it('should join directory and filename', () => {
      const result = pathUtils.joinPath('dir/subdir', 'file.txt');
      
      expect(result).toBe('dir/subdir/file.txt');
    });
    
    it('should handle empty directory', () => {
      const result = pathUtils.joinPath('', 'file.txt');
      
      expect(result).toBe('file.txt');
    });
    
    it('should handle empty filename', () => {
      const result = pathUtils.joinPath('dir/subdir', '');
      
      expect(result).toBe('dir/subdir');
    });
    
    it('should handle directory with trailing slash', () => {
      const result = pathUtils.joinPath('dir/subdir/', 'file.txt');
      
      expect(result).toBe('dir/subdir/file.txt');
    });
    
    it('should handle filename with leading slash', () => {
      const result = pathUtils.joinPath('dir/subdir', '/file.txt');
      
      expect(result).toBe('dir/subdir/file.txt');
    });
    
    it('should handle both trailing and leading slashes', () => {
      const result = pathUtils.joinPath('dir/subdir/', '/file.txt');
      
      expect(result).toBe('dir/subdir/file.txt');
    });
  });
  
  describe('normalizePath', () => {
    it('should normalize a path with backslashes', () => {
      const result = pathUtils.normalizePath('dir\\subdir\\file.txt');
      
      expect(result).toBe('dir/subdir/file.txt');
    });
    
    it('should normalize a path with duplicate slashes', () => {
      const result = pathUtils.normalizePath('dir//subdir///file.txt');
      
      expect(result).toBe('dir/subdir/file.txt');
    });
    
    it('should normalize a path with trailing slash', () => {
      const result = pathUtils.normalizePath('dir/subdir/');
      
      expect(result).toBe('dir/subdir');
    });
    
    it('should handle empty path', () => {
      const result = pathUtils.normalizePath('');
      
      expect(result).toBe('');
    });
    
    it('should handle path with mixed slashes', () => {
      const result = pathUtils.normalizePath('dir\\subdir/file.txt');
      
      expect(result).toBe('dir/subdir/file.txt');
    });
  });
  
  describe('getParentDir', () => {
    it('should get parent directory of a file', () => {
      const result = pathUtils.getParentDir('dir/subdir/file.txt');
      
      expect(result).toBe('dir/subdir');
    });
    
    it('should get parent directory of a directory', () => {
      const result = pathUtils.getParentDir('dir/subdir/');
      
      expect(result).toBe('dir/subdir');
    });
    
    it('should handle top-level file', () => {
      const result = pathUtils.getParentDir('file.txt');
      
      expect(result).toBe('');
    });
    
    it('should handle empty path', () => {
      const result = pathUtils.getParentDir('');
      
      expect(result).toBe('');
    });
  });
  
  describe('getRelativePath', () => {
    it('should get relative path between directories', () => {
      const result = pathUtils.getRelativePath('dir1/subdir1', 'dir2/subdir2');
      
      expect(result).toBe('../../dir2/subdir2');
    });
    
    it('should get relative path to parent directory', () => {
      const result = pathUtils.getRelativePath('dir/subdir', 'dir');
      
      expect(result).toBe('..');
    });
    
    it('should get relative path to child directory', () => {
      const result = pathUtils.getRelativePath('dir', 'dir/subdir');
      
      expect(result).toBe('subdir');
    });
    
    it('should handle identical paths', () => {
      const result = pathUtils.getRelativePath('dir/subdir', 'dir/subdir');
      
      expect(result).toBe('.');
    });
    
    it('should handle paths with no common prefix', () => {
      const result = pathUtils.getRelativePath('dir1/subdir1', 'dir2/subdir2/subdir3');
      
      expect(result).toBe('../../dir2/subdir2/subdir3');
    });
    
    it('should normalize paths before comparison', () => {
      const result = pathUtils.getRelativePath('dir1//subdir1/', 'dir1/subdir1/file.txt');
      
      expect(result).toBe('file.txt');
    });
  });
  
  describe('isSubPath', () => {
    it('should identify direct child path', () => {
      const result = pathUtils.isSubPath('dir', 'dir/subdir');
      
      expect(result).toBe(true);
    });
    
    it('should identify nested child path', () => {
      const result = pathUtils.isSubPath('dir', 'dir/subdir/file.txt');
      
      expect(result).toBe(true);
    });
    
    it('should reject non-child path', () => {
      const result = pathUtils.isSubPath('dir1', 'dir2/subdir');
      
      expect(result).toBe(false);
    });
    
    it('should reject identical paths', () => {
      const result = pathUtils.isSubPath('dir/subdir', 'dir/subdir');
      
      expect(result).toBe(false);
    });
    
    it('should reject parent path', () => {
      const result = pathUtils.isSubPath('dir/subdir', 'dir');
      
      expect(result).toBe(false);
    });
    
    it('should handle empty parent path', () => {
      const result = pathUtils.isSubPath('', 'dir/subdir');
      
      expect(result).toBe(false);
    });
    
    it('should normalize paths before comparison', () => {
      const result = pathUtils.isSubPath('dir///', 'dir/subdir');
      
      expect(result).toBe(true);
    });
    
    it('should reject partial path matches', () => {
      const result = pathUtils.isSubPath('dir', 'directory/subdir');
      
      expect(result).toBe(false);
    });
  });
  
  describe('generateUniqueFilename', () => {
    it('should return original path if file does not exist', async () => {
      const existsCheck = vi.fn().mockResolvedValue(false);
      
      const result = await pathUtils.generateUniqueFilename('dir/file.txt', existsCheck);
      
      expect(result).toBe('dir/file.txt');
      expect(existsCheck).toHaveBeenCalledWith('dir/file.txt');
    });
    
    it('should generate unique filename if file exists', async () => {
      const existsCheck = vi.fn()
        .mockResolvedValueOnce(true)  // Original file exists
        .mockResolvedValueOnce(true)  // file_1.txt exists
        .mockResolvedValueOnce(false); // file_2.txt does not exist
      
      const result = await pathUtils.generateUniqueFilename('dir/file.txt', existsCheck);
      
      expect(result).toBe('dir/file_2.txt');
      expect(existsCheck).toHaveBeenCalledTimes(3);
    });
    
    it('should handle missing existsCheck function', async () => {
      const result = await pathUtils.generateUniqueFilename('dir/file.txt');
      
      expect(result).toBe('dir/file.txt');
    });
  });
  
  describe('getPathDepth', () => {
    it('should get depth of a simple path', () => {
      const result = pathUtils.getPathDepth('dir/subdir/file.txt');
      
      expect(result).toBe(3);
    });
    
    it('should get depth of a root path', () => {
      const result = pathUtils.getPathDepth('file.txt');
      
      expect(result).toBe(1);
    });
    
    it('should handle empty path', () => {
      const result = pathUtils.getPathDepth('');
      
      expect(result).toBe(0);
    });
    
    it('should normalize path before counting', () => {
      const result = pathUtils.getPathDepth('dir//subdir///file.txt');
      
      expect(result).toBe(3);
    });
  });
  
  describe('getPathSegment', () => {
    it('should get segment at specific depth', () => {
      const result = pathUtils.getPathSegment('dir/subdir/file.txt', 1);
      
      expect(result).toBe('subdir');
    });
    
    it('should get first segment', () => {
      const result = pathUtils.getPathSegment('dir/subdir/file.txt', 0);
      
      expect(result).toBe('dir');
    });
    
    it('should get last segment', () => {
      const result = pathUtils.getPathSegment('dir/subdir/file.txt', 2);
      
      expect(result).toBe('file.txt');
    });
    
    it('should return empty string for out of bounds depth', () => {
      const result = pathUtils.getPathSegment('dir/subdir', 5);
      
      expect(result).toBe('');
    });
    
    it('should normalize path before getting segment', () => {
      const result = pathUtils.getPathSegment('dir//subdir///file.txt', 1);
      
      expect(result).toBe('subdir');
    });
  });
});