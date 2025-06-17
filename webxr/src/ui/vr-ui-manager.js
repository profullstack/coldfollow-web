/**
 * VR UI Manager
 * 
 * This module manages the integration between Web Components and the WebXR scene.
 * It handles the creation, positioning, and interaction of UI elements in VR.
 */

import * as THREE from 'three';
import '../components/vr-ui-panel.js';
import '../components/vr-button.js';

export class VRUIManager {
  /**
   * Create a new VR UI Manager
   * @param {Object} options - Configuration options
   * @param {THREE.Scene} options.scene - The Three.js scene
   * @param {THREE.Camera} options.camera - The Three.js camera
   * @param {Array} options.controllers - Array of VR controllers
   */
  constructor(options = {}) {
    this.scene = options.scene || null;
    this.camera = options.camera || null;
    this.controllers = options.controllers || [];
    
    // Store UI elements
    this.uiElements = new Map();
    
    // Create a group to hold all UI elements
    this.uiGroup = new THREE.Group();
    this.uiGroup.name = 'vr-ui-group';
    
    if (this.scene) {
      this.scene.add(this.uiGroup);
    }
    
    // Raycaster for interaction
    this.raycaster = new THREE.Raycaster();
    this.tempMatrix = new THREE.Matrix4();
    
    // Bind methods
    this.update = this.update.bind(this);
    this.createPanel = this.createPanel.bind(this);
    this.createSettingsPanel = this.createSettingsPanel.bind(this);
    this.handleControllerInteraction = this.handleControllerInteraction.bind(this);
    
    // Initialize
    this._setupEventListeners();
  }
  
  /**
   * Set up event listeners for Web Components
   */
  _setupEventListeners() {
    // Listen for vr-panel-connected events
    document.addEventListener('vr-panel-connected', (event) => {
      const panel = event.detail.panel;
      this._createThreeJSObject(panel);
    });
    
    // Listen for vr-panel-updated events
    document.addEventListener('vr-panel-updated', (event) => {
      const panel = event.detail.panel;
      const threeObject = this.uiElements.get(panel);
      
      if (threeObject && panel.threeObject) {
        panel.update(threeObject, this.camera, this.controllers);
      }
    });
    
    // Listen for vr-click events
    document.addEventListener('vr-click', (event) => {
      console.log('VR Button clicked:', event.detail);
    });
  }
  
  /**
   * Create a Three.js object for a Web Component
   * @param {HTMLElement} element - The Web Component element
   */
  _createThreeJSObject(element) {
    if (!this.scene) return;
    
    // Create a CSS3DObject for the element
    const width = 0.5; // meters
    const height = 0.3; // meters
    
    // Create a plane geometry for the panel
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      opacity: 0.7,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'vr-ui-element-' + Math.random().toString(36).substr(2, 9);
    
    // Store the DOM element reference
    mesh.userData.element = element;
    mesh.userData.width = width;
    mesh.userData.height = height;
    
    // Add to the UI group
    this.uiGroup.add(mesh);
    
    // Store the reference
    this.uiElements.set(element, mesh);
    
    // Set the initial position and rotation
    element.threeObject = mesh;
    element.update(mesh, this.camera, this.controllers);
    
    return mesh;
  }
  
  /**
   * Create a VR UI Panel
   * @param {Object} options - Panel options
   * @param {string} options.title - Panel title
   * @param {Object} options.position - Position {x, y, z}
   * @param {Object} options.rotation - Rotation in degrees {x, y, z}
   * @param {boolean} options.followGaze - Whether the panel should follow the user's gaze
   * @param {boolean} options.attachToController - Whether to attach to a controller
   * @param {number} options.controllerIndex - Controller index (0 or 1)
   * @returns {HTMLElement} The created panel element
   */
  createPanel(options = {}) {
    const panel = document.createElement('vr-ui-panel');
    
    // Set panel attributes
    if (options.title) {
      panel.setAttribute('title', options.title);
    }
    
    if (options.position) {
      panel.setAttribute('position', `${options.position.x},${options.position.y},${options.position.z}`);
    }
    
    if (options.rotation) {
      panel.setAttribute('rotation', `${options.rotation.x},${options.rotation.y},${options.rotation.z}`);
    }
    
    if (options.followGaze) {
      panel.setAttribute('follow-gaze', '');
    }
    
    if (options.attachToController) {
      panel.setAttribute('controller-attached', '');
      panel.setAttribute('controller-index', options.controllerIndex || 0);
    }
    
    // Add to the document
    document.body.appendChild(panel);
    
    return panel;
  }
  
