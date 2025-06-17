/**
 * Tests for utility functions
 */

import { expect } from 'chai';
import sinon from 'sinon';
import {
  pathToRegex,
  extractParams,
  normalizePath,
  findAnchorInPath,
  shouldHandleLink
} from '../src/utils.js';

describe('Utility Functions', () => {
  describe('pathToRegex', () => {
    it('should convert a static path to regex', () => {
      const { regex, paramNames } = pathToRegex('/about');
      
      expect(regex).to.be.an.instanceOf(RegExp);
      expect(regex.toString()).to.equal('/^\\/about$/');
      expect(paramNames).to.be.an('array');
      expect(paramNames).to.be.empty;
    });

    it('should convert a dynamic path to regex and extract param names', () => {
      const { regex, paramNames } = pathToRegex('/users/:id');
      
      expect(regex).to.be.an.instanceOf(RegExp);
      // Use a more flexible test that works with different regex escaping styles
      expect(regex.test('/users/123')).to.be.true;
      expect(regex.test('/users/abc')).to.be.true;
      expect(regex.test('/users/')).to.be.false;
      expect(regex.test('/users/123/posts')).to.be.false;
      expect(paramNames).to.be.an('array');
      expect(paramNames).to.deep.equal(['id']);
    });

    it('should handle multiple params in a path', () => {
      const { regex, paramNames } = pathToRegex('/users/:userId/posts/:postId');
      
      expect(regex).to.be.an.instanceOf(RegExp);
      // Use a more flexible test that works with different regex escaping styles
      expect(regex.test('/users/123/posts/456')).to.be.true;
      expect(regex.test('/users/abc/posts/def')).to.be.true;
      expect(regex.test('/users/123/posts/')).to.be.false;
      expect(regex.test('/users/123')).to.be.false;
      expect(paramNames).to.be.an('array');
      expect(paramNames).to.deep.equal(['userId', 'postId']);
    });
  });

  describe('extractParams', () => {
    it('should return null for non-matching paths', () => {
      const { regex, paramNames } = pathToRegex('/users/:id');
      const params = extractParams('/about', regex, paramNames);
      
      expect(params).to.be.null;
    });

    it('should extract params from a matching path', () => {
      const { regex, paramNames } = pathToRegex('/users/:id');
      const params = extractParams('/users/123', regex, paramNames);
      
      expect(params).to.be.an('object');
      expect(params).to.deep.equal({ id: '123' });
    });

    it('should extract multiple params from a matching path', () => {
      const { regex, paramNames } = pathToRegex('/users/:userId/posts/:postId');
      const params = extractParams('/users/123/posts/456', regex, paramNames);
      
      expect(params).to.be.an('object');
      expect(params).to.deep.equal({ userId: '123', postId: '456' });
    });
  });

  describe('normalizePath', () => {
    it('should return "/" for empty paths', () => {
      expect(normalizePath('')).to.equal('/');
      expect(normalizePath(null)).to.equal('/');
      expect(normalizePath(undefined)).to.equal('/');
    });

    it('should remove trailing slashes except for root path', () => {
      expect(normalizePath('/about/')).to.equal('/about');
      expect(normalizePath('/users/profile/')).to.equal('/users/profile');
      expect(normalizePath('/')).to.equal('/');
    });

    it('should handle paths without leading slashes', () => {
      expect(normalizePath('about')).to.equal('about');
    });
  });

  describe('findAnchorInPath', () => {
    it('should find an anchor element in the event path', () => {
      // Create an anchor element
      const anchor = document.createElement('a');
      anchor.href = '/test';
      document.body.appendChild(anchor);
      
      // Create a mock event with a composedPath that includes the anchor
      const event = {
        composedPath: () => [anchor, document.body, document]
      };
      
      const result = findAnchorInPath(event);
      
      expect(result).to.equal(anchor);
      
      // Clean up
      document.body.removeChild(anchor);
    });

    it('should return null if no anchor is found', () => {
      // Create a mock event with a composedPath that doesn't include an anchor
      const event = {
        composedPath: () => [document.body, document]
      };
      
      const result = findAnchorInPath(event);
      
      expect(result).to.be.null;
    });
  });

  describe('shouldHandleLink', () => {
    it('should return false for links without href', () => {
      const anchor = document.createElement('a');
      expect(shouldHandleLink(anchor)).to.be.false;
    });

    it('should return false for external links', () => {
      const anchor = document.createElement('a');
      anchor.href = 'https://example.com';
      expect(shouldHandleLink(anchor)).to.be.false;
      
      anchor.href = '//example.com';
      expect(shouldHandleLink(anchor)).to.be.false;
    });

    it('should return false for links with target attribute', () => {
      const anchor = document.createElement('a');
      anchor.href = '/test';
      anchor.target = '_blank';
      expect(shouldHandleLink(anchor)).to.be.false;
    });

    it('should return false for download links', () => {
      const anchor = document.createElement('a');
      anchor.href = '/test';
      anchor.download = '';
      expect(shouldHandleLink(anchor)).to.be.false;
    });

    it('should return false for anchor links', () => {
      const anchor = document.createElement('a');
      anchor.href = '#section';
      expect(shouldHandleLink(anchor)).to.be.false;
    });

    it('should return false for file links', () => {
      const anchor = document.createElement('a');
      anchor.href = '/document.pdf';
      expect(shouldHandleLink(anchor)).to.be.false;
      
      anchor.href = '/image.jpg';
      expect(shouldHandleLink(anchor)).to.be.false;
    });

    it('should return true for internal navigation links', () => {
      const anchor = document.createElement('a');
      anchor.href = '/about';
      expect(shouldHandleLink(anchor)).to.be.true;
      
      anchor.href = '/users/profile';
      expect(shouldHandleLink(anchor)).to.be.true;
    });
  });
});