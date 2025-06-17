/**
 * @profullstack/localizer
 * A simple localization and internationalization library
 */

// Types
export interface LocalizerOptions {
  defaultLanguage?: string;
  fallbackLanguage?: string;
  translations?: Record<string, Record<string, string>>;
  interpolationStart?: string;
  interpolationEnd?: string;
  rtlLanguages?: string[];
}

export interface TranslationOptions {
  [key: string]: any;
  count?: number;
  language?: string;
}

// Default options
const DEFAULT_OPTIONS: LocalizerOptions = {
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  translations: {},
  interpolationStart: '${',
  interpolationEnd: '}',
  rtlLanguages: ['ar', 'he', 'fa', 'ur']
};

class Localizer {
  private options: Required<LocalizerOptions>;
  private currentLanguage: string;
  private observer: MutationObserver | null = null;
  
  constructor(options: LocalizerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options } as Required<LocalizerOptions>;
    this.currentLanguage = this.options.defaultLanguage;
  }

  /**
   * Load translations from a JSON object
   * @param language The language code
   * @param translations The translations object
   */
  public loadTranslations(language: string, translations: Record<string, string>): void {
    if (!this.options.translations[language]) {
      this.options.translations[language] = {};
    }
    
    this.options.translations[language] = {
      ...this.options.translations[language],
      ...translations
    };
  }

  /**
   * Set the current language
   * @param language The language code to set
   */
  public setLanguage(language: string): void {
    const previousLanguage = this.currentLanguage;
    
    if (this.options.translations[language] || language === this.options.fallbackLanguage) {
      this.currentLanguage = language;
    } else {
      console.warn(`Language '${language}' not loaded, using fallback language '${this.options.fallbackLanguage}'`);
      this.currentLanguage = this.options.fallbackLanguage;
    }
    
    // Dispatch language change event if running in browser environment
    if (typeof window !== 'undefined' && previousLanguage !== this.currentLanguage) {
      const isRTL = this.isRTL();
      window.dispatchEvent(new CustomEvent('language-changed', {
        detail: {
          language: this.currentLanguage,
          previousLanguage,
          isRTL
        }
      }));
    }
  }
  
  /**
   * Check if the current language is RTL (Right-to-Left)
   * @returns True if the current language is RTL
   */
  public isRTL(): boolean {
    return this.options.rtlLanguages?.includes(this.currentLanguage) || false;
  }
  
  /**
   * Check if a specific language is RTL (Right-to-Left)
   * @param language The language code to check
   * @returns True if the language is RTL
   */
  public isLanguageRTL(language: string): boolean {
    return this.options.rtlLanguages?.includes(language) || false;
  }

  /**
   * Get the current language
   * @returns The current language code
   */
  public getLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Get available languages
   * @returns Array of available language codes
   */
  public getAvailableLanguages(): string[] {
    return Object.keys(this.options.translations);
  }

  /**
   * Translate a key
   * @param key The translation key
   * @param options Options for translation (interpolation values, count for pluralization, etc.)
   * @returns The translated string
   */
  public translate(key: string, options: TranslationOptions = {}): string {
    const language = options.language || this.currentLanguage;
    
    // Get translations for the current language
    const translations = this.options.translations[language] || {};
    
    // Try to get the translation
    let translation = translations[key];
    
    // If not found, try fallback language
    if (!translation && language !== this.options.fallbackLanguage) {
      const fallbackTranslations = this.options.translations[this.options.fallbackLanguage] || {};
      translation = fallbackTranslations[key];
    }
    
    // If still not found, return the key itself
    if (!translation) {
      console.warn(`Translation key '${key}' not found in '${language}' or fallback language`);
      return key;
    }
    
    // Handle pluralization if count is provided
    if (options.count !== undefined) {
      const pluralKey = `${key}_${options.count === 1 ? 'one' : 'other'}`;
      const pluralTranslation = translations[pluralKey] || 
                              (language !== this.options.fallbackLanguage ? 
                                this.options.translations[this.options.fallbackLanguage]?.[pluralKey] : 
                                undefined);
      
      if (pluralTranslation) {
        translation = pluralTranslation;
      }
    }
    
    // Handle interpolation
    return this.interpolate(translation, options);
  }

  /**
   * Replace interpolation placeholders with values
   * @param text The text with placeholders
   * @param values The values to interpolate
   * @returns The interpolated string
   */
  private interpolate(text: string, values: Record<string, any>): string {
    const { interpolationStart, interpolationEnd } = this.options;
    
    return text.replace(
      new RegExp(`${escapeRegExp(interpolationStart)}(\\w+)${escapeRegExp(interpolationEnd)}`, 'g'),
      (match, key) => {
        return values[key] !== undefined ? String(values[key]) : match;
      }
    );
  }

  /**
   * Load translations from a JSON file (browser environment)
   * @param language The language code
   * @param url The URL to the JSON file
   * @returns Promise that resolves when translations are loaded
   */
  public async loadTranslationsFromUrl(language: string, url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load translations: ${response.statusText}`);
      }
      
      const translations = await response.json();
      this.loadTranslations(language, this.flattenObject(translations));
    } catch (error) {
      console.error(`Error loading translations for '${language}':`, error);
    }
  }

  /**
   * Flatten a nested object into a flat object with dot notation keys
   * @param obj The object to flatten
   * @param prefix The prefix to use for keys
   * @returns The flattened object
   */
  private flattenObject(obj: Record<string, any>, prefix: string = ''): Record<string, string> {
    return Object.keys(obj).reduce((acc: Record<string, string>, key: string) => {
      const prefixedKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(acc, this.flattenObject(obj[key], prefixedKey));
      } else {
        acc[prefixedKey] = obj[key];
      }
      
      return acc;
    }, {});
  }

  /**
   * Translate all elements with i18n attributes in the document or container
   * @param container Optional container element (defaults to document.body)
   */
  public translateDOM(container?: HTMLElement): void {
    if (typeof document === 'undefined') return; // Skip in non-browser environments
    
    const root = container || document.body;
    
    // Translate elements with data-i18n attribute
    this.translateElementsByAttribute(root.querySelectorAll('[data-i18n]'), 'data-i18n', 'textContent');
    
    // Translate elements with data-i18n-placeholder attribute
    this.translateElementsByAttribute(root.querySelectorAll('[data-i18n-placeholder]'), 'data-i18n-placeholder', 'placeholder');
    
    // Translate elements with data-i18n-title attribute
    this.translateElementsByAttribute(root.querySelectorAll('[data-i18n-title]'), 'data-i18n-title', 'title');
    
    // Translate elements with data-i18n-html attribute
    this.translateElementsByAttribute(root.querySelectorAll('[data-i18n-html]'), 'data-i18n-html', 'innerHTML');
    
    // Handle elements with data-i18n-params attribute
    root.querySelectorAll('[data-i18n-params]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (!key) return;
      
      try {
        const paramsAttr = element.getAttribute('data-i18n-params');
        if (!paramsAttr) return;
        
        const params = JSON.parse(paramsAttr);
        element.textContent = this.translate(key, params);
      } catch (error) {
        console.error(`Error parsing data-i18n-params for key ${key}:`, error);
      }
    });
  }
  
  /**
   * Translate elements by attribute
   * @private
   */
  private translateElementsByAttribute(
    elements: NodeListOf<Element>, 
    attribute: string, 
    property: string
  ): void {
    elements.forEach(element => {
      const key = element.getAttribute(attribute);
      if (!key) return;
      
      // @ts-ignore - Property may not exist on all elements
      element[property] = this.translate(key);
    });
  }

  /**
   * Translate a specific container
   * @param container The container element to translate
   */
  public translateContainer(container: HTMLElement): void {
    this.translateDOM(container);
  }
  
  /**
   * Set up a MutationObserver to automatically translate new elements
   * @param rootElement The root element to observe (defaults to document.body)
   * @returns A function to stop observing
   */
  public observeDOM(rootElement?: HTMLElement): () => void {
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') {
      return () => {}; // Skip in non-browser environments
    }
    
    const root = rootElement || document.body;
    
    // Disconnect any existing observer
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.observer = new MutationObserver((mutations) => {
      let shouldTranslate = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if the node or any of its children have data-i18n attributes
              const element = node as HTMLElement;
              if (
                element.hasAttribute && (
                  element.hasAttribute('data-i18n') ||
                  element.hasAttribute('data-i18n-placeholder') ||
                  element.hasAttribute('data-i18n-title') ||
                  element.hasAttribute('data-i18n-html') ||
                  element.hasAttribute('data-i18n-params') ||
                  element.querySelector('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-html], [data-i18n-params]')
                )
              ) {
                shouldTranslate = true;
              }
            }
          });
        }
      });
      
      if (shouldTranslate) {
        this.translateDOM(root);
      }
    });
    
    this.observer.observe(root, {
      childList: true,
      subtree: true
    });
    
    return () => {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    };
  }
  
  /**
   * Stop observing DOM changes
   */
  public stopObservingDOM(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
  
  /**
   * Apply RTL direction to the document
   * @param documentElement The document element (defaults to document.documentElement)
   * @param bodyElement The body element (defaults to document.body)
   */
  public applyRTLToDocument(
    documentElement?: HTMLElement,
    bodyElement?: HTMLElement
  ): void {
    if (typeof document === 'undefined') return; // Skip in non-browser environments
    
    const docElement = documentElement || document.documentElement as HTMLElement;
    const body = bodyElement || document.body;
    
    const isRTL = this.isRTL();
    
    // Set the dir attribute on the html element
    docElement.dir = isRTL ? 'rtl' : 'ltr';
    
    // Add or remove RTL class to the body
    if (isRTL) {
      body.classList.add('rtl');
      
      // Add RTL stylesheet if it's not already added
      if (typeof document !== 'undefined' && !document.getElementById('rtl-stylesheet')) {
        const rtlStylesheet = document.createElement('link');
        rtlStylesheet.id = 'rtl-stylesheet';
        rtlStylesheet.rel = 'stylesheet';
        rtlStylesheet.href = '/css/rtl.css';
        document.head.appendChild(rtlStylesheet);
      }
    } else {
      body.classList.remove('rtl');
      
      // Remove RTL stylesheet if it exists
      if (typeof document !== 'undefined') {
        const rtlStylesheet = document.getElementById('rtl-stylesheet');
        if (rtlStylesheet) {
          rtlStylesheet.remove();
        }
      }
    }
  }
}

/**
 * Escape special characters in a string for use in a regular expression
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Create a singleton instance
const localizer = new Localizer();

/**
 * Translate function (shorthand for localizer.translate)
 */
export function _t(key: string, options: TranslationOptions = {}): string {
  return localizer.translate(key, options);
}

// Export the singleton and the class
export { localizer, Localizer };

// Default export for convenience
export default localizer;