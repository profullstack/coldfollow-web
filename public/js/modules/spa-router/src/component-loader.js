/**
 * Component Loader Utility
 *
 * Handles automatic detection and loading of web components from HTML content
 */

/**
 * Extracts module script sources from HTML content
 * @param {Document} doc - Parsed HTML document
 * @returns {string[]} - Array of script sources
 */
export function extractModuleScriptSources(doc) {
  // Extract script tags from both body and the entire document
  // This ensures we catch scripts at the root level of HTML fragments
  const bodyScriptTags = Array.from(doc.body.querySelectorAll('script[type="module"]'));
  const allScriptTags = Array.from(doc.querySelectorAll('script[type="module"]'));
  
  // Combine and deduplicate script tags
  const scriptTags = [...new Set([...bodyScriptTags, ...allScriptTags])];
  
  // Extract src attributes
  const scriptSources = scriptTags.map(script => script.getAttribute('src')).filter(src => src);
  
  if (scriptSources.length > 0) {
    console.log(`Found ${scriptSources.length} module scripts:`, scriptSources);
  }
  
  return scriptSources;
}

/**
 * Executes inline script tags from HTML content
 * @param {Document} doc - Parsed HTML document
 * @returns {Promise<number>} - Number of executed inline scripts
 */
/**
 * Execute inline scripts by replacing them with new script elements
 * This forces the browser to execute the scripts
 * @param {Document} doc - Parsed HTML document
 * @returns {number} - Number of executed inline scripts
 */
export async function executeInlineScripts(doc) {
  return function reexecuteInlineScripts(container) {
    // Execute inline scripts only (ignore scripts with src)
    const scripts = container.querySelectorAll('script:not([src])');
    let count = scripts.length;
    
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      [...oldScript.attributes].forEach(attr =>
        newScript.setAttribute(attr.name, attr.value)
      );
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript); // Maintains position in DOM
    });
    
    return count;
  };
}

/**
 * Filters out script tags from HTML content
 * @param {HTMLElement} element - Element to filter scripts from
 * @param {boolean} keepScripts - Whether to keep script tags in the output (default: false)
 * @returns {DocumentFragment} - Document fragment with scripts removed or preserved
 */
export function filterScriptTags(element, keepScripts = false) {
  const tempDiv = document.createElement('div');
  
  // Clone all child nodes, optionally excluding script tags
  Array.from(element.children).forEach(child => {
    if (keepScripts || child.tagName !== 'SCRIPT') {
      tempDiv.appendChild(child.cloneNode(true));
    }
  });
  
  return tempDiv;
}

/**
 * Extracts all script tags from a document and creates new script elements
 * that will be executed when added to the DOM
 * @param {Document} doc - Parsed HTML document
 * @returns {Array<HTMLScriptElement>} - Array of new script elements
 */
export function extractAndCloneScripts(doc) {
  // Get all script tags from the document
  const scriptTags = Array.from(doc.querySelectorAll('script'));
  
  if (scriptTags.length > 0) {
    console.log(`Found ${scriptTags.length} script tags to clone`);
  }
  
  // Create new script elements with the same attributes and content
  return scriptTags.map(oldScript => {
    const newScript = document.createElement('script');
    
    // Copy all attributes
    Array.from(oldScript.attributes).forEach(attr => {
      newScript.setAttribute(attr.name, attr.value);
    });
    
    // Copy the content
    newScript.textContent = oldScript.textContent;
    
    // If it's a src script, ensure the URL is absolute
    if (newScript.src && !newScript.src.startsWith('http://') && !newScript.src.startsWith('https://')) {
      const baseUrl = window.location.origin;
      const absoluteSrc = newScript.src.startsWith('/')
        ? `${baseUrl}${newScript.src}`
        : `${baseUrl}/${newScript.src}`;
      newScript.src = absoluteSrc;
    }
    
    return newScript;
  });
}

/**
 * Creates a document fragment from HTML content and ensures scripts are properly handled
 * @param {Document} doc - Parsed HTML document
 * @returns {DocumentFragment} - Document fragment with content and scripts that will execute
 */
export function createFragmentWithScripts(doc) {
  // Create a fragment to hold the content
  const fragment = document.createDocumentFragment();
  
  // Clone all children from the body
  Array.from(doc.body.children).forEach(child => {
    // Skip script tags, we'll handle them separately
    if (child.tagName !== 'SCRIPT') {
      fragment.appendChild(child.cloneNode(true));
    }
  });
  
  // Extract and clone script tags
  const scriptElements = extractAndCloneScripts(doc);
  
  // Add the script elements to the fragment
  scriptElements.forEach(script => {
    fragment.appendChild(script);
  });
  
  // Extract module script sources
  const moduleScripts = extractModuleScriptSources(doc);
  
  // Create and add module scripts to the fragment
  if (moduleScripts && moduleScripts.length > 0) {
    console.log(`Adding ${moduleScripts.length} module scripts to the fragment`);
    
    moduleScripts.forEach(src => {
      // Create a new script element
      const script = document.createElement('script');
      script.type = 'module';
      
      // Convert to absolute URL if needed
      if (src.startsWith('http://') || src.startsWith('https://')) {
        script.src = src;
      } else {
        // For local scripts, create absolute URL based on current origin
        const baseUrl = window.location.origin;
        const absoluteSrc = src.startsWith('/')
          ? `${baseUrl}${src}`
          : `${baseUrl}/${src}`;
        script.src = absoluteSrc;
      }
      
      console.log(`Adding module script: ${script.src}`);
      fragment.appendChild(script);
    });
  }
  
  return fragment;
}

export default {
  extractModuleScriptSources,
  executeInlineScripts,
  filterScriptTags,
  extractAndCloneScripts,
  createFragmentWithScripts
};