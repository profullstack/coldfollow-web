/**
 * WebXR UI Components Example
 * 
 * This example demonstrates how to use Web Components in a WebXR application.
 * It shows how to create UI panels, buttons, and other interactive elements in VR.
 */

import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { VRUIManager } from '../src/ui/vr-ui-manager.js';

// Main application class
class WebXRUIExample {
  constructor() {
    this.container = document.createElement('div');
    document.body.appendChild(this.container);
    
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
    document.body.appendChild(VRButton.createButton(this.renderer));
    
    // Controllers
    this.controllers = [];
    this.controllerGrips = [];
    
    // Setup controllers
    this.setupControllers();
    
    // Create VR UI Manager
    this.uiManager = new VRUIManager({
      scene: this.scene,
      camera: this.camera,
      controllers: this.controllers
    });
    
    // Create environment
    this.setupEnvironment();
    
    // Create UI
    this.setupUI();
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Start animation loop
    this.renderer.setAnimationLoop(this.render.bind(this));
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
    this.controllerGrips.push(controllerGrip0);
    
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
    this.controllerGrips.push(controllerGrip1);
    
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
    
    // Add some objects to interact with
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x4080ff,
      roughness: 0.7,
      metalness: 0.3
    });
    
    // Create several boxes in a circle
    const radius = 2;
    const numBoxes = 8;
    
    for (let i = 0; i < numBoxes; i++) {
      const angle = (i / numBoxes) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const box = new THREE.Mesh(boxGeometry, boxMaterial.clone());
      box.position.set(x, 0.25, z);
      box.userData.clickable = true;
      box.userData.index = i;
      this.scene.add(box);
    }
  }
  
  /**
   * Set up the UI
   */
  setupUI() {
    // Create a settings panel
    this.settingsPanel = this.uiManager.createSettingsPanel({
      title: 'VR Settings',
      position: { x: 0, y: 1.6, z: -1 },
      rotation: { x: 0, y: 0, z: 0 },
      followGaze: true
    });
    
    // Create a panel attached to the left controller
    this.leftControllerPanel = this.uiManager.createPanel({
      title: 'Left Controller',
      attachToController: true,
      controllerIndex: 0
    });
    
    // Add some buttons to the left controller panel
    this.leftControllerPanel.addButton('Teleport', () => {
      console.log('Teleport button clicked');
      // Implement teleportation logic here
    });
    
    this.leftControllerPanel.addButton('Menu', () => {
      console.log('Menu button clicked');
      // Toggle the settings panel
      this.settingsPanel.visible = !this.settingsPanel.visible;
    });
    
    // Create a panel attached to the right controller
    this.rightControllerPanel = this.uiManager.createPanel({
      title: 'Right Controller',
      attachToController: true,
      controllerIndex: 1
    });
    
    // Add some buttons to the right controller panel
    this.rightControllerPanel.addButton('Grab', () => {
      console.log('Grab button clicked');
      // Implement grab logic here
    });
    
    this.rightControllerPanel.addButton('Reset', () => {
      console.log('Reset button clicked');
      // Reset the scene or user position
    });
    
    // Create a fixed panel in the world
    this.worldPanel = this.uiManager.createPanel({
      title: 'World Panel',
      position: { x: -1.5, y: 1.5, z: -1.5 },
      rotation: { x: 0, y: 45, z: 0 }
    });
    
    // Add content to the world panel
    this.worldPanel.addLabel('This panel is fixed in the world');
    this.worldPanel.addButton('Change Color', () => {
      // Change the color of the boxes
      this.scene.traverse((object) => {
        if (object.userData.clickable) {
          object.material.color.setHSL(Math.random(), 0.8, 0.5);
        }
      });
    });
    
    // Add a slider to control the size of the boxes
    this.worldPanel.addSlider(0.1, 1.0, 0.5, (value) => {
      // Change the size of the boxes
      this.scene.traverse((object) => {
        if (object.userData.clickable) {
          object.scale.set(value * 2, value * 2, value * 2);
        }
      });
    }, 'Box Size');
  }
  
  /**
   * Handle window resize
   */
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  /**
   * Render loop
   */
  render() {
    // Update the UI manager
    this.uiManager.update();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Start the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new WebXRUIExample();
});