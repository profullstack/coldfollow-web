/**
 * UIManager
 * Manages UI elements, both in 2D browser view and in VR
 */

export class UIManager {
  /**
   * Create a new UIManager
   * @param {Object} settings - Application settings
   * @param {Object} callbacks - Callback functions
   * @param {Function} callbacks.onSettingsChanged - Called when settings are changed
   * @param {Function} callbacks.onVRButtonClicked - Called when VR button is clicked
   */
  constructor(settings, callbacks = {}) {
    this.settings = settings;
    this.callbacks = {
      onSettingsChanged: callbacks.onSettingsChanged || (() => {}),
      onVRButtonClicked: callbacks.onVRButtonClicked || (() => {})
    };
    
    // UI elements
    this.uiContainer = document.getElementById('ui-container');
    this.infoPanel = document.getElementById('info-panel');
    this.settingsPanel = document.getElementById('settings-panel');
    this.vrButton = document.getElementById('vr-button');
    
    // VR UI elements
    this.vrUI = null;
    
    // Initialize UI
    this.init();
  }
  
  /**
   * Initialize UI elements
   */
  init() {
    // Set up event listeners
    this.setupEventListeners();
    
    // Apply initial settings to UI
    this.updateUIFromSettings();
    
    console.log('UI initialized');
  }
  
  /**
   * Set up event listeners for UI elements
   */
  setupEventListeners() {
    // Settings panel events
    document.getElementById('quality-setting').addEventListener('change', (e) => {
      this.settings.quality = e.target.value;
      this.callbacks.onSettingsChanged();
    });
    
    document.getElementById('movement-speed').addEventListener('input', (e) => {
      this.settings.movementSpeed = parseFloat(e.target.value);
      this.callbacks.onSettingsChanged();
    });
    
    document.getElementById('comfort-mode').addEventListener('change', (e) => {
      this.settings.comfortMode = e.target.checked;
      this.callbacks.onSettingsChanged();
    });
    
    document.getElementById('snap-turning').addEventListener('change', (e) => {
      this.settings.snapTurning = e.target.checked;
      this.callbacks.onSettingsChanged();
    });
    
    document.getElementById('close-settings').addEventListener('click', () => {
      this.settingsPanel.classList.add('hidden');
    });
    
    // VR button event
    this.vrButton.addEventListener('click', () => {
      this.callbacks.onVRButtonClicked();
    });
  }
  
  /**
   * Update UI elements based on current settings
   */
  updateUIFromSettings() {
    // Update quality dropdown
    document.getElementById('quality-setting').value = this.settings.quality;
    
    // Update movement speed slider
    document.getElementById('movement-speed').value = this.settings.movementSpeed;
    
    // Update comfort mode checkbox
    document.getElementById('comfort-mode').checked = this.settings.comfortMode;
    
    // Update snap turning checkbox
    document.getElementById('snap-turning').checked = this.settings.snapTurning;
  }
  
  /**
   * Show settings panel
   */
  showSettings() {
    this.settingsPanel.classList.remove('hidden');
  }
  
  /**
   * Hide settings panel
   */
  hideSettings() {
    this.settingsPanel.classList.add('hidden');
  }
  
  /**
   * Toggle settings panel visibility
   */
  toggleSettings() {
    this.settingsPanel.classList.toggle('hidden');
  }
  
  /**
   * Hide UI elements when entering VR
   */
  hideUIForVR() {
    // Hide 2D UI elements that shouldn't be visible in VR
    this.infoPanel.classList.add('hidden');
    this.vrButton.classList.add('hidden');
    
    // Hide settings panel if it's open
    this.hideSettings();
  }
  
  /**
   * Show UI elements when exiting VR
   */
  showUIAfterVR() {
    // Show 2D UI elements again
    this.infoPanel.classList.remove('hidden');
    this.vrButton.classList.remove('hidden');
  }
  
