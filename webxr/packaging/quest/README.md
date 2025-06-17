# Meta Quest Store Packaging Guide

This guide explains how to package the WebXR experience as a native Android app for the Meta Quest Store.

## Prerequisites

- Android Studio
- Oculus Mobile SDK
- Meta Quest Developer Account
- Java Development Kit (JDK)

## Steps to Package for Meta Quest

1. **Create an Android Project**

   Create a new Android project in Android Studio with a minimum SDK level that supports the Quest.

2. **Add the Oculus Mobile SDK**

   Add the Oculus Mobile SDK to your project by following the [official documentation](https://developer.oculus.com/documentation/native/android/mobile-intro/).

3. **Create a WebView Activity**

   Create an activity that uses a WebView to load your WebXR content:

   ```java
   public class MainActivity extends Activity {
       private WebView webView;

       @Override
       protected void onCreate(Bundle savedInstanceState) {
           super.onCreate(savedInstanceState);
           
           // Set up full-screen immersive mode
           getWindow().getDecorView().setSystemUiVisibility(
                   View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                   | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                   | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                   | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                   | View.SYSTEM_UI_FLAG_FULLSCREEN
                   | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
           
           // Create WebView
           webView = new WebView(this);
           setContentView(webView);
           
           // Configure WebView settings
           WebSettings webSettings = webView.getSettings();
           webSettings.setJavaScriptEnabled(true);
           webSettings.setDomStorageEnabled(true);
           webSettings.setAllowFileAccess(true);
           webSettings.setAllowContentAccess(true);
           webSettings.setAllowFileAccessFromFileURLs(true);
           webSettings.setAllowUniversalAccessFromFileURLs(true);
           
           // Enable WebXR
           webSettings.setMediaPlaybackRequiresUserGesture(false);
           
           // Add JavaScript interface for native communication if needed
           // webView.addJavascriptInterface(new WebAppInterface(this), "Android");
           
           // Load the WebXR content
           webView.loadUrl("file:///android_asset/www/index.html");
           
           // Enable remote debugging
           if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
               WebView.setWebContentsDebuggingEnabled(true);
           }
       }
   }
   ```

4. **Copy WebXR Files to Assets**

   Copy all the WebXR files (HTML, CSS, JS, assets) to the `assets/www` directory in your Android project.

5. **Configure the Android Manifest**

   Update the `AndroidManifest.xml` to include necessary permissions and Oculus-specific configurations:

   ```xml
   <manifest xmlns:android="http://schemas.android.com/apk/res/android"
       package="com.yourcompany.webxrapp">

       <uses-permission android:name="android.permission.INTERNET" />
       <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
       
       <!-- VR-specific permissions -->
       <uses-feature android:name="android.hardware.vr.headtracking" android:required="true" />
       
       <application
           android:allowBackup="true"
           android:icon="@mipmap/ic_launcher"
           android:label="@string/app_name"
           android:supportsRtl="true"
           android:theme="@android:style/Theme.Black.NoTitleBar.Fullscreen">
           
           <!-- Meta Quest specific metadata -->
           <meta-data android:name="com.oculus.supportedDevices" android:value="quest|quest2|questpro" />
           
           <activity
               android:name=".MainActivity"
               android:configChanges="orientation|keyboardHidden|screenSize"
               android:exported="true"
               android:screenOrientation="landscape">
               <intent-filter>
                   <action android:name="android.intent.action.MAIN" />
                   <category android:name="android.intent.category.LAUNCHER" />
                   <category android:name="com.oculus.intent.category.VR" />
               </intent-filter>
           </activity>
       </application>
   </manifest>
   ```

6. **Build and Sign the APK**

   Build and sign your APK using Android Studio.

7. **Submit to the Meta Quest Store**

   Follow the [Meta Quest Store submission guidelines](https://developer.oculus.com/resources/publish-quest-req/) to submit your app.