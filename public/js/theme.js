/**
 * Profullstack, Inc. Document Generation API
 * Theme switching functionality
 */

class ThemeManager {
  constructor() {
    this.themeToggleClass = 'theme-toggle';
    this.darkThemeClass = 'dark';
    this.lightThemeClass = 'light';
    this.storageKey = 'coldfollow-theme';
    this.themeAttribute = 'data-theme';
    
    this.init();
  }
  
  /**
   * Initialize the theme manager
   */
  init() {
    // Create theme toggle button if it doesn't exist
    this.createToggleButton();
    
    // Set initial theme
    this.setInitialTheme();
    
    // Add event listener to theme toggle button
    this.addToggleListener();
    
    // Listen for system preference changes
    this.addSystemPreferenceListener();
  }
  
  /**
   * Create theme toggle button
   */
  createToggleButton() {
    // We don't need to create a toggle button here anymore
    // as it's already included in the pf-header component
    
    // This method is kept for backward compatibility
    // but doesn't create a duplicate button
  }
  
  /**
   * Set initial theme based on saved preference or system preference
   */
  setInitialTheme() {
    const savedTheme = localStorage.getItem(this.storageKey);
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let theme;
    if (savedTheme) {
      theme = savedTheme;
    } else {
      theme = prefersDarkScheme ? this.darkThemeClass : this.lightThemeClass;
      // Save the initial theme to localStorage
      localStorage.setItem(this.storageKey, theme);
    }
    
    this.setTheme(theme);
  }
  
  /**
   * Add event listener to theme toggle button
   */
  addToggleListener() {
    // Listen for theme toggle clicks from any component
    document.addEventListener('click', (event) => {
      const toggleButton = event.target.closest(`.${this.themeToggleClass}`);
      if (toggleButton) {
        this.toggleTheme();
      }
    });
  }
  
  /**
   * Add listener for system preference changes
   */
  addSystemPreferenceListener() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      // Only change theme if user hasn't set a preference
      if (!localStorage.getItem(this.storageKey)) {
        const newTheme = event.matches ? this.darkThemeClass : this.lightThemeClass;
        this.setTheme(newTheme);
        // Save the theme to localStorage
        localStorage.setItem(this.storageKey, newTheme);
      }
    });
  }
  
  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === this.lightThemeClass ? this.darkThemeClass : this.lightThemeClass;
    
    this.setTheme(newTheme);
    localStorage.setItem(this.storageKey, newTheme);
    
    // We don't need to update the toggle button icon here
    // as the header component will handle that via the themechange event
  }
  
  /**
   * Set theme
   * @param {string} theme - Theme name ('light' or 'dark')
   */
  setTheme(theme) {
    document.documentElement.setAttribute(this.themeAttribute, theme);
    
    // Dispatch theme change event
    const event = new CustomEvent('themechange', { detail: { theme } });
    document.dispatchEvent(event);
  }
  
  /**
   * Get current theme
   * @returns {string} - Current theme ('light' or 'dark')
   */
  getCurrentTheme() {
    return document.documentElement.getAttribute(this.themeAttribute) || this.lightThemeClass;
  }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
});