/**
 * ControllerManager
 * Manages VR controllers, input handling, and interaction with the virtual environment
 */

export class ControllerManager {
  /**
   * Create a new ControllerManager
   * @param {THREE.Scene} scene - The Three.js scene
   * @param {THREE.WebGLRenderer} renderer - The Three.js renderer
   * @param {THREE.Camera} camera - The Three.js camera
   * @param {Object} settings - Application settings
   */
  constructor(scene, renderer, camera, settings) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.settings = settings;
    
    // Controllers
    this.controllers = [];
    this.controllerGrips = [];
    this.raycaster = new THREE.Raycaster();
    
    // Controller models
    this.controllerModelFactory = null;
    
    // Teleportation
    this.teleportTarget = null;
    this.isTeleporting = false;
    this.teleportMarker = null;
    
    // Interaction
    this.interactables = [];
    this.selectedObject = null;
    
    // Controller state
    this.controllerState = {
      left: {
        trigger: false,
        grip: false,
        thumbstick: { x: 0, y: 0 },
        thumbstickPressed: false,
        buttons: {}
      },
      right: {
        trigger: false,
        grip: false,
        thumbstick: { x: 0, y: 0 },
        thumbstickPressed: false,
        buttons: {}
      }
    };
    
    // Bind methods
    this.onSelectStart = this.onSelectStart.bind(this);
    this.onSelectEnd = this.onSelectEnd.bind(this);
    this.onSqueezeStart = this.onSqueezeStart.bind(this);
    this.onSqueezeEnd = this.onSqueezeEnd.bind(this);
  }
  
  /**
   * Initialize controllers when XR session starts
   * @param {XRSession} session - The WebXR session
   */
  onXRSessionStarted(session) {
    console.log('Initializing VR controllers');
    
    // Load controller model factory
    this.loadControllerModels();
    
    // Set up controllers
    this.setupControllers();
    
    // Create teleport marker
    this.createTeleportMarker();
  }
  
  /**
   * Clean up controllers when XR session ends
   */
  onXRSessionEnded() {
    console.log('Cleaning up VR controllers');
    
    // Remove controllers from scene
    this.controllers.forEach((controller) => {
      this.scene.remove(controller);
    });
    
    this.controllerGrips.forEach((grip) => {
      this.scene.remove(grip);
    });
    
    // Clear arrays
    this.controllers = [];
    this.controllerGrips = [];
    
    // Remove teleport marker
    if (this.teleportMarker) {
      this.scene.remove(this.teleportMarker);
      this.teleportMarker = null;
    }
  }
  
  /**
   * Load controller models
   */
  loadControllerModels() {
    // Create controller model factory
    this.controllerModelFactory = new THREE.XRControllerModelFactory();
  }
  
  /**
   * Set up VR controllers
   */
  setupControllers() {
    // Create controllers
    for (let i = 0; i < 2; i++) {
      // Controller
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('selectstart', this.onSelectStart);
      controller.addEventListener('selectend', this.onSelectEnd);
      controller.addEventListener('squeezestart', this.onSqueezeStart);
      controller.addEventListener('squeezeend', this.onSqueezeEnd);
      controller.addEventListener('connected', (event) => {
        this.buildController(controller, event.data);
      });
      controller.addEventListener('disconnected', () => {
        controller.remove(controller.children[0]);
      });
      this.scene.add(controller);
      this.controllers.push(controller);
      
      // Controller grip
      const controllerGrip = this.renderer.xr.getControllerGrip(i);
      const controllerModel = this.controllerModelFactory.createControllerModel(controllerGrip);
      controllerGrip.add(controllerModel);
      this.scene.add(controllerGrip);
      this.controllerGrips.push(controllerGrip);
    }
  }
  
  /**
   * Build controller visual representation
   * @param {THREE.Group} controller - The controller object
   * @param {Object} data - Controller data
   */
  buildController(controller, data) {
    let geometry, material;
    
    // Create controller visual based on handedness
    switch (data.targetRayMode) {
      case 'tracked-pointer':
        // Controller with pointer
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 1], 3));
        
        material = new THREE.LineBasicMaterial({
          vertexColors: true,
          blending: THREE.AdditiveBlending
        });
        
        controller.add(new THREE.Line(geometry, material));
        break;
        
      case 'gaze':
        // Gaze-based controller (reticle)
        geometry = new THREE.RingGeometry(0.02, 0.04, 32).translate(0, 0, -1);
        material = new THREE.MeshBasicMaterial({
          opacity: 0.5,
          transparent: true
        });
        
        controller.add(new THREE.Mesh(geometry, material));
        break;
    }
    
    // Store handedness
    controller.userData.handedness = data.handedness;
  }
  
  /**
   * Create teleport marker
   */
  createTeleportMarker() {
    // Create a ring to show teleport target
    const geometry = new THREE.RingGeometry(0.15, 0.2, 32);
    geometry.rotateX(-Math.PI / 2); // Make it horizontal
    
    const material = new THREE.MeshBasicMaterial({
      color: 0x0077ff,
      opacity: 0.5,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    this.teleportMarker = new THREE.Mesh(geometry, material);
    this.teleportMarker.visible = false;
    this.scene.add(this.teleportMarker);
  }
  
  /**
   * Handle controller select start event (trigger press)
   * @param {Event} event - The select start event
   */
  onSelectStart(event) {
    const controller = event.target;
    const handedness = controller.userData.handedness;
    
    // Update controller state
    this.controllerState[handedness].trigger = true;
    
    // Start teleportation with right controller
    if (handedness === 'right') {
      this.isTeleporting = true;
    }
    
    // Interaction with left controller
    if (handedness === 'left') {
      this.checkInteraction(controller);
    }
  }
  
  /**
   * Handle controller select end event (trigger release)
   * @param {Event} event - The select end event
   */
  onSelectEnd(event) {
    const controller = event.target;
    const handedness = controller.userData.handedness;
    
    // Update controller state
    this.controllerState[handedness].trigger = false;
    
    // Complete teleportation with right controller
    if (handedness === 'right' && this.isTeleporting) {
      this.completeTeleport();
    }
    
    // End interaction with left controller
    if (handedness === 'left' && this.selectedObject) {
      this.endInteraction();
    }
  }
  
  /**
   * Handle controller squeeze start event (grip press)
   * @param {Event} event - The squeeze start event
   */
  onSqueezeStart(event) {
    const controller = event.target;
    const handedness = controller.userData.handedness;
    
    // Update controller state
    this.controllerState[handedness].grip = true;
    
    // Toggle settings panel with left controller
    if (handedness === 'left') {
      const settingsPanel = document.getElementById('settings-panel');
      settingsPanel.classList.toggle('hidden');
    }
  }
  
  /**
   * Handle controller squeeze end event (grip release)
   * @param {Event} event - The squeeze end event
   */
  onSqueezeEnd(event) {
    const controller = event.target;
    const handedness = controller.userData.handedness;
    
    // Update controller state
    this.controllerState[handedness].grip = false;
  }
  
  /**
   * Check for interaction with objects
   * @param {THREE.Group} controller - The controller
   */
  checkInteraction(controller) {
    // Create raycaster from controller
    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(controller.matrixWorld);
    
    // Check for intersections with interactable objects
    const intersects = this.raycaster.intersectObjects(this.interactables);
    
    if (intersects.length > 0) {
      this.selectedObject = intersects[0].object;
      
      // Highlight selected object
      if (this.selectedObject.material) {
        this.selectedObject.userData.originalColor = this.selectedObject.material.color.clone();
        this.selectedObject.material.color.set(0xffff00);
      }
      
      console.log('Selected object:', this.selectedObject.name || 'unnamed object');
    }
  }
  
  /**
   * End interaction with selected object
   */
  endInteraction() {
    // Restore original color
    if (this.selectedObject && this.selectedObject.material && this.selectedObject.userData.originalColor) {
      this.selectedObject.material.color.copy(this.selectedObject.userData.originalColor);
    }
    
    this.selectedObject = null;
  }
  
  /**
   * Update teleport target based on controller direction
   * @param {THREE.Group} controller - The controller
   */
  updateTeleportTarget(controller) {
    // Create raycaster from controller
    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(controller.matrixWorld);
    
    // Check for intersection with the ground
    const intersects = this.raycaster.intersectObjects([this.scene.getObjectByName('ground')]);
    
    if (intersects.length > 0) {
      // Found valid teleport target
      this.teleportTarget = intersects[0].point;
      
      // Update teleport marker position
      this.teleportMarker.position.copy(this.teleportTarget);
      this.teleportMarker.visible = true;
    } else {
      // No valid teleport target
      this.teleportTarget = null;
      this.teleportMarker.visible = false;
    }
  }
  
  /**
   * Complete teleportation
   */
  completeTeleport() {
    if (this.teleportTarget) {
      // Teleport the user to the target position
      // Note: We only change the x and z coordinates to maintain the user's height
      this.camera.position.x = this.teleportTarget.x;
      this.camera.position.z = this.teleportTarget.z;
      
      console.log(`Teleported to: ${this.teleportTarget.x.toFixed(2)}, ${this.teleportTarget.z.toFixed(2)}`);
    }
    
    // Reset teleport state
    this.isTeleporting = false;
    this.teleportMarker.visible = false;
    this.teleportTarget = null;
  }
  
  /**
   * Register an object as interactable
   * @param {THREE.Object3D} object - The object to make interactable
   */
  registerInteractable(object) {
    if (!this.interactables.includes(object)) {
      this.interactables.push(object);
      console.log(`Registered interactable: ${object.name || 'unnamed object'}`);
    }
  }
  
  /**
   * Unregister an object as interactable
   * @param {THREE.Object3D} object - The object to remove from interactables
   */
  unregisterInteractable(object) {
    const index = this.interactables.indexOf(object);
    if (index !== -1) {
      this.interactables.splice(index, 1);
      console.log(`Unregistered interactable: ${object.name || 'unnamed object'}`);
    }
  }
  
  /**
   * Update controller settings
   * @param {Object} settings - The new settings
   */
  updateSettings(settings) {
    this.settings = settings;
    
    // Apply settings to controllers
    // For example, adjust teleport marker color based on settings
    if (this.teleportMarker) {
      const material = this.teleportMarker.material;
      
      // Adjust teleport marker based on comfort mode
      if (settings.comfortMode) {
        material.color.set(0x00ff00); // Green for comfort mode
      } else {
        material.color.set(0x0077ff); // Blue for normal mode
      }
    }
  }
  
  /**
   * Update controllers
   * @param {number} timestamp - The current timestamp
   * @param {XRFrame} frame - The current XR frame (if in XR mode)
   */
  update(timestamp, frame) {
    // Skip if no controllers
    if (this.controllers.length === 0) return;
    
    // Update controller inputs from gamepad if available
    if (frame) {
      this.updateControllerInputs(frame);
    }
    
    // Update teleport target if teleporting
    if (this.isTeleporting) {
      this.updateTeleportTarget(this.controllers[1]); // Right controller
    }
    
    // Update selected object if interacting
    if (this.selectedObject) {
      // Example: rotate the selected object
      this.selectedObject.rotation.y += 0.01;
    }
  }
  
  /**
   * Update controller inputs from gamepad data
   * @param {XRFrame} frame - The current XR frame
   */
  updateControllerInputs(frame) {
    // Get input sources
    const session = frame.session;
    const inputSources = Array.from(session.inputSources);
    
    // Update each input source
    inputSources.forEach((inputSource) => {
      if (!inputSource.gamepad) return;
      
      const handedness = inputSource.handedness;
      if (handedness !== 'left' && handedness !== 'right') return;
      
      const gamepad = inputSource.gamepad;
      const state = this.controllerState[handedness];
      
      // Update thumbstick values
      if (gamepad.axes.length >= 2) {
        state.thumbstick.x = gamepad.axes[0];
        state.thumbstick.y = gamepad.axes[1];
      }
      
      // Update buttons
      gamepad.buttons.forEach((button, index) => {
        state.buttons[`button${index}`] = button.pressed;
        
        // Thumbstick press is usually button 3
        if (index === 3) {
          state.thumbstickPressed = button.pressed;
        }
      });
      
      // Handle thumbstick movement for smooth locomotion or snap turning
      this.handleThumbstickMovement(handedness, state.thumbstick);
    });
  }
  
  /**
   * Handle thumbstick movement for locomotion or turning
   * @param {string} handedness - The controller handedness ('left' or 'right')
   * @param {Object} thumbstick - The thumbstick values {x, y}
   */
  handleThumbstickMovement(handedness, thumbstick) {
    // Apply deadzone to prevent drift
    const deadzone = 0.15;
    const x = Math.abs(thumbstick.x) > deadzone ? thumbstick.x : 0;
    const y = Math.abs(thumbstick.y) > deadzone ? thumbstick.y : 0;
    
    if (handedness === 'left') {
      // Left thumbstick controls movement
      if (y !== 0) {
        // Move forward/backward
        const moveSpeed = this.settings.movementSpeed * 0.05;
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        direction.y = 0; // Keep movement horizontal
        direction.normalize();
        
        this.camera.position.addScaledVector(direction, -y * moveSpeed);
      }
      
      if (x !== 0) {
        // Strafe left/right
        const moveSpeed = this.settings.movementSpeed * 0.05;
        const direction = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        direction.y = 0; // Keep movement horizontal
        direction.normalize();
        
        this.camera.position.addScaledVector(direction, x * moveSpeed);
      }
    } else if (handedness === 'right') {
      // Right thumbstick controls rotation
      if (x !== 0) {
        if (this.settings.snapTurning) {
          // Snap turning
          // Only apply when thumbstick crosses threshold
          const snapAngle = Math.PI / 6; // 30 degrees
          const snapThreshold = 0.6;
          
          // Store previous value to detect crossing threshold
          const prevX = this.controllerState.right.prevThumbstickX || 0;
          this.controllerState.right.prevThumbstickX = x;
          
          if (Math.abs(x) > snapThreshold && Math.abs(prevX) <= snapThreshold) {
            // Rotate camera around Y axis
            const rotationMatrix = new THREE.Matrix4().makeRotationY(x > 0 ? -snapAngle : snapAngle);
            this.camera.applyMatrix4(rotationMatrix);
          }
        } else {
          // Smooth turning
          const turnSpeed = 0.02;
          const rotationMatrix = new THREE.Matrix4().makeRotationY(x * turnSpeed);
          this.camera.applyMatrix4(rotationMatrix);
        }
      }
    }
  }
}