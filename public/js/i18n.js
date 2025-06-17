/**
 * Internationalization (i18n) module for the PDF project
 * Uses the @profullstack/localizer library for translations
 * Integrated with state-manager for better state management
 */

// Import the localizer library
// In production, this would be imported from the npm package
// import { localizer, _t } from '@profullstack/localizer';
// For development, we'll use our deps.js file
import { localizer, _t, createStore } from './deps.js';

// Create a store for i18n state
const i18nStore = createStore('i18n', {
  currentLanguage: 'en',
  availableLanguages: ['en', 'fr', 'de', 'uk', 'ru', 'pl', 'zh', 'ja', 'ar'],
  isRTL: false
});

// Store available languages
const AVAILABLE_LANGUAGES = ['en', 'fr', 'de', 'uk', 'ru', 'pl', 'zh', 'ja', 'ar'];
const DEFAULT_LANGUAGE = 'en';

/**
 * Flatten a nested object into a flat object with dot notation keys
 * @param {Object} obj - The object to flatten
 * @param {string} [prefix=''] - The prefix to use for keys
 * @returns {Object} - The flattened object
 */
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const prefixedKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], prefixedKey));
    } else {
      acc[prefixedKey] = obj[key];
    }
    
    return acc;
  }, {});
}

// Initialize the localizer
async function initI18n() {
  console.log('Initializing i18n...');
  
  try {
    // Load translations for all available languages
    for (const lang of AVAILABLE_LANGUAGES) {
      const response = await fetch(`/i18n/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${lang}.json: ${response.status}`);
      }
      
      const translations = await response.json();
      // Flatten the nested translations
      const flattenedTranslations = flattenObject(translations);
      
      // Load the flattened translations
      localizer.loadTranslations(lang, flattenedTranslations);
    }
    
    console.log('Translations loaded successfully');
    
    // Set initial language based on browser preference or localStorage
    setInitialLanguage();
    
    // Apply translations to the current page
    translatePage();
    
    // Apply RTL direction if needed
    applyDirectionToDocument();
    
    // Set up language switcher if it exists
    setupLanguageSwitcher();
    
    // Listen for DOM changes to translate dynamically added content
    observeDomChanges();
    
    // Initialize state management for i18n
    initStateManagement();
    
    console.log('i18n initialized successfully');
    
    // Dispatch an event to notify that i18n is ready
    window.dispatchEvent(new CustomEvent('i18n-ready'));
    
    // Apply translations to any content that might have been loaded before i18n was ready
    setTimeout(() => translatePage(), 100);
    
    return true;
  } catch (error) {
    console.error('Error initializing i18n:', error);
    return false;
  }
}

/**
 * Initialize state management for i18n
 */
function initStateManagement() {
  // Update the store with current language
  i18nStore.state.currentLanguage = localizer.getLanguage();
  i18nStore.state.isRTL = ['ar', 'he', 'fa', 'ur'].includes(localizer.getLanguage());
  
  // Subscribe to language changes in the store
  i18nStore.subscribe((state) => {
    const newLang = state.currentLanguage;
    if (newLang !== localizer.getLanguage()) {
      console.log(`Language change detected in store: ${newLang}`);
      changeLanguage(newLang);
    }
  });
}

/**
 * Set the initial language based on browser preference or localStorage
 */
function setInitialLanguage() {
  // Check if language is stored in localStorage
  const storedLang = localStorage.getItem('convert2doc-language');
  
  if (storedLang && AVAILABLE_LANGUAGES.includes(storedLang)) {
    console.log(`Using stored language preference: ${storedLang}`);
    localizer.setLanguage(storedLang);
    
    // Force language application
    if (localizer.getLanguage() !== storedLang) {
      console.log(`Language mismatch in setInitialLanguage, forcing to: ${storedLang}`);
      localizer.setLanguage(storedLang);
    }
    
    // Apply RTL direction if needed
    applyDirectionToDocument();
    return;
  }
  
  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  
  if (AVAILABLE_LANGUAGES.includes(browserLang)) {
    console.log(`Using browser language: ${browserLang}`);
    localizer.setLanguage(browserLang);
  } else {
    console.log(`Browser language ${browserLang} not available, using default: ${DEFAULT_LANGUAGE}`);
    localizer.setLanguage(DEFAULT_LANGUAGE);
  }
  
  // Apply RTL direction if needed
  applyDirectionToDocument();
}

/**
 * Change the current language
 * @param {string} language - The language code to switch to
 */
function changeLanguage(language) {
  if (!AVAILABLE_LANGUAGES.includes(language)) {
    console.error(`Language ${language} is not available`);
    return false;
  }
  
  console.log(`Changing language to: ${language}`);
  localizer.setLanguage(language);
  
  // Force language application
  if (localizer.getLanguage() !== language) {
    console.log(`Language mismatch in changeLanguage, forcing to: ${language}`);
    localizer.setLanguage(language);
  }
  
  // Store the language preference
  localStorage.setItem('convert2doc-language', language);
  
  // Apply translations to the current page
  translatePage();
  
  // Apply RTL direction if needed
  applyDirectionToDocument();
  
  // Update the store (without triggering circular updates)
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(language);
  
  // Use direct property assignment to avoid triggering the subscription
  i18nStore.state.currentLanguage = language;
  i18nStore.state.isRTL = isRTL;
  
  // Dispatch an event to notify that language has changed
  window.dispatchEvent(new CustomEvent('language-changed', {
    detail: { language, isRTL }
  }));
  
  return true;
}

