/**
 * VR UI Panel Web Component
 * 
 * A custom web component for creating UI panels in VR that can be attached to
 * controllers, placed in the world, or follow the user's gaze.
 */

export class VRUIPanel extends HTMLElement {
  constructor() {
    super();
    
    // Create a shadow DOM for encapsulation
    this.attachShadow({ mode: 'open' });
    
    // Create the panel container
    this.panel = document.createElement('div');
    this.panel.className = 'vr-panel';
    
    // Add the theme stylesheet
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', '/webxr/src/ui/vr-theme.css');
    
    // Add the link and panel to the shadow DOM
    this.shadowRoot.appendChild(linkElem);
    this.shadowRoot.appendChild(this.panel);
    
    // Create title if specified
    if (this.hasAttribute('title')) {
      const title = document.createElement('div');
      title.className = 'vr-panel-title';
      title.textContent = this.getAttribute('title');
      this.panel.appendChild(title);
    }
    
    // Create content container
    this.content = document.createElement('div');
    this.content.className = 'vr-panel-content';
    this.panel.appendChild(this.content);
    
    // Initialize panel properties
    this._position = { x: 0, y: 0, z: 0 };
    this._rotation = { x: 0, y: 0, z: 0 };
    this._scale = { x: 1, y: 1, z: 1 };
    this._visible = true;
    this._followGaze = false;
    this._attachedToController = false;
    this._controllerIndex = 0;
    
    // Bind methods
    this.update = this.update.bind(this);
    this.addButton = this.addButton.bind(this);
    this.addSlider = this.addSlider.bind(this);
    this.addToggle = this.addToggle.bind(this);
    this.addLabel = this.addLabel.bind(this);
    this.clear = this.clear.bind(this);
    
    // Initialize Three.js object for VR
    this.threeObject = null;
  }
  
  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
    // Process slot content
    this._processSlotContent();
    
