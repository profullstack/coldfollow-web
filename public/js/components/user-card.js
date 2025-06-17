/**
 * UserCard Component
 *
 * A custom component for displaying user information
 */
import { BaseComponent } from '../base-component.js';

/**
 * @class UserCard
 * @extends {BaseComponent}
 * @customElement user-card
 * @description A custom component for displaying user information
 */
export class UserCard extends BaseComponent {
  /**
   * Create a new UserCard component
   */
  constructor() {
    super();
    
    // Component state
    this._state = {
      // Add your component state here
    };
  }

  /**
   * Get the component's template
   * @returns {string} - HTML template
   */
  getTemplate() {
    return `
      <div class="user-card-container">
        <h2>UserCard</h2>
        <div class="user-card-content">
          <!-- Component content goes here -->
          <button id="action-button">Click Me</button>
        </div>
      </div>
    `;
  }

  /**
   * Get the component's styles
   * @returns {string} - CSS styles
   */
  getStyles() {
    return `
      :host {
        display: block;
        font-family: var(--font-primary, 'SpaceMono', monospace);
      }
      
      .user-card-container {
        padding: 16px;
        border-radius: 8px;
        background-color: var(--surface-color, #f5f5f5);
      }
      
      .user-card-content {
        margin-top: 12px;
      }
      
      button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        background-color: var(--primary-color, #e02337);
        color: white;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.2s;
      }
      
      button:hover {
        background-color: var(--primary-color-dark, #c01d2f);
      }
    `;
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Get button element
    const actionButton = this.$('#action-button');
    if (actionButton) {
      actionButton.addEventListener('click', this._handleButtonClick.bind(this));
    }
  }
  
  /**
   * Handle button click
   * @param {Event} event - Click event
   * @private
   */
  _handleButtonClick(event) {
    console.log('Button clicked!');
    // Add your click handler logic here
    
    // Example: Dispatch a custom event
    this.dispatchEvent(new CustomEvent('user-card-action', {
      bubbles: true,
      composed: true,
      detail: { timestamp: new Date() }
    }));
  }
  
  /**
   * Called when the element is removed from the DOM
   */
  disconnectedCallback() {
    // Clean up code here (remove event listeners, cancel timers, etc.)
    super.disconnectedCallback();
  }
}

// Register the custom element
customElements.define('user-card', UserCard);

export default UserCard;