/**
 * Apply translations to the current page
 */
function translatePage() {
  // Translate elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = _t(key);
  });
  
  // Translate elements with data-i18n-placeholder attribute (for input placeholders)
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = _t(key);
  });
  
  // Translate elements with data-i18n-title attribute
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    element.title = _t(key);
  });
  
  // Translate elements with data-i18n-html attribute (for HTML content)
  document.querySelectorAll('[data-i18n-html]').forEach(element => {
    const key = element.getAttribute('data-i18n-html');
    element.innerHTML = _t(key);
  });
  
  // Handle elements with data-i18n-params attribute (for interpolation)
  document.querySelectorAll('[data-i18n-params]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (!key) return;
    
    try {
      const paramsAttr = element.getAttribute('data-i18n-params');
      const params = JSON.parse(paramsAttr);
      element.textContent = _t(key, params);
    } catch (error) {
      console.error(`Error parsing data-i18n-params for key ${key}:`, error);
    }
  });
}

/**
 * Set up language switcher if it exists in the DOM
 */
function setupLanguageSwitcher() {
  const languageSwitcher = document.getElementById('language-switcher');
  if (!languageSwitcher) return;
  
  // Clear existing options
  languageSwitcher.innerHTML = '';
  
  // Add options for each available language
  AVAILABLE_LANGUAGES.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang;
    option.textContent = getLanguageName(lang);
    option.selected = localizer.getLanguage() === lang;
    languageSwitcher.appendChild(option);
  });
  
  // Add change event listener
  languageSwitcher.addEventListener('change', (event) => {
    changeLanguage(event.target.value);
  });
}

/**
 * Get the display name of a language
 * @param {string} langCode - The language code
 * @returns {string} The language name
 */
function getLanguageName(langCode) {
  const names = {
    en: 'English',
    fr: 'Français',
    de: 'Deutsch',
    uk: 'Українська',
    ru: 'Русский',
    pl: 'Polski',
    zh: '中文',
    ja: '日本語'
  };
  
  return names[langCode] || langCode;
}

/**
 * Apply RTL direction to the document if the current language is RTL
 */
function applyDirectionToDocument() {
  const currentLang = localizer.getLanguage();
  
  // Define RTL languages
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  const isRTL = rtlLanguages.includes(currentLang);
  
  // Set the dir attribute on the html element
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  
  // Add or remove RTL class to the body
  if (isRTL) {
    document.body.classList.add('rtl');
    
    // Add RTL stylesheet if it's not already added
    if (!document.getElementById('rtl-stylesheet')) {
      const rtlStylesheet = document.createElement('link');
      rtlStylesheet.id = 'rtl-stylesheet';
      rtlStylesheet.rel = 'stylesheet';
      rtlStylesheet.href = '/css/rtl.css';
      document.head.appendChild(rtlStylesheet);
    }
  } else {
    document.body.classList.remove('rtl');
    
    // Remove RTL stylesheet if it exists
    const rtlStylesheet = document.getElementById('rtl-stylesheet');
    if (rtlStylesheet) {
      rtlStylesheet.remove();
    }
  }
  
  console.log(`Applied ${isRTL ? 'RTL' : 'LTR'} direction to document for language: ${currentLang}`);
}

/**
 * Observe DOM changes to translate dynamically added content
 */
function observeDomChanges() {
  // Create a MutationObserver to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    let shouldTranslate = false;
    
    // Check if any of the mutations added nodes with data-i18n attributes
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the node or any of its children have data-i18n attributes
            if (
              node.hasAttribute && (
                node.hasAttribute('data-i18n') ||
                node.hasAttribute('data-i18n-placeholder') ||
                node.hasAttribute('data-i18n-title') ||
                node.hasAttribute('data-i18n-html') ||
                node.hasAttribute('data-i18n-params') ||
                node.querySelector('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-html], [data-i18n-params]')
              )
            ) {
              shouldTranslate = true;
            }
          }
        });
      }
    });
    
    // If we found elements to translate, update the page
    if (shouldTranslate) {
      console.log('DOM changes detected with i18n attributes, translating page');
      translatePage();
    }
  });
  
  // Start observing the document body for DOM changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Listen for pre-navigation event to apply translations before transition starts
  document.addEventListener('pre-navigation', (event) => {
    console.log('Pre-navigation event detected, applying translations');
    console.log('Navigation details:', event.detail);
    translatePage();
    applyDirectionToDocument();
  });
  
  // Also listen for the SPA router's transition end event
  document.addEventListener('spa-transition-end', () => {
    console.log('SPA transition ended, applying translations');
    translatePage();
    applyDirectionToDocument();
  });
}

// Export the API
export {
  initI18n,
  changeLanguage,
  translatePage,
  applyDirectionToDocument,
  _t,
  localizer,
  AVAILABLE_LANGUAGES
};

// Also expose functions globally for access from other scripts
window.app = window.app || {};
window.app.localizer = localizer;
window.app.translatePage = translatePage;
window.app.applyDirectionToDocument = applyDirectionToDocument;
window.app._t = _t;

// Initialize i18n when the DOM is loaded
document.addEventListener('DOMContentLoaded', initI18n);

// Also initialize immediately if the document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initI18n();
}