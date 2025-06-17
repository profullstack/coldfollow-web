/**
 * EnvironmentManager
 * Manages the 3D environment, including lighting, skybox, and scene elements
 */

export class EnvironmentManager {
  /**
   * Create a new EnvironmentManager
   * @param {THREE.Scene} scene - The Three.js scene
   * @param {THREE.Camera} camera - The Three.js camera
   * @param {Object} settings - Application settings
   */
  constructor(scene, camera, settings) {
    this.scene = scene;
    this.camera = camera;
    this.settings = settings;
    
    // Environment elements
    this.lights = {};
    this.ground = null;
    this.skybox = null;
    this.environmentObjects = [];
    
    // Initialize the environment
    this.init();
  }
  
  /**
   * Initialize the environment
   */
  init() {
    // Set scene background color
    this.scene.background = new THREE.Color(0x87ceeb);
    
    // Add lights
    this.setupLights();
    
    // Add ground
    this.createGround();
    
    // Add skybox
    this.createSkybox();
    
    // Add basic environment objects
    this.addEnvironmentObjects();
    
    console.log('Environment initialized');
  }
  
  /**
   * Set up scene lighting
   */
  setupLights() {
    // Ambient light
    this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.lights.ambient);
    
    // Directional light (sun)
    this.lights.directional = new THREE.DirectionalLight(0xffffff, 0.8);
    this.lights.directional.position.set(10, 10, 10);
    this.lights.directional.castShadow = true;
    
    // Configure shadow properties
    this.lights.directional.shadow.mapSize.width = 2048;
    this.lights.directional.shadow.mapSize.height = 2048;
    this.lights.directional.shadow.camera.near = 0.5;
    this.lights.directional.shadow.camera.far = 50;
    this.lights.directional.shadow.camera.left = -10;
    this.lights.directional.shadow.camera.right = 10;
    this.lights.directional.shadow.camera.top = 10;
    this.lights.directional.shadow.camera.bottom = -10;
    
    this.scene.add(this.lights.directional);
    