    // Dispatch event when connected
    this.dispatchEvent(new CustomEvent('vr-panel-connected', {
      bubbles: true,
      composed: true,
      detail: { panel: this }
    }));
  }
  
  /**
   * Process any content provided in slots
   */
  _processSlotContent() {
    // Move any light DOM children into the shadow DOM content container
    while (this.childNodes.length) {
      this.content.appendChild(this.childNodes[0]);
    }
  }
  
  /**
   * Observed attributes for the component
   */
  static get observedAttributes() {
    return [
      'title', 
      'position', 
      'rotation', 
      'scale', 
      'visible', 
      'follow-gaze', 
      'controller-attached',
      'controller-index'
    ];
  }
  
  /**
   * Called when observed attributes change
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'title':
        this._updateTitle(newValue);
        break;
      case 'position':
        this._updatePosition(newValue);
        break;
      case 'rotation':
        this._updateRotation(newValue);
        break;
      case 'scale':
        this._updateScale(newValue);
        break;
      case 'visible':
        this._updateVisibility(newValue);
        break;
      case 'follow-gaze':
        this._followGaze = newValue !== null && newValue !== 'false';
        break;
      case 'controller-attached':
        this._attachedToController = newValue !== null && newValue !== 'false';
        break;
      case 'controller-index':
        this._controllerIndex = parseInt(newValue) || 0;
        break;
    }
    
    // Dispatch update event
    this.dispatchEvent(new CustomEvent('vr-panel-updated', {
      bubbles: true,
      composed: true,
      detail: { 
        panel: this,
        attribute: name,
        value: newValue
      }
    }));
  }
  
  /**
   * Update the panel title
   */
  _updateTitle(title) {
    let titleElement = this.panel.querySelector('.vr-panel-title');
    
    if (title) {
      if (!titleElement) {
        titleElement = document.createElement('div');
        titleElement.className = 'vr-panel-title';
        this.panel.insertBefore(titleElement, this.content);
      }
      titleElement.textContent = title;
    } else if (titleElement) {
      titleElement.remove();
    }
  }
  
  /**
   * Update the panel position
   */
  _updatePosition(positionStr) {
    if (!positionStr) return;
    
    try {
      const [x, y, z] = positionStr.split(',').map(parseFloat);
      this._position = { 
        x: isNaN(x) ? 0 : x, 
        y: isNaN(y) ? 0 : y, 
        z: isNaN(z) ? 0 : z 
      };
    } catch (e) {
      console.error('Invalid position format. Use "x,y,z"', e);
    }
  }
  
  /**
   * Update the panel rotation
   */
  _updateRotation(rotationStr) {
    if (!rotationStr) return;
    
    try {
      const [x, y, z] = rotationStr.split(',').map(parseFloat);
      this._rotation = { 
        x: isNaN(x) ? 0 : x, 
        y: isNaN(y) ? 0 : y, 
        z: isNaN(z) ? 0 : z 
      };
    } catch (e) {
      console.error('Invalid rotation format. Use "x,y,z"', e);
    }
  }
  
  /**
   * Update the panel scale
   */
  _updateScale(scaleStr) {
    if (!scaleStr) return;
    
    try {
      const [x, y, z] = scaleStr.split(',').map(parseFloat);
      this._scale = { 
        x: isNaN(x) ? 1 : x, 
        y: isNaN(y) ? 1 : y, 
        z: isNaN(z) ? 1 : z 
      };
    } catch (e) {
      console.error('Invalid scale format. Use "x,y,z"', e);
    }
  }
  
  /**
   * Update the panel visibility
   */
  _updateVisibility(visible) {
    this._visible = visible !== 'false' && visible !== null;
    this.panel.style.display = this._visible ? 'flex' : 'none';
  }
  
  /**
   * Update the panel in the VR scene
   * This method is called by the WebXR renderer
   */
  update(threeObject, camera, controllers) {
    if (!this.threeObject) {
      this.threeObject = threeObject;
    }
    
    if (!this._visible) {
      threeObject.visible = false;
      return;
    }
    
    threeObject.visible = true;
    
    // Update position based on attachment mode
    if (this._attachedToController && controllers && controllers[this._controllerIndex]) {
      // Attach to controller
      const controller = controllers[this._controllerIndex];
      threeObject.position.copy(controller.position);
      threeObject.quaternion.copy(controller.quaternion);
      
      // Apply offset
      threeObject.translateY(0.05);
      threeObject.translateZ(-0.15);
      threeObject.rotateX(-Math.PI / 4);
    } else if (this._followGaze && camera) {
      // Follow user's gaze
      const cameraDirection = camera.getWorldDirection(new THREE.Vector3());
      const distance = 1.5; // Distance from camera
      
      threeObject.position.copy(camera.position);
      threeObject.position.add(cameraDirection.multiplyScalar(distance));
      
      // Make panel face the user
      threeObject.lookAt(camera.position);
    } else {
      // Use fixed position and rotation
      threeObject.position.set(this._position.x, this._position.y, this._position.z);
      threeObject.rotation.set(
        this._rotation.x * Math.PI / 180,
        this._rotation.y * Math.PI / 180,
        this._rotation.z * Math.PI / 180
      );
    }
    
    // Apply scale
    threeObject.scale.set(this._scale.x, this._scale.y, this._scale.z);
  }
  
  /**
   * Add a button to the panel
   * @param {string} text - Button text
   * @param {Function} onClick - Click handler
   * @returns {HTMLElement} The created button
   */
  addButton(text, onClick) {
    const button = document.createElement('button');
    button.className = 'vr-button';
    button.textContent = text;
    
    if (onClick && typeof onClick === 'function') {
      button.addEventListener('click', onClick);
    }
    
    this.content.appendChild(button);
    return button;
  }
  
  /**
   * Add a slider to the panel
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} value - Initial value
   * @param {Function} onChange - Change handler
   * @param {string} label - Optional label
   * @returns {HTMLElement} The created slider
   */
  addSlider(min, max, value, onChange, label) {
    const container = document.createElement('div');
    container.style.width = '90%';
    container.style.margin = '5px 0';
    
    if (label) {
      const labelElement = document.createElement('div');
      labelElement.textContent = label;
      labelElement.style.marginBottom = '5px';
      labelElement.style.fontSize = '0.9em';
      container.appendChild(labelElement);
    }
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'vr-slider';
    slider.min = min;
    slider.max = max;
    slider.value = value;
    
    if (onChange && typeof onChange === 'function') {
      slider.addEventListener('input', (e) => onChange(parseFloat(e.target.value)));
    }
    
    container.appendChild(slider);
    this.content.appendChild(container);
    return slider;
  }
  
  /**
   * Add a toggle switch to the panel
   * @param {boolean} checked - Initial state
   * @param {Function} onChange - Change handler
   * @param {string} label - Optional label
   * @returns {HTMLElement} The created toggle
   */
  addToggle(checked, onChange, label) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'space-between';
    container.style.width = '90%';
    container.style.margin = '5px 0';
    
    if (label) {
      const labelElement = document.createElement('div');
      labelElement.textContent = label;
      labelElement.style.fontSize = '0.9em';
      container.appendChild(labelElement);
    }
    
    const toggleContainer = document.createElement('label');
    toggleContainer.className = 'vr-toggle';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    
    const slider = document.createElement('span');
    slider.className = 'vr-toggle-slider';
    
    toggleContainer.appendChild(input);
    toggleContainer.appendChild(slider);
    
    if (onChange && typeof onChange === 'function') {
      input.addEventListener('change', (e) => onChange(e.target.checked));
    }
    
    container.appendChild(toggleContainer);
    this.content.appendChild(container);
    return input;
  }
  
  /**
   * Add a text label to the panel
   * @param {string} text - Label text
   * @returns {HTMLElement} The created label
   */
  addLabel(text) {
    const label = document.createElement('div');
    label.textContent = text;
    label.style.margin = '5px 0';
    label.style.textAlign = 'center';
    label.style.width = '90%';
    
    this.content.appendChild(label);
    return label;
  }
  
  /**
   * Clear all content from the panel
   */
  clear() {
    while (this.content.firstChild) {
      this.content.removeChild(this.content.firstChild);
    }
  }
  
  /**
   * Get the position of the panel
   */
  get position() {
    return { ...this._position };
  }
  
  /**
   * Set the position of the panel
   */
  set position(pos) {
    if (pos && typeof pos === 'object') {
      this._position = {
        x: pos.x !== undefined ? pos.x : this._position.x,
        y: pos.y !== undefined ? pos.y : this._position.y,
        z: pos.z !== undefined ? pos.z : this._position.z
      };
      
      this.setAttribute('position', `${this._position.x},${this._position.y},${this._position.z}`);
    }
  }
  
  /**
   * Get the rotation of the panel
   */
  get rotation() {
    return { ...this._rotation };
  }
  
  /**
   * Set the rotation of the panel
   */
  set rotation(rot) {
    if (rot && typeof rot === 'object') {
      this._rotation = {
        x: rot.x !== undefined ? rot.x : this._rotation.x,
        y: rot.y !== undefined ? rot.y : this._rotation.y,
        z: rot.z !== undefined ? rot.z : this._rotation.z
      };
      
      this.setAttribute('rotation', `${this._rotation.x},${this._rotation.y},${this._rotation.z}`);
    }
  }
  
  /**
   * Get the scale of the panel
   */
  get scale() {
    return { ...this._scale };
  }
  
  /**
   * Set the scale of the panel
   */
  set scale(sc) {
    if (sc && typeof sc === 'object') {
      this._scale = {
        x: sc.x !== undefined ? sc.x : this._scale.x,
        y: sc.y !== undefined ? sc.y : this._scale.y,
        z: sc.z !== undefined ? sc.z : this._scale.z
      };
      
      this.setAttribute('scale', `${this._scale.x},${this._scale.y},${this._scale.z}`);
    }
  }
  
  /**
   * Get the visibility of the panel
   */
  get visible() {
    return this._visible;
  }
  
  /**
   * Set the visibility of the panel
   */
  set visible(value) {
    this._visible = !!value;
    this.setAttribute('visible', this._visible.toString());
  }
  
  /**
   * Get whether the panel follows the user's gaze
   */
  get followGaze() {
    return this._followGaze;
  }
  
  /**
   * Set whether the panel follows the user's gaze
   */
  set followGaze(value) {
    this._followGaze = !!value;
    
    if (this._followGaze) {
      this.setAttribute('follow-gaze', '');
      this._attachedToController = false;
      this.removeAttribute('controller-attached');
    } else {
      this.removeAttribute('follow-gaze');
    }
  }
  
  /**
   * Get whether the panel is attached to a controller
   */
  get attachedToController() {
    return this._attachedToController;
  }
  
  /**
   * Set whether the panel is attached to a controller
   */
  set attachedToController(value) {
    this._attachedToController = !!value;
    
    if (this._attachedToController) {
      this.setAttribute('controller-attached', '');
      this._followGaze = false;
      this.removeAttribute('follow-gaze');
    } else {
      this.removeAttribute('controller-attached');
    }
  }
  
  /**
   * Get the controller index
   */
  get controllerIndex() {
    return this._controllerIndex;
  }
  
  /**
   * Set the controller index
   */
  set controllerIndex(value) {
    this._controllerIndex = parseInt(value) || 0;
    this.setAttribute('controller-index', this._controllerIndex.toString());
  }
}

// Register the custom element
customElements.define('vr-ui-panel', VRUIPanel);