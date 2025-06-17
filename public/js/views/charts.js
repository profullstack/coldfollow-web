/**
 * Charts.css Demo page functionality
 */

/**
 * Initialize the charts page
 */
function initChartsPage() {
  console.log('Initializing charts page');
  
  // Setup interactive chart controls
  setupInteractiveControls();
  
  // Add some custom styling for better presentation
  addCustomChartStyles();
}

/**
 * Setup interactive controls for the demo chart
 */
function setupInteractiveControls() {
  const buttons = document.querySelectorAll('.chart-controls button');
  const interactiveChart = document.querySelector('#interactive-chart');
  
  if (!interactiveChart) {
    console.warn('Interactive chart not found');
    return;
  }
  
  buttons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      
      // Toggle the data-clicked attribute on the button
      button.toggleAttribute('data-clicked');
      
      // Get the class name from the button
      const className = button.className.split(' ')[0]; // Get first class name
      
      // Toggle the class on the interactive chart
      interactiveChart.classList.toggle(className);
      
      // Update button text to show current state
      updateButtonText(button, className);
      
      console.log(`Toggled ${className} on interactive chart`);
    });
  });
}

/**
 * Update button text to reflect current state
 * @param {HTMLElement} button - The button element
 * @param {string} className - The class name being toggled
 */
function updateButtonText(button, className) {
  const isActive = button.hasAttribute('data-clicked');
  const baseText = button.textContent.replace(' (ON)', '').replace(' (OFF)', '');
  
  button.textContent = `${baseText} (${isActive ? 'ON' : 'OFF'})`;
}

/**
 * Add custom styles for better chart presentation
 */
function addCustomChartStyles() {
  // Create a style element for custom chart styles
  const style = document.createElement('style');
  style.textContent = `
    .charts-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .chart-section {
      margin-bottom: 3rem;
      padding: 2rem;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      background: var(--card-background, #ffffff);
    }
    
    .chart-section h2 {
      color: var(--heading-color, #1f2937);
      margin-bottom: 0.5rem;
      font-size: 1.5rem;
    }
    
    .chart-section p {
      color: var(--text-color, #6b7280);
      margin-bottom: 1.5rem;
    }
    
    .charts-css {
      height: 200px;
      max-width: 100%;
      margin: 1rem 0;
    }
    
    .chart-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    
    .chart-controls button {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 4px;
      background: var(--button-background, #f9fafb);
      color: var(--button-text, #374151);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
    }
    
    .chart-controls button:hover {
      background: var(--button-hover-background, #f3f4f6);
      border-color: var(--button-hover-border, #9ca3af);
    }
    
    .chart-controls button[data-clicked] {
      background: var(--button-active-background, #3b82f6);
      color: var(--button-active-text, #ffffff);
      border-color: var(--button-active-border, #2563eb);
    }
    
    .legend-examples {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    
    .legend {
      padding: 1rem;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 4px;
      background: var(--legend-background, #f9fafb);
    }
    
    .legend > div:first-child {
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: var(--heading-color, #1f2937);
    }
    
    /* Custom colors for chart data */
    .charts-css.column td:nth-child(2) { --color: #3b82f6; }
    .charts-css.column td:nth-child(3) { --color: #ef4444; }
    .charts-css.column td:nth-child(4) { --color: #10b981; }
    .charts-css.column td:nth-child(5) { --color: #f59e0b; }
    .charts-css.column td:nth-child(6) { --color: #8b5cf6; }
    
    .charts-css.bar td:nth-child(2) { --color: #3b82f6; }
    .charts-css.bar td:nth-child(3) { --color: #ef4444; }
    .charts-css.bar td:nth-child(4) { --color: #10b981; }
    .charts-css.bar td:nth-child(5) { --color: #f59e0b; }
    .charts-css.bar td:nth-child(6) { --color: #8b5cf6; }
    
    .charts-css.area { --color: #3b82f6; }
    .charts-css.line { --color: #ef4444; }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .charts-container {
        padding: 1rem;
      }
      
      .chart-section {
        padding: 1rem;
      }
      
      .charts-css {
        height: 150px;
      }
      
      .legend-examples {
        grid-template-columns: 1fr;
      }
    }
  `;
  
  // Append the style to the document head safely
  try {
    if (document.head) {
      document.head.appendChild(style);
    } else {
      console.warn('Document head not available for style injection');
    }
  } catch (error) {
    console.error('Error adding custom chart styles:', error);
  }
}

/**
 * Generate random data for dynamic chart updates (future enhancement)
 */
function generateRandomData() {
  return Math.floor(Math.random() * 100) + 1;
}

/**
 * Update chart data dynamically (future enhancement)
 * @param {HTMLElement} chart - The chart table element
 */
function updateChartData(chart) {
  const dataCells = chart.querySelectorAll('tbody td');
  
  dataCells.forEach(cell => {
    const newValue = generateRandomData();
    const newSize = newValue / 100;
    
    cell.style.setProperty('--size', newSize);
    cell.textContent = newValue;
  });
}

// Initialize the page when the DOM is loaded
initChartsPage();

// Also initialize on spa-transition-end event for SPA router
document.addEventListener("spa-transition-end", initChartsPage);

// Export functions for potential external use
export {
  initChartsPage,
  initChartsPage as initChartsInteractivity, // Alias for page initializer
  setupInteractiveControls,
  updateChartData,
  generateRandomData
};