/**
 * InputManager
 * Handles user input in both desktop and VR modes
 */

export class InputManager {
  /**
   * Create a new InputManager
   * @param {THREE.Camera} camera - The Three.js camera
   * @param {ControllerManager} controllerManager - The controller manager
   */
  constructor(camera, controllerManager) {
    this.camera = camera;
    this.controllerManager = controllerManager;
    
    // Input state
    this.keys = {};
    this.mouse = {
      x: 0,
      y: 0,
      leftButton: false,
      rightButton: false,
      middleButton: false
    };
    
    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    
    // Camera rotation
    this.rotateX = 0;
    this.rotateY = 0;
    this.isPointerLocked = false;
    
    // Bind methods
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onPointerLockError = this.onPointerLockError.bind(this);
    
    // Initialize input handlers
    this.init();
  }
  
  /**
   * Initialize input handlers
   */
  init() {
    // Add event listeners
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    
    // Pointer lock event listeners
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('pointerlockerror', this.onPointerLockError);
    
    // Add click listener to canvas for pointer lock
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('click', () => {
        if (!this.isPointerLocked) {
          this.requestPointerLock(canvas);
        }
      });
    }
    
    console.log('Input manager initialized');
  }
  
  /**
   * Request pointer lock on an element
   * @param {HTMLElement} element - The element to request pointer lock on
   */
  requestPointerLock(element) {
    element.requestPointerLock = element.requestPointerLock ||
                                element.mozRequestPointerLock ||
                                element.webkitRequestPointerLock;
    
    if (element.requestPointerLock) {
      element.requestPointerLock();
    }
  }
  
  /**
   * Handle pointer lock change event
   */
  onPointerLockChange() {
    this.isPointerLocked = document.pointerLockElement !== null ||
                          document.mozPointerLockElement !== null ||
                          document.webkitPointerLockElement !== null;
    
    console.log(`Pointer lock ${this.isPointerLocked ? 'acquired' : 'released'}`);
  }
  
  /**
   * Handle pointer lock error event
   */
  onPointerLockError() {
    console.error('Pointer lock error');
  }
  
  /**
   * Handle keydown event
   * @param {KeyboardEvent} event - The keydown event
   */
  onKeyDown(event) {
    // Store key state
    this.keys[event.code] = true;
    
    // Update movement flags
    this.updateMovementFlags();
    
    // Handle special keys
    switch (event.code) {
      case 'Escape':
        // Exit pointer lock
        if (this.isPointerLocked) {
          document.exitPointerLock();
        }
        break;
        
      case 'KeyF':
        // Toggle fullscreen
        this.toggleFullscreen();
        break;
        
      case 'KeyR':
        // Reset position
        this.camera.position.set(0, 1.6, 3);
        this.camera.rotation.set(0, 0, 0);
        break;
    }
  }
  
  /**
   * Handle keyup event
   * @param {KeyboardEvent} event - The keyup event
   */
  onKeyUp(event) {
    // Clear key state
    this.keys[event.code] = false;
    
    // Update movement flags
    this.updateMovementFlags();
  }
  
  /**
   * Update movement flags based on key states
   */
  updateMovementFlags() {
    this.moveForward = this.keys['KeyW'] || this.keys['ArrowUp'] || false;
    this.moveBackward = this.keys['KeyS'] || this.keys['ArrowDown'] || false;
    this.moveLeft = this.keys['KeyA'] || this.keys['ArrowLeft'] || false;
    this.moveRight = this.keys['KeyD'] || this.keys['ArrowRight'] || false;
    this.moveUp = this.keys['Space'] || false;
    this.moveDown = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || false;
  }
  
  /**
   * Handle mouse move event
   * @param {MouseEvent} event - The mouse move event
   */
  onMouseMove(event) {
    if (this.isPointerLocked) {
      // Calculate mouse movement
      const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
      const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
      
      // Update rotation values
      this.rotateY -= movementX * 0.002;
      this.rotateX -= movementY * 0.002;
      
      // Clamp vertical rotation to prevent camera flipping
      this.rotateX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotateX));
      
      // Apply rotation to camera
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.x = this.rotateX;
      this.camera.rotation.y = this.rotateY;
    } else {
      // Store mouse position for raycasting
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
  }
  
  /**
   * Handle mouse down event
   * @param {MouseEvent} event - The mouse down event
   */
  onMouseDown(event) {
    switch (event.button) {
      case 0: // Left button
        this.mouse.leftButton = true;
        break;
      case 1: // Middle button
        this.mouse.middleButton = true;
        break;
      case 2: // Right button
        this.mouse.rightButton = true;
        break;
    }
  }
  
  /**
   * Handle mouse up event
   * @param {MouseEvent} event - The mouse up event
   */
  onMouseUp(event) {
    switch (event.button) {
      case 0: // Left button
        this.mouse.leftButton = false;
        break;
      case 1: // Middle button
        this.mouse.middleButton = false;
        break;
      case 2: // Right button
        this.mouse.rightButton = false;
        break;
    }
  }
  
  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
  
  /**
   * Update camera position based on input
   * @param {number} deltaTime - Time since last update in seconds
   */
  updateCamera(deltaTime) {
    if (!this.isPointerLocked) return;
    
    const moveSpeed = 2.0 * deltaTime;
    
    // Calculate movement direction
    const direction = new THREE.Vector3();
    
    // Forward/backward
    if (this.moveForward) {
      direction.z -= 1;
    }
    if (this.moveBackward) {
      direction.z += 1;
    }
    
    // Left/right
    if (this.moveLeft) {
      direction.x -= 1;
    }
    if (this.moveRight) {
      direction.x += 1;
    }
    
    // Up/down
    if (this.moveUp) {
      direction.y += 1;
    }
    if (this.moveDown) {
      direction.y -= 1;
    }
    
    // Normalize direction vector
    if (direction.length() > 0) {
      direction.normalize();
    }
    
    // Move camera in local space
    if (direction.z !== 0) {
      this.camera.translateZ(direction.z * moveSpeed);
    }
    if (direction.x !== 0) {
      this.camera.translateX(direction.x * moveSpeed);
    }
    if (direction.y !== 0) {
      this.camera.translateY(direction.y * moveSpeed);
    }
  }
  
  /**
   * Check if a key is currently pressed
   * @param {string} code - The key code to check
   * @returns {boolean} True if the key is pressed, false otherwise
   */
  isKeyPressed(code) {
    return this.keys[code] === true;
  }
  
  /**
   * Get the current mouse position
   * @returns {Object} The mouse position {x, y}
   */
  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  }
  
  /**
   * Check if a mouse button is currently pressed
   * @param {number} button - The button to check (0 = left, 1 = middle, 2 = right)
   * @returns {boolean} True if the button is pressed, false otherwise
   */
  isMouseButtonPressed(button) {
    switch (button) {
      case 0:
        return this.mouse.leftButton;
      case 1:
        return this.mouse.middleButton;
      case 2:
        return this.mouse.rightButton;
      default:
        return false;
    }
  }
  
  /**
   * Update input state
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Update camera position based on keyboard input
    this.updateCamera(deltaTime);
  }
  
  /**
   * Clean up event listeners
   */
  dispose() {
    // Remove event listeners
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('pointerlockerror', this.onPointerLockError);
    
    console.log('Input manager disposed');
  }
}