  /**
   * Create VR-specific UI elements
   * These are 3D objects that appear in the VR space
   * @param {THREE.Scene} scene - The Three.js scene
   * @param {THREE.Camera} camera - The Three.js camera
   */
  createVRUI(scene, camera) {
    // Create a group to hold all VR UI elements
    this.vrUI = new THREE.Group();
    this.vrUI.name = 'vr-ui';
    
    // Create a settings panel in VR
    this.createVRSettingsPanel();
    
    // Add the VR UI to the scene
    scene.add(this.vrUI);
    
    console.log('VR UI created');
  }
  
  /**
   * Create a settings panel in VR
   */
  createVRSettingsPanel() {
    if (!this.vrUI) return;
    
    // Create a panel geometry
    const panelWidth = 0.5;
    const panelHeight = 0.3;
    const panelGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
    
    // Create panel material with a texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512 * (panelHeight / panelWidth);
    const context = canvas.getContext('2d');
    
    // Draw panel background
    context.fillStyle = 'rgba(32, 33, 36, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    context.lineWidth = 4;
    context.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Draw panel title
    context.fillStyle = 'white';
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.fillText('Settings', canvas.width / 2, 50);
    
    // Draw settings options
    context.font = '24px Arial';
    context.textAlign = 'left';
    context.fillText('Quality:', 40, 120);
    context.fillText('Movement Speed:', 40, 180);
    context.fillText('Comfort Mode:', 40, 240);
    context.fillText('Snap Turning:', 40, 300);
    
    // Draw current settings values
    context.textAlign = 'right';
    context.fillText(this.settings.quality, canvas.width - 40, 120);
    context.fillText(this.settings.movementSpeed.toFixed(1), canvas.width - 40, 180);
    context.fillText(this.settings.comfortMode ? 'On' : 'Off', canvas.width - 40, 240);
    context.fillText(this.settings.snapTurning ? 'On' : 'Off', canvas.width - 40, 300);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true
    });
    
    // Create panel mesh
    const panel = new THREE.Mesh(panelGeometry, material);
    panel.name = 'vr-settings-panel';
    panel.position.set(0, 1.5, -1); // Position in front of user
    panel.rotation.y = Math.PI; // Face the user
    
    // Add to VR UI group
    this.vrUI.add(panel);
    
    // Store canvas and context for updates
    panel.userData.canvas = canvas;
    panel.userData.context = context;
    
    return panel;
  }
  
  /**
   * Update VR settings panel with current settings
   */
  updateVRSettingsPanel() {
    if (!this.vrUI) return;
    
    const panel = this.vrUI.getObjectByName('vr-settings-panel');
    if (!panel || !panel.userData.canvas || !panel.userData.context) return;
    
    const canvas = panel.userData.canvas;
    const context = panel.userData.context;
    
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw panel background
    context.fillStyle = 'rgba(32, 33, 36, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    context.lineWidth = 4;
    context.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Redraw panel title
    context.fillStyle = 'white';
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.fillText('Settings', canvas.width / 2, 50);
    
    // Redraw settings options
    context.font = '24px Arial';
    context.textAlign = 'left';
    context.fillText('Quality:', 40, 120);
    context.fillText('Movement Speed:', 40, 180);
    context.fillText('Comfort Mode:', 40, 240);
    context.fillText('Snap Turning:', 40, 300);
    
    // Redraw current settings values
    context.textAlign = 'right';
    context.fillText(this.settings.quality, canvas.width - 40, 120);
    context.fillText(this.settings.movementSpeed.toFixed(1), canvas.width - 40, 180);
    context.fillText(this.settings.comfortMode ? 'On' : 'Off', canvas.width - 40, 240);
    context.fillText(this.settings.snapTurning ? 'On' : 'Off', canvas.width - 40, 300);
    
    // Update texture
    panel.material.map.needsUpdate = true;
  }
  
  /**
   * Show a notification message
   * @param {string} message - The message to display
   * @param {string} type - The type of notification ('info', 'success', 'warning', 'error')
   * @param {number} duration - How long to show the notification in milliseconds
   */
  showNotification(message, type = 'info', duration = 3000) {
    // Check if notification container exists, create if not
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.id = 'notification-container';
      notificationContainer.style.position = 'fixed';
      notificationContainer.style.top = '20px';
      notificationContainer.style.right = '20px';
      notificationContainer.style.zIndex = '1000';
      document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.backgroundColor = 'rgba(32, 33, 36, 0.9)';
    notification.style.color = 'white';
    notification.style.padding = '12px 20px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    notification.style.transition = 'opacity 0.3s ease-in-out';
    
    // Add border based on type
    switch (type) {
      case 'success':
        notification.style.borderLeft = '4px solid #34a853';
        break;
      case 'warning':
        notification.style.borderLeft = '4px solid #fbbc05';
        break;
      case 'error':
        notification.style.borderLeft = '4px solid #ea4335';
        break;
      default: // info
        notification.style.borderLeft = '4px solid #4285f4';
    }
    
    // Set message
    notification.textContent = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Remove after duration
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        notificationContainer.removeChild(notification);
        
        // Remove container if empty
        if (notificationContainer.children.length === 0) {
          document.body.removeChild(notificationContainer);
        }
      }, 300);
    }, duration);
  }
  
  /**
   * Show a confirmation dialog
   * @param {string} message - The message to display
   * @param {Function} onConfirm - Callback when confirmed
   * @param {Function} onCancel - Callback when canceled
   */
  showConfirmDialog(message, onConfirm, onCancel) {
    // Create dialog overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '2000';
    
    // Create dialog box
    const dialog = document.createElement('div');
    dialog.style.backgroundColor = 'var(--background-color)';
    dialog.style.color = 'var(--text-color)';
    dialog.style.padding = '20px';
    dialog.style.borderRadius = '8px';
    dialog.style.maxWidth = '400px';
    dialog.style.boxShadow = 'var(--ui-shadow)';
    
    // Add message
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.style.marginBottom = '20px';
    dialog.appendChild(messageElement);
    
    // Add buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'flex-end';
    buttonsContainer.style.gap = '10px';
    
    // Add cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.padding = '8px 16px';
    cancelButton.style.backgroundColor = 'transparent';
    cancelButton.style.color = 'var(--text-color)';
    cancelButton.style.border = '1px solid var(--ui-border)';
    cancelButton.style.borderRadius = '4px';
    cancelButton.style.cursor = 'pointer';
    
    // Add confirm button
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.style.padding = '8px 16px';
    confirmButton.style.backgroundColor = 'var(--primary-color)';
    confirmButton.style.color = 'white';
    confirmButton.style.border = 'none';
    confirmButton.style.borderRadius = '4px';
    confirmButton.style.cursor = 'pointer';
    
    // Add event listeners
    cancelButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
      if (onCancel) onCancel();
    });
    
    confirmButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
      if (onConfirm) onConfirm();
    });
    
    // Add buttons to container
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(confirmButton);
    
    // Add buttons container to dialog
    dialog.appendChild(buttonsContainer);
    
    // Add dialog to overlay
    overlay.appendChild(dialog);
    
    // Add overlay to body
    document.body.appendChild(overlay);
  }
  
  /**
   * Update UI based on performance metrics
   * @param {Object} metrics - Performance metrics
   * @param {number} metrics.fps - Frames per second
   */
  updatePerformanceUI(metrics) {
    const statsElement = document.getElementById('performance-stats');
    if (statsElement) {
      statsElement.textContent = `FPS: ${metrics.fps.toFixed(1)}`;
      
      // Change color based on performance
      if (metrics.fps < 30) {
        statsElement.style.color = '#ea4335'; // Red for poor performance
      } else if (metrics.fps < 55) {
        statsElement.style.color = '#fbbc05'; // Yellow for moderate performance
      } else {
        statsElement.style.color = '#34a853'; // Green for good performance
      }
    }
  }
}