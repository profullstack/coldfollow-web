/**
 * i18n setup for the application
 * Uses the enhanced @profullstack/localizer module
 */

import { localizer } from './deps.js';

// Available languages
const AVAILABLE_LANGUAGES = ['en', 'fr', 'de', 'uk', 'ru', 'pl', 'zh', 'ja', 'ar'];

/**
 * Initialize i18n for the application
 * @returns {Promise<boolean>} True if initialization was successful
 */
export async function initI18n() {
  try {
    console.log('Initializing i18n...');
    
    // Load translations for all available languages
    for (const lang of AVAILABLE_LANGUAGES) {
      try {
        await localizer.loadTranslationsFromUrl(lang, `/i18n/${lang}.json`);
        console.log(`Loaded translations for ${lang}`);
      } catch (error) {
        console.warn(`Failed to load translations for ${lang}:`, error);
      }
    }
    
    // Set initial language based on localStorage or browser preference
    const storedLang = localStorage.getItem('coldfollow-language');
    const availableLanguages = localizer.getAvailableLanguages();
    
    if (storedLang && availableLanguages.includes(storedLang)) {
      console.log(`Using stored language preference: ${storedLang}`);
      localizer.setLanguage(storedLang);
    } else {
      // Check browser language
      const browserLang = navigator.language.split('-')[0];
      
      if (availableLanguages.includes(browserLang)) {
        console.log(`Using browser language: ${browserLang}`);
        localizer.setLanguage(browserLang);
      } else {
        console.log(`Browser language ${browserLang} not available, using default: en`);
        localizer.setLanguage('en');
      }
    }
    
    // Apply translations to the current page
    localizer.translateDOM();
    
    // Apply RTL direction if needed
    localizer.applyRTLToDocument();
    
    // Set up observer for DOM changes
    localizer.observeDOM();
    
    // Listen for language changes to update localStorage
    window.addEventListener('language-changed', (event) => {
      const { language } = event.detail;
      console.log(`Language changed to: ${language}`);
      localStorage.setItem('coldfollow-language', language);
      
      // Apply RTL direction if needed
      localizer.applyRTLToDocument();
    });
    
    // Expose translation function globally
    window.app = window.app || {};
    window.app._t = localizer.translate.bind(localizer);
    window.app.localizer = localizer;
    
    console.log('i18n initialized successfully');
    
    // Dispatch an event to notify that i18n is ready
    window.dispatchEvent(new CustomEvent('i18n-ready'));
    
    return true;
  } catch (error) {
    console.error('Error initializing i18n:', error);
    return false;
  }
}

// Export localizer for direct use
export { localizer };

// Export translation function for convenience
export const _t = localizer.translate.bind(localizer);