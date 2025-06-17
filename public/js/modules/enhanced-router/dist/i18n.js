/**
 * i18n Integration module for EnhancedRouter
 * 
 * Provides internationalization integration for the router
 */

/**
 * Create an i18n integration
 * @param {Object} options - i18n options
 * @returns {Object} i18n integration
 */
export function createI18nIntegration(options = {}) {
  // Default options
  const defaultOptions = {
    enabled: false,
    localizer: null,
    translateContainer: null,
    applyRTLToDocument: null,
    defaultLanguage: 'en',
    languages: ['en'],
    rtlLanguages: ['ar', 'he', 'fa', 'ur']
  };
  
  // Merge options
  const config = { ...defaultOptions, ...options };
  
  // Detect if we have a localizer
  if (config.localizer) {
    config.enabled = true;
    
    // If translateContainer is not provided, try to get it from the localizer
    if (!config.translateContainer && typeof config.localizer.translateContainer === 'function') {
      config.translateContainer = config.localizer.translateContainer.bind(config.localizer);
    }
    
    // If applyRTLToDocument is not provided, try to get it from the localizer
    if (!config.applyRTLToDocument && typeof config.localizer.applyRTLToDocument === 'function') {
      config.applyRTLToDocument = config.localizer.applyRTLToDocument.bind(config.localizer);
    }
  }
  
  // Try to detect localizer in window.app
  if (!config.enabled && typeof window !== 'undefined' && window.app && window.app.localizer) {
    config.enabled = true;
    config.localizer = window.app.localizer;
    
    // If translateContainer is not provided, try to get it from window.app
    if (!config.translateContainer && typeof window.app.translatePage === 'function') {
      config.translateContainer = window.app.translatePage;
    }
    
    // If applyRTLToDocument is not provided, try to get it from window.app
    if (!config.applyRTLToDocument && typeof window.app.applyDirectionToDocument === 'function') {
      config.applyRTLToDocument = window.app.applyDirectionToDocument;
    }
  }
  
  /**
   * Check if i18n is enabled
   * @returns {boolean} Whether i18n is enabled
   */
  function isEnabled() {
    return config.enabled;
  }
  
  /**
   * Initialize i18n
   */
  function init() {
    if (!isEnabled()) {
      return;
    }
    
    // Apply translations to the current page
    translateDOM();
    
    // Apply RTL direction if needed
    applyRTL();
    
    // Set up event listeners
    document.addEventListener('spa-transition-end', () => {
      translateDOM();
      applyRTL();
    });
    
    // Return true to indicate initialization was performed
    return true;
  }
  
  /**
   * Translate the DOM
   */
  function translateDOM() {
    if (!isEnabled()) {
      return;
    }
    
    if (config.translateContainer) {
      config.translateContainer(document.body);
    } else if (config.localizer) {
      // Check if localizer has translateDOM method
      if (typeof config.localizer.translateDOM === 'function') {
        config.localizer.translateDOM();
      }
      // Check if localizer has translateContainer method as fallback
      else if (typeof config.localizer.translateContainer === 'function') {
        config.localizer.translateContainer(document.body);
      }
    }
  }
  
  /**
   * Apply RTL direction if needed
   */
  function applyRTL() {
    if (!isEnabled()) {
      return;
    }
    
    if (config.applyRTLToDocument) {
      config.applyRTLToDocument();
    } else if (config.localizer) {
      // Get current language
      const currentLang = config.localizer.getLanguage();
      
      // Check if it's an RTL language
      const isRTL = config.rtlLanguages.includes(currentLang);
      
      // Set the dir attribute on the html element
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      
      // Add or remove RTL class to the body
      if (isRTL) {
        document.body.classList.add('rtl');
      } else {
        document.body.classList.remove('rtl');
      }
    }
  }
  
  /**
   * Enhance a renderer with i18n support
   * @param {Object} renderer - Renderer to enhance
   * @returns {Object} Enhanced renderer
   */
  function enhanceRenderer(renderer) {
    if (!isEnabled() || !renderer) {
      return renderer;
    }
    
    // Create a new renderer that wraps the original
    return {
      ...renderer,
      render: async (content, target) => {
        // Call the original render method
        await renderer.render(content, target);
        
        // Apply translations
        translateDOM();
        
        // Apply RTL direction if needed
        applyRTL();
      }
    };
  }
  
  /**
   * Translate a string
   * @param {string} key - Translation key
   * @param {Object} params - Translation parameters
   * @returns {string} Translated string
   */
  function translate(key, params = {}) {
    if (!isEnabled()) {
      return key;
    }
    
    if (config.localizer && typeof config.localizer.translate === 'function') {
      return config.localizer.translate(key, params);
    }
    
    if (typeof window !== 'undefined' && window.app && typeof window.app._t === 'function') {
      return window.app._t(key, params);
    }
    
    return key;
  }
  
  /**
   * Get the current language
   * @returns {string} Current language
   */
  function getLanguage() {
    if (!isEnabled()) {
      return config.defaultLanguage;
    }
    
    if (config.localizer && typeof config.localizer.getLanguage === 'function') {
      return config.localizer.getLanguage();
    }
    
    return config.defaultLanguage;
  }
  
  /**
   * Set the current language
   * @param {string} language - Language to set
   * @returns {boolean} Whether the language was set
   */
  function setLanguage(language) {
    if (!isEnabled()) {
      return false;
    }
    
    if (config.localizer && typeof config.localizer.setLanguage === 'function') {
      config.localizer.setLanguage(language);
      
      // Apply translations
      translateDOM();
      
      // Apply RTL direction if needed
      applyRTL();
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Get available languages
   * @returns {string[]} Available languages
   */
  function getLanguages() {
    if (!isEnabled()) {
      return config.languages;
    }
    
    if (config.localizer && typeof config.localizer.getLanguages === 'function') {
      return config.localizer.getLanguages();
    }
    
    return config.languages;
  }
  
  /**
   * Check if a language is RTL
   * @param {string} language - Language to check
   * @returns {boolean} Whether the language is RTL
   */
  function isRTL(language) {
    return config.rtlLanguages.includes(language);
  }
  
  // Return the i18n integration
  return {
    isEnabled,
    init,
    translateDOM,
    applyRTL,
    enhanceRenderer,
    translate,
    getLanguage,
    setLanguage,
    getLanguages,
    isRTL
  };
}

export default createI18nIntegration;