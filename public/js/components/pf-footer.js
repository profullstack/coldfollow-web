/**
 * Footer component for the application
 */
class PfFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.initEventListeners();
  }
  
  initEventListeners() {
    // Listen for language changes
    window.addEventListener('language-changed', () => {
      console.log('pf-footer: Language changed event received');
      this.translateElements();
    });
    
    // Listen for i18n ready event
    window.addEventListener('i18n-ready', () => {
      console.log('pf-footer: i18n ready event received');
      this.translateElements();
    });
    
    // Listen for pre-navigation event to translate before transition starts
    document.addEventListener('pre-navigation', () => {
      console.log('pf-footer: Pre-navigation event received');
      this.translateElements();
    });
    
    // Listen for router transitions
    document.addEventListener('spa-transition-end', () => {
      console.log('pf-footer: SPA transition end event received');
      this.translateElements();
    });
  }

  render() {
    const year = new Date().getFullYear();
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--font-primary, 'SpaceMono', monospace);
          margin-top: 60px;
        }
        
        .footer {
          padding: 30px 0;
          border-top: 1px solid var(--border-color);
        }
        
        .footer-content {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 30px;
        }
        
        .footer-section {
          flex: 1;
          min-width: 200px;
        }
        
        .footer-section h3 {
          color: var(--primary-color);
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
        }
        
        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .footer-links li {
          margin-bottom: 10px;
        }
        
        .footer-links a {
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .footer-links a:hover {
          color: var(--primary-color);
        }
        
        .copyright {
          margin-top: 30px;
          text-align: center;
          color: var(--text-tertiary);
          font-size: 14px;
        }
        
        @media (max-width: 768px) {
          .footer-content {
            flex-direction: column;
          }
        }
      </style>
      
      <div class="footer">
        <div class="footer-content">
          <div class="footer-section">
            <h3 data-i18n="app_name">convert2doc</h3>
            <ul class="footer-links">
              <li><a href="/" data-i18n="footer.home">Home</a></li>
              <li><a href="/api-keys" data-i18n="footer.api_docs">API Documentation</a></li>
              <li><a href="/subscription" data-i18n="footer.pricing">Pricing</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h3 data-i18n="footer.resources">Resources</h3>
            <ul class="footer-links">
              <li><a href="/api-keys" data-i18n="footer.api_keys">API Keys</a></li>
              <li><a href="https://github.com/profullstack/coldfollow-web" target="_blank" data-i18n="footer.github">GitHub</a></li>
              <li><a href="mailto:support@convert2doc.com" data-i18n="footer.support">Support</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h3 data-i18n="footer.legal">Legal</h3>
            <ul class="footer-links">
              <li><a href="/terms" data-i18n="footer.terms">Terms of Service</a></li>
              <li><a href="/privacy" data-i18n="footer.privacy">Privacy Policy</a></li>
              <li><a href="/refund" data-i18n="footer.refund">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div class="copyright">
          &copy; ${year} <span data-i18n="footer.company_name">Profullstack, Inc.</span> <span data-i18n="footer.all_rights_reserved">All rights reserved.</span>
        </div>
      </div>
    `;
    
    // Translate elements after rendering
    this.translateElements();
  }
  
  /**
   * Translate elements with data-i18n attributes in the shadow DOM
   */
  translateElements() {
    console.log('pf-footer: Translating elements in shadow DOM');
    
    // Check if there are any elements to translate
    const elementsToTranslate = this.shadowRoot.querySelectorAll('[data-i18n]');
    if (elementsToTranslate.length === 0) {
      console.log('pf-footer: No elements with data-i18n attribute found');
      return;
    }
    
    // Check if window.app._t is available (faster than importing)
    if (window.app && window.app._t) {
      console.log('pf-footer: Using window.app._t for translation');
      elementsToTranslate.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translated = window.app._t(key);
        element.textContent = translated;
        console.log(`pf-footer: Translated "${key}" to "${translated}"`);
      });
      return;
    }
    
    // Fallback to importing the translation function
    console.log('pf-footer: Importing i18n module for translation');
    import('../i18n.js').then(({ _t }) => {
      elementsToTranslate.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translated = _t(key);
        element.textContent = translated;
        console.log(`pf-footer: Translated "${key}" to "${translated}"`);
      });
    }).catch(error => {
      console.error('Error importing i18n module:', error);
    });
  }
}

// Define the custom element
customElements.define('pf-footer', PfFooter);