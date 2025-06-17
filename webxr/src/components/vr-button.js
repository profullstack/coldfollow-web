/**
 * VR Button Web Component
 * 
 * A custom web component for creating interactive buttons in VR.
 */

export class VRButton extends HTMLElement {
  constructor() {
    super();
    
    // Create a shadow DOM for encapsulation
    this.attachShadow({ mode: 'open' });
    
    // Create the button element
    this.button = document.createElement('button');
    this.button.className = 'vr-button';
    
    // Add the theme stylesheet
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', '/webxr/src/ui/vr-theme.css');
    
    // Add the link and button to the shadow DOM
    this.shadowRoot.appendChild(linkElem);
    this.shadowRoot.appendChild(this.button);
    
    // Bind methods
    this._handleClick = this._handleClick.bind(this);
    
    // Add event listeners
    this.button.addEventListener('click', this._handleClick);
  }
  
  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
    // Set button text from attribute or slot
    if (this.hasAttribute('label')) {
      this.button.textContent = this.getAttribute('label');
    } else {
      const slot = document.createElement('slot');
      this.button.appendChild(slot);
    }
    
    // Set disabled state
    if (this.hasAttribute('disabled')) {
      this.button.disabled = true;
    }
    
    // Set button type
    if (this.hasAttribute('type')) {
      this.button.type = this.getAttribute('type');
    } else {
      this.button.type = 'button';
    }
  }
  
  /**
   * Observed attributes for the component
   */
  static get observedAttributes() {
    return ['label', 'disabled', 'type'];
  }
  
  /**
   * Called when observed attributes change
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'label':
        this.button.textContent = newValue;
        break;
      case 'disabled':
        this.button.disabled = newValue !== null;
        break;
      case 'type':
        this.button.type = newValue || 'button';
        break;
    }
  }
  
  /**
   * Handle click events
   */
  _handleClick(event) {
    // Dispatch a custom event
    this.dispatchEvent(new CustomEvent('vr-click', {
      bubbles: true,
      composed: true,
      detail: { originalEvent: event }
    }));
  }
  
  /**
   * Get the disabled state
   */
  get disabled() {
    return this.hasAttribute('disabled');
  }
  
  /**
   * Set the disabled state
   */
  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }
  
  /**
   * Get the button label
   */
  get label() {
    return this.getAttribute('label');
  }
  
  /**
   * Set the button label
   */
  set label(value) {
    this.setAttribute('label', value);
  }
}

// Register the custom element
customElements.define('vr-button', VRButton);