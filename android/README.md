# PDF Converter Android App

A simple Android app that uses WebView to load the PDF Converter PWA from the production website.

## Features

- Loads the PWA from the URL specified in the Config.kt file
- Supports all PWA features through WebView
- Pull-to-refresh functionality
- Handles back navigation within the WebView
- Provides a native Android experience for the web application

## Requirements

- Android Studio Arctic Fox (2020.3.1) or newer
- Minimum SDK: 21 (Android 5.0 Lollipop)
- Target SDK: 33 (Android 13)
- Kotlin 1.8.0+
- JDK 11 or newer
- Gradle 7.0.2 or newer

## Building and Running the App

### Prerequisites

1. Install [Android Studio](https://developer.android.com/studio)
2. Install the Android SDK through Android Studio's SDK Manager
3. Make sure you have the required SDK platforms (API level 21-33) installed

### Building from Android Studio

1. Open Android Studio
2. Select "Open an existing project"
3. Navigate to the `android/PDFConverter` folder and click "Open"
4. Wait for Gradle sync to complete
5. Select your target device or emulator from the dropdown menu in the toolbar
6. Click the Run button (green triangle) or press `Shift+F10` to build and run the app

### Building from Command Line

#### Using the Build Script (Recommended)

We've provided a convenient build script that handles the build process:

```bash
cd android
./build.sh
```

This script will:
1. Clean the project
2. Build the debug APK
3. Show the location and size of the generated APK
4. Provide instructions for installing the APK on a device

#### Manual Build Process

If you prefer to build manually:

##### On macOS/Linux:

```bash
cd android/PDFConverter
./gradlew assembleDebug
```

##### On Windows:

```bash
cd android\PDFConverter
gradlew.bat assembleDebug
```

The APK file will be generated at `app/build/outputs/apk/debug/app-debug.apk`

### Installing the APK on a Device

#### Using ADB (Android Debug Bridge):

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

#### Manually:

1. Transfer the APK file to your Android device
2. On your device, navigate to the APK file and tap on it
3. Follow the on-screen instructions to install the app

## Testing the App

### On an Emulator

1. In Android Studio, open the AVD Manager (Tools > AVD Manager)
2. Create a new virtual device if you don't have one already
3. Start the emulator
4. Run the app on the emulator

### On a Physical Device

1. Enable Developer Options on your Android device:
   - Go to Settings > About phone
   - Tap on "Build number" 7 times until you see "You are now a developer"
2. Enable USB Debugging:
   - Go to Settings > System > Developer options
   - Turn on "USB debugging"
3. Connect your device to your computer via USB
4. Allow USB debugging when prompted on your device
5. In Android Studio, select your device from the dropdown menu
6. Run the app

## Troubleshooting

### Common Issues

1. **Gradle sync failed**: Make sure you have the correct Gradle version and JDK installed
2. **Device not recognized**: Check USB debugging is enabled and you have the proper USB drivers installed
3. **App crashes on startup**: Check the logcat output in Android Studio for error details
4. **WebView not loading**: Verify internet connectivity and that the URL in Config.kt is correct

### Debugging

1. In Android Studio, open the Logcat window (View > Tool Windows > Logcat)
2. Filter the logs by "PDFConverter" to see app-specific logs
3. Look for any error messages or exceptions

## Project Structure

- `MainActivity.kt`: Main activity with WebView implementation
- `Config.kt`: Configuration class that provides the API base URL
- `activity_main.xml`: Main layout with WebView and bottom navigation bar
- `bottom_nav_bar.xml`: Layout for the bottom navigation bar
- `AndroidManifest.xml`: App configuration and permissions
- `build.gradle`: Project and app-level build configurations

## Configuration

The app uses a hardcoded URL in the `Config.kt` file. If you want to change the URL:

1. Open `app/src/main/java/com/profullstack/pdfconverter/Config.kt`
2. Modify the `DEFAULT_API_BASE_URL` constant to point to your desired URL
3. Rebuild the app

## Additional WebView Settings

The app is configured with optimal WebView settings for PWA support:

- JavaScript enabled
- DOM storage enabled
- Database access enabled
- Geolocation enabled
- Zoom controls enabled
- File access enabled
- Caching enabled

These settings can be modified in the `onCreate` method of `MainActivity.kt` if needed.