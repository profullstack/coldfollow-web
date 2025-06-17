# PDF Converter iOS App

A simple iOS app that uses WKWebView to load the PDF Converter PWA from the production website.

## Features

- Loads the PWA from the URL specified in the Config.swift file
- Supports all PWA features through WKWebView
- Progress indicator for page loading
- Navigation controls with refresh button
- Bottom navigation bar for easy access to home
- Handles navigation within the app
- Provides a native iOS experience for the web application

## Requirements

- Xcode 14.0+
- iOS 13.0+
- Swift 5.0+
- macOS Monterey (12.0) or newer
- Apple Developer account (for testing on physical devices)

## Building and Running the App

### Prerequisites

1. Install [Xcode](https://apps.apple.com/us/app/xcode/id497799835) from the Mac App Store
2. Make sure you have a valid Apple ID
3. If you want to test on a physical device, you'll need an Apple Developer account

### Building from Xcode

1. Open the `ios/PDFConverter/PDFConverter.xcodeproj` file in Xcode
2. Wait for Xcode to index the project
3. Select your target device or simulator from the scheme dropdown in the toolbar
   - For simulator: Choose an iOS simulator (e.g., iPhone 14)
   - For physical device: Connect your iOS device via USB and select it
4. Click the Run button (play icon) or press `Cmd+R` to build and run the app

### Building from Command Line

#### Using the Build Script (Recommended)

We've provided a convenient build script that handles the build process:

```bash
cd ios
./build.sh
```

This script will:
1. Check for available iOS simulators
2. Clean the project
3. Build the app for iOS simulator
4. Provide instructions for running on a simulator or physical device
5. Provide instructions for creating an IPA for distribution

#### Manual Build Process

If you prefer to build manually using `xcodebuild`:

```bash
cd ios/PDFConverter
xcodebuild -scheme PDFConverter -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 14,OS=latest'
```

To create an IPA file for distribution:

```bash
cd ios/PDFConverter
xcodebuild -scheme PDFConverter -sdk iphoneos -configuration Release archive -archivePath ./build/PDFConverter.xcarchive
xcodebuild -exportArchive -archivePath ./build/PDFConverter.xcarchive -exportOptionsPlist exportOptions.plist -exportPath ./build
```

Note: You'll need to create an `exportOptions.plist` file with your team ID and provisioning profile information.

## Testing the App

### On a Simulator

1. In Xcode, select an iOS simulator from the scheme dropdown
2. Run the app by clicking the Run button or pressing `Cmd+R`
3. The simulator will launch and the app will start automatically
4. Test the app's functionality:
   - Verify the PWA loads correctly
   - Test navigation within the app
   - Test the refresh button
   - Test the home button in the bottom navigation bar

### On a Physical Device

1. Connect your iOS device to your Mac via USB
2. In Xcode, select your device from the scheme dropdown
3. You may need to set up code signing:
   - In Xcode, select the project in the navigator
   - Select the PDFConverter target
   - Go to the "Signing & Capabilities" tab
   - Select your team and provisioning profile
4. Run the app by clicking the Run button or pressing `Cmd+R`
5. If prompted, trust the developer on your iOS device:
   - On your device, go to Settings > General > Device Management
   - Tap on your developer certificate and trust it
6. Test the app's functionality as described above

## Troubleshooting

### Common Issues

1. **Code signing issues**: Make sure you have a valid Apple Developer account and proper provisioning profiles
2. **App doesn't install on device**: Check that your device is unlocked and trusted on your Mac
3. **WebView not loading**: Verify internet connectivity and that the URL in Config.swift is correct
4. **Build errors**: Make sure you have the latest Xcode version and required dependencies

### Debugging

1. In Xcode, use the Debug Navigator (Cmd+7) to monitor app performance
2. Use the Console (Cmd+Shift+C) to view logs
3. Set breakpoints in the code to pause execution and inspect variables

## Project Structure

- `AppDelegate.swift`: Main application delegate
- `SceneDelegate.swift`: Scene management for iOS 13+
- `ViewController.swift`: Main view controller with WebView implementation
- `BottomNavigationBar.swift`: Custom view for the bottom navigation bar
- `Colors.swift`: Color definitions for the app
- `Config.swift`: Configuration class that provides the API base URL
- `Info.plist`: App configuration
- `LaunchScreen.storyboard`: Launch screen

## Configuration

The app reads the PWA URL from the `Config.swift` file. If you want to change the URL:

1. Open `Config.swift`
2. Modify the fallback URL in the `apiBaseURL` computed property
3. Rebuild the app

### Environment Variables

The app can also read the URL from environment variables:

1. In Xcode, select the scheme (Product > Scheme > Edit Scheme)
2. Go to the Run action and select the Arguments tab
3. Under Environment Variables, add a variable named `API_BASE_URL` with your desired URL
4. Run the app

## Advanced Configuration

### Customizing the UI

- To change colors: Modify the `Colors.swift` file
- To change the bottom navigation bar: Modify the `BottomNavigationBar.swift` file
- To change the launch screen: Modify the `LaunchScreen.storyboard` file

### Adding Features

- To add new navigation buttons: Modify the `BottomNavigationBar.swift` and `ViewController.swift` files
- To add offline support: Implement WKWebView's caching capabilities
- To add push notifications: Implement UNUserNotificationCenter