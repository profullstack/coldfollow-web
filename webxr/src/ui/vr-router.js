/**
 * WebXR Router Component
 * 
 * This component integrates @profullstack/spa-router with the WebXR experience,
 * allowing for different "scenes" or "views" within the VR environment.
 */

import { VRRouter as SPARouter } from '/webxr/js/deps.js';

export class VRRouter extends HTMLElement {
  constructor() {
    super();
    
    // Create a shadow DOM for encapsulation
    this.attachShadow({ mode: 'open' });
    
    // Create the router container
    this.container = document.createElement('div');
    this.container.className = 'vr-router-container';
    
    // Add the theme stylesheet
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', '/webxr/src/ui/vr-theme.css');
    
    // Add the link and container to the shadow DOM
    this.shadowRoot.appendChild(linkElem);
    this.shadowRoot.appendChild(this.container);
    
    // Initialize router
    this.router = null;
    this.routes = [];
    this.currentRoute = null;
    this.currentView = null;
    
    // Bind methods
    this.initRouter = this.initRouter.bind(this);
    this.navigate = this.navigate.bind(this);
    this.handleRouteChange = this.handleRouteChange.bind(this);
  }
  
  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
    // Initialize the router
    this.initRouter();
    
    // Dispatch event when connected
    this.dispatchEvent(new CustomEvent('vr-router-connected', {
      bubbles: true,
      composed: true,
      detail: { router: this }
    }));
  }
  
  /**
   * Initialize the router with routes
   */
  initRouter() {
    // Get routes from attributes or child elements
    this.routes = this.getRoutes();
    
    // Create router configuration
    const routerConfig = {
      routes: this.routes,
      container: this.container,
      onChange: this.handleRouteChange
    };
    
    // Initialize the router
    this.router = new SPARouter(routerConfig);
    
    // Navigate to the initial route
    const initialRoute = this.getAttribute('initial-route') || '/';
    this.navigate(initialRoute);
  }
  
  /**
   * Get routes from child elements or attributes
   */
  getRoutes() {
    const routes = [];
    
    // Check for route elements
    const routeElements = Array.from(this.children).filter(child => 
      child.tagName.toLowerCase() === 'vr-route'
    );
    
    if (routeElements.length > 0) {
      // Get routes from child elements
      routeElements.forEach(routeElement => {
        const path = routeElement.getAttribute('path');
        const component = routeElement.getAttribute('component');
        const title = routeElement.getAttribute('title') || '';
        
        if (path && component) {
          routes.push({ path, component, title });
        }
      });
    } else {
      // Get routes from attribute
      const routesAttr = this.getAttribute('routes');
      if (routesAttr) {
        try {
          const parsedRoutes = JSON.parse(routesAttr);
          routes.push(...parsedRoutes);
        } catch (error) {
          console.error('Error parsing routes attribute:', error);
        }
      }
    }
    
    return routes;
  }
  
  /**
   * Navigate to a specific route
   * @param {string} path - The route path to navigate to
   */
  navigate(path) {
    if (this.router) {
      this.router.navigate(path);
    }
  }
  
  /**
   * Handle route change events
   * @param {Object} event - The route change event
   */
  handleRouteChange(event) {
    this.currentRoute = event.route;
    this.currentView = event.view;
    
    // Dispatch a custom event
    this.dispatchEvent(new CustomEvent('vr-route-changed', {
      bubbles: true,
      composed: true,
      detail: { 
        route: this.currentRoute,
        view: this.currentView
      }
    }));
  }
  
  /**
   * Get the current route
   */
  get route() {
    return this.currentRoute;
  }
  
  /**
   * Get the current view
   */
  get view() {
    return this.currentView;
  }
}

// Define the VR Route element
export class VRRoute extends HTMLElement {
  constructor() {
    super();
  }
}

// Register the custom elements
customElements.define('vr-router', VRRouter);
customElements.define('vr-route', VRRoute);