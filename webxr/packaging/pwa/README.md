# Progressive Web App (PWA) Packaging Guide

This guide explains how to enhance the WebXR experience as a Progressive Web App (PWA) that can be installed directly from the browser on VR headsets.

## Benefits of PWA for WebXR

- **Installable**: Users can add the app to their home screen
- **Offline Support**: Works without an internet connection after initial load
- **App-like Experience**: Runs in a standalone window without browser UI
- **Automatic Updates**: Updates when online without requiring manual installation
- **Lightweight**: No need for app store approval process
- **Cross-platform**: Works on any device with a compatible browser

## Prerequisites

- Basic understanding of PWAs
- A web server to host your PWA
- HTTPS support (required for PWAs and WebXR)

## Steps to Create a WebXR PWA

1. **Add a Web App Manifest**

   Create a `manifest.json` file in the root of your WebXR project:

   ```json
   {
     "name": "WebXR VR Experience",
     "short_name": "WebXR VR",
     "description": "An immersive WebXR virtual reality experience",
     "start_url": "./index.html",
     "display": "standalone",
     "orientation": "landscape",
     "background_color": "#000000",
     "theme_color": "#4285F4",
     "icons": [
       {
         "src": "icons/icon-72x72.png",
         "sizes": "72x72",
         "type": "image/png"
       },
       {
         "src": "icons/icon-96x96.png",
         "sizes": "96x96",
         "type": "image/png"
       },
       {
         "src": "icons/icon-128x128.png",
         "sizes": "128x128",
         "type": "image/png"
       },
       {
         "src": "icons/icon-144x144.png",
         "sizes": "144x144",
         "type": "image/png"
       },
       {
         "src": "icons/icon-152x152.png",
         "sizes": "152x152",
         "type": "image/png"
       },
       {
         "src": "icons/icon-192x192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "icons/icon-384x384.png",
         "sizes": "384x384",
         "type": "image/png"
       },
       {
         "src": "icons/icon-512x512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ]
   }
   ```

2. **Link the Manifest in your HTML**

   Add the following to the `<head>` section of your `index.html`:

   ```html
   <link rel="manifest" href="manifest.json">
   <meta name="theme-color" content="#4285F4">
   <meta name="apple-mobile-web-app-capable" content="yes">
   <meta name="apple-mobile-web-app-status-bar-style" content="black">
   <meta name="apple-mobile-web-app-title" content="WebXR VR">
   <link rel="apple-touch-icon" href="icons/icon-152x152.png">
   ```

