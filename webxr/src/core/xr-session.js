/**
 * XRSessionManager
 * Manages WebXR sessions, handling initialization, session lifecycle, and reference space creation
 */

export class XRSessionManager {
  /**
   * Create a new XRSessionManager
   * @param {THREE.WebGLRenderer} renderer - The Three.js renderer
   * @param {Object} callbacks - Callback functions
   * @param {Function} callbacks.onSessionStarted - Called when XR session starts
   * @param {Function} callbacks.onSessionEnded - Called when XR session ends
   */
  constructor(renderer, callbacks = {}) {
    this.renderer = renderer;
    this.session = null;
    this.referenceSpace = null;
    this.callbacks = {
      onSessionStarted: callbacks.onSessionStarted || (() => {}),
      onSessionEnded: callbacks.onSessionEnded || (() => {})
    };
    
    // Bind methods
    this.enterVR = this.enterVR.bind(this);
    this.onSessionEnded = this.onSessionEnded.bind(this);
    
    // Initialize VR button
    this.initVRButton();
  }
  
  /**
   * Initialize the VR button
   */
  initVRButton() {
    const vrButton = document.getElementById('vr-button');
    
    // Check if WebXR is supported
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        if (supported) {
          vrButton.disabled = false;
          vrButton.textContent = 'Enter VR';
          vrButton.addEventListener('click', this.enterVR);
        } else {
          vrButton.disabled = true;
          vrButton.textContent = 'VR Not Available';
        }
      });
    } else {
      vrButton.disabled = true;
      vrButton.textContent = 'VR Not Supported';
    }
  }
  
  /**
   * Enter VR mode
   */
  async enterVR() {
    if (this.session) {
      console.warn('VR session already active');
      return;
    }
    
    try {
      // Request a new immersive-vr session
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: [
          'local-floor',
          'bounded-floor',
          'hand-tracking',
          'layers'
        ]
      });
      
      // Set up session
      this.session = session;
      this.renderer.xr.setSession(session);
      
      // Set up session end event
      session.addEventListener('end', this.onSessionEnded);
      
      // Get reference space
      try {
        // Try to get 'local-floor' reference space first
        this.referenceSpace = await session.requestReferenceSpace('local-floor');
        console.log('Using local-floor reference space');
      } catch (error) {
        // Fall back to 'viewer' reference space
        this.referenceSpace = await session.requestReferenceSpace('viewer');
        console.log('Using viewer reference space');
      }
      
      // Call the onSessionStarted callback
      this.callbacks.onSessionStarted(session);
      
      console.log('Entered VR mode');
    } catch (error) {
      console.error('Failed to enter VR mode:', error);
    }
  }
  
  /**
   * Handle XR session end
   */
  onSessionEnded() {
    if (this.session) {
      this.session = null;
      this.referenceSpace = null;
      
      // Call the onSessionEnded callback
      this.callbacks.onSessionEnded();
      
      console.log('Exited VR mode');
    }
  }
  
  /**
   * Exit VR mode
   */
  exitVR() {
    if (this.session) {
      this.session.end();
    }
  }
  
  /**
   * Get the current XR session
   * @returns {XRSession|null} The current XR session or null if not in VR
   */
  getSession() {
    return this.session;
  }
  
  /**
   * Get the current reference space
   * @returns {XRReferenceSpace|null} The current reference space or null if not in VR
   */
  getReferenceSpace() {
    return this.referenceSpace;
  }
  
  /**
   * Check if currently in VR mode
   * @returns {boolean} True if in VR mode, false otherwise
   */
  isInVR() {
    return this.session !== null;
  }
}