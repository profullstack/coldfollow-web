/**
 * Web Components example for @profullstack/spa-router
 *
 * This example demonstrates how to use the router with Web Components
 * and the recommended approach of passing routes directly in the constructor.
 */

import { Router, transitions } from '../dist/index.esm.js';

// Define a simple web component
class HomeComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    this.render();
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: var(--primary-color, #3498db);
        }
        a {
          color: var(--primary-color, #3498db);
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        nav {
          margin: 20px 0;
        }
        nav a {
          margin-right: 15px;
        }
      </style>
      <div class="home-page">
        <h1>Home Page</h1>
        <p>Welcome to the SPA Router with Web Components example!</p>
        <nav>
          <a href="/about">About</a>
          <a href="/users">Users</a>
        </nav>
      </div>
    `;
  }
}

// Define an about component
class AboutComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    this.render();
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: var(--primary-color, #3498db);
        }
        a {
          color: var(--primary-color, #3498db);
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
      <div class="about-page">
        <h1>About Page</h1>
        <p>This is a simple SPA router with Web Components integration.</p>
        <a href="/">Back to Home</a>
      </div>
    `;
  }
}

// Define a user list component
class UsersComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    this.render();
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: var(--primary-color, #3498db);
        }
        a {
          color: var(--primary-color, #3498db);
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        ul {
          padding-left: 20px;
        }
        li {
          margin-bottom: 8px;
        }
      </style>
      <div class="users-page">
        <h1>Users Page</h1>
        <p>List of users:</p>
        <ul>
          <li><a href="/users/1">User 1</a></li>
          <li><a href="/users/2">User 2</a></li>
          <li><a href="/users/3">User 3</a></li>
        </ul>
        <a href="/">Back to Home</a>
      </div>
    `;
  }
}

// Define a user profile component
class UserProfileComponent extends HTMLElement {
  static get observedAttributes() {
    return ['user-id'];
  }
  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    this.render();
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'user-id' && oldValue !== newValue) {
      this.render();
    }
  }
  
  render() {
    const userId = this.getAttribute('user-id') || 'unknown';
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: var(--primary-color, #3498db);
        }
        a {
          color: var(--primary-color, #3498db);
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
      <div class="user-page">
        <h1>User Profile</h1>
        <p>User ID: ${userId}</p>
        <a href="/users">Back to Users</a>
      </div>
    `;
  }
}

// Register the web components
customElements.define('home-component', HomeComponent);
customElements.define('about-component', AboutComponent);
customElements.define('users-component', UsersComponent);
customElements.define('user-profile-component', UserProfileComponent);

// Define routes using web components
const routes = {
  '/': {
    component: 'home-component'
  },
  '/about': {
    component: 'about-component'
  },
  '/users': {
    component: 'users-component'
  },
  '/users/:id': {
    component: 'user-profile-component',
    afterRender: (params) => {
      // Find the component and set the user-id attribute
      const component = document.querySelector('user-profile-component');
      if (component) {
        component.setAttribute('user-id', params.id);
      }
    }
  }
};

// Initialize router with routes in the constructor (recommended approach)
const router = new Router({
  routes, // Pass routes directly in the constructor
  rootElement: '#app',
  transition: transitions.slide({ direction: 'left', duration: 300 }),
  errorHandler: (path) => `
    <div class="error-page">
      <h1>404 - Page Not Found</h1>
      <p>The page "${path}" could not be found.</p>
      <a href="/" class="back-link">Go back to home</a>
    </div>
  `
});

// Add middleware for logging
router.use(async (to, from, next) => {
  console.log(`Navigating from ${from || 'initial'} to ${to.path}`);
  next();
});

// Expose router globally for debugging
window.router = router;