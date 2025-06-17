// Preload script runs in an isolated context, but has access to Node.js APIs
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// specific Electron APIs without exposing the entire API
contextBridge.exposeInMainWorld(
  'electronAPI', {
    // Example of exposing a method to get app version
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // Example of exposing a method to open external links
    openExternalLink: (url) => ipcRenderer.send('open-external-link', url)
  }
);

// Add any additional functionality needed for PWA integration
window.addEventListener('DOMContentLoaded', () => {
  // You can inject custom CSS or JS here if needed for desktop-specific features
  
  // Example: Add a class to the body to enable desktop-specific styles
  document.body.classList.add('convert2doc-desktop-app');
  
  // Example: Log when the app is fully loaded
  console.log('Convert2Doc Desktop App loaded - connecting to https://convert2doc.com');
});