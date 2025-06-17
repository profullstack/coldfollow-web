/**
 * @profullstack/localizer Node.js Example
 * 
 * This example demonstrates how to use the @profullstack/localizer package in a Node.js environment.
 */

// Import the localizer
const { localizer, _t } = require('@profullstack/localizer');

// Flatten a nested object into a flat object with dot notation keys
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

// Define translations
const translations = {
  en: {
    greeting: 'Hello',
    farewell: 'Goodbye',
    welcome: 'Welcome, ${name}!',
    items_one: 'You have ${count} item in your cart.',
    items_other: 'You have ${count} items in your cart.',
    nested: {
      key1: 'Nested key 1',
      key2: 'Nested key 2',
      deeper: {
        key3: 'Deeply nested key'
      }
    }
  },
  fr: {
    greeting: 'Bonjour',
    farewell: 'Au revoir',
    welcome: 'Bienvenue, ${name}!',
    items_one: 'Vous avez ${count} article dans votre panier.',
    items_other: 'Vous avez ${count} articles dans votre panier.',
    nested: {
      key1: 'Clé imbriquée 1',
      key2: 'Clé imbriquée 2',
      deeper: {
        key3: 'Clé profondément imbriquée'
      }
    }
  },
  de: {
    greeting: 'Hallo',
    farewell: 'Auf Wiedersehen',
    welcome: 'Willkommen, ${name}!',
    items_one: 'Sie haben ${count} Artikel in Ihrem Warenkorb.',
    items_other: 'Sie haben ${count} Artikel in Ihrem Warenkorb.',
    nested: {
      key1: 'Verschachtelte Taste 1',
      key2: 'Verschachtelte Taste 2',
      deeper: {
        key3: 'Tief verschachtelte Taste'
      }
    }
  }
};

// Load translations (flattening nested objects)
Object.keys(translations).forEach(lang => {
  const flattenedTranslations = flattenObject(translations[lang]);
  localizer.loadTranslations(lang, flattenedTranslations);
  console.log(`Loaded translations for ${lang}`);
});

// Function to demonstrate translations
function demonstrateTranslations(language) {
  console.log(`\n--- ${language.toUpperCase()} ---`);
  
  // Set the language
  localizer.setLanguage(language);
  
  // Basic translations
  console.log(`Greeting: ${_t('greeting')}`);
  console.log(`Farewell: ${_t('farewell')}`);
  
  // Interpolation
  console.log(`Welcome: ${_t('welcome', { name: 'John' })}`);
  
  // Pluralization
  console.log(`Items (1): ${_t('items', { count: 1 })}`);
  console.log(`Items (5): ${_t('items', { count: 5 })}`);
  
  // Nested keys
  console.log(`Nested key 1: ${_t('nested.key1')}`);
  console.log(`Nested key 2: ${_t('nested.key2')}`);
  console.log(`Deeply nested key: ${_t('nested.deeper.key3')}`);
  
  // Missing key (falls back to the key itself)
  console.log(`Missing key: ${_t('missing.key')}`);
}

// Demonstrate translations for each language
['en', 'fr', 'de'].forEach(demonstrateTranslations);

// Show available languages
console.log(`\nAvailable languages: ${localizer.getAvailableLanguages().join(', ')}`);

// Example of changing language programmatically
console.log('\nChanging language to French...');
localizer.setLanguage('fr');
console.log(`Current language: ${localizer.getLanguage()}`);
console.log(`Greeting in French: ${_t('greeting')}`);

// Example of overriding the current language
console.log('\nOverriding language for a specific translation:');
console.log(`Greeting in German (while French is active): ${_t('greeting', { language: 'de' })}`);