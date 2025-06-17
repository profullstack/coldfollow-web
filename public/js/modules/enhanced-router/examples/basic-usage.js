/**
 * Basic usage examples for @profullstack/enhanced-router
 * 
 * This example demonstrates how to use the enhanced router with layouts,
 * transitions, and i18n integration.
 */

import { createRouter } from '../src/index.js';

// Create a simple localizer for demonstration
const localizer = {
  translations: {
    en: {
      'home.title': 'Home',
      'home.welcome': 'Welcome to the Enhanced Router Demo',
      'home.description': 'This is a demonstration of the enhanced router with layouts, transitions, and i18n integration.',
      'about.title': 'About',
      'about.content': 'This is the about page.',
      'contact.title': 'Contact',
      'contact.content': 'This is the contact page.',
      'errors.page_not_found': 'Page Not Found',
      'errors.page_not_found_message': 'The page "{path}" could not be found.',
      'errors.go_back_home': 'Go back to home',
      'nav.home': 'Home',
      'nav.about': 'About',
      'nav.contact': 'Contact'
    },
    fr: {
      'home.title': 'Accueil',
      'home.welcome': 'Bienvenue sur la démo du routeur amélioré',
      'home.description': 'Ceci est une démonstration du routeur amélioré avec des mises en page, des transitions et une intégration i18n.',
      'about.title': 'À propos',
      'about.content': 'Ceci est la page à propos.',
      'contact.title': 'Contact',
      'contact.content': 'Ceci est la page de contact.',
      'errors.page_not_found': 'Page non trouvée',
      'errors.page_not_found_message': 'La page "{path}" n\'a pas pu être trouvée.',
      'errors.go_back_home': 'Retour à l\'accueil',
      'nav.home': 'Accueil',
      'nav.about': 'À propos',
      'nav.contact': 'Contact'
    }
  },
  currentLanguage: 'en',
  
  translate(key, params = {}) {
    const translation = this.translations[this.currentLanguage][key] || key;
    
    // Replace parameters
    return translation.replace(/{(\w+)}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  },
  
  translateContainer(container) {
    // Translate elements with data-i18n attribute
    container.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      
      // Check for parameters
      const paramsAttr = element.getAttribute('data-i18n-params');
      let params = {};
      
      if (paramsAttr) {
        try {
          params = JSON.parse(paramsAttr);
        } catch (error) {
          console.error('Error parsing data-i18n-params:', error);
        }
      }
      
      element.textContent = this.translate(key, params);
    });
  },
  
  getLanguage() {
    return this.currentLanguage;
  },
  
  setLanguage(language) {
    if (this.translations[language]) {
      this.currentLanguage = language;
      return true;
    }
    return false;
  },
  
  getLanguages() {
    return Object.keys(this.translations);
  },
  
  applyRTLToDocument() {
    // No RTL support in this simple example
    document.documentElement.dir = 'ltr';
    document.body.classList.remove('rtl');
  }
};

