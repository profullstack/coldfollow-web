package com.profullstack.pdfconverter

import android.content.Context
import android.util.Log

object Config {
    // Hardcoded production URL
    private const val DEFAULT_API_BASE_URL = "https://convert2doc.com"
    
    // Get API base URL - hardcoded for simplicity
    fun getApiBaseUrl(context: Context): String {
        Log.d("PDFConverter", "Using hardcoded URL: $DEFAULT_API_BASE_URL")
        return DEFAULT_API_BASE_URL
    }
}