3. **Create App Icons**

   Create icons in various sizes as specified in the manifest. You can use tools like:
   - [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - [App Icon Generator](https://appicon.co/)

   Place these icons in an `icons` directory.

4. **Create a Service Worker**

   Create a `service-worker.js` file in the root of your project:

   ```javascript
   const CACHE_NAME = 'webxr-vr-experience-v1';
   const ASSETS_TO_CACHE = [
     './',
     './index.html',
     './manifest.json',
     './src/core/main.js',
     './src/core/xr-session.js',
     './src/core/environment.js',
     './src/core/controllers.js',
     './src/ui/styles.css',
     './src/ui/ui-panel.js',
     './src/utils/input-manager.js',
     './src/utils/performance-monitor.js',
     './src/audio/audio-manager.js',
     './src/network/multiplayer.js',
     // Add all other assets, including models, textures, etc.
     './icons/icon-72x72.png',
     './icons/icon-96x96.png',
     './icons/icon-128x128.png',
     './icons/icon-144x144.png',
     './icons/icon-152x152.png',
     './icons/icon-192x192.png',
     './icons/icon-384x384.png',
     './icons/icon-512x512.png'
   ];

   // Install event - cache assets
   self.addEventListener('install', (event) => {
     event.waitUntil(
       caches.open(CACHE_NAME)
         .then((cache) => {
           console.log('Opened cache');
           return cache.addAll(ASSETS_TO_CACHE);
         })
     );
   });

   // Activate event - clean up old caches
   self.addEventListener('activate', (event) => {
     event.waitUntil(
       caches.keys().then((cacheNames) => {
         return Promise.all(
           cacheNames.map((cacheName) => {
             if (cacheName !== CACHE_NAME) {
               return caches.delete(cacheName);
             }
           })
         );
       })
     );
   });

   // Fetch event - serve from cache or network
   self.addEventListener('fetch', (event) => {
     event.respondWith(
       caches.match(event.request)
         .then((response) => {
           // Cache hit - return response
           if (response) {
             return response;
           }
           return fetch(event.request).then(
             (response) => {
               // Check if we received a valid response
               if (!response || response.status !== 200 || response.type !== 'basic') {
                 return response;
               }

               // Clone the response
               const responseToCache = response.clone();

               caches.open(CACHE_NAME)
                 .then((cache) => {
                   cache.put(event.request, responseToCache);
                 });

               return response;
             }
           );
         })
     );
   });
   ```

5. **Register the Service Worker**

   Add the following script to your `index.html` before the closing `</body>` tag:

   ```html
   <script>
     if ('serviceWorker' in navigator) {
       window.addEventListener('load', () => {
         navigator.serviceWorker.register('./service-worker.js')
           .then((registration) => {
             console.log('ServiceWorker registration successful with scope: ', registration.scope);
           })
           .catch((error) => {
             console.log('ServiceWorker registration failed: ', error);
           });
       });
     }
   </script>
   ```

6. **Add an Install Prompt**

   Create a simple UI to prompt users to install the PWA. Add this to your HTML:

   ```html
   <div id="install-prompt" style="display: none; position: fixed; bottom: 20px; left: 20px; background-color: rgba(0, 0, 0, 0.8); color: white; padding: 15px; border-radius: 5px; z-index: 1000;">
     <p>Install this app on your device</p>
     <button id="install-button">Install</button>
     <button id="dismiss-button">Not Now</button>
   </div>
   ```

   And add this JavaScript:

   ```javascript
   let deferredPrompt;

   window.addEventListener('beforeinstallprompt', (e) => {
     // Prevent Chrome 67 and earlier from automatically showing the prompt
     e.preventDefault();
     // Stash the event so it can be triggered later
     deferredPrompt = e;
     // Show the install prompt
     document.getElementById('install-prompt').style.display = 'block';
   });

   document.getElementById('install-button').addEventListener('click', () => {
     // Hide the app provided install promotion
     document.getElementById('install-prompt').style.display = 'none';
     // Show the install prompt
     deferredPrompt.prompt();
     // Wait for the user to respond to the prompt
     deferredPrompt.userChoice.then((choiceResult) => {
       if (choiceResult.outcome === 'accepted') {
         console.log('User accepted the install prompt');
       } else {
         console.log('User dismissed the install prompt');
       }
       deferredPrompt = null;
     });
   });

   document.getElementById('dismiss-button').addEventListener('click', () => {
     document.getElementById('install-prompt').style.display = 'none';
   });
   ```

7. **Test Your PWA**

   - Use Chrome's Lighthouse tool to audit your PWA
   - Test on various devices, especially VR headsets with WebXR support
   - Verify that the app works offline

8. **Deploy to a Web Server with HTTPS**

   Deploy your PWA to a web server with HTTPS support. You can use services like:
   - GitHub Pages
   - Netlify
   - Vercel
   - Firebase Hosting

## VR Headset Compatibility

### Meta Quest Browser

The Meta Quest Browser supports PWAs and WebXR. Users can:
1. Navigate to your PWA in the Oculus Browser
2. Click the three-dot menu
3. Select "Add to Home Screen"

### Firefox Reality

Firefox Reality also supports PWAs:
1. Navigate to your PWA
2. Click the URL bar
3. Select "Add to Home Screen"

## Limitations

- **Performance**: PWAs may have slightly lower performance compared to native apps
- **Hardware Access**: Limited access to some device features compared to native apps
- **Store Visibility**: Not listed in app stores (unless you use TWA for Android)

## Advanced: Trusted Web Activity (TWA)

For distribution on the Google Play Store, you can wrap your PWA as a Trusted Web Activity:

1. Use [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) to create an Android app from your PWA
2. Follow the [TWA documentation](https://developers.google.com/web/android/trusted-web-activity) to publish to the Play Store

This approach allows your PWA to be listed on the Google Play Store while still being a web app.