// Create a custom layout
const customLayout = content => {
  // Create a document fragment with a custom layout
  const fragment = document.createDocumentFragment();
  
  // Create header
  const header = document.createElement('header');
  header.className = 'site-header';
  
  // Create navigation
  const nav = document.createElement('nav');
  nav.className = 'site-nav';
  
  // Create navigation links
  const homeLink = document.createElement('a');
  homeLink.href = '/';
  homeLink.textContent = 'Home';
  homeLink.setAttribute('data-i18n', 'nav.home');
  nav.appendChild(homeLink);
  
  const aboutLink = document.createElement('a');
  aboutLink.href = '/about';
  aboutLink.textContent = 'About';
  aboutLink.setAttribute('data-i18n', 'nav.about');
  nav.appendChild(aboutLink);
  
  const contactLink = document.createElement('a');
  contactLink.href = '/contact';
  contactLink.textContent = 'Contact';
  contactLink.setAttribute('data-i18n', 'nav.contact');
  nav.appendChild(contactLink);
  
  // Add language switcher
  const langSwitcher = document.createElement('select');
  langSwitcher.id = 'language-switcher';
  
  // Add options for each language
  localizer.getLanguages().forEach(lang => {
    const option = document.createElement('option');
    option.value = lang;
    option.textContent = lang.toUpperCase();
    option.selected = localizer.getLanguage() === lang;
    langSwitcher.appendChild(option);
  });
  
  // Add change event listener
  langSwitcher.addEventListener('change', (event) => {
    localizer.setLanguage(event.target.value);
    document.dispatchEvent(new CustomEvent('language-changed'));
  });
  
  nav.appendChild(langSwitcher);
  
  header.appendChild(nav);
  fragment.appendChild(header);
  
  // Create content container
  const contentDiv = document.createElement('main');
  contentDiv.className = 'content';
  
  // If content is a string, use createContextualFragment to parse it
  if (typeof content === 'string') {
    const range = document.createRange();
    const parsedContent = range.createContextualFragment(content);
    contentDiv.appendChild(parsedContent);
  } else if (content instanceof DocumentFragment) {
    // If it's already a fragment, append it directly
    contentDiv.appendChild(content);
  } else if (content instanceof Node) {
    // If it's a DOM node, append it directly
    contentDiv.appendChild(content);
  }
  
  fragment.appendChild(contentDiv);
  
  // Create footer
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.textContent = '© 2025 Enhanced Router Demo';
  fragment.appendChild(footer);
  
  return fragment;
};

// Create the router with custom options
const router = createRouter({
  rootElement: '#app',
  transition: {
    type: 'fade',
    duration: 300
  },
  layouts: {
    custom: customLayout
  },
  i18n: {
    localizer,
    defaultLanguage: 'en',
    languages: ['en', 'fr']
  }
});

// Define routes
const routes = {
  '/': {
    view: () => {
      const content = document.createDocumentFragment();
      
      const heading = document.createElement('h1');
      heading.textContent = 'Home';
      heading.setAttribute('data-i18n', 'home.title');
      content.appendChild(heading);
      
      const welcome = document.createElement('h2');
      welcome.textContent = 'Welcome to the Enhanced Router Demo';
      welcome.setAttribute('data-i18n', 'home.welcome');
      content.appendChild(welcome);
      
      const description = document.createElement('p');
      description.textContent = 'This is a demonstration of the enhanced router with layouts, transitions, and i18n integration.';
      description.setAttribute('data-i18n', 'home.description');
      content.appendChild(description);
      
      return content;
    },
    layout: 'custom'
  },
  '/about': {
    view: () => {
      const content = document.createDocumentFragment();
      
      const heading = document.createElement('h1');
      heading.textContent = 'About';
      heading.setAttribute('data-i18n', 'about.title');
      content.appendChild(heading);
      
      const paragraph = document.createElement('p');
      paragraph.textContent = 'This is the about page.';
      paragraph.setAttribute('data-i18n', 'about.content');
      content.appendChild(paragraph);
      
      return content;
    },
    layout: 'custom'
  },
  '/contact': {
    view: () => {
      const content = document.createDocumentFragment();
      
      const heading = document.createElement('h1');
      heading.textContent = 'Contact';
      heading.setAttribute('data-i18n', 'contact.title');
      content.appendChild(heading);
      
      const paragraph = document.createElement('p');
      paragraph.textContent = 'This is the contact page.';
      paragraph.setAttribute('data-i18n', 'contact.content');
      content.appendChild(paragraph);
      
      return content;
    },
    layout: 'custom'
  }
};

// Register routes
router.registerRoutes(routes);

// Add middleware for logging
router.use((to, from, next) => {
  console.log(`Navigating from ${from || 'initial'} to ${to.path}`);
  next();
});

// Initialize the router
router.init();

// Listen for language changes
document.addEventListener('language-changed', () => {
  // Refresh the current page to apply translations
  const currentPath = window.location.pathname;
  router.navigate(currentPath, { replace: true });
});

// Export the router for use in the browser
window.router = router;

console.log('Enhanced Router initialized!');