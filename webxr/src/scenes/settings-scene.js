/**
 * Settings Scene Component
 * 
 * This component represents the settings scene in the WebXR experience.
 * It provides options to customize the WebXR experience.
 */

import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import '../components/vr-ui-panel.js';
import '../components/vr-button.js';

export class VRSceneSettings extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Add the theme stylesheet
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', '/webxr/src/ui/vr-theme.css');
    
    // Create scene container
    this.container = document.createElement('div');
    this.container.className = 'vr-scene';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    
    // Add to shadow DOM
    this.shadowRoot.appendChild(linkElem);
    this.shadowRoot.appendChild(this.container);
    
    // Scene properties
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controllers = [];
    this.uiElements = [];
    
    // Settings
    this.settings = {
      movementSpeed: 2.0,
      turnSpeed: 30,
      teleportEnabled: true,
      snapTurning: true,
      highQuality: true,
      spatialAudio: true,
      showFPS: false
    };
    
    // Bind methods
    this.initScene = this.initScene.bind(this);
    this.setupEnvironment = this.setupEnvironment.bind(this);
    this.setupUI = this.setupUI.bind(this);
    this.setupControllers = this.setupControllers.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.animate = this.animate.bind(this);
    this.updateQualitySettings = this.updateQualitySettings.bind(this);
  }
  
  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
    // Load saved settings
    this.loadSettings();
    
    // Initialize the scene
    this.initScene();
    
    // Set up the environment
    this.setupEnvironment();
    
    // Set up the UI
    this.setupUI();
    
    // Set up controllers
    this.setupControllers();
    
    // Start animation loop
    this.animate();
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize);
  }
  
  /**
   * Called when the element is removed from the DOM
   */
  disconnectedCallback() {
    // Stop animation loop
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);
    
    // Dispose of resources
    if (this.scene) {
      this.disposeScene(this.scene);
    }
  }
  
  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('webxr-settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('webxr-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
  
  /**
   * Initialize the Three.js scene
   */
  initScene() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x303030); // Medium dark background for settings
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 1.6, 3);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.xr.enabled = true;
    this.container.appendChild(this.renderer.domElement);
    
    // Add VR button
    const vrButton = VRButton.createButton(this.renderer);
    this.container.appendChild(vrButton);
    
    // Apply quality settings
    this.updateQualitySettings();
  }
  
  /**
   * Set up the environment
   */
  setupEnvironment() {
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    this.scene.add(directionalLight);
    
    // Add a floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x606060,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    // Add a grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x404040, 0x404040);
    this.scene.add(gridHelper);
    
    // Add a settings visualization object
    const gearGeometry = new THREE.TorusGeometry(0.5, 0.1, 16, 50);
    const gearMaterial = new THREE.MeshStandardMaterial({
      color: 0xba18aa, // Accent color from theme
      roughness: 0.7,
      metalness: 0.3
    });
    const gear = new THREE.Mesh(gearGeometry, gearMaterial);
    gear.position.set(0, 1.5, -3);
    gear.rotation.x = Math.PI / 2;
    this.scene.add(gear);
    
    // Add animation to the gear
    const animate = () => {
      gear.rotation.z += 0.005;
      requestAnimationFrame(animate);
    };
    animate();
    
    // Add some decorative elements
    const smallGearGeometry = new THREE.TorusGeometry(0.3, 0.05, 16, 50);
    const smallGearMaterial = new THREE.MeshStandardMaterial({
      color: 0xe02337, // Primary color from theme
      roughness: 0.7,
      metalness: 0.3
    });
    
    const smallGear1 = new THREE.Mesh(smallGearGeometry, smallGearMaterial);
    smallGear1.position.set(0.7, 1.5, -3);
    smallGear1.rotation.x = Math.PI / 2;
    this.scene.add(smallGear1);
    
    const smallGear2 = new THREE.Mesh(smallGearGeometry, smallGearMaterial);
    smallGear2.position.set(-0.7, 1.5, -3);
    smallGear2.rotation.x = Math.PI / 2;
    this.scene.add(smallGear2);
    
    // Add animation to the small gears
    const animateSmallGears = () => {
      smallGear1.rotation.z -= 0.01;
      smallGear2.rotation.z -= 0.01;
      requestAnimationFrame(animateSmallGears);
    };
    animateSmallGears();
  }
  
  /**
   * Set up the UI
   */
  setupUI() {
    // Create a settings panel
    const settingsPanel = document.createElement('vr-ui-panel');
    settingsPanel.setAttribute('title', 'Settings');
    settingsPanel.setAttribute('position', '0,1.6,-1');
    settingsPanel.setAttribute('follow-gaze', '');
    
    // Add content to the settings panel
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="margin-bottom: 15px; text-align: center;">
        Customize your WebXR experience.
      </div>
    `;
    settingsPanel.appendChild(content);
    
    // Add navigation buttons
    const homeButton = document.createElement('vr-button');
    homeButton.setAttribute('label', 'Go to Home');
    homeButton.setAttribute('data-route', '/');
    settingsPanel.appendChild(homeButton);
    
    const galleryButton = document.createElement('vr-button');
    galleryButton.setAttribute('label', 'Go to Gallery');
    galleryButton.setAttribute('data-route', '/gallery');
    settingsPanel.appendChild(galleryButton);
    
    // Add the panel to the shadow DOM
    this.shadowRoot.appendChild(settingsPanel);
    this.uiElements.push(settingsPanel);
    
    // Create a movement settings panel
    const movementPanel = document.createElement('vr-ui-panel');
    movementPanel.setAttribute('title', 'Movement Settings');
    movementPanel.setAttribute('position', '-1.5,1.6,-2');
    movementPanel.setAttribute('rotation', '0,30,0');
    
    // Add movement speed slider
    const speedLabel = document.createElement('div');
    speedLabel.textContent = 'Movement Speed';
    speedLabel.style.marginBottom = '5px';
    speedLabel.style.textAlign = 'center';
    movementPanel.appendChild(speedLabel);
    
    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.min = '0.5';
    speedSlider.max = '5';
    speedSlider.step = '0.1';
    speedSlider.value = this.settings.movementSpeed.toString();
    speedSlider.className = 'vr-slider';
    speedSlider.addEventListener('input', (e) => {
      this.settings.movementSpeed = parseFloat(e.target.value);
      this.saveSettings();
    });
    movementPanel.appendChild(speedSlider);
    
    // Add teleportation toggle
    const teleportContainer = document.createElement('div');
    teleportContainer.style.display = 'flex';
    teleportContainer.style.alignItems = 'center';
    teleportContainer.style.justifyContent = 'space-between';
    teleportContainer.style.width = '90%';
    teleportContainer.style.margin = '10px 0';
    
    const teleportLabel = document.createElement('div');
    teleportLabel.textContent = 'Teleportation';
    teleportContainer.appendChild(teleportLabel);
    
    const teleportToggle = document.createElement('label');
    teleportToggle.className = 'vr-toggle';
    
    const teleportInput = document.createElement('input');
    teleportInput.type = 'checkbox';
    teleportInput.checked = this.settings.teleportEnabled;
    teleportInput.addEventListener('change', (e) => {
      this.settings.teleportEnabled = e.target.checked;
      this.saveSettings();
    });
    
    const teleportSlider = document.createElement('span');
    teleportSlider.className = 'vr-toggle-slider';
    
    teleportToggle.appendChild(teleportInput);
    teleportToggle.appendChild(teleportSlider);
    teleportContainer.appendChild(teleportToggle);
    
    movementPanel.appendChild(teleportContainer);
    
    // Add snap turning toggle
    const snapContainer = document.createElement('div');
    snapContainer.style.display = 'flex';
    snapContainer.style.alignItems = 'center';
    snapContainer.style.justifyContent = 'space-between';
    snapContainer.style.width = '90%';
    snapContainer.style.margin = '10px 0';
    
    const snapLabel = document.createElement('div');
    snapLabel.textContent = 'Snap Turning';
    snapContainer.appendChild(snapLabel);
    
    const snapToggle = document.createElement('label');
    snapToggle.className = 'vr-toggle';
    
    const snapInput = document.createElement('input');
    snapInput.type = 'checkbox';
    snapInput.checked = this.settings.snapTurning;
    snapInput.addEventListener('change', (e) => {
      this.settings.snapTurning = e.target.checked;
      this.saveSettings();
    });
    
    const snapSlider = document.createElement('span');
    snapSlider.className = 'vr-toggle-slider';
    
    snapToggle.appendChild(snapInput);
    snapToggle.appendChild(snapSlider);
    snapContainer.appendChild(snapToggle);
    
    movementPanel.appendChild(snapContainer);
    
    // Add turn speed slider
    const turnLabel = document.createElement('div');
    turnLabel.textContent = 'Turn Speed';
    turnLabel.style.marginBottom = '5px';
    turnLabel.style.textAlign = 'center';
    movementPanel.appendChild(turnLabel);
    
    const turnSlider = document.createElement('input');
    turnSlider.type = 'range';
    turnSlider.min = '15';
    turnSlider.max = '60';
    turnSlider.step = '5';
    turnSlider.value = this.settings.turnSpeed.toString();
    turnSlider.className = 'vr-slider';
    turnSlider.addEventListener('input', (e) => {
      this.settings.turnSpeed = parseInt(e.target.value);
      this.saveSettings();
    });
    movementPanel.appendChild(turnSlider);
    
    // Add the panel to the shadow DOM
    this.shadowRoot.appendChild(movementPanel);
    this.uiElements.push(movementPanel);
    
    // Create a visual settings panel
    const visualPanel = document.createElement('vr-ui-panel');
    visualPanel.setAttribute('title', 'Visual Settings');
    visualPanel.setAttribute('position', '1.5,1.6,-2');
    visualPanel.setAttribute('rotation', '0,-30,0');
    
    // Add high quality toggle
    const qualityContainer = document.createElement('div');
    qualityContainer.style.display = 'flex';
    qualityContainer.style.alignItems = 'center';
    qualityContainer.style.justifyContent = 'space-between';
    qualityContainer.style.width = '90%';
    qualityContainer.style.margin = '10px 0';
    
    const qualityLabel = document.createElement('div');
    qualityLabel.textContent = 'High Quality';
    qualityContainer.appendChild(qualityLabel);
    
    const qualityToggle = document.createElement('label');
    qualityToggle.className = 'vr-toggle';
    
    const qualityInput = document.createElement('input');
    qualityInput.type = 'checkbox';
    qualityInput.checked = this.settings.highQuality;
    qualityInput.addEventListener('change', (e) => {
      this.settings.highQuality = e.target.checked;
      this.updateQualitySettings();
      this.saveSettings();
    });
    
    const qualitySlider = document.createElement('span');
    qualitySlider.className = 'vr-toggle-slider';
    
    qualityToggle.appendChild(qualityInput);
    qualityToggle.appendChild(qualitySlider);
    qualityContainer.appendChild(qualityToggle);
    
    visualPanel.appendChild(qualityContainer);
    
    // Add spatial audio toggle
    const audioContainer = document.createElement('div');
    audioContainer.style.display = 'flex';
    audioContainer.style.alignItems = 'center';
    audioContainer.style.justifyContent = 'space-between';
    audioContainer.style.width = '90%';
    audioContainer.style.margin = '10px 0';
    
    const audioLabel = document.createElement('div');
    audioLabel.textContent = 'Spatial Audio';
    audioContainer.appendChild(audioLabel);
    
    const audioToggle = document.createElement('label');
    audioToggle.className = 'vr-toggle';
    
    const audioInput = document.createElement('input');
    audioInput.type = 'checkbox';
    audioInput.checked = this.settings.spatialAudio;
    audioInput.addEventListener('change', (e) => {
      this.settings.spatialAudio = e.target.checked;
      this.saveSettings();
    });
    
    const audioSlider = document.createElement('span');
    audioSlider.className = 'vr-toggle-slider';
    
    audioToggle.appendChild(audioInput);
    audioToggle.appendChild(audioSlider);
    audioContainer.appendChild(audioToggle);
    
    visualPanel.appendChild(audioContainer);
    
    // Add FPS counter toggle
    const fpsContainer = document.createElement('div');
    fpsContainer.style.display = 'flex';
    fpsContainer.style.alignItems = 'center';
    fpsContainer.style.justifyContent = 'space-between';
    fpsContainer.style.width = '90%';
    fpsContainer.style.margin = '10px 0';
    
    const fpsLabel = document.createElement('div');
    fpsLabel.textContent = 'Show FPS Counter';
    fpsContainer.appendChild(fpsLabel);
    
    const fpsToggle = document.createElement('label');
    fpsToggle.className = 'vr-toggle';
    
    const fpsInput = document.createElement('input');
    fpsInput.type = 'checkbox';
    fpsInput.checked = this.settings.showFPS;
    fpsInput.addEventListener('change', (e) => {
      this.settings.showFPS = e.target.checked;
      this.saveSettings();
    });
    
    const fpsSlider = document.createElement('span');
    fpsSlider.className = 'vr-toggle-slider';
    
    fpsToggle.appendChild(fpsInput);
    fpsToggle.appendChild(fpsSlider);
    fpsContainer.appendChild(fpsToggle);
    
    visualPanel.appendChild(fpsContainer);
    
    // Add reset button
    const resetButton = document.createElement('vr-button');
    resetButton.setAttribute('label', 'Reset to Defaults');
    resetButton.setAttribute('data-action', 'reset');
    resetButton.addEventListener('click', () => {
      this.resetSettings();
    });
    visualPanel.appendChild(resetButton);
    
    // Add the panel to the shadow DOM
    this.shadowRoot.appendChild(visualPanel);
    this.uiElements.push(visualPanel);
    
    // Add event listeners for navigation
    this.shadowRoot.addEventListener('click', (event) => {
      const button = event.target.closest('vr-button');
      if (button) {
        const route = button.getAttribute('data-route');
        if (route) {
          // Find the router and navigate
          const router = document.getElementById('vr-router');
          if (router) {
            router.navigate(route);
          }
        }
      }
    });
  }
  
  /**
   * Reset settings to defaults
   */
  resetSettings() {
    this.settings = {
      movementSpeed: 2.0,
      turnSpeed: 30,
      teleportEnabled: true,
      snapTurning: true,
      highQuality: true,
      spatialAudio: true,
      showFPS: false
    };
    
    this.saveSettings();
    
    // Update UI elements
    const speedSlider = this.shadowRoot.querySelector('input[type="range"][min="0.5"]');
    if (speedSlider) {
      speedSlider.value = this.settings.movementSpeed.toString();
    }
    
    const turnSlider = this.shadowRoot.querySelector('input[type="range"][min="15"]');
    if (turnSlider) {
      turnSlider.value = this.settings.turnSpeed.toString();
    }
    
    const teleportInput = this.shadowRoot.querySelector('input[type="checkbox"]');
    if (teleportInput) {
      teleportInput.checked = this.settings.teleportEnabled;
    }
    
    const snapInput = this.shadowRoot.querySelectorAll('input[type="checkbox"]')[1];
    if (snapInput) {
      snapInput.checked = this.settings.snapTurning;
    }
    
    const qualityInput = this.shadowRoot.querySelectorAll('input[type="checkbox"]')[2];
    if (qualityInput) {
      qualityInput.checked = this.settings.highQuality;
    }
    
    const audioInput = this.shadowRoot.querySelectorAll('input[type="checkbox"]')[3];
    if (audioInput) {
      audioInput.checked = this.settings.spatialAudio;
    }
    
    const fpsInput = this.shadowRoot.querySelectorAll('input[type="checkbox"]')[4];
    if (fpsInput) {
      fpsInput.checked = this.settings.showFPS;
    }
    
    // Update quality settings
    this.updateQualitySettings();
  }
  
  /**
   * Update quality settings
   */
  updateQualitySettings() {
    if (!this.renderer) return;
    
    if (this.settings.highQuality) {
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } else {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
    }
  }
  
  /**
   * Set up VR controllers
   */
  setupControllers() {
    const controllerModelFactory = new XRControllerModelFactory();
    
    // Controller 0
    const controller0 = this.renderer.xr.getController(0);
    controller0.addEventListener('selectstart', () => {
      controller0.userData.triggerPressed = true;
    });
    controller0.addEventListener('selectend', () => {
      controller0.userData.triggerPressed = false;
    });
    this.scene.add(controller0);
    this.controllers.push(controller0);
    
    // Controller 0 Grip
    const controllerGrip0 = this.renderer.xr.getControllerGrip(0);
    controllerGrip0.add(controllerModelFactory.createControllerModel(controllerGrip0));
    this.scene.add(controllerGrip0);
    
    // Controller 1
    const controller1 = this.renderer.xr.getController(1);
    controller1.addEventListener('selectstart', () => {
      controller1.userData.triggerPressed = true;
    });
    controller1.addEventListener('selectend', () => {
      controller1.userData.triggerPressed = false;
    });
    this.scene.add(controller1);
    this.controllers.push(controller1);
    
    // Controller 1 Grip
    const controllerGrip1 = this.renderer.xr.getControllerGrip(1);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    this.scene.add(controllerGrip1);
    
    // Controller ray visualization
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1)
    ]);
    
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2
    });
    
    const line = new THREE.Line(geometry, material);
    line.scale.z = 5;
    
    controller0.add(line.clone());
    controller1.add(line.clone());
  }
  
  /**
   * Handle window resize
   */
  onWindowResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }
  
  /**
   * Animation loop
   */
  animate() {
    this.renderer.setAnimationLoop(() => {
      // Update UI elements
      this.uiElements.forEach(element => {
        if (element.update) {
          element.update(element.threeObject, this.camera, this.controllers);
        }
      });
      
      // Render the scene
      this.renderer.render(this.scene, this.camera);
    });
  }
  
  /**
   * Dispose of scene resources
   */
  disposeScene(scene) {
    scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}