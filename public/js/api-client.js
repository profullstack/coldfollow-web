/**
 * API client for document generation service
 */
export class ApiClient {
  // Flag to avoid logging token warning multiple times
  static _tokenWarningLogged = false;
  
  /**
   * Show a success message using the alert system
   * @param {string} message - Success message to display
   * @private
   */
  static _showSuccess(message) {
    if (window.showSuccess) {
      window.showSuccess(message);
    } else {
      console.log(`Success: ${message}`);
    }
  }
  
  /**
   * Get a valid JWT token or null if none is available
   * @returns {string|null} - Valid JWT token or null
   * @private
   */
  static _getValidJwtToken() {
    // Get JWT token from localStorage
    const jwtToken = localStorage.getItem('jwt_token');
    
    // Log token details for debugging (only in development)
    if (jwtToken) {
      console.log(`JWT Token check: Found token of length ${jwtToken ? jwtToken.length : 0}`);
      console.log(`JWT Token value: ${jwtToken === 'null' ? 'literal "null" string' : (jwtToken ? 'valid string' : 'empty')}`);
    }
    
    // Validate token to prevent sending 'null' string
    if (jwtToken && jwtToken !== 'null' && jwtToken.length > 50) {
      return jwtToken;
    }
    
    // Log only once per session to avoid console spam
    if (!ApiClient._tokenWarningLogged) {
      console.warn('No valid JWT token available in localStorage');
      if (jwtToken) {
        console.warn(`Token validation failed: ${jwtToken === 'null' ? 'literal "null" string' : `length ${jwtToken.length} (too short)`}`);
      } else {
        console.warn('Token is undefined or null');
      }
      ApiClient._tokenWarningLogged = true;
    }
    
    return null;
  }
  /**
   * Base URL for API endpoints
   * @type {string}
   */
  static baseUrl = '/api/1';

  /**
   * Convert HTML to PDF
   * @param {string} html - HTML content
   * @param {Object} options - PDF generation options
   * @param {string} filename - Output filename
   * @param {boolean} store - Whether to store the document in Supabase
   * @returns {Promise<Blob>} - PDF blob
   */
  static async htmlToPdf(html, options = {}, filename = 'document.pdf', store = false) {
    return this.fetchBinaryResponse(`${this.baseUrl}/html-to-pdf`, { 
      html, 
      options, 
      filename, 
      store 
    });
  }

  /**
   * Convert HTML to Word document
   * @param {string} html - HTML content
   * @param {string} filename - Output filename
   * @param {boolean} store - Whether to store the document in Supabase
   * @returns {Promise<Blob>} - Word document blob
   */
  static async htmlToDoc(html, filename = 'document.docx', store = false) {
    console.log('Sending HTML to DOC conversion request with filename:', filename);
    return this.fetchBinaryResponse(`${this.baseUrl}/html-to-doc`, { 
      html, 
      filename, 
      store 
    });
  }

  /**
   * Convert HTML to Excel spreadsheet
   * @param {string} html - HTML content with tables
   * @param {string} filename - Output filename
   * @param {string} sheetName - Sheet name
   * @param {boolean} store - Whether to store the document in Supabase
   * @returns {Promise<Blob>} - Excel blob
   */
  static async htmlToExcel(html, filename = 'document.xlsx', sheetName = 'Sheet1', store = false) {
    return this.fetchBinaryResponse(`${this.baseUrl}/html-to-excel`, { 
      html, 
      filename, 
      sheetName, 
      store 
    });
  }

  /**
   * Convert HTML to PowerPoint presentation
   * @param {string} html - HTML content with headings
   * @param {string} filename - Output filename
   * @param {string} title - Presentation title
   * @param {boolean} store - Whether to store the document in Supabase
   * @returns {Promise<Blob>} - PowerPoint blob
   */
  static async htmlToPpt(html, filename = 'presentation.pptx', title = 'Presentation', store = false) {
    return this.fetchBinaryResponse(`${this.baseUrl}/html-to-ppt`, { 
      html, 
      filename, 
      title, 
      store 
    });
  }

  /**
   * Convert HTML to EPUB
   * @param {string} html - HTML content
   * @param {string} filename - Output filename
   * @param {string} title - Book title
   * @param {string} author - Book author
   * @param {string} cover - Cover image path
   * @param {boolean} store - Whether to store the document in Supabase
   * @returns {Promise<Blob>} - EPUB blob
   */
  static async htmlToEpub(html, filename = 'document.epub', title = '', author = '', cover = '', store = false) {
    return this.fetchBinaryResponse(`${this.baseUrl}/html-to-epub`, { 
      html, 
      filename, 
      title, 
      author, 
      cover,
      store
    });
  }

  /**
   * Convert HTML to Markdown
   * @param {string} html - HTML content
   * @param {Object} options - Turndown options
   * @returns {Promise<string>} - Markdown content
   */
  static async htmlToMarkdown(html, options = {}) {
    const response = await this.fetchJsonResponse(`${this.baseUrl}/html-to-markdown`, { html, options });
    return response.markdown;
  }

