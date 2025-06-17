/**
 * Main entry point for the WebXR experience
 * This file initializes the Three.js scene, WebXR session, and coordinates all components
 */

import { XRSessionManager } from './xr-session.js';
import { EnvironmentManager } from './environment.js';
import { ControllerManager } from './controllers.js';
import { UIManager } from '../ui/ui-panel.js';
import { InputManager } from '../utils/input-manager.js';
import { PerformanceMonitor } from '../utils/performance-monitor.js';
import { AudioManager } from '../audio/audio-manager.js';
import { NetworkManager } from '../network/multiplayer.js';

class WebXRApp {
  constructor() {
    // Core components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    
    // Managers
    this.xrSessionManager = null;
    this.environmentManager = null;
    this.controllerManager = null;
    this.uiManager = null;
    this.inputManager = null;
    this.performanceMonitor = null;
    this.audioManager = null;
    this.networkManager = null;
    
    // Settings
    this.settings = {
      quality: 'medium',
      movementSpeed: 1.0,
      comfortMode: true,
      snapTurning: true
    };
    
    // State
    this.isInitialized = false;
    this.isXRActive = false;
    
    // Bind methods
    this.update = this.update.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onXRSessionStarted = this.onXRSessionStarted.bind(this);
    this.onXRSessionEnded = this.onXRSessionEnded.bind(this);
    
    // Initialize the application
    this.init();
  }
  
  /**
   * Initialize the WebXR application
   */
  async init() {
    try {
      // Wait for Three.js to load
      await this.waitForThreeJS();
      
      // Create the scene, camera, and renderer
      this.createScene();
      
      // Initialize managers
      this.initializeManagers();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start the render loop
      this.update();
      
      // Hide loading overlay
      this.hideLoadingOverlay();
      
      this.isInitialized = true;
      console.log('WebXR application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebXR application:', error);
      this.showErrorMessage('Failed to initialize the WebXR experience. Please try again later.');
    }
  }
  
  /**
   * Wait for Three.js to load
   */
  waitForThreeJS() {
    return new Promise((resolve) => {
      const checkThree = () => {
        if (window.THREE) {
          resolve();
        } else {
          setTimeout(checkThree, 100);
        }
      };
      checkThree();
    });
  }
  
  /**
   * Create the Three.js scene, camera, and renderer
   */
  createScene() {
    // Create scene
    this.scene = new THREE.Scene();
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    this.camera.position.set(0, 1.6, 3);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    this.renderer.shadowMap.enabled = true;
    
    // Add renderer to DOM
    document.getElementById('container').appendChild(this.renderer.domElement);
  }
  
  /**
   * Initialize all manager components
   */
  initializeManagers() {
    // Initialize XR session manager
    this.xrSessionManager = new XRSessionManager(this.renderer, {
      onSessionStarted: this.onXRSessionStarted,
      onSessionEnded: this.onXRSessionEnded
    });
    
    // Initialize environment manager
    this.environmentManager = new EnvironmentManager(this.scene, this.camera, this.settings);
    
    // Initialize controller manager
    this.controllerManager = new ControllerManager(
      this.scene, 
      this.renderer, 
      this.camera,
      this.settings
    );
    
    // Initialize UI manager
    this.uiManager = new UIManager(this.settings, {
      onSettingsChanged: this.applySettings.bind(this),
      onVRButtonClicked: this.xrSessionManager.enterVR.bind(this.xrSessionManager)
    });
    
    // Initialize input manager
    this.inputManager = new InputManager(this.camera, this.controllerManager);
    
    // Initialize performance monitor
    this.performanceMonitor = new PerformanceMonitor(
      document.getElementById('performance-stats')
    );
    
    // Initialize audio manager
    this.audioManager = new AudioManager(this.camera, this.scene);
    
    // Initialize network manager (optional)
    this.networkManager = new NetworkManager();
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Window resize event
    window.addEventListener('resize', this.onWindowResize);
    
    // Settings panel events
    document.getElementById('quality-setting').addEventListener('change', (e) => {
      this.settings.quality = e.target.value;
      this.applySettings();
    });
    
    document.getElementById('movement-speed').addEventListener('input', (e) => {
      this.settings.movementSpeed = parseFloat(e.target.value);
      this.applySettings();
    });
    
    document.getElementById('comfort-mode').addEventListener('change', (e) => {
      this.settings.comfortMode = e.target.checked;
      this.applySettings();
    });
    
    document.getElementById('snap-turning').addEventListener('change', (e) => {
      this.settings.snapTurning = e.target.checked;
      this.applySettings();
    });
    
    document.getElementById('close-settings').addEventListener('click', () => {
      document.getElementById('settings-panel').classList.add('hidden');
    });
  }
  
