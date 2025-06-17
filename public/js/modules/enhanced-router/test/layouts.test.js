/**
 * Tests for the layout management functionality
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createLayoutManager } from '../src/layouts.js';

describe('Layout Manager', () => {
  describe('createLayoutManager', () => {
    it('should create a layout manager with default options', () => {
      const layoutManager = createLayoutManager();
      
      expect(layoutManager).to.be.an('object');
      expect(layoutManager).to.have.property('wrapInLayout');
      expect(layoutManager).to.have.property('registerLayout');
      expect(layoutManager).to.have.property('getLayout');
      expect(layoutManager).to.have.property('getLayouts');
      expect(layoutManager).to.have.property('setDefaultLayout');
      expect(layoutManager).to.have.property('getDefaultLayout');
      expect(layoutManager).to.have.property('createLayoutFromTemplate');
    });

    it('should create a layout manager with custom options', () => {
      const customLayout = content => `<div class="custom-layout">${content}</div>`;
      const layoutManager = createLayoutManager({
        defaultLayout: 'custom',
        layouts: {
          custom: customLayout
        }
      });
      
      expect(layoutManager.getDefaultLayout()).to.equal('custom');
      expect(layoutManager.getLayout('custom')).to.equal(customLayout);
    });
  });

  describe('wrapInLayout', () => {
    it('should wrap content in the default layout', () => {
      const layoutManager = createLayoutManager();
      const content = '<h1>Test Content</h1>';
      
      const result = layoutManager.wrapInLayout(content);
      
      // Result should be a DocumentFragment
      expect(result).to.be.an.instanceOf(DocumentFragment);
      
      // Convert to HTML string for easier testing
      const div = document.createElement('div');
      div.appendChild(result.cloneNode(true));
      const html = div.innerHTML;
      
      // Verify structure
      expect(html).to.include('<header class="site-header"></header>');
      expect(html).to.include('<main class="content">');
      expect(html).to.include('<h1>Test Content</h1>');
      expect(html).to.include('<footer class="site-footer"></footer>');
    });

    it('should wrap content in a specified layout', () => {
      const layoutManager = createLayoutManager();
      const content = '<h1>Test Content</h1>';
      
      const result = layoutManager.wrapInLayout(content, 'minimal');
      
      // Convert to HTML string for easier testing
      const div = document.createElement('div');
      div.appendChild(result.cloneNode(true));
      const html = div.innerHTML;
      
      // Verify structure (minimal layout has no header/footer)
      expect(html).to.not.include('<header class="site-header"></header>');
      expect(html).to.include('<main class="content minimal-layout">');
      expect(html).to.include('<h1>Test Content</h1>');
      expect(html).to.not.include('<footer class="site-footer"></footer>');
    });

    it('should use default layout if specified layout does not exist', () => {
      const layoutManager = createLayoutManager();
      const content = '<h1>Test Content</h1>';
      
      const result = layoutManager.wrapInLayout(content, 'non-existent');
      
      // Convert to HTML string for easier testing
      const div = document.createElement('div');
      div.appendChild(result.cloneNode(true));
      const html = div.innerHTML;
      
      // Verify structure (should use default layout)
      expect(html).to.include('<header class="site-header"></header>');
      expect(html).to.include('<main class="content">');
      expect(html).to.include('<h1>Test Content</h1>');
      expect(html).to.include('<footer class="site-footer"></footer>');
    });

    it('should handle string content', () => {
      const layoutManager = createLayoutManager();
      const content = '<h1>String Content</h1>';
      
      const result = layoutManager.wrapInLayout(content);
      
      // Convert to HTML string for easier testing
      const div = document.createElement('div');
      div.appendChild(result.cloneNode(true));
      const html = div.innerHTML;
      
      expect(html).to.include('<h1>String Content</h1>');
    });

    it('should handle DocumentFragment content', () => {
      const layoutManager = createLayoutManager();
      const fragment = document.createDocumentFragment();
      const heading = document.createElement('h1');
      heading.textContent = 'Fragment Content';
      fragment.appendChild(heading);
      
      const result = layoutManager.wrapInLayout(fragment);
      
      // Convert to HTML string for easier testing
      const div = document.createElement('div');
      div.appendChild(result.cloneNode(true));
      const html = div.innerHTML;
      
      expect(html).to.include('<h1>Fragment Content</h1>');
    });

    it('should handle DOM Node content', () => {
      const layoutManager = createLayoutManager();
      const node = document.createElement('h1');
      node.textContent = 'Node Content';
      
      const result = layoutManager.wrapInLayout(node);
      
      // Convert to HTML string for easier testing
      const div = document.createElement('div');
      div.appendChild(result.cloneNode(true));
      const html = div.innerHTML;
      
      expect(html).to.include('<h1>Node Content</h1>');
    });
  });

  describe('registerLayout', () => {
    it('should register a new layout', () => {
      const layoutManager = createLayoutManager();
      const customLayout = content => `<div class="custom-layout">${content}</div>`;
      
      layoutManager.registerLayout('custom', customLayout);
      
      expect(layoutManager.getLayout('custom')).to.equal(customLayout);
    });

    it('should throw an error if layout is not a function', () => {
      const layoutManager = createLayoutManager();
      
      expect(() => layoutManager.registerLayout('invalid', 'not-a-function')).to.throw('Layout must be a function');
    });
  });

  describe('getLayout', () => {
    it('should return a layout by name', () => {
      const layoutManager = createLayoutManager();
      const customLayout = content => `<div class="custom-layout">${content}</div>`;
      
      layoutManager.registerLayout('custom', customLayout);
      
      expect(layoutManager.getLayout('custom')).to.equal(customLayout);
    });

    it('should return null for non-existent layouts', () => {
      const layoutManager = createLayoutManager();
      
      expect(layoutManager.getLayout('non-existent')).to.be.null;
    });
  });

  describe('getLayouts', () => {
    it('should return all registered layouts', () => {
      const layoutManager = createLayoutManager();
      const customLayout = content => `<div class="custom-layout">${content}</div>`;
      
      layoutManager.registerLayout('custom', customLayout);
      
      const layouts = layoutManager.getLayouts();
      
      expect(layouts).to.be.an('object');
      expect(layouts).to.have.property('default');
      expect(layouts).to.have.property('error');
      expect(layouts).to.have.property('minimal');
      expect(layouts).to.have.property('custom');
      expect(layouts.custom).to.equal(customLayout);
    });
  });

  describe('setDefaultLayout', () => {
    it('should set the default layout', () => {
      const layoutManager = createLayoutManager();
      
      layoutManager.setDefaultLayout('minimal');
      
      expect(layoutManager.getDefaultLayout()).to.equal('minimal');
    });

    it('should throw an error if layout does not exist', () => {
      const layoutManager = createLayoutManager();
      
      expect(() => layoutManager.setDefaultLayout('non-existent')).to.throw('Layout "non-existent" not found');
    });
  });

  describe('getDefaultLayout', () => {
    it('should return the default layout name', () => {
      const layoutManager = createLayoutManager();
      
      expect(layoutManager.getDefaultLayout()).to.equal('default');
      
      layoutManager.setDefaultLayout('minimal');
      
      expect(layoutManager.getDefaultLayout()).to.equal('minimal');
    });
  });

  describe('createLayoutFromTemplate', () => {
    it('should create a layout function from an HTML template', () => {
      const layoutManager = createLayoutManager();
      const template = '<div class="template-layout"><header></header>{content}<footer></footer></div>';
      
      const layoutFn = layoutManager.createLayoutFromTemplate(template);
      expect(layoutFn).to.be.a('function');
      
      const content = '<h1>Template Content</h1>';
      const result = layoutFn(content);
      
      // Convert to HTML string for easier testing
      const div = document.createElement('div');
      div.appendChild(result.cloneNode(true));
      const html = div.innerHTML;
      
      expect(html).to.include('<div class="template-layout">');
      expect(html).to.include('<header></header>');
      expect(html).to.include('<h1>Template Content</h1>');
      expect(html).to.include('<footer></footer>');
    });

    it('should handle string content in template layout', () => {
      const layoutManager = createLayoutManager();
      const template = '<div class="template-layout">{content}</div>';
      
      const layoutFn = layoutManager.createLayoutFromTemplate(template);
      const content = '<h1>String Content</h1>';
      const result = layoutFn(content);
      
      // Convert to HTML string for easier testing
      const div = document.createElement('div');
      div.appendChild(result.cloneNode(true));
      const html = div.innerHTML;
      
      expect(html).to.include('<h1>String Content</h1>');
    });

    it('should handle DocumentFragment content in template layout', () => {
      const layoutManager = createLayoutManager();
      const template = '<div class="template-layout">{content}</div>';
      
      const layoutFn = layoutManager.createLayoutFromTemplate(template);
      const fragment = document.createDocumentFragment();
      const heading = document.createElement('h1');
      heading.textContent = 'Fragment Content';
      fragment.appendChild(heading);
      
      const result = layoutFn(fragment);
      
      // Convert to HTML string for easier testing
      const div = document.createElement('div');
      div.appendChild(result.cloneNode(true));
      const html = div.innerHTML;
      
      expect(html).to.include('<h1>Fragment Content</h1>');
    });

    it('should handle DOM Node content in template layout', () => {
      const layoutManager = createLayoutManager();
      const template = '<div class="template-layout">{content}</div>';
      
      const layoutFn = layoutManager.createLayoutFromTemplate(template);
      const node = document.createElement('h1');
      node.textContent = 'Node Content';
      
      const result = layoutFn(node);
      
      // Convert to HTML string for easier testing
      const div = document.createElement('div');
      div.appendChild(result.cloneNode(true));
      const html = div.innerHTML;
      
      expect(html).to.include('<h1>Node Content</h1>');
    });
  });
});