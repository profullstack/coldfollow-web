/**
 * Header component for the application
 */
import '../components/language-switcher.js';

class PfHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    
    // Initialize properties
    this._documentClickHandler = null;
  }

  connectedCallback() {
    this.render();
    this.initEventListeners();
  }

  render() {
    // Get the current language before rendering
    const currentLang = window.app && window.app.localizer ?
      window.app.localizer.getLanguage() : 'en';
    
    // Pre-translate navigation items
    const dashboardText = window.app && window.app._t ?
      window.app._t('navigation.dashboard') : 'Dashboard';
    const apiKeysText = window.app && window.app._t ?
      window.app._t('navigation.api_keys') : 'API Keys';
    const loginText = window.app && window.app._t ?
      window.app._t('navigation.login') : 'Login';
    const registerText = window.app && window.app._t ?
      window.app._t('navigation.register') : 'Register';
    const themeText = window.app && window.app._t ?
      window.app._t('navigation.theme') : 'Theme';
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--font-primary, 'SpaceMono', monospace);
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
        }

        /* Mobile menu styles */
        .hamburger-menu {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 30px;
          height: 21px;
          cursor: pointer;
          z-index: 200;
        }
        
        .hamburger-menu span {
          display: block;
          height: 3px;
          width: 100%;
          background-color: var(--text-primary);
          border-radius: 3px;
          transition: all 0.3s ease;
        }
        
        .hamburger-menu.active span:nth-child(1) {
          transform: translateY(9px) rotate(45deg);
        }
        
        .hamburger-menu.active span:nth-child(2) {
          opacity: 0;
        }
        
        .hamburger-menu.active span:nth-child(3) {
          transform: translateY(-9px) rotate(-45deg);
        }
        
        .mobile-menu {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--background-color);
          z-index: 100;
          padding: 80px var(--spacing-md-lg) var(--spacing-md-lg);
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 20px;
          overflow-y: auto;
        }
        
        .mobile-menu.active {
          display: flex;
        }
        
        .mobile-menu a {
          font-size: 1.2rem;
          padding: 12px 0;
          width: 100%;
          text-align: center;
          border-bottom: 1px solid var(--border-color);
        }
        
        .mobile-theme-toggle-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-top: 20px;
          padding: 15px 0;
          border-top: 1px solid var(--border-color);
          width: 100%;
        }
        
        .mobile-theme-toggle-container span {
          font-size: 1.1rem;
          color: var(--text-primary);
        }
        
        .mobile-theme-toggle {
          position: static;
          margin-left: 0;
        }

        /* Theme toggle styles */
        .theme-toggle {
          margin-left: 15px;
          background-color: transparent;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
          color: var(--text-primary, #111827); /* Add explicit color for default state */
        }
        
        .theme-toggle:hover {
          background-color: var(--surface-variant, #f3f4f6); /* Use theme-appropriate background */
          color: var(--text-primary, #111827); /* Maintain text color on hover */
        }
        
        .theme-toggle svg {
          width: 20px;
          height: 20px;
          fill: currentColor;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .logo img {
          height: 40px;
          width: auto;
        }
        
        .logo h1 {
          margin: 0;
          color: #e02337;
          font-weight: bold;
        }
        
        .nav-links {
          display: flex;
          gap: 15px;
        }
        
        .nav-link {
          padding: 8px 15px;
          color: var(--text-primary);
          text-decoration: none;
          border-radius: 5px;
          transition: background-color 0.2s, color 0.2s;
        }
        
        .nav-link:hover {
          background-color: var(--surface-variant);
          color: var(--primary-color);
        }
        
        .nav-link.active {
          background-color: var(--surface-variant);
          color: var(--primary-color);
          font-weight: bold;
        }
        
        .subscription-link {
          display: inline-block;
          padding: 8px 15px;
          background-color: #e02337;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .subscription-link:hover {
          background-color: #c01d2f;
        }

        /* User dropdown styles */
        .user-dropdown {
          position: relative;
        }
        
        .dropdown-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 15px;
          background: none;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          color: var(--text-primary, #333);
          transition: background-color 0.2s, color 0.2s;
        }
        
        .dropdown-button:hover {
          background-color: var(--surface-variant, #f0f0f0);
          color: var(--primary-color, #e02337);
        }
        
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          width: 200px;
          background-color: var(--background-color, white);
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color, #ddd);
          padding: 8px 0;
          display: none;
          z-index: 100;
        }
        
        .dropdown-menu.show {
          display: block;
        }
        
        .dropdown-item {
          display: block;
          padding: 8px 15px;
          color: var(--text-primary, #333);
          text-decoration: none;
          transition: background-color 0.2s, color 0.2s;
        }
        
        .dropdown-item:hover {
          background-color: var(--surface-variant, #f0f0f0);
          color: var(--primary-color, #e02337);
        }
        
        /* Media queries for responsive design */
        @media (max-width: 768px) {
          .nav-links {
            display: none; /* Hide regular nav links on mobile */
          }
          
          .hamburger-menu {
            display: flex; /* Show hamburger menu on mobile */
          }
          
          /* Hide the header theme toggle on mobile */
          .header .theme-toggle {
            display: none;
          }
        }
      </style>
      
      <div class="header">
        <a href="/" class="logo-link" style="text-decoration: none;">
          <div class="logo">
            <img src="/icons/logo.${this.currentTheme === 'dark' ? 'dark' : 'light'}.svg" alt="Profullstack, Inc. Logo">
            <h1 data-i18n="app_name">coldfollow</h1>
          </div>
        </a>
        
        <!-- Hamburger menu for mobile -->
        <div class="hamburger-menu">
          <span></span>
          <span></span>
          <span></span>
        </div>
        
        <div class="nav-links">
          <a href="/dashboard" class="nav-link" id="dashboard-link" data-i18n="navigation.dashboard">${dashboardText}</a>
          <a href="/api-keys" class="nav-link" id="api-keys-link" data-i18n="navigation.api_keys">${apiKeysText}</a>
          <a href="/login" class="nav-link login-link" id="login-link" data-i18n="navigation.login">${loginText}</a>
          <a href="/register" class="subscription-link register-link" id="register-link" data-i18n="navigation.register">${registerText}</a>
          
          <!-- Language Switcher moved after user dropdown in updateNavbar() -->
          
          <button class="theme-toggle" title="Toggle light/dark theme">
            ${this.currentTheme === 'dark'
              ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"/>
                </svg>`
              : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27105 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z"/>
                </svg>`
            }
          </button>
        </div>
      </div>
      
      <!-- Mobile menu container -->
      <div class="mobile-menu">
        <a href="/dashboard" class="nav-link" id="mobile-dashboard-link" data-i18n="navigation.dashboard">${dashboardText}</a>
        <a href="/api-keys" class="nav-link" id="mobile-api-keys-link" data-i18n="navigation.api_keys">${apiKeysText}</a>
        <a href="/login" class="nav-link login-link" id="mobile-login-link" data-i18n="navigation.login">${loginText}</a>
        <a href="/register" class="subscription-link register-link" id="mobile-register-link" data-i18n="navigation.register">${registerText}</a>
        
        <!-- Mobile Language Switcher -->
        <language-switcher></language-switcher>
        
        <div class="mobile-theme-toggle-container">
          <span data-i18n="navigation.theme">${themeText}</span>
          <button class="theme-toggle mobile-theme-toggle" title="Toggle light/dark theme">
            ${this.currentTheme === 'dark'
              ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"/>
                </svg>`
              : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27105 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z"/>
                </svg>`
            }
          </button>
        </div>
      </div>
    `;
  }

  initEventListeners() {
    // Update the navigation based on authentication status
    this.updateNavbar();

    // Listen for auth changes
    window.addEventListener('auth-changed', () => {
      this.updateNavbar();
    });
    
    // Listen for theme changes
    document.addEventListener('themechange', (event) => {
      this.currentTheme = event.detail.theme;
      this.updateLogo();
      this.updateThemeToggle();
    });
    
    // Listen for language changes
    window.addEventListener('language-changed', () => {
      console.log('pf-header: Language changed event received');
      // Translate elements in the shadow DOM
      this.translateElements();
    });
    
    // Listen for i18n ready event
    window.addEventListener('i18n-ready', () => {
      console.log('pf-header: i18n ready event received');
      this.translateElements();
    });
    
    // Listen for pre-navigation event to translate before transition starts
    document.addEventListener('pre-navigation', () => {
      console.log('pf-header: Pre-navigation event received');
      this.translateElements();
    });
    
    // Listen for router transitions
    document.addEventListener('spa-transition-end', () => {
      console.log('pf-header: SPA transition end event received');
      this.translateElements();
    });
    
    // Add event listeners for theme toggle buttons (both desktop and mobile)
    const themeToggles = this.shadowRoot.querySelectorAll('.theme-toggle');
    themeToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    });
    
    // Add event listener for hamburger menu toggle
    const hamburgerMenu = this.shadowRoot.querySelector('.hamburger-menu');
    const mobileMenu = this.shadowRoot.querySelector('.mobile-menu');
    if (hamburgerMenu && mobileMenu) {
      hamburgerMenu.addEventListener('click', () => {
        hamburgerMenu.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        // Prevent scrolling when mobile menu is open
        document.body.style.overflow = hamburgerMenu.classList.contains('active') ? 'hidden' : '';
      });
      
      // Close mobile menu when clicking on a link
      const mobileLinks = mobileMenu.querySelectorAll('a');
      mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          hamburgerMenu.classList.remove('active');
          mobileMenu.classList.remove('active');
          document.body.style.overflow = '';
        });
      });
    }
    
    // Update active link based on current path
    this.updateActiveLink();
    
    // Listen for route changes
    window.addEventListener('route-changed', () => {
      this.updateActiveLink();
    });
  }
  
  updateActiveLink() {
    const currentPath = window.location.pathname;
    
    // Remove active class from all links
    const links = this.shadowRoot.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to the current link
    if (currentPath.startsWith('/dashboard')) {
      this.shadowRoot.querySelector('#dashboard-link')?.classList.add('active');
    } else if (currentPath.startsWith('/api-keys')) {
      this.shadowRoot.querySelector('#api-keys-link')?.classList.add('active');
    } else if (currentPath.startsWith('/login')) {
      this.shadowRoot.querySelector('#login-link')?.classList.add('active');
    } else if (currentPath.startsWith('/register')) {
      this.shadowRoot.querySelector('#register-link')?.classList.add('active');
    }
  }
  
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.currentTheme = newTheme;
    
    // Update the document theme
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Save theme preference
    localStorage.setItem('convert2doc-theme', newTheme);
    
    // Update UI
    this.updateLogo();
    this.updateThemeToggle();
    
    // Dispatch theme change event
    const event = new CustomEvent('themechange', { detail: { theme: newTheme } });
    document.dispatchEvent(event);
  }
  
  updateThemeToggle() {
    const themeToggles = this.shadowRoot.querySelectorAll('.theme-toggle');
    const iconHtml = this.currentTheme === 'dark'
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"/>
        </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27105 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z"/>
        </svg>`;
    
    themeToggles.forEach(toggle => {
      toggle.innerHTML = iconHtml;
    });
  }
  
  updateLogo() {
    const logoImg = this.shadowRoot.querySelector('.logo img');
    if (logoImg) {
      logoImg.src = `/icons/logo.${this.currentTheme === 'dark' ? 'dark' : 'light'}.svg`;
    }
  }

  /**
   * Store user data in localStorage without PII
   * @param {Object} userData - User data from server
   */
  storeUserData(userData) {
    if (!userData) return;
    
    // Create a sanitized user object without PII
    const sanitizedUser = {
      id: userData.id,
      username: userData.username || userData.email?.split('@')[0] || 'User',
      role: userData.role || 'user',
      created_at: userData.created_at,
      updated_at: userData.updated_at
    };
    
    // Store the sanitized user object in localStorage
    try {
      localStorage.setItem('user', JSON.stringify(sanitizedUser));
      console.log('User data stored in localStorage without PII');
    } catch (error) {
      console.error('Error storing user data in localStorage:', error);
    }
  }

  updateNavbar() {
    // Check for JWT token instead of API key
    const jwtToken = localStorage.getItem('jwt_token');
    
    // Get user data from localStorage
    let userObject = null;
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        userObject = JSON.parse(userJson);
      } else if (jwtToken) {
        // If we have a JWT but no user object, try to get user info from the auth status endpoint
        this.fetchUserData(jwtToken);
      }
    } catch (error) {
      console.error('Error parsing user object from localStorage:', error);
    }
    
    // Get username from user object or fallback to username in localStorage
    const username = userObject?.username || localStorage.getItem('username') || 'User';
    
    // Check if user is logged in based on JWT token
    const isLoggedIn = !!jwtToken;
    
    // Update desktop navigation
    const navLinks = this.shadowRoot.querySelector('.nav-links');
    if (!navLinks) return;
    
    // Get the static login and register links
    const loginLink = navLinks.querySelector('.login-link');
    const registerLink = navLinks.querySelector('.register-link');
    const dashboardLink = navLinks.querySelector('#dashboard-link');
    const apiKeysLink = navLinks.querySelector('#api-keys-link');
    
    // Only remove existing dropdown if we're going to add a new one
    // (when user is logged in) or if we're switching from logged in to logged out
    if (isLoggedIn || navLinks.querySelector('.user-dropdown')) {
      const authElements = navLinks.querySelectorAll('.user-dropdown');
      authElements.forEach(el => el.remove());
    }
    
    // Update mobile navigation
    const mobileMenu = this.shadowRoot.querySelector('.mobile-menu');
    const mobileLoginLink = mobileMenu?.querySelector('#mobile-login-link');
    const mobileRegisterLink = mobileMenu?.querySelector('#mobile-register-link');
    const mobileDashboardLink = mobileMenu?.querySelector('#mobile-dashboard-link');
    const mobileApiKeysLink = mobileMenu?.querySelector('#mobile-api-keys-link');
    
    if (isLoggedIn) {
      // User is logged in
      
      // Hide the static login and register links in desktop nav
      if (loginLink) loginLink.style.display = 'none';
      if (registerLink) registerLink.style.display = 'none';
      
      // Show the dashboard and API keys links in desktop nav
      if (dashboardLink) dashboardLink.style.display = '';
      if (apiKeysLink) apiKeysLink.style.display = '';
      
      // Hide the login and register links in mobile nav
      if (mobileLoginLink) mobileLoginLink.style.display = 'none';
      if (mobileRegisterLink) mobileRegisterLink.style.display = 'none';
      
      // Show the dashboard and API keys links in mobile nav
      if (mobileDashboardLink) mobileDashboardLink.style.display = '';
      if (mobileApiKeysLink) mobileApiKeysLink.style.display = '';
      
      // Add the user dropdown to desktop nav
      const dropdownHtml = `
        <div class="user-dropdown">
          <button class="dropdown-button">
            <span class="username">${username}</span>
            <svg class="dropdown-icon" width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L6 5L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="dropdown-menu">
            <a href="/manage-subscription" class="dropdown-item">Manage Subscription</a>
            <a href="/settings" class="dropdown-item">Settings</a>
            <a href="#" class="dropdown-item logout-button">Logout</a>
          </div>
        </div>
      `;
      
      // Insert the dropdown before the theme toggle
      try {
        const themeToggle = navLinks.querySelector('.theme-toggle');
        if (themeToggle) {
          // Insert before the theme toggle
          themeToggle.insertAdjacentHTML('beforebegin', dropdownHtml);
          console.log('Dropdown inserted before theme toggle');
          
          // Move language switcher after user dropdown
          const languageSwitcher = navLinks.querySelector('language-switcher');
          if (languageSwitcher) {
            const userDropdown = navLinks.querySelector('.user-dropdown');
            if (userDropdown) {
              // Move language switcher after user dropdown
              userDropdown.insertAdjacentElement('afterend', languageSwitcher);
              console.log('Language switcher moved after user dropdown');
            }
          } else {
            // If language switcher doesn't exist yet, create it
            const userDropdown = navLinks.querySelector('.user-dropdown');
            if (userDropdown) {
              userDropdown.insertAdjacentHTML('afterend', '<language-switcher></language-switcher>');
              console.log('Language switcher created after user dropdown');
            }
          }
        } else {
          // Fallback: append to the end of nav links
          navLinks.insertAdjacentHTML('beforeend', dropdownHtml);
          console.log('Dropdown appended to nav links (theme toggle not found)');
        }
        
        // Verify the dropdown was added
        const dropdown = navLinks.querySelector('.user-dropdown');
        if (!dropdown) {
          console.error('Failed to insert dropdown menu');
        }
      } catch (error) {
        console.error('Error inserting dropdown menu:', error);
        // Fallback: try one more time with direct append
        try {
          navLinks.insertAdjacentHTML('beforeend', dropdownHtml);
        } catch (e) {
          console.error('Final attempt to insert dropdown failed:', e);
        }
      }
      
      // Add user-related links to mobile menu
      if (mobileMenu) {
        // Only add if they don't already exist
        if (!mobileMenu.querySelector('.mobile-settings-link')) {
          try {
            const mobileUserLinksHtml = `
              <a href="/manage-subscription" class="nav-link mobile-subscription-link">Manage Subscription</a>
              <a href="/settings" class="nav-link mobile-settings-link">Settings</a>
              <a href="#" class="nav-link mobile-logout-link">Logout</a>
            `;
            mobileMenu.insertAdjacentHTML('beforeend', mobileUserLinksHtml);
            console.log('Mobile menu items added');
            
            // Add event listener for mobile logout
            const mobileLogoutLink = mobileMenu.querySelector('.mobile-logout-link');
            if (mobileLogoutLink) {
              // Use direct onclick assignment
              mobileLogoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.logout();
              });
            } else {
              console.error('Mobile logout link not found after insertion');
            }
          } catch (error) {
            console.error('Error adding mobile menu items:', error);
          }
        } else {
          console.log('Mobile menu items already exist');
        }
      } else {
        console.error('Mobile menu element not found');
      }
      
      // Add event listener for dropdown toggle
      const dropdownButton = navLinks.querySelector('.dropdown-button');
      const dropdownMenu = navLinks.querySelector('.dropdown-menu');
      
      if (dropdownButton && dropdownMenu) {
        // Use direct onclick assignment for more reliable event handling
        dropdownButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Dropdown button clicked, toggling show class');
          dropdownMenu.classList.toggle('show');
        });
        
        // Set up document click handler if not already done
        if (!this._documentClickHandler) {
          this._documentClickHandler = (e) => {
            const dropdownButtons = this.shadowRoot.querySelectorAll('.dropdown-button');
            const dropdownMenus = this.shadowRoot.querySelectorAll('.dropdown-menu');
            
            // Check if click is outside all dropdowns
            let outsideClick = true;
            dropdownButtons.forEach(btn => {
              if (btn.contains(e.target)) outsideClick = false;
            });
            dropdownMenus.forEach(menu => {
              if (menu.contains(e.target)) outsideClick = false;
            });
            
            // If click is outside, close all dropdowns
            if (outsideClick) {
              console.log('Outside click detected, closing dropdowns');
              dropdownMenus.forEach(menu => {
                menu.classList.remove('show');
              });
            }
          };
          
          // Add the document click handler
          document.addEventListener('click', this._documentClickHandler);
        }
      }
      
      // Add event listener for logout
      const logoutButton = navLinks.querySelector('.logout-button');
      if (logoutButton) {
        // Use direct onclick assignment
        logoutButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Logout button clicked');
          this.logout();
        });
      }
    } else {
      // User is not logged in
      
      // Show the static login and register links in desktop nav
      if (loginLink) loginLink.style.display = '';
      if (registerLink) registerLink.style.display = '';
      
      // Hide the dashboard and API keys links in desktop nav
      if (dashboardLink) dashboardLink.style.display = 'none';
      if (apiKeysLink) apiKeysLink.style.display = 'none';
      
      // Show the login and register links in mobile nav
      if (mobileLoginLink) mobileLoginLink.style.display = '';
      if (mobileRegisterLink) mobileRegisterLink.style.display = '';
      
      // Hide the dashboard and API keys links in mobile nav
      if (mobileDashboardLink) mobileDashboardLink.style.display = 'none';
      if (mobileApiKeysLink) mobileApiKeysLink.style.display = 'none';
      
      // Remove any user-specific links from mobile menu
      const mobileSettingsLink = mobileMenu?.querySelector('.mobile-settings-link');
      const mobileLogoutLink = mobileMenu?.querySelector('.mobile-logout-link');
      if (mobileSettingsLink) mobileSettingsLink.remove();
      if (mobileLogoutLink) mobileLogoutLink.remove();
      
      // Move language switcher before theme toggle when logged out
      const languageSwitcher = navLinks.querySelector('language-switcher');
      const themeToggle = navLinks.querySelector('.theme-toggle');
      if (languageSwitcher && themeToggle) {
        themeToggle.insertAdjacentElement('beforebegin', languageSwitcher);
        console.log('Language switcher moved before theme toggle (logged out)');
      } else if (!languageSwitcher && themeToggle) {
        // If language switcher doesn't exist yet, create it
        themeToggle.insertAdjacentHTML('beforebegin', '<language-switcher></language-switcher>');
        console.log('Language switcher created before theme toggle (logged out)');
      }
    }
  }

  /**
   * Fetch user data from the auth status endpoint
   * @param {string} jwtToken - JWT token
   */
  async fetchUserData(jwtToken) {
    try {
      const response = await fetch('/api/1/auth/status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.auth_user) {
          // Store user data without PII
          this.storeUserData(data.auth_user);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  logout() {
    // Clear JWT token and user data
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    localStorage.removeItem('user');
    localStorage.removeItem('subscription_data');
    localStorage.removeItem('api_key'); // Remove legacy API key if present
    
    // Clear all cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
    
    // Update UI
    this.updateNavbar();
    
    // Dispatch auth changed event
    window.dispatchEvent(new CustomEvent('auth-changed'));
    
    // Redirect to home page if on a protected page
    const currentPath = window.location.pathname;
    const protectedPages = ['/api-keys', '/settings', '/dashboard'];
    
    if (protectedPages.includes(currentPath)) {
      if (window.router) {
        window.router.navigate('/');
      } else {
        window.location.href = '/';
      }
    }
  }
  
  /**
   * Translate elements with data-i18n attributes in the shadow DOM
   */
  translateElements() {
    console.log('pf-header: Translating elements in shadow DOM');
    
    // Check if window.app._t is available (faster than importing)
    if (window.app && window.app._t) {
      console.log('pf-header: Using window.app._t for translation');
      this.shadowRoot.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translated = window.app._t(key);
        element.textContent = translated;
        console.log(`pf-header: Translated "${key}" to "${translated}"`);
      });
      return;
    }
    
    // Fallback to importing the translation function
    console.log('pf-header: Importing i18n module for translation');
    import('../i18n.js').then(({ _t }) => {
      // Find all elements with data-i18n attribute
      this.shadowRoot.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translated = _t(key);
        element.textContent = translated;
        console.log(`pf-header: Translated "${key}" to "${translated}"`);
      });
    }).catch(error => {
      console.error('Error importing i18n module:', error);
    });
  }
}

// Define the custom element
customElements.define('pf-header', PfHeader);