# SteamVR/PCVR Packaging Guide

This guide explains how to package the WebXR experience as a desktop application for SteamVR and other PCVR platforms using Electron.

## Prerequisites

- Node.js and npm/pnpm
- Electron
- SteamVR installed (for testing)
- Steam Developer Account (for distribution on Steam)

## Steps to Package for SteamVR/PCVR

1. **Create an Electron Project**

   Create a new directory for your Electron project and initialize it:

   ```bash
   mkdir webxr-electron
   cd webxr-electron
   npm init -y
   npm install electron electron-builder --save-dev
   ```

2. **Create the Main Electron File**

   Create a `main.js` file in the root directory:

   ```javascript
   const { app, BrowserWindow } = require('electron');
   const path = require('path');
   const url = require('url');

   // Keep a global reference of the window object
   let mainWindow;

   function createWindow() {
     // Create the browser window
     mainWindow = new BrowserWindow({
       width: 1280,
       height: 720,
       webPreferences: {
         nodeIntegration: false,
         contextIsolation: true,
         webSecurity: false, // Required for loading local files
         webgl: true,
         webxr: true // Enable WebXR
       }
     });

     // Load the index.html of the app
     mainWindow.loadURL(url.format({
       pathname: path.join(__dirname, 'www', 'index.html'),
       protocol: 'file:',
       slashes: true
     }));

     // Open the DevTools in development mode
     if (process.env.NODE_ENV === 'development') {
       mainWindow.webContents.openDevTools();
     }

     // Maximize the window
     mainWindow.maximize();

     // Emitted when the window is closed
     mainWindow.on('closed', function() {
       mainWindow = null;
     });
   }

   // This method will be called when Electron has finished initialization
   app.on('ready', createWindow);

   // Quit when all windows are closed
   app.on('window-all-closed', function() {
     if (process.platform !== 'darwin') {
       app.quit();
     }
   });

   app.on('activate', function() {
     if (mainWindow === null) {
       createWindow();
     }
   });
   ```

3. **Configure package.json**

   Update your `package.json` file:

   ```json
   {
     "name": "webxr-vr-experience",
     "version": "1.0.0",
     "description": "WebXR VR Experience for SteamVR",
     "main": "main.js",
     "scripts": {
       "start": "electron .",
       "dev": "NODE_ENV=development electron .",
       "build": "electron-builder",
       "build:win": "electron-builder --windows",
       "build:mac": "electron-builder --mac",
       "build:linux": "electron-builder --linux"
     },
     "build": {
       "appId": "com.yourcompany.webxr-vr-experience",
       "productName": "WebXR VR Experience",
       "directories": {
         "output": "dist"
       },
       "files": [
         "main.js",
         "www/**/*"
       ],
       "win": {
         "target": "nsis"
       },
       "mac": {
         "target": "dmg"
       },
       "linux": {
         "target": "AppImage"
       }
     },
     "author": "Your Name",
     "license": "MIT",
     "devDependencies": {
       "electron": "^28.0.0",
       "electron-builder": "^24.0.0"
     }
   }
   ```

4. **Copy WebXR Files**

   Create a `www` directory in your Electron project and copy all the WebXR files (HTML, CSS, JS, assets) to this directory.

5. **Modify WebXR Code for Electron**

   You may need to make some adjustments to your WebXR code to work properly in Electron:

   - Update any absolute paths to use relative paths
   - Ensure all resources are loaded from local files
   - Add a polyfill for WebXR if needed

   Create a file `www/electron-adapter.js` to handle any Electron-specific adjustments:

   ```javascript
   // This script is included only when running in Electron
   
   // Check if running in Electron
   const isElectron = () => {
     return navigator.userAgent.indexOf('Electron') !== -1;
   };

   if (isElectron()) {
     console.log('Running in Electron - applying WebXR adaptations');
     
     // Add any Electron-specific adaptations here
     // For example, you might need to modify how WebXR is detected or initialized
     
     // Example: Override navigator.xr.isSessionSupported if needed
     const originalIsSessionSupported = navigator.xr.isSessionSupported;
     navigator.xr.isSessionSupported = function(mode) {
       // Check if SteamVR is running and available
       // This is a simplified example - you would need to implement actual detection
       return originalIsSessionSupported.call(this, mode);
     };
   }
   ```

   Include this script in your `index.html`:

   ```html
   <!-- Add this before your main.js script -->
   <script src="electron-adapter.js"></script>
   ```

6. **Build the Application**

   Build your Electron application:

   ```bash
   npm run build
   ```

   This will create distributable packages in the `dist` directory.

7. **Steam Integration (Optional)**

   To distribute on Steam, you'll need to:

   - Create a Steam App ID
   - Implement the Steamworks SDK (optional, for achievements, etc.)
   - Create a Steam build following the [Steam Direct submission guidelines](https://partner.steamgames.com/doc/store/application)

   For basic Steam integration, create a `steam_appid.txt` file in your project root with your Steam App ID.

8. **SteamVR Manifest (Optional)**

   Create a SteamVR manifest file `vrmanifest.vrmanifest` for better integration:

   ```json
   {
     "applications": [
       {
         "app_key": "yourcompany.webxr-vr-experience",
         "launch_type": "binary",
         "binary_path_windows": "WebXR VR Experience.exe",
         "arguments": "",
         "image_path": "assets/icon.png",
         "strings": {
           "en_us": {
             "name": "WebXR VR Experience",
             "description": "An immersive WebXR VR experience"
           }
         }
       }
     ]
   }
   ```

## Testing with SteamVR

1. Start SteamVR
2. Run your Electron application with `npm start`
3. Click the "Enter VR" button in your WebXR experience

## Distribution

For distribution on Steam:

1. Create a Steam Partner account
2. Set up your app in the Steamworks Developer portal
3. Upload your build using the Steamworks SDK
4. Configure your store page
5. Submit for review

For standalone distribution:

1. Create an installer using the output from electron-builder
2. Distribute through your website or other platforms

## Troubleshooting

- **WebXR Not Detected**: Ensure SteamVR is running before starting your application
- **Performance Issues**: Electron adds some overhead, so you may need to optimize your WebXR experience further
- **White Screen**: Check the console for errors (Ctrl+Shift+I in Electron)