  /**
   * Apply settings changes to all components
   */
  applySettings() {
    this.environmentManager.updateQuality(this.settings.quality);
    this.controllerManager.updateSettings(this.settings);
    
    // Apply comfort mode settings
    if (this.isXRActive) {
      // Apply VR-specific settings
    }
    
    console.log('Applied settings:', this.settings);
  }
  
  /**
   * Handle window resize event
   */
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  /**
   * Handle XR session start
   * @param {XRSession} session - The WebXR session
   */
  onXRSessionStarted(session) {
    this.isXRActive = true;
    console.log('XR session started');
    
    // Hide 2D UI elements
    this.uiManager.hideUIForVR();
    
    // Apply VR-specific settings
    this.applySettings();
    
    // Notify other managers
    this.environmentManager.onXRSessionStarted(session);
    this.controllerManager.onXRSessionStarted(session);
    this.audioManager.onXRSessionStarted(session);
  }
  
  /**
   * Handle XR session end
   */
  onXRSessionEnded() {
    this.isXRActive = false;
    console.log('XR session ended');
    
    // Show 2D UI elements
    this.uiManager.showUIAfterVR();
    
    // Notify other managers
    this.environmentManager.onXRSessionEnded();
    this.controllerManager.onXRSessionEnded();
    this.audioManager.onXRSessionEnded();
  }
  
  /**
   * Main update loop
   * @param {number} timestamp - The current timestamp
   * @param {XRFrame} frame - The current XR frame (if in XR mode)
   */
  update(timestamp, frame) {
    // Request next animation frame
    this.renderer.setAnimationLoop(this.update);
    
    if (this.isInitialized) {
      // Update performance monitor
      this.performanceMonitor.update();
      
      // Update managers
      if (this.isXRActive && frame) {
        // XR-specific updates
        this.controllerManager.update(timestamp, frame);
        this.environmentManager.update(timestamp, frame);
      } else {
        // Non-XR updates
        this.controllerManager.update(timestamp);
        this.environmentManager.update(timestamp);
      }
      
      // Update audio
      this.audioManager.update(this.camera.position);
      
      // Update network state (if multiplayer)
      this.networkManager.update();
      
      // Render the scene
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  /**
   * Hide the loading overlay
   */
  hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 500);
  }
  
  /**
   * Show error message
   * @param {string} message - The error message to display
   */
  showErrorMessage(message) {
    const overlay = document.getElementById('loading-overlay');
    const loader = overlay.querySelector('.loader');
    const loadingText = overlay.querySelector('.loading-text');
    
    loader.style.display = 'none';
    loadingText.textContent = message;
    loadingText.style.color = 'var(--accent-color)';
  }
}

// Create and initialize the WebXR application
document.addEventListener('DOMContentLoaded', () => {
  // Check if WebXR is supported
  if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
      if (!supported) {
        document.getElementById('no-webxr').classList.remove('hidden');
        document.getElementById('loading-overlay').style.display = 'none';
      } else {
        // Initialize the WebXR application
        window.webXRApp = new WebXRApp();
      }
    });
  } else {
    document.getElementById('no-webxr').classList.remove('hidden');
    document.getElementById('loading-overlay').style.display = 'none';
  }
});