/**
 * Home Scene Component
 * 
 * This component represents the home scene in the WebXR experience.
 * It provides a welcome message and navigation options.
 */

import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import '../components/vr-ui-panel.js';
import '../components/vr-button.js';

export class VRSceneHome extends HTMLElement {
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
    
    // Bind methods
    this.initScene = this.initScene.bind(this);
    this.setupEnvironment = this.setupEnvironment.bind(this);
    this.setupUI = this.setupUI.bind(this);
    this.setupControllers = this.setupControllers.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.animate = this.animate.bind(this);
  }
  
  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
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
   * Initialize the Three.js scene
   */
  initScene() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x505050);
    
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
      color: 0x808080,
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
    
    // Add a welcome object
    const welcomeGeometry = new THREE.TorusKnotGeometry(0.5, 0.2, 100, 16);
    const welcomeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe02337, // Using primary color from theme
      roughness: 0.7,
      metalness: 0.3
    });
    const welcomeObject = new THREE.Mesh(welcomeGeometry, welcomeMaterial);
    welcomeObject.position.set(0, 1.5, -3);
    this.scene.add(welcomeObject);
    
    // Add animation to the welcome object
    const animate = () => {
      welcomeObject.rotation.x += 0.01;
      welcomeObject.rotation.y += 0.01;
      requestAnimationFrame(animate);
    };
    animate();
  }
  
  /**
   * Set up the UI
   */
  setupUI() {
    // Create a welcome panel
    const welcomePanel = document.createElement('vr-ui-panel');
    welcomePanel.setAttribute('title', 'Welcome to WebXR');
    welcomePanel.setAttribute('position', '0,1.6,-1');
    welcomePanel.setAttribute('follow-gaze', '');
    
    // Add content to the welcome panel
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="margin-bottom: 15px; text-align: center;">
        Welcome to the WebXR Experience!
      </div>
      <div style="margin-bottom: 15px; text-align: center;">
        This is the Home scene. Explore the environment and navigate to other scenes.
      </div>
    `;
    welcomePanel.appendChild(content);
    
    // Add navigation buttons
    const galleryButton = document.createElement('vr-button');
    galleryButton.setAttribute('label', 'Go to Gallery');
    galleryButton.setAttribute('data-route', '/gallery');
    welcomePanel.appendChild(galleryButton);
    
    const settingsButton = document.createElement('vr-button');
    settingsButton.setAttribute('label', 'Go to Settings');
    settingsButton.setAttribute('data-route', '/settings');
    welcomePanel.appendChild(settingsButton);
    
    // Add the panel to the shadow DOM
    this.shadowRoot.appendChild(welcomePanel);
    this.uiElements.push(welcomePanel);
    
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