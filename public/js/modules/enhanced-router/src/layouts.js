/**
 * Layouts module for EnhancedRouter
 * 
 * Provides layout management for routes
 */

/**
 * Create a layout manager
 * @param {Object} options - Layout options
 * @returns {Object} Layout manager
 */
export function createLayoutManager(options = {}) {
  // Default options
  const defaultOptions = {
    defaultLayout: 'default',
    layouts: {
      default: content => {
        // Create a document fragment with the default layout
        const fragment = document.createDocumentFragment();
        
        // Create header
        const header = document.createElement('header');
        header.className = 'site-header';
        fragment.appendChild(header);
        
        // Create content container
        const contentDiv = document.createElement('main');
        contentDiv.className = 'content';
        
        // If content is a string, use createContextualFragment to parse it
        if (typeof content === 'string') {
          const range = document.createRange();
          const parsedContent = range.createContextualFragment(content);
          contentDiv.appendChild(parsedContent);
        } else if (content instanceof DocumentFragment) {
          // If it's already a fragment, append it directly
          contentDiv.appendChild(content);
        } else if (content instanceof Node) {
          // If it's a DOM node, append it directly
          contentDiv.appendChild(content);
        }
        
        fragment.appendChild(contentDiv);
        
        // Create footer
        const footer = document.createElement('footer');
        footer.className = 'site-footer';
        fragment.appendChild(footer);
        
        return fragment;
      },
      error: content => {
        // Create a document fragment with the error layout
        const fragment = document.createDocumentFragment();
        
        // Create header
        const header = document.createElement('header');
        header.className = 'site-header';
        fragment.appendChild(header);
        
        // Create content container
        const contentDiv = document.createElement('main');
        contentDiv.className = 'content error-page';
        
        // If content is a string, use createContextualFragment to parse it
        if (typeof content === 'string') {
          const range = document.createRange();
          const parsedContent = range.createContextualFragment(content);
          contentDiv.appendChild(parsedContent);
        } else if (content instanceof DocumentFragment) {
          // If it's already a fragment, append it directly
          contentDiv.appendChild(content);
        } else if (content instanceof Node) {
          // If it's a DOM node, append it directly
          contentDiv.appendChild(content);
        }
        
        fragment.appendChild(contentDiv);
        
        // Create footer
        const footer = document.createElement('footer');
        footer.className = 'site-footer';
        fragment.appendChild(footer);
        
        return fragment;
      },
      minimal: content => {
        // Create a document fragment with a minimal layout (no header/footer)
        const fragment = document.createDocumentFragment();
        
        // Create content container
        const contentDiv = document.createElement('main');
        contentDiv.className = 'content minimal-layout';
        
        // If content is a string, use createContextualFragment to parse it
        if (typeof content === 'string') {
          const range = document.createRange();
          const parsedContent = range.createContextualFragment(content);
          contentDiv.appendChild(parsedContent);
        } else if (content instanceof DocumentFragment) {
          // If it's already a fragment, append it directly
          contentDiv.appendChild(content);
        } else if (content instanceof Node) {
          // If it's a DOM node, append it directly
          contentDiv.appendChild(content);
        }
        
        fragment.appendChild(contentDiv);
        
        return fragment;
      }
    }
  };
  
  // Merge options
  const config = {
    defaultLayout: options.defaultLayout || defaultOptions.defaultLayout,
    layouts: { ...defaultOptions.layouts, ...options.layouts }
  };
  
  /**
   * Wrap content in a layout
   * @param {string|DocumentFragment|Node} content - Content to wrap
   * @param {string} layoutName - Name of the layout to use
   * @returns {DocumentFragment} Content wrapped in layout
   */
  function wrapInLayout(content, layoutName = config.defaultLayout) {
    // Get the layout function
    const layoutFn = config.layouts[layoutName] || config.layouts[config.defaultLayout];
    
    // Apply the layout
    return layoutFn(content);
  }
  
  /**
   * Register a new layout
   * @param {string} name - Layout name
   * @param {Function} layoutFn - Layout function
   */
  function registerLayout(name, layoutFn) {
    if (typeof layoutFn !== 'function') {
      throw new Error('Layout must be a function');
    }
    
    config.layouts[name] = layoutFn;
  }
  
  /**
   * Get a layout by name
   * @param {string} name - Layout name
   * @returns {Function|null} Layout function or null if not found
   */
  function getLayout(name) {
    return config.layouts[name] || null;
  }
  
  /**
   * Get all registered layouts
   * @returns {Object} Object with layout names as keys and layout functions as values
   */
  function getLayouts() {
    return { ...config.layouts };
  }
  
  /**
   * Set the default layout
   * @param {string} name - Layout name
   */
  function setDefaultLayout(name) {
    if (!config.layouts[name]) {
      throw new Error(`Layout "${name}" not found`);
    }
    
    config.defaultLayout = name;
  }
  
  /**
   * Get the default layout name
   * @returns {string} Default layout name
   */
  function getDefaultLayout() {
    return config.defaultLayout;
  }
  
  /**
   * Create a layout function from an HTML template
   * @param {string} template - HTML template with {content} placeholder
   * @returns {Function} Layout function
   */
  function createLayoutFromTemplate(template) {
    return content => {
      // Create a temporary div to hold the template
      const div = document.createElement('div');
      
      // Replace {content} placeholder with a unique marker
      const marker = `__CONTENT_PLACEHOLDER_${Date.now()}__`;
      div.innerHTML = template.replace('{content}', marker);
      
      // Convert to document fragment
      const range = document.createRange();
      const fragment = range.createContextualFragment(div.innerHTML);
      
      // Find the marker in the fragment
      const walker = document.createTreeWalker(
        fragment,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: node => {
            return node.textContent.includes(marker)
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          }
        }
      );
      
      // Replace the marker with the actual content
      const markerNode = walker.nextNode();
      if (markerNode) {
        const parent = markerNode.parentNode;
        const contentFragment = document.createDocumentFragment();
        
        // If content is a string, use createContextualFragment to parse it
        if (typeof content === 'string') {
          const range = document.createRange();
          const parsedContent = range.createContextualFragment(content);
          contentFragment.appendChild(parsedContent);
        } else if (content instanceof DocumentFragment) {
          // If it's already a fragment, append it directly
          contentFragment.appendChild(content);
        } else if (content instanceof Node) {
          // If it's a DOM node, append it directly
          contentFragment.appendChild(content);
        }
        
        // Replace the marker with the content
        const beforeText = markerNode.textContent.split(marker)[0];
        const afterText = markerNode.textContent.split(marker)[1];
        
        if (beforeText) {
          parent.insertBefore(document.createTextNode(beforeText), markerNode);
        }
        
        parent.insertBefore(contentFragment, markerNode);
        
        if (afterText) {
          parent.insertBefore(document.createTextNode(afterText), markerNode);
        }
        
        parent.removeChild(markerNode);
      }
      
      return fragment;
    };
  }
  
  // Return the layout manager
  return {
    wrapInLayout,
    registerLayout,
    getLayout,
    getLayouts,
    setDefaultLayout,
    getDefaultLayout,
    createLayoutFromTemplate
  };
}

export default createLayoutManager;