    // Add hemisphere light for more natural outdoor lighting
    this.lights.hemisphere = new THREE.HemisphereLight(0xaaaaff, 0x806040, 0.3);
    this.scene.add(this.lights.hemisphere);
  }
  
  /**
   * Create the ground plane
   */
  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(50, 50, 10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x7cfc00,
      roughness: 0.8,
      metalness: 0.2
    });
    
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.ground.position.y = 0;
    this.ground.receiveShadow = true;
    
    this.scene.add(this.ground);
  }
  
  /**
   * Create a skybox
   */
  createSkybox() {
    // Simple color gradient sky (can be replaced with cubemap skybox)
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `;
    
    const uniforms = {
      topColor: { value: new THREE.Color(0x0077ff) },
      bottomColor: { value: new THREE.Color(0xffffff) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
    };
    
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.BackSide
    });
    
    this.skybox = new THREE.Mesh(
      new THREE.SphereGeometry(500, 32, 15),
      skyMaterial
    );
    
    this.scene.add(this.skybox);
  }
  
  /**
   * Add basic environment objects
   */
  addEnvironmentObjects() {
    // Add some basic geometric shapes as environment objects
    
    // Create a cube
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x3399ff,
      roughness: 0.7,
      metalness: 0.3
    });
    
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(3, 0.5, -3);
    cube.castShadow = true;
    cube.receiveShadow = true;
    this.scene.add(cube);
    this.environmentObjects.push(cube);
    
    // Create a sphere
    const sphereGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6347,
      roughness: 0.5,
      metalness: 0.1
    });
    
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(-3, 0.7, -3);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    this.scene.add(sphere);
    this.environmentObjects.push(sphere);
    
    // Create a cylinder
    const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
    const cylinderMaterial = new THREE.MeshStandardMaterial({
      color: 0x9932cc,
      roughness: 0.6,
      metalness: 0.2
    });
    
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.set(0, 0.75, -5);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    this.scene.add(cylinder);
    this.environmentObjects.push(cylinder);
  }
  
  /**
   * Load a custom environment model
   * @param {string} modelPath - Path to the 3D model
   * @returns {Promise} Promise that resolves when the model is loaded
   */
  loadEnvironmentModel(modelPath) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.GLTFLoader();
      
      loader.load(
        modelPath,
        (gltf) => {
          // Model loaded successfully
          const model = gltf.scene;
          
          // Configure the model
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          // Add the model to the scene
          this.scene.add(model);
          this.environmentObjects.push(model);
          
          console.log(`Loaded environment model: ${modelPath}`);
          resolve(model);
        },
        (xhr) => {
          // Loading progress
          const progress = (xhr.loaded / xhr.total) * 100;
          console.log(`Loading model: ${progress.toFixed(2)}%`);
        },
        (error) => {
          // Error loading model
          console.error(`Error loading model: ${modelPath}`, error);
          reject(error);
        }
      );
    });
  }
  
  /**
   * Load a panoramic skybox
   * @param {string} imagePath - Path to the panoramic image
   */
  loadPanoramicSkybox(imagePath) {
    const loader = new THREE.TextureLoader();
    
    loader.load(
      imagePath,
      (texture) => {
        // Remove existing skybox if present
        if (this.skybox) {
          this.scene.remove(this.skybox);
        }
        
        // Create new skybox with the loaded texture
        const skyboxGeometry = new THREE.SphereGeometry(500, 60, 40);
        // Flip the geometry inside out
        skyboxGeometry.scale(-1, 1, 1);
        
        const skyboxMaterial = new THREE.MeshBasicMaterial({
          map: texture
        });
        
        this.skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        this.scene.add(this.skybox);
        
        console.log(`Loaded panoramic skybox: ${imagePath}`);
      },
      undefined,
      (error) => {
        console.error(`Error loading panoramic skybox: ${imagePath}`, error);
      }
    );
  }
  
  /**
   * Update environment quality based on settings
   * @param {string} quality - Quality setting ('low', 'medium', 'high')
   */
  updateQuality(quality) {
    switch (quality) {
      case 'low':
        // Reduce shadow quality
        this.lights.directional.shadow.mapSize.width = 1024;
        this.lights.directional.shadow.mapSize.height = 1024;
        
        // Simplify geometries if needed
        // ...
        
        break;
        
      case 'medium':
        // Default shadow quality
        this.lights.directional.shadow.mapSize.width = 2048;
        this.lights.directional.shadow.mapSize.height = 2048;
        
        // Default geometries
        // ...
        
        break;
        
      case 'high':
        // Increase shadow quality
        this.lights.directional.shadow.mapSize.width = 4096;
        this.lights.directional.shadow.mapSize.height = 4096;
        
        // Enhance geometries if needed
        // ...
        
        break;
        
      default:
        console.warn(`Unknown quality setting: ${quality}`);
    }
    
    // Update shadow maps
    this.lights.directional.shadow.needsUpdate = true;
  }
  
  /**
   * Handle XR session start
   * @param {XRSession} session - The WebXR session
   */
  onXRSessionStarted(session) {
    // Adjust environment for VR if needed
    // For example, position objects relative to the user's height
  }
  
  /**
   * Handle XR session end
   */
  onXRSessionEnded() {
    // Restore environment settings if needed
  }
  
  /**
   * Update the environment
   * @param {number} timestamp - The current timestamp
   * @param {XRFrame} frame - The current XR frame (if in XR mode)
   */
  update(timestamp, frame) {
    // Animate environment objects
    const time = timestamp * 0.001; // Convert to seconds
    
    // Rotate the cube
    if (this.environmentObjects[0]) {
      this.environmentObjects[0].rotation.y = time * 0.5;
    }
    
    // Move the sphere up and down
    if (this.environmentObjects[1]) {
      this.environmentObjects[1].position.y = 0.7 + Math.sin(time) * 0.3;
    }
    
    // Rotate the cylinder
    if (this.environmentObjects[2]) {
      this.environmentObjects[2].rotation.x = time * 0.3;
    }
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Dispose of geometries, materials, textures, etc.
    // This helps prevent memory leaks
    
    // Remove objects from scene
    this.environmentObjects.forEach((object) => {
      this.scene.remove(object);
    });
    
    if (this.ground) {
      this.scene.remove(this.ground);
      this.ground.geometry.dispose();
      this.ground.material.dispose();
    }
    
    if (this.skybox) {
      this.scene.remove(this.skybox);
      this.skybox.geometry.dispose();
      this.skybox.material.dispose();
    }
    
    // Remove lights
    Object.values(this.lights).forEach((light) => {
      this.scene.remove(light);
    });
    
    console.log('Environment resources disposed');
  }
}