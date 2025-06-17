/**
 * Transitions module for EnhancedRouter
 * 
 * Provides enhanced transition effects between routes with proper cleanup
 */

/**
 * Create a transition manager
 * @param {Object} options - Transition options
 * @returns {Object} Transition manager
 */
export function createTransitions(options = {}) {
  // Default options
  const defaultOptions = {
    type: 'fade',
    duration: 300,
    easing: 'ease',
    preventClicks: true
  };
  
  // Merge options
  const config = { ...defaultOptions, ...options };
  
  /**
   * Clean up any transition overlays
   */
  function cleanupOverlays() {
    // Remove any transition overlays
    const overlays = document.querySelectorAll('.transition-overlay');
    
    overlays.forEach(overlay => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    });
    
    // Also check for any elements with opacity or visibility styles that might be leftover
    document.querySelectorAll('[style*="opacity: 0"]').forEach(el => {
      if (el.classList.contains('transition-overlay') || el.style.position === 'absolute') {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }
    });
    
    // Remove the initial loading overlay if it exists
    const initialOverlay = document.getElementById('initial-loading-overlay');
    if (initialOverlay && initialOverlay.parentNode) {
      initialOverlay.style.opacity = '0';
      setTimeout(() => {
        if (initialOverlay.parentNode) {
          initialOverlay.parentNode.removeChild(initialOverlay);
        }
      }, 150);
    }
  }
  
  /**
   * Create a fade transition
   * @returns {Function} Transition function
   */
  function createFadeTransition() {
    return async (fromEl, toEl) => {
      return new Promise(resolve => {
        // Create overlay to prevent clicks during transition if enabled
        if (config.preventClicks) {
          const overlay = document.createElement('div');
          overlay.className = 'transition-overlay';
          overlay.style.position = 'fixed';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100%';
          overlay.style.height = '100%';
          overlay.style.zIndex = '9999';
          overlay.style.backgroundColor = 'transparent';
          document.body.appendChild(overlay);
        }
        
        // If no fromEl (initial load), just show toEl
        if (!fromEl) {
          if (toEl) {
            // Check if toEl exists and has a style property
            if (toEl.style) {
              toEl.style.opacity = '0';
              toEl.style.transition = `opacity ${config.duration}ms ${config.easing}`;
              
              // Force reflow
              void toEl.offsetWidth;
              
              toEl.style.opacity = '1';
            }
          }
          
          setTimeout(() => {
            cleanupOverlays();
            resolve();
            
            // Dispatch transition end event
            document.dispatchEvent(new CustomEvent('spa-transition-end'));
          }, config.duration);
          
          return;
        }
        
        // Fade out fromEl if it exists
        if (fromEl && fromEl.style) {
          fromEl.style.transition = `opacity ${config.duration}ms ${config.easing}`;
          fromEl.style.opacity = '0';
        }
        
        setTimeout(() => {
          // Remove fromEl
          if (fromEl.parentNode) {
            fromEl.parentNode.removeChild(fromEl);
          }
          
          // Prepare toEl
          if (toEl && toEl.style) {
            toEl.style.opacity = '0';
            toEl.style.transition = `opacity ${config.duration}ms ${config.easing}`;
            
            // Force reflow
            void toEl.offsetWidth;
            
            // Fade in toEl
            toEl.style.opacity = '1';
          }
          
          setTimeout(() => {
            cleanupOverlays();
            resolve();
            
            // Dispatch transition end event
            document.dispatchEvent(new CustomEvent('spa-transition-end'));
          }, config.duration);
        }, config.duration);
      });
    };
  }
  
  /**
   * Create a slide transition
   * @returns {Function} Transition function
   */
  function createSlideTransition() {
    return async (fromEl, toEl) => {
      return new Promise(resolve => {
        // Create overlay to prevent clicks during transition if enabled
        if (config.preventClicks) {
          const overlay = document.createElement('div');
          overlay.className = 'transition-overlay';
          overlay.style.position = 'fixed';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100%';
          overlay.style.height = '100%';
          overlay.style.zIndex = '9999';
          overlay.style.backgroundColor = 'transparent';
          document.body.appendChild(overlay);
        }
        
        // If no fromEl (initial load), just show toEl
        if (!fromEl) {
          if (toEl) {
            toEl.style.transform = 'translateX(100%)';
            toEl.style.transition = `transform ${config.duration}ms ${config.easing}`;
            
            // Force reflow
            void toEl.offsetWidth;
            
            toEl.style.transform = 'translateX(0)';
          }
          
          setTimeout(() => {
            cleanupOverlays();
            resolve();
            
            // Dispatch transition end event
            document.dispatchEvent(new CustomEvent('spa-transition-end'));
          }, config.duration);
          
          return;
        }
        
        // Prepare container if fromEl exists and has a parent
        const container = fromEl ? fromEl.parentNode : null;
        if (container && container.style) {
          container.style.position = 'relative';
          container.style.overflow = 'hidden';
        }
        
        // Prepare fromEl if it exists
        if (fromEl && fromEl.style) {
          fromEl.style.position = 'absolute';
          fromEl.style.top = '0';
          fromEl.style.left = '0';
          fromEl.style.width = '100%';
          fromEl.style.transition = `transform ${config.duration}ms ${config.easing}`;
        }
        
        // Prepare toEl if it exists
        if (toEl && toEl.style) {
          toEl.style.position = 'absolute';
          toEl.style.top = '0';
          toEl.style.left = '0';
          toEl.style.width = '100%';
          toEl.style.transform = 'translateX(100%)';
          toEl.style.transition = `transform ${config.duration}ms ${config.easing}`;
          
          // Add to container if container exists
          if (container) {
            container.appendChild(toEl);
          }
        }
        
        // Force reflow if elements exist
        if (fromEl) void fromEl.offsetWidth;
        if (toEl) void toEl.offsetWidth;
        
        // Slide fromEl out to the left if it exists
        if (fromEl && fromEl.style) {
          fromEl.style.transform = 'translateX(-100%)';
        }
        
        // Slide toEl in from the right if it exists
        if (toEl && toEl.style) {
          toEl.style.transform = 'translateX(0)';
        }
        
        setTimeout(() => {
          // Reset styles if container exists and has style
          if (container && container.style) {
            container.style.position = '';
            container.style.overflow = '';
          }
          
          // Remove fromEl
          if (fromEl.parentNode) {
            fromEl.parentNode.removeChild(fromEl);
          }
          
          // Reset toEl styles if it exists and has style
          if (toEl && toEl.style) {
            toEl.style.position = '';
            toEl.style.top = '';
            toEl.style.left = '';
            toEl.style.width = '';
            toEl.style.transform = '';
            toEl.style.transition = '';
          }
          
          cleanupOverlays();
          resolve();
          
          // Dispatch transition end event
          document.dispatchEvent(new CustomEvent('spa-transition-end'));
        }, config.duration);
      });
    };
  }
  
  /**
   * Create a custom transition
   * @param {Function} transitionFn - Custom transition function
   * @returns {Function} Transition function with cleanup
   */
  function createCustomTransition(transitionFn) {
    return async (fromEl, toEl) => {
      try {
        // Execute the custom transition
        await transitionFn(fromEl, toEl);
      } finally {
        // Always clean up overlays
        cleanupOverlays();
        
        // Dispatch transition end event
        document.dispatchEvent(new CustomEvent('spa-transition-end'));
      }
    };
  }
  
  /**
   * Get the appropriate transition function based on configuration
   * @returns {Function} Transition function
   */
  function getTransition() {
    // If a custom transition function is provided, use it
    if (typeof config.transition === 'function') {
      return createCustomTransition(config.transition);
    }
    
    // Otherwise, use the configured type
    switch (config.type) {
      case 'slide':
        return createSlideTransition();
      case 'none':
        return (fromEl, toEl) => {
          // Simply remove fromEl and show toEl
          if (fromEl && fromEl.parentNode) {
            fromEl.parentNode.removeChild(fromEl);
          }
          
          // Dispatch transition end event
          document.dispatchEvent(new CustomEvent('spa-transition-end'));
          
          return Promise.resolve();
        };
      case 'fade':
      default:
        return createFadeTransition();
    }
  }
  
  // Return the transition manager
  return {
    cleanupOverlays,
    getTransition,
    createFadeTransition,
    createSlideTransition,
    createCustomTransition
  };
}

export default createTransitions;