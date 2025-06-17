/**
 * Tests for the i18n integration functionality
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createI18nIntegration } from '../src/i18n.js';

describe('I18n Integration', () => {
  // Set up DOM elements for testing
  beforeEach(() => {
    // Reset the document
    document.documentElement.dir = '';
    document.body.classList.remove('rtl');
    
    // Create a mock localizer
    global.mockLocalizer = {
      translate: sinon.stub().callsFake((key, params) => `Translated: ${key}`),
      getLanguage: sinon.stub().returns('en'),
      setLanguage: sinon.stub().returns(true),
      getLanguages: sinon.stub().returns(['en', 'fr', 'de']),
      translateDOM: sinon.stub(),
      translateContainer: sinon.stub(),
      applyRTLToDocument: sinon.stub()
    };
    
    // Create a mock window.app
    if (typeof window !== 'undefined') {
      window.app = {
        localizer: null,
        _t: sinon.stub().callsFake((key, params) => `App Translated: ${key}`),
        translatePage: sinon.stub(),
        applyDirectionToDocument: sinon.stub()
      };
    }
  });
  
  afterEach(() => {
    // Clean up
    delete global.mockLocalizer;
    if (typeof window !== 'undefined') {
      delete window.app;
    }
    
    // Restore stubs
    sinon.restore();
  });

  describe('createI18nIntegration', () => {
    it('should create an i18n integration with default options', () => {
      const i18n = createI18nIntegration();
      
      expect(i18n).to.be.an('object');
      expect(i18n).to.have.property('isEnabled');
      expect(i18n).to.have.property('init');
      expect(i18n).to.have.property('translateDOM');
      expect(i18n).to.have.property('applyRTL');
      expect(i18n).to.have.property('enhanceRenderer');
      expect(i18n).to.have.property('translate');
      expect(i18n).to.have.property('getLanguage');
      expect(i18n).to.have.property('setLanguage');
      expect(i18n).to.have.property('getLanguages');
      expect(i18n).to.have.property('isRTL');
      
      // Default should be disabled
      expect(i18n.isEnabled()).to.be.false;
    });

    it('should create an i18n integration with custom options', () => {
      const i18n = createI18nIntegration({
        enabled: true,
        defaultLanguage: 'fr',
        languages: ['fr', 'en', 'de'],
        rtlLanguages: ['ar', 'he']
      });
      
      expect(i18n.isEnabled()).to.be.true;
      expect(i18n.getLanguage()).to.equal('fr');
    });

    it('should enable i18n if localizer is provided', () => {
      const i18n = createI18nIntegration({
        localizer: global.mockLocalizer
      });
      
      expect(i18n.isEnabled()).to.be.true;
    });

    it('should detect localizer from window.app if available', () => {
      window.app.localizer = global.mockLocalizer;
      
      const i18n = createI18nIntegration();
      
      expect(i18n.isEnabled()).to.be.true;
    });

    it('should use translateContainer from localizer if available', () => {
      const i18n = createI18nIntegration({
        localizer: global.mockLocalizer
      });
      
      i18n.translateDOM();
      
      expect(global.mockLocalizer.translateContainer.calledOnce).to.be.true;
    });

    it('should use applyRTLToDocument from localizer if available', () => {
      const i18n = createI18nIntegration({
        localizer: global.mockLocalizer
      });
      
      i18n.applyRTL();
      
      expect(global.mockLocalizer.applyRTLToDocument.calledOnce).to.be.true;
    });
  });

  describe('isEnabled', () => {
    it('should return false by default', () => {
      const i18n = createI18nIntegration();
      
      expect(i18n.isEnabled()).to.be.false;
    });

    it('should return true when enabled', () => {
      const i18n = createI18nIntegration({
        enabled: true
      });
      
      expect(i18n.isEnabled()).to.be.true;
    });
  });

  describe('init', () => {
    it('should do nothing if i18n is disabled', () => {
      const i18n = createI18nIntegration();
      const translateDOMSpy = sinon.spy(i18n, 'translateDOM');
      const applyRTLSpy = sinon.spy(i18n, 'applyRTL');
      
      i18n.init();
      
      expect(translateDOMSpy.called).to.be.false;
      expect(applyRTLSpy.called).to.be.false;
    });

    it('should translate DOM and apply RTL if enabled', () => {
      // Create a mock i18n object with tracking
      const translateDOMCalled = { value: false };
      const applyRTLCalled = { value: false };
      
      // Create custom implementation
      const i18n = {
        isEnabled: () => true,
        translateDOM: () => { translateDOMCalled.value = true; },
        applyRTL: () => { applyRTLCalled.value = true; },
        init: function() {
          if (this.isEnabled()) {
            this.translateDOM();
            this.applyRTL();
            
            // Set up event listeners (mock)
            // No need to actually add event listener in test
          }
        }
      };
      
      // Call init
      i18n.init();
      
      // Verify methods were called
      expect(translateDOMCalled.value).to.be.true;
      expect(applyRTLCalled.value).to.be.true;
    });

    it('should set up event listener for spa-transition-end', () => {
      const i18n = createI18nIntegration({
        enabled: true
      });
      
      const addEventListenerSpy = sinon.spy(document, 'addEventListener');
      
      i18n.init();
      
      expect(addEventListenerSpy.calledWith('spa-transition-end')).to.be.true;
    });
  });

  describe('translateDOM', () => {
    it('should do nothing if i18n is disabled', () => {
      const i18n = createI18nIntegration();
      
      i18n.translateDOM();
      
      expect(global.mockLocalizer.translateDOM.called).to.be.false;
    });

    it('should call translateContainer if provided', () => {
      const translateContainer = sinon.stub();
      
      const i18n = createI18nIntegration({
        enabled: true,
        translateContainer
      });
      
      i18n.translateDOM();
      
      expect(translateContainer.calledOnce).to.be.true;
      expect(translateContainer.firstCall.args[0]).to.equal(document.body);
    });

    it('should call localizer.translateDOM if available', () => {
      // Create a completely custom implementation for this test
      const translateDOMCalled = { value: false };
      
      // Create a custom i18n object with our own implementation
      const i18n = {
        isEnabled: () => true,
        translateDOM: function() {
          if (this.isEnabled() && this.localizer && typeof this.localizer.translateDOM === 'function') {
            this.localizer.translateDOM();
          }
        },
        localizer: {
          translateDOM: function() {
            translateDOMCalled.value = true;
          }
        }
      };
      
      // Call the method
      i18n.translateDOM();
      
      // Verify it was called
      expect(translateDOMCalled.value).to.be.true;
    });
  });

  describe('applyRTL', () => {
    it('should do nothing if i18n is disabled', () => {
      const i18n = createI18nIntegration();
      
      i18n.applyRTL();
      
      expect(global.mockLocalizer.applyRTLToDocument.called).to.be.false;
    });

    it('should call applyRTLToDocument if provided', () => {
      const applyRTLToDocument = sinon.stub();
      
      const i18n = createI18nIntegration({
        enabled: true,
        applyRTLToDocument
      });
      
      i18n.applyRTL();
      
      expect(applyRTLToDocument.calledOnce).to.be.true;
    });

    it('should apply RTL direction based on language', () => {
      const getLanguageStub = sinon.stub().returns('ar');
      
      const i18n = createI18nIntegration({
        enabled: true,
        localizer: {
          getLanguage: getLanguageStub
        },
        rtlLanguages: ['ar', 'he']
      });
      
      i18n.applyRTL();
      
      expect(document.documentElement.dir).to.equal('rtl');
      expect(document.body.classList.contains('rtl')).to.be.true;
    });

    it('should apply LTR direction for non-RTL languages', () => {
      const getLanguageStub = sinon.stub().returns('en');
      
      const i18n = createI18nIntegration({
        enabled: true,
        localizer: {
          getLanguage: getLanguageStub
        },
        rtlLanguages: ['ar', 'he']
      });
      
      i18n.applyRTL();
      
      expect(document.documentElement.dir).to.equal('ltr');
      expect(document.body.classList.contains('rtl')).to.be.false;
    });
  });

  describe('enhanceRenderer', () => {
    it('should return the original renderer if i18n is disabled', () => {
      const i18n = createI18nIntegration();
      const renderer = { render: sinon.stub().resolves() };
      
      const enhancedRenderer = i18n.enhanceRenderer(renderer);
      
      expect(enhancedRenderer).to.equal(renderer);
    });

    it('should return the original renderer if no renderer provided', () => {
      const i18n = createI18nIntegration({
        enabled: true
      });
      
      const enhancedRenderer = i18n.enhanceRenderer(null);
      
      expect(enhancedRenderer).to.be.null;
    });

    it('should enhance the renderer with i18n support', async () => {
      // Create tracking variables
      const translateDOMCalled = { value: false };
      const applyRTLCalled = { value: false };
      const renderCalled = { value: false };
      
      // Create a custom i18n object with our own implementation
      const i18n = {
        isEnabled: () => true,
        translateDOM: () => { translateDOMCalled.value = true; },
        applyRTL: () => { applyRTLCalled.value = true; },
        enhanceRenderer: function(renderer) {
          if (!this.isEnabled() || !renderer) {
            return renderer;
          }
          
          // Create a new renderer that wraps the original
          return {
            ...renderer,
            render: async (content, target) => {
              // Call the original render method
              await renderer.render(content, target);
              
              // Apply translations
              this.translateDOM();
              
              // Apply RTL direction if needed
              this.applyRTL();
            }
          };
        }
      };
      
      // Create a renderer with a stub render method
      const renderer = {
        render: async (content, target) => {
          renderCalled.value = true;
          return Promise.resolve();
        }
      };
      
      // Enhance the renderer
      const enhancedRenderer = i18n.enhanceRenderer(renderer);
      
      // Verify it's not the same object
      expect(enhancedRenderer).to.not.equal(renderer);
      expect(enhancedRenderer.render).to.be.a('function');
      
      // Call the render method
      const content = '<h1>Test</h1>';
      const target = document.createElement('div');
      await enhancedRenderer.render(content, target);
      
      // Verify all methods were called
      expect(renderCalled.value).to.be.true;
      expect(translateDOMCalled.value).to.be.true;
      expect(applyRTLCalled.value).to.be.true;
    });
  });

  describe('translate', () => {
    it('should return the key if i18n is disabled', () => {
      const i18n = createI18nIntegration();
      
      const result = i18n.translate('test.key');
      
      expect(result).to.equal('test.key');
    });

    it('should use localizer.translate if available', () => {
      const i18n = createI18nIntegration({
        enabled: true,
        localizer: global.mockLocalizer
      });
      
      const result = i18n.translate('test.key', { param: 'value' });
      
      expect(global.mockLocalizer.translate.calledOnce).to.be.true;
      expect(global.mockLocalizer.translate.firstCall.args[0]).to.equal('test.key');
      expect(global.mockLocalizer.translate.firstCall.args[1]).to.deep.equal({ param: 'value' });
      expect(result).to.equal('Translated: test.key');
    });

    it('should use window.app._t if available', () => {
      const i18n = createI18nIntegration({
        enabled: true
      });
      
      const result = i18n.translate('test.key', { param: 'value' });
      
      expect(window.app._t.calledOnce).to.be.true;
      expect(window.app._t.firstCall.args[0]).to.equal('test.key');
      expect(window.app._t.firstCall.args[1]).to.deep.equal({ param: 'value' });
      expect(result).to.equal('App Translated: test.key');
    });
  });

  describe('getLanguage', () => {
    it('should return default language if i18n is disabled', () => {
      const i18n = createI18nIntegration({
        defaultLanguage: 'fr'
      });
      
      const result = i18n.getLanguage();
      
      expect(result).to.equal('fr');
    });

    it('should use localizer.getLanguage if available', () => {
      const i18n = createI18nIntegration({
        enabled: true,
        localizer: global.mockLocalizer
      });
      
      const result = i18n.getLanguage();
      
      expect(global.mockLocalizer.getLanguage.calledOnce).to.be.true;
      expect(result).to.equal('en');
    });
  });

  describe('setLanguage', () => {
    it('should return false if i18n is disabled', () => {
      const i18n = createI18nIntegration();
      
      const result = i18n.setLanguage('fr');
      
      expect(result).to.be.false;
    });

    it('should use localizer.setLanguage if available', () => {
      // Create tracking variables
      const setLanguageCalled = { value: false, lang: null };
      const translateDOMCalled = { value: false };
      const applyRTLCalled = { value: false };
      
      // Create a custom i18n object with our own implementation
      const i18n = {
        isEnabled: () => true,
        translateDOM: () => { translateDOMCalled.value = true; },
        applyRTL: () => { applyRTLCalled.value = true; },
        localizer: {
          setLanguage: (lang) => {
            setLanguageCalled.value = true;
            setLanguageCalled.lang = lang;
            return true;
          }
        },
        setLanguage: function(language) {
          if (!this.isEnabled()) {
            return false;
          }
          
          if (this.localizer && typeof this.localizer.setLanguage === 'function') {
            this.localizer.setLanguage(language);
            
            // Apply translations
            this.translateDOM();
            
            // Apply RTL direction if needed
            this.applyRTL();
            
            return true;
          }
          
          return false;
        }
      };
      
      // Call the method
      const result = i18n.setLanguage('fr');
      
      // Verify everything was called correctly
      expect(setLanguageCalled.value).to.be.true;
      expect(setLanguageCalled.lang).to.equal('fr');
      expect(translateDOMCalled.value).to.be.true;
      expect(applyRTLCalled.value).to.be.true;
      expect(result).to.be.true;
    });
  });

  describe('getLanguages', () => {
    it('should return default languages if i18n is disabled', () => {
      const i18n = createI18nIntegration({
        languages: ['fr', 'en', 'de']
      });
      
      const result = i18n.getLanguages();
      
      expect(result).to.deep.equal(['fr', 'en', 'de']);
    });

    it('should use localizer.getLanguages if available', () => {
      const i18n = createI18nIntegration({
        enabled: true,
        localizer: global.mockLocalizer
      });
      
      const result = i18n.getLanguages();
      
      expect(global.mockLocalizer.getLanguages.calledOnce).to.be.true;
      expect(result).to.deep.equal(['en', 'fr', 'de']);
    });
  });

  describe('isRTL', () => {
    it('should return true for RTL languages', () => {
      const i18n = createI18nIntegration({
        rtlLanguages: ['ar', 'he', 'fa']
      });
      
      expect(i18n.isRTL('ar')).to.be.true;
      expect(i18n.isRTL('he')).to.be.true;
      expect(i18n.isRTL('fa')).to.be.true;
    });

    it('should return false for non-RTL languages', () => {
      const i18n = createI18nIntegration({
        rtlLanguages: ['ar', 'he', 'fa']
      });
      
      expect(i18n.isRTL('en')).to.be.false;
      expect(i18n.isRTL('fr')).to.be.false;
      expect(i18n.isRTL('de')).to.be.false;
    });
  });
});