# PDF Converter Native Apps

This repository contains native iOS, Android, and desktop applications that wrap the PDF Converter PWA (Progressive Web App) in a WebView. These apps provide a native experience for users while leveraging the existing web application.

## Project Structure

The repository is organized into three main directories:

- `/ios`: Contains the iOS application written in Swift
- `/android`: Contains the Android application written in Kotlin
- `/desktop`: Contains the cross-platform desktop application built with Electron

Each directory has its own README with specific instructions for building and running the respective applications.

## iOS App

The iOS app uses WKWebView to load the PWA from the production website. It provides a native iOS experience with the following features:

- Full support for PWA features through WKWebView
- Progress indicator for page loading
- Navigation controls
- Error handling

See the [iOS README](./ios/README.md) for detailed instructions on building and running the iOS app.

## Android App

The Android app uses WebView to load the PWA from the production website. It provides a native Android experience with the following features:

- Full support for PWA features through WebView
- Pull-to-refresh functionality
- Back navigation handling
- Error handling

See the [Android README](./android/README.md) for detailed instructions on building and running the Android app.

## Desktop App

The desktop app uses Electron to load the PWA from the production website. It provides a native desktop experience for Windows, macOS, and Linux users with the following features:

- Cross-platform support (Windows, macOS, Linux)
- Native desktop integration
- Custom application menu
- External link handling
- Offline capabilities (when the PWA supports it)

See the [Desktop README](./desktop/README.md) for detailed instructions on building and running the desktop app.

## Configuration

All apps are configured to load the PWA URL from the `API_BASE_URL` variable in the project's root `.env` file. This allows you to easily switch between different environments (development, staging, production) by modifying a single configuration file.

### .env Configuration

In the project root's `.env` file:

```
API_BASE_URL=https://profullstack.com/pdf
```

### How Each App Reads the Configuration

#### iOS App

The iOS app uses a `Config.swift` file that reads from the `.env` file in the project root:

```swift
// In Config.swift
static let apiBaseURL: String = {
    // Try to read from .env file in the project root
    // Falls back to default URL if not found
}()

// In ViewController.swift
if let url = URL(string: Config.apiBaseURL) {
    let request = URLRequest(url: url)
    webView.load(request)
}
```

#### Android App

The Android app uses a `Config.kt` file that reads from the `.env` file in the project root:

```kotlin
// In Config.kt
fun getApiBaseUrl(context: Context): String {
    // Try to read from .env file in the project root
    // Falls back to default URL if not found
}

// In MainActivity.kt
pwaUrl = Config.getApiBaseUrl(this)
```

#### Desktop App

The desktop app uses a `config.js` file that reads from the `.env` file in the project root:

```javascript
// In config.js
function getApiBaseUrl() {
    // Try to read from .env file in the project root
    // Falls back to default URL if not found
}

// In main.js
const pwaUrl = getApiBaseUrl();
```

## Benefits of Native WebView Apps

1. **App Store/Distribution Presence**: Makes the application discoverable in app stores and software distribution platforms
2. **Native Features**: Access to device capabilities not available to web apps
3. **Offline Support**: Better offline capabilities through native caching
4. **User Experience**: Provides a more integrated experience on mobile and desktop devices
5. **Push Notifications**: Native push notification support
6. **Icon on Home Screen/Desktop**: Automatic placement on the user's home screen or desktop
7. **Desktop Integration**: System tray, dock, and taskbar integration for desktop apps

## Future Enhancements

Potential future enhancements for these apps include:

1. Adding offline support with local caching
2. Implementing push notifications
3. Adding deep linking support
4. Integrating native file pickers for better file handling
5. Adding biometric authentication options
6. Implementing auto-updates for the desktop app
7. Adding system tray/menu bar functionality for the desktop app