package com.profullstack.pdfconverter

import android.annotation.SuppressLint
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import android.widget.Toast
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    // URL of the PWA - hardcoded for simplicity
    private lateinit var pwaUrl: String
    
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Get API base URL from Config
        pwaUrl = Config.getApiBaseUrl(this)
        Log.d("PDFConverter", "Loading URL: $pwaUrl")
        
        // Verify URL is valid
        try {
            val url = java.net.URL(pwaUrl)
            Log.d("PDFConverter", "URL is valid: $pwaUrl (protocol: ${url.protocol}, host: ${url.host}, path: ${url.path})")
        } catch (e: Exception) {
            Log.e("PDFConverter", "URL is invalid: $pwaUrl", e)
            // Fall back to hardcoded URL if the one from Config is invalid
            pwaUrl = "https://convert2doc.com"
            Log.d("PDFConverter", "Falling back to hardcoded URL: $pwaUrl")
        }
        
        // Initialize WebView
        webView = findViewById(R.id.webView)
        
        // Configure WebView settings
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false
            // Enable PWA features
            setGeolocationEnabled(true)
            allowFileAccess = true
            allowContentAccess = true
            // Modern caching is handled by the browser automatically
            cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
        }
        
        // Set WebViewClient to handle page navigation
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                Log.d("PDFConverter", "Page loading started: $url")
            }
            
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d("PDFConverter", "Page loading finished: $url")
            }
            
            @RequiresApi(Build.VERSION_CODES.M)
            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                
                val errorMessage = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    "Error: ${error?.errorCode} - ${error?.description}"
                } else {
                    "Error loading page"
                }
                
                Log.e("PDFConverter", "WebView error: $errorMessage for URL: ${request?.url}")
                
                // Check if this is a 404 error
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && error?.errorCode == -2) {
                    Log.e("PDFConverter", "404 Not Found error detected")
                    
                    // Try to load the fallback URL
                    val fallbackUrl = "https://convert2doc.com"
                    if (request?.url.toString() != fallbackUrl) {
                        Log.d("PDFConverter", "Trying fallback URL: $fallbackUrl")
                        view?.loadUrl(fallbackUrl)
                        Toast.makeText(this@MainActivity, "Page not found, trying fallback URL", Toast.LENGTH_LONG).show()
                        return
                    }
                }
                
                Toast.makeText(this@MainActivity, errorMessage, Toast.LENGTH_LONG).show()
            }
            
            // Keep navigation within the WebView
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                Log.d("PDFConverter", "Navigation to: ${request?.url}")
                return false
            }
        }
        
        // Check if URL is accessible
        checkUrlAccessibility(pwaUrl)
        
        // Load the PWA
        Log.d("PDFConverter", "Loading PWA URL: $pwaUrl")
        webView.loadUrl(pwaUrl)
        
        // Set up bottom navigation
        setupBottomNavigation()
    }
    
    /**
     * Set up the bottom navigation bar
     */
    private fun setupBottomNavigation() {
        val homeButton = findViewById<TextView>(R.id.homeButton)
        homeButton.setOnClickListener {
            // Navigate to home page
            webView.loadUrl(pwaUrl)
        }
    }
    
    // Handle back button to navigate within WebView history
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
    
    // Check if URL is accessible
    private fun checkUrlAccessibility(url: String) {
        Thread {
            try {
                Log.d("PDFConverter", "Checking URL accessibility: $url")
                val connection = java.net.URL(url).openConnection() as java.net.HttpURLConnection
                connection.connectTimeout = 5000
                connection.readTimeout = 5000
                connection.requestMethod = "HEAD"
                val responseCode = connection.responseCode
                Log.d("PDFConverter", "URL accessibility check result: $url - Response code: $responseCode")
                
                if (responseCode == 200) {
                    Log.d("PDFConverter", "URL is accessible: $url")
                } else {
                    Log.e("PDFConverter", "URL is not accessible: $url - Response code: $responseCode")
                    runOnUiThread {
                        Toast.makeText(this@MainActivity, "Warning: URL may not be accessible (HTTP $responseCode)", Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                Log.e("PDFConverter", "Error checking URL accessibility: $url", e)
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "Warning: Could not check URL accessibility", Toast.LENGTH_LONG).show()
                }
            }
        }.start()
    }
}