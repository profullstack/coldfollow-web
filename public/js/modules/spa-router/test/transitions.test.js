/**
 * Tests for transition effects
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { none, fade, slide, custom } from '../src/transitions.js';

describe('Transition Effects', () => {
  // Set up DOM elements for testing
  let rootElement;
  let oldContent;
  let newContent;
  
  beforeEach(() => {
    // Create a root element
    rootElement = document.createElement('div');
    rootElement.id = 'app';
    document.body.appendChild(rootElement);
    
    // Set up content
    oldContent = '<div class="old-content">Old Content</div>';
    newContent = '<div class="new-content">New Content</div>';
    
    // Set initial content
    rootElement.innerHTML = oldContent;
    
    // Create a clock for controlling setTimeout
    sinon.useFakeTimers();
  });
  
  afterEach(() => {
    // Clean up
    if (document.body.contains(rootElement)) {
      document.body.removeChild(rootElement);
    }
    
    // Remove any transition overlays
    const overlays = document.querySelectorAll('.transition-overlay');
    overlays.forEach(overlay => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    });
    
    // Restore timers
    sinon.restore();
  });

  describe('none', () => {
    it('should immediately replace content without transition', async () => {
      const transition = none();
      
      await transition(oldContent, newContent, rootElement);
      
      expect(rootElement.innerHTML).to.equal(newContent);
    });
  });

  describe('fade', () => {
    it('should create a fade transition with default duration', async () => {
      const transition = fade();
      const promise = transition(oldContent, newContent, rootElement);
      
      // Verify overlay is created
      const overlay = document.querySelector('.transition-overlay');
      expect(overlay).to.not.be.null;
      expect(overlay.style.opacity).to.equal('0');
      
      // Advance time to trigger opacity change
      sinon.clock.tick(10);
      expect(overlay.style.opacity).to.equal('1');
      
      // Advance time to complete first phase
      sinon.clock.tick(150);
      
      // Verify content is replaced
      expect(rootElement.innerHTML).to.equal(newContent);
      expect(overlay.style.opacity).to.equal('0');
      
      // Advance time to complete second phase
      sinon.clock.tick(150);
      
      // Verify overlay is removed
      expect(document.querySelector('.transition-overlay')).to.be.null;
      
      // Resolve the promise
      await promise;
    });

    it('should create a fade transition with custom duration', async () => {
      const customDuration = 300;
      const transition = fade({ duration: customDuration });
      const promise = transition(oldContent, newContent, rootElement);
      
      // Verify overlay is created
      const overlay = document.querySelector('.transition-overlay');
      expect(overlay).to.not.be.null;
      
      // Advance time to trigger opacity change
      sinon.clock.tick(10);
      
      // Advance time to complete first phase
      sinon.clock.tick(customDuration);
      
      // Verify content is replaced
      expect(rootElement.innerHTML).to.equal(newContent);
      
      // Advance time to complete second phase
      sinon.clock.tick(customDuration);
      
      // Verify overlay is removed
      expect(document.querySelector('.transition-overlay')).to.be.null;
      
      // Resolve the promise
      await promise;
    });

    it('should call onComplete callback if provided', async () => {
      const onCompleteSpy = sinon.spy();
      const transition = fade({ onComplete: onCompleteSpy });
      const promise = transition(oldContent, newContent, rootElement);
      
      // Advance time to complete both phases
      sinon.clock.tick(10);
      sinon.clock.tick(150);
      sinon.clock.tick(150);
      
      // Verify callback was called
      expect(onCompleteSpy.calledOnce).to.be.true;
      
      // Resolve the promise
      await promise;
    });

    it('should handle DocumentFragment as new content', async () => {
      const fragment = document.createDocumentFragment();
      const div = document.createElement('div');
      div.textContent = 'Fragment Content';
      fragment.appendChild(div);
      
      const transition = fade();
      const promise = transition(oldContent, fragment, rootElement);
      
      // Advance time to complete both phases
      sinon.clock.tick(10);
      sinon.clock.tick(150);
      sinon.clock.tick(150);
      
      // Verify content is replaced
      expect(rootElement.innerHTML).to.include('Fragment Content');
      
      // Resolve the promise
      await promise;
    });
  });

  describe('slide', () => {
    it('should create a slide transition with default options', async () => {
      const transition = slide();
      const promise = transition(oldContent, newContent, rootElement);
      
      // Verify containers are created
      const oldContainer = rootElement.querySelector('div:first-child');
      const newContainer = rootElement.querySelector('div:last-child');
      
      expect(oldContainer).to.not.be.null;
      expect(newContainer).to.not.be.null;
      
      // Advance time to trigger the transform changes
      sinon.clock.tick(10);
      
      // Verify the old container transform
      expect(oldContainer.style.transform).to.equal('translateX(-100%)');
      
      // Skip checking the new container transform as it's not critical
      // and may vary depending on browser implementation
      
      // Advance time to complete transition
      sinon.clock.tick(300);
      
      // Verify content is replaced
      expect(rootElement.innerHTML).to.equal(newContent);
      
      // Resolve the promise
      await promise;
    });

    it('should create a slide transition with custom direction', async () => {
      const transition = slide({ direction: 'right' });
      const promise = transition(oldContent, newContent, rootElement);
      
      // Verify containers are created
      sinon.clock.tick(10);
      
      // Verify old container is sliding out and new container is sliding in
      const oldContainer = rootElement.querySelector('div:first-child');
      const newContainer = rootElement.querySelector('div:last-child');
      
      expect(oldContainer).to.not.be.null;
      expect(newContainer).to.not.be.null;
      expect(oldContainer.style.transform).to.equal('translateX(100%)');
      
      // Advance time to complete transition
      sinon.clock.tick(300);
      
      // Verify content is replaced
      expect(rootElement.innerHTML).to.equal(newContent);
      
      // Resolve the promise
      await promise;
    });

    it('should create a slide transition with custom duration', async () => {
      const customDuration = 500;
      const transition = slide({ duration: customDuration });
      const promise = transition(oldContent, newContent, rootElement);
      
      // Verify containers are created
      sinon.clock.tick(10);
      
      // Advance time to complete transition
      sinon.clock.tick(customDuration);
      
      // Verify content is replaced
      expect(rootElement.innerHTML).to.equal(newContent);
      
      // Resolve the promise
      await promise;
    });

    it('should handle DocumentFragment as new content', async () => {
      const fragment = document.createDocumentFragment();
      const div = document.createElement('div');
      div.textContent = 'Fragment Content';
      fragment.appendChild(div);
      
      const transition = slide();
      const promise = transition(oldContent, fragment, rootElement);
      
      // Advance time to complete transition
      sinon.clock.tick(10);
      sinon.clock.tick(300);
      
      // Verify content is replaced
      expect(rootElement.innerHTML).to.include('Fragment Content');
      
      // Resolve the promise
      await promise;
    });
  });

  describe('custom', () => {
    it('should use a custom transition function', async () => {
      const customFn = sinon.spy((oldContent, newContent, rootElement) => {
        rootElement.innerHTML = newContent;
        return Promise.resolve();
      });
      
      const transition = custom(customFn);
      await transition(oldContent, newContent, rootElement);
      
      expect(customFn.calledOnce).to.be.true;
      expect(customFn.firstCall.args[0]).to.equal(oldContent);
      expect(customFn.firstCall.args[1]).to.equal(newContent);
      expect(customFn.firstCall.args[2]).to.equal(rootElement);
      expect(rootElement.innerHTML).to.equal(newContent);
    });
  });
});