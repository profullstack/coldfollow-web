const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Default fallback URL
const DEFAULT_API_BASE_URL = 'https://convert2doc.com';

// Function to get API base URL from .env file
function getApiBaseUrl() {
  try {
    // Try to find the .env file in the project root
    const rootPath = path.resolve(__dirname, '../../');
    const envPath = path.join(rootPath, '.env');
    
    if (fs.existsSync(envPath)) {
      // Parse .env file
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      
      // Return API_BASE_URL if found
      if (envConfig.API_BASE_URL) {
        return envConfig.API_BASE_URL;
      }
    }
    
    // If .env file not found or API_BASE_URL not set, check environment variables
    if (process.env.API_BASE_URL) {
      return process.env.API_BASE_URL;
    }
  } catch (error) {
    console.error('Error reading .env file:', error);
  }
  
  // Return default URL if .env file not found or error occurs
  return DEFAULT_API_BASE_URL;
}

module.exports = {
  getApiBaseUrl
};