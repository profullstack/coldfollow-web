# WebXR Integration Guide

This guide explains how to integrate the WebXR experience with your main application. The `./webxr` directory is designed as a standalone module that can be served separately or integrated with your existing application.

## Hono.js Integration

The WebXR experience is designed to be integrated with the main application using Hono.js and served at the `/webxr` URL path. A ready-to-use integration file is provided:

```javascript
// In your main application
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { integrateWebXR } from './webxr/hono-integration.js';

const app = new Hono();

// Integrate WebXR experience at /webxr path
integrateWebXR(app);

// Other routes and middleware
// ...

// Start the server
serve({
  fetch: app.fetch,
  port: 3000
});
```

The `hono-integration.js` file provides:

1. A `createWebXRRouter()` function that creates a Hono router for the WebXR experience
2. An `integrateWebXR(app)` function that mounts the WebXR router at the `/webxr` path

This integration ensures that:
- The WebXR experience is served at the `/webxr` URL path
- All static files from the WebXR directory are properly served
- The WebXR experience is fully integrated with the main application

## Other Integration Options

### Option 1: Serve as a Separate Experience

You can serve the WebXR experience independently from your main application. This is useful if you want to:
- Keep the WebXR experience completely separate
- Avoid adding VR-specific code to your main application
- Allow users to access the VR experience directly

```bash
# Serve just the WebXR experience
python -m http.server 8080 -d webxr

# Or serve the entire application including the WebXR directory
python -m http.server 8080
```

### Option 2: Link from Main Application

You can add a link or button in your main application that navigates to the WebXR experience:

```html
<!-- In your main application -->
<a href="/webxr/" class="vr-button">Launch VR Experience</a>
```

### Option 3: Embed within Main Application

You can embed the WebXR experience in an iframe within your main application:

```html
<!-- In your main application -->
<iframe src="/webxr/" width="100%" height="600px" allow="xr-spatial-tracking"></iframe>
```

Note: The `allow="xr-spatial-tracking"` attribute is crucial for WebXR to work in an iframe.

### Option 4: Integrate the Code

You can integrate the WebXR code directly into your main application by:

1. Moving the core WebXR files into your main application's structure
2. Importing the WebXR modules where needed
3. Initializing the WebXR experience when appropriate

For example:

```javascript
// In your main application
import { WebXRApp } from './webxr/src/core/main.js';

// Initialize WebXR when a button is clicked
document.getElementById('vr-button').addEventListener('click', () => {
  const webXRApp = new WebXRApp();
});
```

## Example: Adding a VR Button to Your Main Application

Here's a complete example of how to add a VR button to your main application that launches the WebXR experience:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Main Application with WebXR Integration</title>
  <style>
    .vr-button {
      display: inline-block;
      background-color: #4285f4;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-family: Arial, sans-serif;
      font-weight: bold;
      margin: 20px;
      cursor: pointer;
    }
    
    .vr-button:hover {
      background-color: #3367d6;
    }
  </style>
</head>
<body>
  <h1>Main Application</h1>
  <p>This is your main application content.</p>
  
  <!-- Option 1: Link to WebXR experience -->
  <a href="/webxr/" class="vr-button">Launch VR Experience</a>
  
  <!-- Option 2: Open in a new tab -->
  <a href="/webxr/" target="_blank" class="vr-button">Launch VR in New Tab</a>
  
  <!-- Option 3: Embed in iframe (hidden by default) -->
  <div id="vr-container" style="display: none; width: 100%; height: 600px; margin-top: 20px;">
    <iframe id="vr-iframe" width="100%" height="100%" allow="xr-spatial-tracking" style="border: none;"></iframe>
  </div>
  
  <button id="embed-vr-button" class="vr-button">Embed VR Experience</button>
  
  <script>
    // Handle embedding the VR experience in an iframe
    document.getElementById('embed-vr-button').addEventListener('click', function() {
      const container = document.getElementById('vr-container');
      const iframe = document.getElementById('vr-iframe');
      
      // Toggle visibility
      if (container.style.display === 'none') {
        container.style.display = 'block';
        iframe.src = '/webxr/';
        this.textContent = 'Hide VR Experience';
      } else {
        container.style.display = 'none';
        iframe.src = '';
        this.textContent = 'Embed VR Experience';
      }
    });
  </script>
</body>
</html>
```

## Example: Direct Code Integration

If you want to integrate the WebXR code directly into your main application, you'll need to:

1. Make the WebXR modules available to your main application
2. Initialize the WebXR experience when needed

Here's an example of how to do this:

```javascript
// main-app.js

// Import the WebXR modules
import { WebXRApp } from './webxr/src/core/main.js';

// Create a function to initialize the WebXR experience
function initializeWebXR(containerId) {
  // Get the container element
  const container = document.getElementById(containerId);
  
  // Create a new WebXR app
  const webXRApp = new WebXRApp({
    container: container,
    // You can pass additional options here
  });
  
  return webXRApp;
}

// Add a button to launch the WebXR experience
document.getElementById('launch-vr-button').addEventListener('click', () => {
  // Initialize the WebXR experience
  const webXRApp = initializeWebXR('vr-container');
  
  // You can control the WebXR experience from your main application
  // For example, you can load a specific environment
  webXRApp.environmentManager.loadEnvironmentModel('path/to/model.glb');
});
```

## Recommended Approach

The best approach depends on your specific needs:

- For a **clean separation**: Use Option 1 or 2
- For **seamless integration**: Use Option 3 or 4
- For **maximum flexibility**: Keep the WebXR code modular as implemented, then choose the integration method that works best for your use case

## Considerations

When integrating the WebXR experience with your main application, consider the following:

- **Performance**: The WebXR experience may require significant resources, so consider loading it only when needed
- **User Experience**: Provide clear instructions for users on how to enter VR mode
- **Fallback**: Ensure there's a fallback experience for users without VR hardware
- **Cross-Origin Issues**: If serving from different domains, be aware of cross-origin restrictions
- **Asset Loading**: Ensure all assets are properly loaded, especially when integrating the code directly