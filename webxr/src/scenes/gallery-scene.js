/**
 * Gallery Scene Component
 * 
 * This component represents the gallery scene in the WebXR experience.
 * It displays 3D models and images in a virtual gallery.
 */

import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import '../components/vr-ui-panel.js';
import '../components/vr-button.js';

export class VRSceneGallery extends HTMLElement {
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
    this.galleryItems = [];
    this.currentItemIndex = 0;
    
    // Bind methods
    this.initScene = this.initScene.bind(this);
    this.setupEnvironment = this.setupEnvironment.bind(this);
    this.setupGalleryItems = this.setupGalleryItems.bind(this);
    this.setupUI = this.setupUI.bind(this);
    this.setupControllers = this.setupControllers.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.animate = this.animate.bind(this);
    this.showNextItem = this.showNextItem.bind(this);
    this.showPreviousItem = this.showPreviousItem.bind(this);
  }
  
  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
    // Initialize the scene
    this.initScene();
    
    // Set up the environment
    this.setupEnvironment();
    
    // Set up gallery items
    this.setupGalleryItems();
    
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
    this.scene.background = new THREE.Color(0x202020); // Darker background for gallery
    
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
    
    // Add spotlights for gallery items
    const spotLight1 = new THREE.SpotLight(0xffffff, 1);
    spotLight1.position.set(0, 3, 0);
    spotLight1.angle = Math.PI / 6;
    spotLight1.penumbra = 0.2;
    spotLight1.decay = 2;
    spotLight1.distance = 10;
    spotLight1.castShadow = true;
    this.scene.add(spotLight1);
    
    const spotLight2 = new THREE.SpotLight(0xffffff, 0.5);
    spotLight2.position.set(5, 3, 0);
    spotLight2.angle = Math.PI / 6;
    spotLight2.penumbra = 0.2;
    spotLight2.decay = 2;
    spotLight2.distance = 10;
    spotLight2.castShadow = true;
    this.scene.add(spotLight2);
    
    const spotLight3 = new THREE.SpotLight(0xffffff, 0.5);
    spotLight3.position.set(-5, 3, 0);
    spotLight3.angle = Math.PI / 6;
    spotLight3.penumbra = 0.2;
    spotLight3.decay = 2;
    spotLight3.distance = 10;
    spotLight3.castShadow = true;
    this.scene.add(spotLight3);
    
    // Add a floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    // Add gallery walls
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2
    });
    
    // Back wall
    const backWallGeometry = new THREE.BoxGeometry(10, 4, 0.2);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, 2, -5);
    this.scene.add(backWall);
    
    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(0.2, 4, 10);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-5, 2, 0);
    this.scene.add(leftWall);
    
    // Right wall
    const rightWallGeometry = new THREE.BoxGeometry(0.2, 4, 10);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.set(5, 2, 0);
    this.scene.add(rightWall);
  }
  
  /**
   * Set up gallery items
   */
  setupGalleryItems() {
    // Create a group to hold gallery items
    this.galleryGroup = new THREE.Group();
    this.scene.add(this.galleryGroup);
    
    // Create gallery items
    this.createGalleryItem(0, new THREE.TorusKnotGeometry(0.5, 0.2, 100, 16), 
                          new THREE.MeshStandardMaterial({ 
                            color: 0xfc7e3e, // Secondary color from theme
                            roughness: 0.7, 
                            metalness: 0.3 
                          }));
    
    this.createGalleryItem(1, new THREE.IcosahedronGeometry(0.5, 2), 
                          new THREE.MeshStandardMaterial({ 
                            color: 0xe02337, // Primary color from theme
                            roughness: 0.7, 
                            metalness: 0.3 
                          }));
    
    this.createGalleryItem(2, new THREE.OctahedronGeometry(0.5, 2), 
                          new THREE.MeshStandardMaterial({ 
                            color: 0xba18aa, // Accent color from theme
                            roughness: 0.7, 
                            metalness: 0.3 
                          }));
    
    // Show the first item
    this.showGalleryItem(0);
  }
  
  /**
   * Create a gallery item
   * @param {number} index - The index of the item
   * @param {THREE.BufferGeometry} geometry - The geometry of the item
   * @param {THREE.Material} material - The material of the item
   */
  createGalleryItem(index, geometry, material) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(0, 1.5, -3);
    item.castShadow = true;
    item.visible = false;
    
    // Add to gallery group
    this.galleryGroup.add(item);
    this.galleryItems.push(item);
    
    // Add animation to the item
    const animate = () => {
      item.rotation.x += 0.01;
      item.rotation.y += 0.01;
      requestAnimationFrame(animate);
    };
    animate();
  }
  
  /**
   * Show a specific gallery item
   * @param {number} index - The index of the item to show
   */
  showGalleryItem(index) {
    // Hide all items
    this.galleryItems.forEach(item => {
      item.visible = false;
    });
    
    // Show the selected item
    if (index >= 0 && index < this.galleryItems.length) {
      this.galleryItems[index].visible = true;
      this.currentItemIndex = index;
      
      // Update the item info panel
      this.updateItemInfoPanel();
    }
  }
  
  /**
   * Show the next gallery item
   */
  showNextItem() {
    const nextIndex = (this.currentItemIndex + 1) % this.galleryItems.length;
    this.showGalleryItem(nextIndex);
  }
  
  /**
   * Show the previous gallery item
   */
  showPreviousItem() {
    const prevIndex = (this.currentItemIndex - 1 + this.galleryItems.length) % this.galleryItems.length;
    this.showGalleryItem(prevIndex);
  }
  
  /**
   * Update the item info panel
   */
  updateItemInfoPanel() {
    const itemNames = ['Torus Knot', 'Icosahedron', 'Octahedron'];
    const itemDescriptions = [
      'A torus knot is a knot that lies on the surface of a torus.',
      'A regular icosahedron is a convex polyhedron with 20 triangular faces.',
      'A regular octahedron is a polyhedron with 8 triangular faces.'
    ];
    
    // Update the item info panel
    const itemInfoPanel = this.shadowRoot.querySelector('#item-info-panel');
    if (itemInfoPanel) {
      const nameElement = itemInfoPanel.querySelector('.item-name');
      const descElement = itemInfoPanel.querySelector('.item-description');
      const indexElement = itemInfoPanel.querySelector('.item-index');
      
      if (nameElement) {
        nameElement.textContent = itemNames[this.currentItemIndex];
      }
      
      if (descElement) {
        descElement.textContent = itemDescriptions[this.currentItemIndex];
      }
      
      if (indexElement) {
        indexElement.textContent = `${this.currentItemIndex + 1} / ${this.galleryItems.length}`;
      }
    }
  }
  
  /**
   * Set up the UI
   */
  setupUI() {
    // Create a gallery panel
    const galleryPanel = document.createElement('vr-ui-panel');
    galleryPanel.setAttribute('title', 'Gallery');
    galleryPanel.setAttribute('position', '0,1.6,-1');
    galleryPanel.setAttribute('follow-gaze', '');
    
    // Add content to the gallery panel
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="margin-bottom: 15px; text-align: center;">
        This is the Gallery scene. Browse through 3D models.
      </div>
    `;
    galleryPanel.appendChild(content);
    
    // Add navigation buttons
    const homeButton = document.createElement('vr-button');
    homeButton.setAttribute('label', 'Go to Home');
    homeButton.setAttribute('data-route', '/');
    galleryPanel.appendChild(homeButton);
    
    const settingsButton = document.createElement('vr-button');
    settingsButton.setAttribute('label', 'Go to Settings');
    settingsButton.setAttribute('data-route', '/settings');
    galleryPanel.appendChild(settingsButton);
    
    // Add the panel to the shadow DOM
    this.shadowRoot.appendChild(galleryPanel);
    this.uiElements.push(galleryPanel);
    
    // Create an item info panel
    const itemInfoPanel = document.createElement('vr-ui-panel');
    itemInfoPanel.setAttribute('id', 'item-info-panel');
    itemInfoPanel.setAttribute('title', 'Item Information');
    itemInfoPanel.setAttribute('position', '2,1.6,-3');
    itemInfoPanel.setAttribute('rotation', '0,-30,0');
    
    // Add content to the item info panel
    const itemInfoContent = document.createElement('div');
    itemInfoContent.innerHTML = `
      <div class="item-name" style="margin-bottom: 10px; font-weight: bold; text-align: center;"></div>
      <div class="item-description" style="margin-bottom: 15px; text-align: center;"></div>
      <div class="item-index" style="margin-bottom: 15px; text-align: center;"></div>
    `;
    itemInfoPanel.appendChild(itemInfoContent);
    
    // Add navigation buttons
    const prevButton = document.createElement('vr-button');
    prevButton.setAttribute('label', 'Previous');
    prevButton.setAttribute('data-action', 'prev');
    itemInfoPanel.appendChild(prevButton);
    
    const nextButton = document.createElement('vr-button');
    nextButton.setAttribute('label', 'Next');
    nextButton.setAttribute('data-action', 'next');
    itemInfoPanel.appendChild(nextButton);
    
    // Add the panel to the shadow DOM
    this.shadowRoot.appendChild(itemInfoPanel);
    this.uiElements.push(itemInfoPanel);
    
    // Add event listeners for navigation and gallery controls
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
        
        const action = button.getAttribute('data-action');
        if (action === 'prev') {
          this.showPreviousItem();
        } else if (action === 'next') {
          this.showNextItem();
        }
      }
    });
    
    // Initialize the item info panel
    this.updateItemInfoPanel();
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