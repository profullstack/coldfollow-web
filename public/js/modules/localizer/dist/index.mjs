
/**
 * @profullstack/localizer
 * A simple localization and internationalization library with RTL support
 */


// src/index.ts
var DEFAULT_OPTIONS = {
  defaultLanguage: "en",
  fallbackLanguage: "en",
  translations: {},
  interpolationStart: "${",
  interpolationEnd: "}",
  rtlLanguages: ["ar", "he", "fa", "ur"]
};
var Localizer = class {
  constructor(options = {}) {
    this.observer = null;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.currentLanguage = this.options.defaultLanguage;
  }
  /**
   * Load translations from a JSON object
   * @param language The language code
   * @param translations The translations object
   */
  loadTranslations(language, translations) {
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
  setLanguage(language) {
    const previousLanguage = this.currentLanguage;
    if (this.options.translations[language] || language === this.options.fallbackLanguage) {
      this.currentLanguage = language;
    } else {
      console.warn(`Language '${language}' not loaded, using fallback language '${this.options.fallbackLanguage}'`);
      this.currentLanguage = this.options.fallbackLanguage;
    }
    if (typeof window !== "undefined" && previousLanguage !== this.currentLanguage) {
      const isRTL = this.isRTL();
      window.dispatchEvent(new CustomEvent("language-changed", {
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
  isRTL() {
    return this.options.rtlLanguages?.includes(this.currentLanguage) || false;
  }
  /**
   * Check if a specific language is RTL (Right-to-Left)
   * @param language The language code to check
   * @returns True if the language is RTL
   */
  isLanguageRTL(language) {
    return this.options.rtlLanguages?.includes(language) || false;
  }
  /**
   * Get the current language
   * @returns The current language code
   */
  getLanguage() {
    return this.currentLanguage;
  }
  /**
   * Get available languages
   * @returns Array of available language codes
   */
  getAvailableLanguages() {
    return Object.keys(this.options.translations);
  }
  /**
   * Translate a key
   * @param key The translation key
   * @param options Options for translation (interpolation values, count for pluralization, etc.)
   * @returns The translated string
   */
  translate(key, options = {}) {
    const language = options.language || this.currentLanguage;
    const translations = this.options.translations[language] || {};
    let translation = translations[key];
    if (!translation && language !== this.options.fallbackLanguage) {
      const fallbackTranslations = this.options.translations[this.options.fallbackLanguage] || {};
      translation = fallbackTranslations[key];
    }
    if (!translation) {
      console.warn(`Translation key '${key}' not found in '${language}' or fallback language`);
      return key;
    }
    if (options.count !== void 0) {
      const pluralKey = `${key}_${options.count === 1 ? "one" : "other"}`;
      const pluralTranslation = translations[pluralKey] || (language !== this.options.fallbackLanguage ? this.options.translations[this.options.fallbackLanguage]?.[pluralKey] : void 0);
      if (pluralTranslation) {
        translation = pluralTranslation;
      }
    }
    return this.interpolate(translation, options);
  }
  /**
   * Replace interpolation placeholders with values
   * @param text The text with placeholders
   * @param values The values to interpolate
   * @returns The interpolated string
   */
  interpolate(text, values) {
    const { interpolationStart, interpolationEnd } = this.options;
    return text.replace(
      new RegExp(`${escapeRegExp(interpolationStart)}(\\w+)${escapeRegExp(interpolationEnd)}`, "g"),
      (match, key) => {
        return values[key] !== void 0 ? String(values[key]) : match;
      }
    );
  }
  /**
   * Load translations from a JSON file (browser environment)
   * @param language The language code
   * @param url The URL to the JSON file
   * @returns Promise that resolves when translations are loaded
   */
  async loadTranslationsFromUrl(language, url) {
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
  flattenObject(obj, prefix = "") {
    return Object.keys(obj).reduce((acc, key) => {
      const prefixedKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
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
  translateDOM(container) {
    if (typeof document === "undefined") return;
    const root = container || document.body;
    this.translateElementsByAttribute(root.querySelectorAll("[data-i18n]"), "data-i18n", "textContent");
    this.translateElementsByAttribute(root.querySelectorAll("[data-i18n-placeholder]"), "data-i18n-placeholder", "placeholder");
    this.translateElementsByAttribute(root.querySelectorAll("[data-i18n-title]"), "data-i18n-title", "title");
    this.translateElementsByAttribute(root.querySelectorAll("[data-i18n-html]"), "data-i18n-html", "innerHTML");
    root.querySelectorAll("[data-i18n-params]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      if (!key) return;
      try {
        const paramsAttr = element.getAttribute("data-i18n-params");
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
  translateElementsByAttribute(elements, attribute, property) {
    elements.forEach((element) => {
      const key = element.getAttribute(attribute);
      if (!key) return;
      element[property] = this.translate(key);
    });
  }
  /**
   * Translate a specific container
   * @param container The container element to translate
   */
  translateContainer(container) {
    this.translateDOM(container);
  }
  /**
   * Set up a MutationObserver to automatically translate new elements
   * @param rootElement The root element to observe (defaults to document.body)
   * @returns A function to stop observing
   */
  observeDOM(rootElement) {
    if (typeof MutationObserver === "undefined" || typeof document === "undefined") {
      return () => {
      };
    }
    const root = rootElement || document.body;
    if (this.observer) {
      this.observer.disconnect();
    }
    this.observer = new MutationObserver((mutations) => {
      let shouldTranslate = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node;
              if (element.hasAttribute && (element.hasAttribute("data-i18n") || element.hasAttribute("data-i18n-placeholder") || element.hasAttribute("data-i18n-title") || element.hasAttribute("data-i18n-html") || element.hasAttribute("data-i18n-params") || element.querySelector("[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-html], [data-i18n-params]"))) {
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
  stopObservingDOM() {
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
  applyRTLToDocument(documentElement, bodyElement) {
    if (typeof document === "undefined") return;
    const docElement = documentElement || document.documentElement;
    const body = bodyElement || document.body;
    const isRTL = this.isRTL();
    docElement.dir = isRTL ? "rtl" : "ltr";
    if (isRTL) {
      body.classList.add("rtl");
      if (typeof document !== "undefined" && !document.getElementById("rtl-stylesheet")) {
        const rtlStylesheet = document.createElement("link");
        rtlStylesheet.id = "rtl-stylesheet";
        rtlStylesheet.rel = "stylesheet";
        rtlStylesheet.href = "/css/rtl.css";
        document.head.appendChild(rtlStylesheet);
      }
    } else {
      body.classList.remove("rtl");
      if (typeof document !== "undefined") {
        const rtlStylesheet = document.getElementById("rtl-stylesheet");
        if (rtlStylesheet) {
          rtlStylesheet.remove();
        }
      }
    }
  }
};
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
var localizer = new Localizer();
function _t(key, options = {}) {
  return localizer.translate(key, options);
}
var index_default = localizer;
export {
  Localizer,
  _t,
  index_default as default,
  localizer
};
//# sourceMappingURL=index.mjs.map