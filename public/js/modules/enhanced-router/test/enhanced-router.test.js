/**
 * Tests for the EnhancedRouter class
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { EnhancedRouter, createRouter } from '../src/index.js';
import { Router } from '@profullstack/spa-router';

describe('EnhancedRouter', () => {
  // Set up DOM elements for testing
  let appElement;
  
  beforeEach(() => {
    // Create app element
    appElement = document.createElement('div');
    appElement.id = 'app';
    document.body.appendChild(appElement);
    
    // Create a clock for controlling setTimeout
    sinon.useFakeTimers();
  });
  
  afterEach(() => {
    // Clean up
    if (document.body.contains(appElement)) {
      document.body.removeChild(appElement);
    }
    
    // Restore timers and stubs
    sinon.restore();
  });

  describe('constructor', () => {
    it('should create an enhanced router with default options', () => {
      const router = new EnhancedRouter();
      
      expect(router).to.be.an('object');
      expect(router.router).to.be.an.instanceOf(Router);
      expect(router.transitions).to.be.an('object');
      expect(router.layouts).to.be.an('object');
      expect(router.i18n).to.be.an('object');
    });

    it('should create an enhanced router with custom options', () => {
      const errorHandler = () => '<h1>Custom 404</h1>';
      const router = new EnhancedRouter({
        rootElement: '#root',
        errorHandler
      });
      
      expect(router.router.rootElement).to.equal('#root');
    });

    it('should create transition manager with custom options', () => {
      const router = new EnhancedRouter({
        transition: {
          type: 'slide',
          duration: 500
        }
      });
      
      const transitionManager = router.getTransitionManager();
      expect(transitionManager).to.be.an('object');
    });

    it('should create layout manager with custom options', () => {
      const customLayout = content => `<div class="custom-layout">${content}</div>`;
      const router = new EnhancedRouter({
        layouts: {
          custom: customLayout
        }
      });
      
      const layoutManager = router.getLayoutManager();
      expect(layoutManager).to.be.an('object');
      expect(layoutManager.getLayout('custom')).to.equal(customLayout);
    });

    it('should create i18n integration with custom options', () => {
      const router = new EnhancedRouter({
        i18n: {
          enabled: true,
          defaultLanguage: 'fr'
        }
      });
      
      const i18n = router.getI18nIntegration();
      expect(i18n).to.be.an('object');
    });
  });

  describe('createRouter factory function', () => {
    it('should create an instance of EnhancedRouter', () => {
      const router = createRouter();
      
      expect(router).to.be.an.instanceOf(EnhancedRouter);
    });
  });

  describe('registerRoutes', () => {
    it('should enhance routes with layout support', () => {
      const router = new EnhancedRouter();
      const registerRoutesSpy = sinon.spy(router.router, 'registerRoutes');
      
      const routes = {
        '/': { 
          view: () => '<h1>Home</h1>',
          layout: 'default'
        },
        '/about': { 
          view: () => '<h1>About</h1>',
          layout: 'minimal'
        }
      };
      
      router.registerRoutes(routes);
      
      expect(registerRoutesSpy.calledOnce).to.be.true;
      
      // Verify that the routes were enhanced
      const enhancedRoutes = registerRoutesSpy.firstCall.args[0];
      expect(enhancedRoutes).to.have.property('/');
      expect(enhancedRoutes).to.have.property('/about');
      expect(enhancedRoutes['/'].view).to.be.a('function');
      expect(enhancedRoutes['/about'].view).to.be.a('function');
    });

    it('should return the router instance for chaining', () => {
      const router = new EnhancedRouter();
      const result = router.registerRoutes({});
      
      expect(result).to.equal(router);
    });
  });

  describe('navigate', () => {
    it('should dispatch pre-navigation event', () => {
      const router = new EnhancedRouter();
      const dispatchEventSpy = sinon.spy(document, 'dispatchEvent');
      const navigateStub = sinon.stub(router.router, 'navigate').resolves();
      
      router.navigate('/test');
      
      expect(dispatchEventSpy.calledOnce).to.be.true;
      expect(dispatchEventSpy.firstCall.args[0].type).to.equal('pre-navigation');
      expect(dispatchEventSpy.firstCall.args[0].detail.toPath).to.equal('/test');
      
      expect(navigateStub.calledOnce).to.be.true;
      expect(navigateStub.firstCall.args[0]).to.equal('/test');
    });
  });

  describe('init', () => {
    it('should initialize the base router', () => {
      const router = new EnhancedRouter();
      const initSpy = sinon.spy(router.router, 'init');
      
      router.init();
      
      expect(initSpy.calledOnce).to.be.true;
    });

    it('should initialize i18n if enabled', () => {
      const router = new EnhancedRouter({
        i18n: { enabled: true }
      });
      
      const i18nInitSpy = sinon.spy(router.i18n, 'init');
      const isEnabledStub = sinon.stub(router.i18n, 'isEnabled').returns(true);
      
      router.init();
      
      expect(i18nInitSpy.calledOnce).to.be.true;
      
      isEnabledStub.restore();
    });

    it('should not initialize i18n if disabled', () => {
      const router = new EnhancedRouter();
      
      const i18nInitSpy = sinon.spy(router.i18n, 'init');
      const isEnabledStub = sinon.stub(router.i18n, 'isEnabled').returns(false);
      
      router.init();
      
      expect(i18nInitSpy.called).to.be.false;
      
      isEnabledStub.restore();
    });

    it('should return the router instance for chaining', () => {
      const router = new EnhancedRouter();
      const result = router.init();
      
      expect(result).to.equal(router);
    });
  });

  describe('use (middleware)', () => {
    it('should add middleware to the base router', () => {
      const router = new EnhancedRouter();
      const useSpy = sinon.spy(router.router, 'use');
      const middleware = (to, from, next) => next();
      
      router.use(middleware);
      
      expect(useSpy.calledOnce).to.be.true;
      expect(useSpy.firstCall.args[0]).to.equal(middleware);
    });

    it('should return the router instance for chaining', () => {
      const router = new EnhancedRouter();
      const middleware = (to, from, next) => next();
      const result = router.use(middleware);
      
      expect(result).to.equal(router);
    });
  });

  describe('getBaseRouter', () => {
    it('should return the base router instance', () => {
      const router = new EnhancedRouter();
      const baseRouter = router.getBaseRouter();
      
      expect(baseRouter).to.equal(router.router);
      expect(baseRouter).to.be.an.instanceOf(Router);
    });
  });

  describe('getTransitionManager', () => {
    it('should return the transition manager', () => {
      const router = new EnhancedRouter();
      const transitionManager = router.getTransitionManager();
      
      expect(transitionManager).to.equal(router.transitions);
      expect(transitionManager).to.be.an('object');
      expect(transitionManager).to.have.property('getTransition');
      expect(transitionManager).to.have.property('cleanupOverlays');
    });
  });

  describe('getLayoutManager', () => {
    it('should return the layout manager', () => {
      const router = new EnhancedRouter();
      const layoutManager = router.getLayoutManager();
      
      expect(layoutManager).to.equal(router.layouts);
      expect(layoutManager).to.be.an('object');
      expect(layoutManager).to.have.property('wrapInLayout');
      expect(layoutManager).to.have.property('registerLayout');
    });
  });

  describe('getI18nIntegration', () => {
    it('should return the i18n integration', () => {
      const router = new EnhancedRouter();
      const i18n = router.getI18nIntegration();
      
      expect(i18n).to.equal(router.i18n);
      expect(i18n).to.be.an('object');
      expect(i18n).to.have.property('isEnabled');
      expect(i18n).to.have.property('translateDOM');
    });
  });

  describe('_enhanceErrorHandler', () => {
    it('should wrap custom error handler content in layout', () => {
      const router = new EnhancedRouter();
      const customErrorHandler = () => '<h1>Custom 404</h1>';
      const wrapInLayoutSpy = sinon.spy(router.layouts, 'wrapInLayout');
      
      // Access the private method using the function's prototype
      const enhancedErrorHandler = router._enhanceErrorHandler(customErrorHandler);
      enhancedErrorHandler('/not-found');
      
      expect(wrapInLayoutSpy.calledOnce).to.be.true;
      expect(wrapInLayoutSpy.firstCall.args[1]).to.equal('error');
    });

    it('should create default error content if no custom handler provided', () => {
      const router = new EnhancedRouter();
      const wrapInLayoutSpy = sinon.spy(router.layouts, 'wrapInLayout');
      
      // Access the private method using the function's prototype
      const enhancedErrorHandler = router._enhanceErrorHandler();
      enhancedErrorHandler('/not-found');
      
      expect(wrapInLayoutSpy.calledOnce).to.be.true;
      expect(wrapInLayoutSpy.firstCall.args[1]).to.equal('error');
    });
  });

  describe('_setupEventListeners', () => {
    it('should set up event listener for spa-transition-end', () => {
      const router = new EnhancedRouter();
      const addEventListenerSpy = sinon.spy(document, 'addEventListener');
      
      // Call the method again to verify it sets up the listener
      router._setupEventListeners();
      
      expect(addEventListenerSpy.calledWith('spa-transition-end')).to.be.true;
    });

    it('should clean up overlays and translate DOM on transition end', () => {
      const router = new EnhancedRouter();
      const cleanupOverlaysSpy = sinon.spy(router.transitions, 'cleanupOverlays');
      const isEnabledStub = sinon.stub(router.i18n, 'isEnabled').returns(true);
      const translateDOMSpy = sinon.spy(router.i18n, 'translateDOM');
      
      // Trigger the event
      document.dispatchEvent(new CustomEvent('spa-transition-end'));
      
      expect(cleanupOverlaysSpy.calledOnce).to.be.true;
      expect(translateDOMSpy.calledOnce).to.be.true;
      
      isEnabledStub.restore();
    });
  });
});