  /**
   * Create a settings panel with common VR settings
   * @param {Object} options - Panel options
   * @returns {HTMLElement} The created panel
   */
  createSettingsPanel(options = {}) {
    const defaultOptions = {
      title: 'VR Settings',
      position: { x: 0, y: 1.6, z: -1 },
      rotation: { x: 0, y: 0, z: 0 },
      followGaze: true
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    const panel = this.createPanel(mergedOptions);
    
    // Add settings controls
    
    // Movement speed slider
    panel.addLabel('Movement Speed');
    panel.addSlider(0.5, 5, 2, (value) => {
      // Update movement speed
      console.log('Movement speed changed:', value);
      // You would typically update your movement controller here
    });
    
    // Teleportation toggle
    panel.addToggle(true, (checked) => {
      // Enable/disable teleportation
      console.log('Teleportation:', checked ? 'enabled' : 'disabled');
      // You would typically update your teleportation controller here
    }, 'Teleportation');
    
    // Snap turning toggle
    panel.addToggle(true, (checked) => {
      // Enable/disable snap turning
      console.log('Snap turning:', checked ? 'enabled' : 'disabled');
      // You would typically update your rotation controller here
    }, 'Snap Turning');
    
    // Snap turn angle slider (only shown if snap turning is enabled)
    panel.addSlider(15, 60, 30, (value) => {
      // Update snap turn angle
      console.log('Snap turn angle changed:', value);
      // You would typically update your rotation controller here
    }, 'Turn Angle (degrees)');
    
    // Add a reset position button
    panel.addButton('Reset Position', () => {
      // Reset the user's position
      console.log('Resetting position');
      // You would typically reset the camera/user position here
    });
    
    // Add a close button
    panel.addButton('Close', () => {
      panel.visible = false;
    });
    
    return panel;
  }
  
  /**
   * Handle controller interaction with UI elements
   * @param {THREE.Object3D} controller - The VR controller
   * @param {boolean} triggerPressed - Whether the trigger is pressed
   */
  handleControllerInteraction(controller, triggerPressed) {
    if (!controller) return;
    
    // Get the controller position and orientation
    this.tempMatrix.identity().extractRotation(controller.matrixWorld);
    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);
    
    // Check for intersections with UI elements
    const intersects = this.raycaster.intersectObjects(this.uiGroup.children);
    
    if (intersects.length > 0) {
      const intersection = intersects[0];
      const object = intersection.object;
      const element = object.userData.element;
      
      // Highlight the intersected element
      object.material.color.set(0x3366ff);
      
      // If trigger is pressed, simulate a click
      if (triggerPressed && element) {
        // Find the point of intersection in local coordinates
        const localPoint = intersection.point.clone()
          .sub(object.position)
          .applyQuaternion(object.quaternion.clone().invert());
          
        // Convert to UV coordinates (range -0.5 to 0.5)
        const u = (localPoint.x / object.userData.width) + 0.5;
        const v = 0.5 - (localPoint.y / object.userData.height);
        
        // Simulate a click at this position
        if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
          // Find the element at this position in the DOM
          // This is a simplified approach - in a real implementation,
          // you would need to do proper hit testing on the DOM elements
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          
          // Dispatch the event on the element
          element.dispatchEvent(clickEvent);
        }
      }
    }
    
    // Reset colors for non-intersected objects
    this.uiGroup.children.forEach(child => {
      if (intersects.length === 0 || intersects[0].object !== child) {
        child.material.color.set(0x000000);
      }
    });
  }
  
  /**
   * Update the UI elements
   * This should be called in the animation loop
   */
  update() {
    // Update all UI elements
    this.uiElements.forEach((threeObject, element) => {
      if (element.update) {
        element.update(threeObject, this.camera, this.controllers);
      }
    });
    
    // Handle controller interaction
    this.controllers.forEach(controller => {
      // Check if the controller has a user data object with trigger state
      const triggerPressed = controller.userData && controller.userData.triggerPressed;
      this.handleControllerInteraction(controller, triggerPressed);
    });
  }
  
  /**
   * Set the scene
   * @param {THREE.Scene} scene - The Three.js scene
   */
  setScene(scene) {
    if (this.scene && this.uiGroup.parent === this.scene) {
      this.scene.remove(this.uiGroup);
    }
    
    this.scene = scene;
    
    if (this.scene) {
      this.scene.add(this.uiGroup);
    }
  }
  
  /**
   * Set the camera
   * @param {THREE.Camera} camera - The Three.js camera
   */
  setCamera(camera) {
    this.camera = camera;
  }
  
  /**
   * Set the controllers
   * @param {Array} controllers - Array of VR controllers
   */
  setControllers(controllers) {
    this.controllers = controllers || [];
  }
}