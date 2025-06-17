# WebXR Experience Packaging Guide

This guide provides an overview of the different ways to package and distribute the WebXR experience for various platforms and app stores.

## Distribution Options

The WebXR experience can be distributed in several ways:

1. **Browser-based WebXR** - Run directly in WebXR-compatible browsers
2. **Progressive Web App (PWA)** - Install from the browser for a more app-like experience
3. **Meta Quest Store App** - Package as a native Android app for the Meta Quest Store
4. **SteamVR/PCVR App** - Package as an Electron app for SteamVR and other PCVR platforms

Each approach has its own advantages and limitations:

| Distribution Method | Advantages | Limitations | Target Platforms |
|---------------------|------------|-------------|------------------|
| Browser-based WebXR | • No installation required<br>• Instant updates<br>• Cross-platform | • Requires internet connection<br>• Browser limitations<br>• No app store presence | Any WebXR-compatible browser |
| Progressive Web App | • Installable from browser<br>• Works offline<br>• App-like experience | • Limited hardware access<br>• Not in app stores by default | Quest Browser, Firefox Reality, Chrome |
| Meta Quest Store App | • Full app store presence<br>• Better integration with Quest | • Requires app store approval<br>• More complex development | Meta Quest, Quest 2, Quest Pro |
| SteamVR/PCVR App | • Distribution on Steam<br>• Better PC VR integration | • More complex setup<br>• Platform-specific | SteamVR, Valve Index, HTC Vive, etc. |

## Detailed Guides

For detailed instructions on each packaging method, refer to the following guides:

- [Progressive Web App (PWA) Guide](./pwa/README.md) - Turn the WebXR experience into an installable PWA
- [Meta Quest Store Guide](./quest/README.md) - Package for the Meta Quest Store
- [SteamVR/PCVR Guide](./steamvr/README.md) - Package for SteamVR and other PCVR platforms

## Choosing the Right Distribution Method

Consider the following factors when choosing a distribution method:

### Browser-based WebXR

**Best for:**
- Quick demos and prototypes
- Educational content
- When you want to avoid installation barriers
- Cross-platform compatibility

**Implementation:**
- Simply host the WebXR files on a web server with HTTPS
- No additional packaging required

### Progressive Web App (PWA)

**Best for:**
- Experiences that benefit from offline access
- When you want an installable app without app store approval
- Cross-platform compatibility with a more app-like experience

**Implementation:**
- Add a manifest.json file
- Implement a service worker
- Host on a web server with HTTPS

### Meta Quest Store App

**Best for:**
- Commercial applications targeting Meta Quest devices
- When you need deeper integration with Quest features
- When app store presence is important

**Implementation:**
- Create an Android WebView wrapper
- Package with the Oculus Mobile SDK
- Submit to the Meta Quest Store

### SteamVR/PCVR App

**Best for:**
- PC VR experiences targeting Steam users
- When you need integration with SteamVR features
- When Steam store presence is important

**Implementation:**
- Create an Electron app wrapper
- Package with Electron Builder
- Optionally integrate with the Steamworks SDK
- Submit to Steam

## Hybrid Approach

For maximum reach, consider implementing multiple distribution methods:

1. Start with the browser-based WebXR implementation
2. Enhance it as a PWA for installability
3. Create native wrappers for specific platforms (Quest, SteamVR)

This approach allows you to maintain a single codebase while reaching users across different platforms and distribution channels.

## Testing Considerations

When packaging for different platforms, be sure to test:

- Performance on target devices
- Input handling with different controller types
- Installation and update processes
- Offline functionality (for PWAs)
- Integration with platform-specific features

## Resources

- [WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [Progressive Web Apps](https://web.dev/progressive-web-apps/)
- [Oculus Developer Documentation](https://developer.oculus.com/documentation/)
- [SteamVR Documentation](https://partner.steamgames.com/doc/features/steamvr)
- [Electron Documentation](https://www.electronjs.org/docs)