# @profullstack/localizer

A simple localization and internationalization library with RTL support.

## Features

- Simple API for translating text
- Support for multiple languages with fallback
- Interpolation of variables in translations
- Support for pluralization
- Right-to-Left (RTL) language support
- DOM translation utilities for automatic UI updates
- MutationObserver integration for dynamic content
- Works in both browser and Node.js environments

## Installation

```bash
npm install @profullstack/localizer
# or
yarn add @profullstack/localizer
# or
pnpm add @profullstack/localizer
```

## Usage

### Basic Usage

```javascript
import { localizer, _t } from '@profullstack/localizer';

// Load translations
localizer.loadTranslations('en', {
  'hello': 'Hello',
  'welcome': 'Welcome, ${name}!'
});

localizer.loadTranslations('fr', {
  'hello': 'Bonjour',
  'welcome': 'Bienvenue, ${name}!'
});

localizer.loadTranslations('ar', {
  'hello': 'مرحبا',
  'welcome': 'مرحبًا، ${name}!'
});

// Set the current language
localizer.setLanguage('fr');

// Translate a key
console.log(_t('hello')); // Output: Bonjour

// Translate with interpolation
console.log(_t('welcome', { name: 'John' })); // Output: Bienvenue, John!
```

### DOM Translation

The library provides utilities for automatically translating DOM elements:

```javascript
// Add data-i18n attributes to your HTML
// <h1 data-i18n="welcome">Welcome</h1>
// <input placeholder="Enter your name" data-i18n-placeholder="enter_name">

// Translate all elements with i18n attributes in the document
localizer.translateDOM();

// Translate elements within a specific container
const container = document.querySelector('.my-container');
localizer.translateContainer(container);

// Set up automatic translation of dynamically added elements
localizer.observeDOM();
```

### RTL Support

The library automatically detects Right-to-Left (RTL) languages and provides methods to check if a language is RTL:

```javascript
// Check if the current language is RTL
const isRTL = localizer.isRTL();

// Check if a specific language is RTL
const isArabicRTL = localizer.isLanguageRTL('ar'); // true
const isEnglishRTL = localizer.isLanguageRTL('en'); // false

// Apply RTL direction to the document
localizer.applyRTLToDocument();

// The library dispatches an event when the language changes
window.addEventListener('language-changed', (event) => {
  const { language, previousLanguage, isRTL } = event.detail;
  
  // RTL direction is automatically applied when using applyRTLToDocument()
  // but you can also handle it manually:
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  
  if (isRTL) {
    document.body.classList.add('rtl');
  } else {
    document.body.classList.remove('rtl');
  }
});
```

### Loading Translations from JSON Files

```javascript
// In a browser environment
async function loadTranslations() {
  await localizer.loadTranslationsFromUrl('en', '/i18n/en.json');
  await localizer.loadTranslationsFromUrl('fr', '/i18n/fr.json');
  await localizer.loadTranslationsFromUrl('ar', '/i18n/ar.json');
  
  // Set initial language based on browser preference
  const browserLang = navigator.language.split('-')[0];
  if (localizer.getAvailableLanguages().includes(browserLang)) {
    localizer.setLanguage(browserLang);
  } else {
    localizer.setLanguage('en'); // fallback
  }
}
```

## API Reference

### Localizer Class

#### Constructor

```javascript
const localizer = new Localizer(options);
```

Options:
- `defaultLanguage`: The default language to use (default: 'en')
- `fallbackLanguage`: The fallback language to use when a translation is not found (default: 'en')
- `translations`: Initial translations object (default: {})
- `interpolationStart`: The start delimiter for interpolation (default: '${')
- `interpolationEnd`: The end delimiter for interpolation (default: '}')
- `rtlLanguages`: Array of RTL language codes (default: ['ar', 'he', 'fa', 'ur'])

#### Methods

##### Core Methods
- `loadTranslations(language, translations)`: Load translations for a language
- `setLanguage(language)`: Set the current language
- `getLanguage()`: Get the current language
- `getAvailableLanguages()`: Get an array of available language codes
- `translate(key, options)`: Translate a key with optional interpolation and pluralization
- `loadTranslationsFromUrl(language, url)`: Load translations from a JSON file (browser only)
- `isRTL()`: Check if the current language is RTL
- `isLanguageRTL(language)`: Check if a specific language is RTL

##### DOM Methods (Browser Only)
- `translateDOM(container?)`: Translate all elements with i18n attributes in the document or container
- `translateContainer(container)`: Translate all elements with i18n attributes in a specific container
- `observeDOM(rootElement?)`: Set up a MutationObserver to automatically translate new elements
- `stopObservingDOM()`: Stop observing DOM changes
- `applyRTLToDocument()`: Apply RTL direction to the document based on the current language

### Translation Function

```javascript
_t(key, options);
```

Parameters:
- `key`: The translation key
- `options`: Options for translation (interpolation values, count for pluralization, etc.)

## DOM Translation Attributes

The library supports the following data attributes for DOM translation:

- `data-i18n`: Translates the element's text content
- `data-i18n-placeholder`: Translates the element's placeholder attribute
- `data-i18n-title`: Translates the element's title attribute
- `data-i18n-html`: Translates the element's innerHTML (use with caution)
- `data-i18n-params`: JSON string of parameters for interpolation (used with data-i18n)

Example:
```html
<h1 data-i18n="welcome">Welcome</h1>
<input placeholder="Enter your name" data-i18n-placeholder="enter_name">
<button title="Click me" data-i18n="button.click" data-i18n-title="button.tooltip">Click me</button>
<p data-i18n="greeting" data-i18n-params='{"name":"John"}'>Hello, John!</p>
```

## License

MIT