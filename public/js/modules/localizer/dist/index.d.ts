/**
 * @profullstack/localizer
 * A simple localization and internationalization library
 */
interface LocalizerOptions {
    defaultLanguage?: string;
    fallbackLanguage?: string;
    translations?: Record<string, Record<string, string>>;
    interpolationStart?: string;
    interpolationEnd?: string;
    rtlLanguages?: string[];
}
interface TranslationOptions {
    [key: string]: any;
    count?: number;
    language?: string;
}
declare class Localizer {
    private options;
    private currentLanguage;
    private observer;
    constructor(options?: LocalizerOptions);
    /**
     * Load translations from a JSON object
     * @param language The language code
     * @param translations The translations object
     */
    loadTranslations(language: string, translations: Record<string, string>): void;
    /**
     * Set the current language
     * @param language The language code to set
     */
    setLanguage(language: string): void;
    /**
     * Check if the current language is RTL (Right-to-Left)
     * @returns True if the current language is RTL
     */
    isRTL(): boolean;
    /**
     * Check if a specific language is RTL (Right-to-Left)
     * @param language The language code to check
     * @returns True if the language is RTL
     */
    isLanguageRTL(language: string): boolean;
    /**
     * Get the current language
     * @returns The current language code
     */
    getLanguage(): string;
    /**
     * Get available languages
     * @returns Array of available language codes
     */
    getAvailableLanguages(): string[];
    /**
     * Translate a key
     * @param key The translation key
     * @param options Options for translation (interpolation values, count for pluralization, etc.)
     * @returns The translated string
     */
    translate(key: string, options?: TranslationOptions): string;
    /**
     * Replace interpolation placeholders with values
     * @param text The text with placeholders
     * @param values The values to interpolate
     * @returns The interpolated string
     */
    private interpolate;
    /**
     * Load translations from a JSON file (browser environment)
     * @param language The language code
     * @param url The URL to the JSON file
     * @returns Promise that resolves when translations are loaded
     */
    loadTranslationsFromUrl(language: string, url: string): Promise<void>;
    /**
     * Flatten a nested object into a flat object with dot notation keys
     * @param obj The object to flatten
     * @param prefix The prefix to use for keys
     * @returns The flattened object
     */
    private flattenObject;
    /**
     * Translate all elements with i18n attributes in the document or container
     * @param container Optional container element (defaults to document.body)
     */
    translateDOM(container?: HTMLElement): void;
    /**
     * Translate elements by attribute
     * @private
     */
    private translateElementsByAttribute;
    /**
     * Translate a specific container
     * @param container The container element to translate
     */
    translateContainer(container: HTMLElement): void;
    /**
     * Set up a MutationObserver to automatically translate new elements
     * @param rootElement The root element to observe (defaults to document.body)
     * @returns A function to stop observing
     */
    observeDOM(rootElement?: HTMLElement): () => void;
    /**
     * Stop observing DOM changes
     */
    stopObservingDOM(): void;
    /**
     * Apply RTL direction to the document
     * @param documentElement The document element (defaults to document.documentElement)
     * @param bodyElement The body element (defaults to document.body)
     */
    applyRTLToDocument(documentElement?: HTMLElement, bodyElement?: HTMLElement): void;
}
declare const localizer: Localizer;
/**
 * Translate function (shorthand for localizer.translate)
 */
declare function _t(key: string, options?: TranslationOptions): string;

export { Localizer, type LocalizerOptions, type TranslationOptions, _t, localizer as default, localizer };
