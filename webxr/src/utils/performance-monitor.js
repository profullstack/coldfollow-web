/**
 * PerformanceMonitor
 * Tracks and displays performance metrics like FPS
 */

export class PerformanceMonitor {
  /**
   * Create a new PerformanceMonitor
   * @param {HTMLElement} container - The container element to display stats
   */
  constructor(container) {
    this.container = container;
    
    // Performance metrics
    this.fps = 0;
    this.frameTime = 0;
    this.memoryUsage = 0;
    
    // Tracking variables
    this.frames = 0;
    this.prevTime = performance.now();
    this.fpsUpdateInterval = 500; // Update FPS every 500ms
    this.fpsUpdateTime = this.prevTime;
    
    // Display options
    this.showFPS = true;
    this.showFrameTime = false;
    this.showMemory = false;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the performance monitor
   */
  init() {
    // Create UI if container exists
    if (this.container) {
      this.createUI();
    }
    
    console.log('Performance monitor initialized');
  }
  
  /**
   * Create the UI elements
   */
  createUI() {
    // Clear container
    this.container.innerHTML = '';
    
    // Set initial text
    this.container.textContent = 'FPS: --';
    
    // Add toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = '⚙️';
    toggleButton.style.marginLeft = '10px';
    toggleButton.style.background = 'transparent';
    toggleButton.style.border = 'none';
    toggleButton.style.color = 'inherit';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.fontSize = '12px';
    
    toggleButton.addEventListener('click', () => {
      this.toggleOptions();
    });
    
    this.container.appendChild(toggleButton);
  }
  
  /**
   * Toggle display options
   */
  toggleOptions() {
    // Create options panel if it doesn't exist
    let optionsPanel = document.getElementById('performance-options');
    
    if (optionsPanel) {
      // Toggle visibility
      optionsPanel.classList.toggle('hidden');
      return;
    }
    
    // Create options panel
    optionsPanel = document.createElement('div');
    optionsPanel.id = 'performance-options';
    optionsPanel.style.position = 'absolute';
    optionsPanel.style.top = '30px';
    optionsPanel.style.left = '10px';
    optionsPanel.style.backgroundColor = 'rgba(32, 33, 36, 0.9)';
    optionsPanel.style.padding = '10px';
    optionsPanel.style.borderRadius = '4px';
    optionsPanel.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    optionsPanel.style.zIndex = '1000';
    
    // Add options
    const createOption = (id, label, checked) => {
      const option = document.createElement('div');
      option.style.marginBottom = '5px';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = id;
      checkbox.checked = checked;
      
      const labelElement = document.createElement('label');
      labelElement.htmlFor = id;
      labelElement.textContent = label;
      labelElement.style.marginLeft = '5px';
      labelElement.style.fontSize = '12px';
      
      option.appendChild(checkbox);
      option.appendChild(labelElement);
      
      return option;
    };
    
    // FPS option
    const fpsOption = createOption('show-fps', 'Show FPS', this.showFPS);
    fpsOption.querySelector('input').addEventListener('change', (e) => {
      this.showFPS = e.target.checked;
      this.updateDisplay();
    });
    optionsPanel.appendChild(fpsOption);
    
    // Frame time option
    const frameTimeOption = createOption('show-frame-time', 'Show Frame Time', this.showFrameTime);
    frameTimeOption.querySelector('input').addEventListener('change', (e) => {
      this.showFrameTime = e.target.checked;
      this.updateDisplay();
    });
    optionsPanel.appendChild(frameTimeOption);
    
    // Memory option
    const memoryOption = createOption('show-memory', 'Show Memory Usage', this.showMemory);
    memoryOption.querySelector('input').addEventListener('change', (e) => {
      this.showMemory = e.target.checked;
      this.updateDisplay();
    });
    optionsPanel.appendChild(memoryOption);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '10px';
    closeButton.style.padding = '3px 8px';
    closeButton.style.fontSize = '12px';
    closeButton.style.backgroundColor = 'rgba(66, 133, 244, 0.8)';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '3px';
    closeButton.style.cursor = 'pointer';
    
    closeButton.addEventListener('click', () => {
      optionsPanel.classList.add('hidden');
    });
    
    optionsPanel.appendChild(closeButton);
    
    // Add to document
    document.body.appendChild(optionsPanel);
  }
  
  /**
   * Update the performance metrics
   */
  update() {
    // Increment frame counter
    this.frames++;
    
    // Get current time
    const now = performance.now();
    
    // Calculate frame time
    this.frameTime = now - this.prevTime;
    this.prevTime = now;
    
    // Update FPS counter periodically
    if (now - this.fpsUpdateTime >= this.fpsUpdateInterval) {
      // Calculate FPS
      this.fps = Math.round((this.frames * 1000) / (now - this.fpsUpdateTime));
      
      // Reset frame counter and update time
      this.frames = 0;
      this.fpsUpdateTime = now;
      
      // Get memory usage if available
      if (window.performance && window.performance.memory) {
        this.memoryUsage = window.performance.memory.usedJSHeapSize / (1024 * 1024); // MB
      }
      
      // Update display
      this.updateDisplay();
    }
  }
  
  /**
   * Update the display with current metrics
   */
  updateDisplay() {
    if (!this.container) return;
    
    // Build display text
    let displayText = '';
    
    if (this.showFPS) {
      displayText += `FPS: ${this.fps}`;
    }
    
    if (this.showFrameTime) {
      if (displayText) displayText += ' | ';
      displayText += `Frame: ${this.frameTime.toFixed(2)}ms`;
    }
    
    if (this.showMemory && window.performance && window.performance.memory) {
      if (displayText) displayText += ' | ';
      displayText += `Mem: ${this.memoryUsage.toFixed(1)}MB`;
    }
    
    // Update container text (excluding the toggle button)
    const toggleButton = this.container.querySelector('button');
    if (toggleButton) {
      this.container.textContent = displayText;
      this.container.appendChild(toggleButton);
    } else {
      this.container.textContent = displayText;
    }
    
    // Color-code based on performance
    if (this.showFPS) {
      if (this.fps < 30) {
        this.container.style.color = '#ea4335'; // Red for poor performance
      } else if (this.fps < 55) {
        this.container.style.color = '#fbbc05'; // Yellow for moderate performance
      } else {
        this.container.style.color = '#34a853'; // Green for good performance
      }
    } else {
      this.container.style.color = 'white'; // Default color
    }
  }
  
  /**
   * Get the current FPS
   * @returns {number} The current FPS
   */
  getFPS() {
    return this.fps;
  }
  
  /**
   * Get the current frame time
   * @returns {number} The current frame time in milliseconds
   */
  getFrameTime() {
    return this.frameTime;
  }
  
  /**
   * Get all performance metrics
   * @returns {Object} All performance metrics
   */
  getMetrics() {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      memoryUsage: this.memoryUsage
    };
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Remove options panel if it exists
    const optionsPanel = document.getElementById('performance-options');
    if (optionsPanel) {
      document.body.removeChild(optionsPanel);
    }
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    console.log('Performance monitor disposed');
  }
}