  /**
   * Convert Markdown to HTML
   * @param {string} markdown - Markdown content
   * @param {Object} options - Marked options
   * @returns {Promise<string>} - HTML content
   */
  static async markdownToHtml(markdown, options = {}) {
    const response = await this.fetchJsonResponse(`${this.baseUrl}/markdown-to-html`, { markdown, options });
    return response.html;
  }

  /**
   * Get document generation history
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object>} - Document history data with pagination
   */
  static async getDocumentHistory(limit = 10, offset = 0) {
    // Use API_BASE_URL for the domain, but keep the API path as /api/1
    const apiBaseUrl = window.API_BASE_URL || window.location.origin;
    const url = new URL(`${apiBaseUrl}/api/1/document-history`);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('offset', offset.toString());
    
    const headers = {
      'Accept': 'application/json',
    };
    
    // Get a valid JWT token using our helper method
    const jwtToken = ApiClient._getValidJwtToken();
    
    // Add Authorization header with JWT token if available
    if (jwtToken) {
      console.log(`API Client: Using JWT token of length ${jwtToken.length} for document history`);
      headers['Authorization'] = `Bearer ${jwtToken}`;
    } else {
      console.warn('API Client: No valid JWT token available for document history request');
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || response.statusText;
      // Use our new error handling system
      if (window.handleApiError) {
        window.handleApiError(errorData, errorMessage);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  /**
   * Create a new subscription
   * @param {string} email - User email
   * @param {string} plan - Subscription plan (monthly, yearly)
   * @param {string} coin - Cryptocurrency code (btc, eth, sol, usdc)
   * @returns {Promise<Object>} - Subscription details with payment info
   */
  static async createSubscription(email, plan, coin) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Get a valid JWT token using our helper method
      const jwtToken = ApiClient._getValidJwtToken();
      
      // Add Authorization header with JWT token if available
      if (jwtToken) {
        console.log(`API Client: Using JWT token of length ${jwtToken.length} for createSubscription`);
        headers['Authorization'] = `Bearer ${jwtToken}`;
      } else {
        console.warn('API Client: No valid JWT token available for createSubscription request');
      }
      
      // Use API_BASE_URL for the domain, but keep the API path as provided
      const apiBaseUrl = window.API_BASE_URL || window.location.origin;
      const fullUrl = `${apiBaseUrl}${this.baseUrl}/subscription`;
      console.log('Making subscription request to:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          plan,
          coin
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to create subscription';
        // Use our new error handling system
        if (window.handleApiError) {
          window.handleApiError(errorData, errorMessage);
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // Show success message
      this._showSuccess(`Subscription created successfully`);
      
      return result;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Check subscription status
   * @param {string} email - User email
   * @returns {Promise<Object>} - Subscription status
   */
  static async checkSubscriptionStatus(email) {
    // This is a public endpoint that doesn't require authentication
    // Use API_BASE_URL for the domain, but keep the API path as provided
    const apiBaseUrl = window.API_BASE_URL || window.location.origin;
    const fullUrl = `${apiBaseUrl}${this.baseUrl}/subscription-status`;
    console.log('Checking subscription status at:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || response.statusText;
      // Use our new error handling system
      if (window.handleApiError) {
        window.handleApiError(errorData, errorMessage);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  /**
   * Fetch a binary response from an API endpoint
   * @param {string} url - API endpoint URL
   * @param {Object} body - Request body
   * @returns {Promise<Blob>} - Binary blob
   * @private
   */
  static async fetchBinaryResponse(url, body) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Get a valid JWT token using our helper method
    const jwtToken = ApiClient._getValidJwtToken();
    
    // Add Authorization header with JWT token if available
    if (jwtToken) {
      console.log(`API Client: Using JWT token of length ${jwtToken.length} for binary request`);
      headers['Authorization'] = `Bearer ${jwtToken}`;
    } else {
      console.warn('API Client: No valid JWT token available for binary request');
    }
    
    // Use API_BASE_URL for the domain, but keep the API path as provided
    const apiBaseUrl = window.API_BASE_URL || window.location.origin;
    const fullUrl = `${apiBaseUrl}${url}`;
    console.log('Making binary request to:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || response.statusText;
      // Use our new error handling system
      if (window.handleApiError) {
        window.handleApiError(errorData, errorMessage);
      }
      throw new Error(errorMessage);
    }

    return await response.blob();
  }

  /**
   * Fetch a JSON response from an API endpoint
   * @param {string} url - API endpoint URL
   * @param {Object} body - Request body
   * @returns {Promise<Object>} - JSON response
   * @private
   */
  static async fetchJsonResponse(url, body) {
    // Get a valid JWT token using our helper method
    const jwtToken = ApiClient._getValidJwtToken();
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add Authorization header with JWT token if available
    if (jwtToken) {
      console.log(`API Client: Using JWT token of length ${jwtToken.length} for JSON request`);
      headers['Authorization'] = `Bearer ${jwtToken}`;
    } else {
      console.warn('API Client: No valid JWT token available for JSON request');
    }
    
    // Use API_BASE_URL for the domain, but keep the API path as provided
    const apiBaseUrl = window.API_BASE_URL || window.location.origin;
    const fullUrl = `${apiBaseUrl}${url}`;
    console.log('Making JSON request to:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || response.statusText;
      // Use our new error handling system
      if (window.handleApiError) {
        window.handleApiError(errorData, errorMessage);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  /**
   * Download a blob as a file
   * @param {Blob} blob - Blob to download
   * @param {string} filename - Filename
   */
  static downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * API Key Management
   */

  /**
   * Get API keys
   * @returns {Promise<Object>} - API keys
   */
  static async getApiKeys() {
    // Use API_BASE_URL for the domain, but keep the API path as provided
    const apiBaseUrl = window.API_BASE_URL || window.location.origin;
    const url = `${apiBaseUrl}${this.baseUrl}/api-keys`;
    console.log('Getting API keys from:', url);
    
    const headers = {
      'Accept': 'application/json',
    };
    
    // Get a valid JWT token using our helper method
    const jwtToken = ApiClient._getValidJwtToken();
    
    // Add Authorization header with JWT token if available
    if (jwtToken) {
      console.log(`API Client: Using JWT token of length ${jwtToken.length} for getApiKeys`);
      headers['Authorization'] = `Bearer ${jwtToken}`;
    } else {
      console.warn('API Client: No valid JWT token available for getApiKeys request');
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || response.statusText;
      // Use our new error handling system
      if (window.handleApiError) {
        window.handleApiError(errorData, errorMessage);
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    
    // Show success message
    this._showSuccess(`API key "${name}" created successfully`);
    
    return result;
  }
  
  /**
   * Create a new API key
   * @param {string} name - API key name
   * @returns {Promise<Object>} - New API key
   */
  static async createApiKey(name) {
    // Use API_BASE_URL for the domain, but keep the API path as provided
    const apiBaseUrl = window.API_BASE_URL || window.location.origin;
    const url = `${apiBaseUrl}${this.baseUrl}/api-keys`;
    console.log('Creating API key at:', url);
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Get a valid JWT token using our helper method
    const jwtToken = ApiClient._getValidJwtToken();
    
    // Add Authorization header with JWT token if available
    if (jwtToken) {
      console.log(`API Client: Using JWT token of length ${jwtToken.length} for createApiKey`);
      headers['Authorization'] = `Bearer ${jwtToken}`;
    } else {
      console.warn('API Client: No valid JWT token available for createApiKey request');
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || response.statusText;
      // Use our new error handling system
      if (window.handleApiError) {
        window.handleApiError(errorData, errorMessage);
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    
    // Show success message
    this._showSuccess(`API key updated successfully`);
    
    return result;
  }
  
  /**
   * Update an API key
   * @param {string} keyId - API key ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Updated API key
   */
  static async updateApiKey(keyId, updates) {
    // Use API_BASE_URL for the domain, but keep the API path as provided
    const apiBaseUrl = window.API_BASE_URL || window.location.origin;
    const url = `${apiBaseUrl}${this.baseUrl}/api-keys/${keyId}`;
    console.log('Updating API key at:', url);
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Get a valid JWT token using our helper method
    const jwtToken = ApiClient._getValidJwtToken();
    
    // Add Authorization header with JWT token if available
    if (jwtToken) {
      console.log(`API Client: Using JWT token of length ${jwtToken.length} for updateApiKey`);
      headers['Authorization'] = `Bearer ${jwtToken}`;
    } else {
      console.warn('API Client: No valid JWT token available for updateApiKey request');
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || response.statusText;
      // Use our new error handling system
      if (window.handleApiError) {
        window.handleApiError(errorData, errorMessage);
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    
    // Show success message
    this._showSuccess(`API key deleted successfully`);
    
    return result;
  }
  
  /**
   * Delete an API key
   * @param {string} keyId - API key ID
   * @returns {Promise<Object>} - Success status
   */
  static async deleteApiKey(keyId) {
    // Use API_BASE_URL for the domain, but keep the API path as provided
    const apiBaseUrl = window.API_BASE_URL || window.location.origin;
    const url = `${apiBaseUrl}${this.baseUrl}/api-keys/${keyId}`;
    console.log('Deleting API key at:', url);
    
    const headers = {
      'Accept': 'application/json',
    };
    
    // Get a valid JWT token using our helper method
    const jwtToken = ApiClient._getValidJwtToken();
    
    // Add Authorization header with JWT token if available
    if (jwtToken) {
      console.log(`API Client: Using JWT token of length ${jwtToken.length} for deleteApiKey`);
      headers['Authorization'] = `Bearer ${jwtToken}`;
    } else {
      console.warn('API Client: No valid JWT token available for deleteApiKey request');
    }
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || response.statusText);
    }
    
    return await response.json();
  }
}