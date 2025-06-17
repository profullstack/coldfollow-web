import { BaseComponent } from './base-component.js';
import { commonStyles } from './common-styles.js';
import { ApiClient } from '../api-client.js';

/**
 * API Key Manager component
 * Manages API keys for the user
 */
export class ApiKeyManager extends BaseComponent {
  /**
   * Create a new API key manager
   */
  constructor() {
    super();
    this._apiKeys = [];
    this._loading = false;
    this._error = null;
    this._newKeyName = '';
    this._newKeyValue = null;
  }

  /**
   * Get the component's styles
   * @returns {string} - CSS styles
   */
  getStyles() {
    return `
      ${commonStyles}
      
      :host {
        display: block;
        padding: 20px;
      }
      
      h2 {
        margin-top: 0;
        margin-bottom: 20px;
        color: var(--primary-color);
      }
      
      h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: var(--text-primary);
      }
      
      .api-key-form {
        margin-bottom: 30px;
        padding: 20px;
        background-color: var(--surface-color);
        border-radius: var(--border-radius-md);
        border: 1px solid var(--border-color);
      }
      
      .form-group {
        margin-bottom: 15px;
      }
      
      .form-help {
        margin-top: 5px;
        font-size: var(--font-size-sm);
        color: var(--text-tertiary);
      }
      
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: var(--font-weight-medium);
        color: var(--text-secondary);
      }
      
      input {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--input-border);
        border-radius: var(--border-radius-md);
        background-color: var(--input-background);
        color: var(--text-primary);
      }
      
      input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(224, 35, 55, 0.2);
      }
      
      .btn {
        display: inline-block;
        padding: 10px 15px;
        border: none;
        border-radius: var(--border-radius-md);
        cursor: pointer;
        font-weight: var(--font-weight-medium);
        transition: background-color var(--transition-fast);
        text-align: center;
      }
      
      .btn-primary {
        background-color: var(--primary-color);
        color: var(--text-on-primary);
      }
      
      .btn-primary:hover {
        background-color: var(--primary-dark);
      }
      
      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .delete-button {
        background-color: var(--error-color);
        color: white;
      }
      
      .delete-button:hover {
        background-color: #d32f2f;
      }
      
      .toggle-button {
        background-color: var(--text-tertiary);
        color: white;
      }
      
      .toggle-button:hover {
        background-color: var(--text-secondary);
      }
      
      .toggle-button.active {
        background-color: var(--success-color);
      }
      
      .toggle-button.active:hover {
        background-color: var(--secondary-dark);
      }
      
      .api-keys-list {
        width: 100%;
        list-style-position: inside;
        padding: 0;
        margin-bottom: 20px;
      }
      
      .api-key-item {
        padding: 15px;
        margin-bottom: 10px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        background-color: var(--background-color);
      }
      
      .api-key-item:hover {
        background-color: var(--surface-variant);
      }
      
      .api-key-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .api-key-name {
        font-weight: var(--font-weight-semibold);
        font-size: var(--font-size-lg);
      }
      
      .api-key-details {
        margin-bottom: 15px;
      }
      
      .api-key-detail {
        margin-bottom: 5px;
        display: flex;
        flex-wrap: wrap;
      }
      
      .api-key-label {
        font-weight: var(--font-weight-medium);
        color: var(--text-secondary);
        margin-right: 10px;
        min-width: 100px;
      }
      
      .api-key-value {
        color: var(--text-primary);
      }
      
      .api-key-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      
      .empty-state {
        padding: 30px;
        text-align: center;
        color: var(--text-tertiary);
        background-color: var(--surface-color);
        border-radius: var(--border-radius-md);
        border: 1px dashed var(--border-color);
        margin-bottom: 30px;
      }
      
      .empty-state button {
        margin-top: 15px;
      }
      
      .error {
        padding: 10px 15px;
        margin-bottom: 20px;
        color: var(--error-color);
        background-color: rgba(239, 68, 68, 0.1);
        border-left: 4px solid var(--error-color);
        border-radius: var(--border-radius-sm);
      }
      
      .success {
        padding: 10px 15px;
        margin-bottom: 20px;
        color: var(--success-color);
        background-color: rgba(16, 185, 129, 0.1);
        border-left: 4px solid var(--success-color);
        border-radius: var(--border-radius-sm);
      }
      
      .new-key {
        margin-top: 20px;
        padding: 15px;
        background-color: var(--surface-variant);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
      }
      
      .new-key-value {
        font-family: monospace;
        padding: 10px;
        background-color: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-sm);
        word-break: break-all;
        margin-bottom: 15px;
      }
      
      .copy-button {
        background-color: var(--secondary-color);
        margin-right: 10px;
        color: white;
      }
      
      .copy-button:hover {
        background-color: var(--secondary-dark);
      }
      
      .loading {
        text-align: center;
        padding: 40px;
        color: var(--text-tertiary);
      }
      
      .spinner {
        display: inline-block;
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: var(--primary-color);
        animation: spin 1s ease-in-out infinite;
        margin-top: 15px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .status-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: var(--border-radius-full);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-medium);
      }
      
      .status-badge.active {
        background-color: rgba(16, 185, 129, 0.1);
        color: var(--success-color);
      }
      
      .status-badge.inactive {
        background-color: rgba(239, 68, 68, 0.1);
        color: var(--error-color);
      }
    `;
  }

  /**
   * Get the component's template
   * @returns {string} - HTML template
   */
  getTemplate() {
    if (this._loading) {
      return `
        <div class="loading">
          <p>Loading API keys...</p>
          <div class="spinner"></div>
        </div>
      `;
    }
    
    return `
      <h2>API Key Management</h2>
      
      ${this._error ? `<div class="error">${this._error}</div>` : ''}
      ${this._newKeyValue ? this._renderNewKey() : ''}
      
      <div class="api-key-form">
        <h3>Create New API Key</h3>
        <div class="form-group">
          <label for="key-name">API Key Name</label>
          <input type="text" id="key-name" placeholder="e.g., Production, Development, Testing" value="${this._newKeyName}">
          <p class="form-help">Give your API key a descriptive name to identify its purpose.</p>
        </div>
        <button id="create-key-button" class="btn btn-primary" ${this._newKeyName.trim() === '' ? 'disabled' : ''}>Create API Key</button>
      </div>
      
      <h3>Your API Keys</h3>
      
      ${this._renderApiKeys()}
    `;
  }

  /**
   * Render API keys table
   * @returns {string} - HTML for API keys table
   * @private
   */
  _renderApiKeys() {
    if (this._apiKeys.length === 0) {
      return `
        <div class="empty-state">
          <p>You don't have any API keys yet. Create one to get started.</p>
          <p>API keys are used to authenticate your requests to our API endpoints.</p>
        </div>
      `;
    }
    
    return `
      <ol class="api-keys-list">
        ${this._apiKeys.map(key => `
          <li class="api-key-item" data-key-id="${key.id}">
            <div class="api-key-header">
              <div class="api-key-name">${key.name}</div>
              <span class="status-badge ${key.is_active ? 'active' : 'inactive'}">
                ${key.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div class="api-key-details">
              <div class="api-key-detail">
                <span class="api-key-label">Created:</span>
                <span class="api-key-value">${this._formatDate(key.created_at)}</span>
              </div>
              
              <div class="api-key-detail">
                <span class="api-key-label">Last Used:</span>
                <span class="api-key-value">${key.last_used_at ? this._formatDate(key.last_used_at) : 'Never'}</span>
              </div>
            </div>
            
            <div class="api-key-actions">
              <button class="toggle-button ${key.is_active ? 'active' : ''}" data-action="toggle" data-key-id="${key.id}" title="${key.is_active ? 'Deactivate this API key' : 'Activate this API key'}">
                ${key.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button class="delete-button" data-action="delete" data-key-id="${key.id}" title="Delete this API key permanently">Delete</button>
            </div>
          </li>
        `).join('')}
      </ol>
    `;
  }

  /**
   * Render new key section
   * @returns {string} - HTML for new key section
   * @private
   */
  _renderNewKey() {
    return `
      <div class="new-key success">
        <h3>Your New API Key</h3>
        <p>This is your new API key. Please copy it now as you won't be able to see it again.</p>
        <div class="new-key-value">${this._newKeyValue}</div>
        <button id="copy-key-button" class="copy-button">Copy to Clipboard</button>
        <button id="done-button">Done</button>
      </div>
    `;
  }

  /**
   * Format a date
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   * @private
   */
  _formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Create key button
    const createKeyButton = this.$('#create-key-button');
    if (createKeyButton) {
      createKeyButton.addEventListener('click', (e) => {
        this._createApiKey();
      });
    }
    
    // Create empty key button (when no keys exist)
    const createEmptyKeyButton = this.$('#create-empty-key-button');
    if (createEmptyKeyButton) {
      createEmptyKeyButton.addEventListener('click', () => {
        this._newKeyName = 'My First API Key';
        this._createApiKey();
      });
    }
    
    // Key name input
    const keyNameInput = this.$('#key-name');
    if (keyNameInput) {
      keyNameInput.addEventListener('blur', (e) => {
        this._newKeyName = e.target.value;
        this.render();
      });
      
      // Also handle Enter key press
      keyNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && this._newKeyName.trim() !== '') {
          this._createApiKey();
        }
      });
    }
    
    // Copy key button
    const copyKeyButton = this.$('#copy-key-button');
    if (copyKeyButton) {
      copyKeyButton.addEventListener('click', () => this._copyToClipboard());
    }
    
    // Done button
    const doneButton = this.$('#done-button');
    if (doneButton) {
      doneButton.addEventListener('click', () => {
        this._newKeyValue = null;
        this._newKeyName = '';
        this.render();
      });
    }
    
    // Toggle and delete buttons
    const apiKeysList = this.$('.api-keys-list');
    if (apiKeysList) {
      apiKeysList.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        
        const action = button.dataset.action;
        const keyId = button.dataset.keyId;
        
        if (action === 'toggle') {
          const key = this._apiKeys.find(k => k.id === keyId);
          if (key) {
            this._toggleApiKey(keyId, !key.is_active);
          }
        } else if (action === 'delete') {
          if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
            this._deleteApiKey(keyId);
          }
        }
      });
    }
  }

  /**
   * Called when the element is connected to the DOM
   */
  connectedCallback() {
    super.connectedCallback();
    this._loadApiKeys();
  }

  /**
   * Load API keys
   * @private
   */
  async _loadApiKeys() {
    try {
      this._loading = true;
      this._error = null;
      this.render();
      
      // Use the ApiClient class for consistency
      const { ApiClient } = await import('../api-client.js');
      const baseUrl = ApiClient.baseUrl || '/api/1';
      
      // Get a valid token using the BaseComponent's getAuthToken method
      const authToken = await this.getAuthToken();
      
      // Debug the token we're about to use
      console.log('API Key Manager: Authorization token length:', authToken?.length || 0);
      
      // Only include Authorization header if we have a valid token
      const headers = {
        'Accept': 'application/json'
      };
      
      if (authToken && authToken !== 'null' && authToken.length > 10) {
        console.log('API Key Manager: Using valid token for Authorization header');
        headers['Authorization'] = `Bearer ${authToken}`;
      } else {
        console.warn('API Key Manager: No valid token available, proceeding without Authorization header');
      }
      
      const response = await fetch(`${baseUrl}/api-keys`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load API keys');
      }
      
      const data = await response.json();
      this._apiKeys = data.api_keys || [];
      this._loading = false;
      this.render();
    } catch (error) {
      console.error('Error loading API keys:', error);
      this._error = `Error loading API keys: ${error.message}`;
      this._loading = false;
      this.render();
    }
  }

  /**
   * Create a new API key
   * @private
   */
  async _createApiKey() {
    try {
      if (!this._newKeyName.trim()) {
        this._error = 'API key name is required';
        this.render();
        return;
      }
      
      this._loading = true;
      this._error = null;
      this.render();
      
      // Use the ApiClient class for consistency
      const { ApiClient } = await import('../api-client.js');
      const baseUrl = ApiClient.baseUrl || '/api/1';
      
      // Get a valid token using the BaseComponent's getAuthToken method
      const authToken = await this.getAuthToken();
      
      // Debug the token we're about to use
      console.log('API Key Manager: Create key - token length:', authToken?.length || 0);
      
      // Only include Authorization header if we have a valid token
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (authToken && authToken !== 'null' && authToken.length > 10) {
        console.log('API Key Manager: Create key - using valid token');
        headers['Authorization'] = `Bearer ${authToken}`;
      } else {
        console.warn('API Key Manager: Create key - no valid token available');
      }
      
      const response = await fetch(`${baseUrl}/api-keys`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: this._newKeyName })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create API key');
      }
      
      const data = await response.json();
      this._newKeyValue = data.key;
      await this._loadApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      this._error = `Error creating API key: ${error.message}`;
      this._loading = false;
      this.render();
    }
  }

  /**
   * Toggle an API key's active status
   * @param {string} keyId - API key ID
   * @param {boolean} isActive - Whether the key should be active
   * @private
   */
  async _toggleApiKey(keyId, isActive) {
    try {
      this._loading = true;
      this._error = null;
      this.render();
      
      // Use the ApiClient class for consistency
      const { ApiClient } = await import('../api-client.js');
      const baseUrl = ApiClient.baseUrl || '/api/1';
      
      // Get a valid token using the BaseComponent's getAuthToken method
      const authToken = await this.getAuthToken();
      
      // Debug the token we're about to use
      console.log('API Key Manager: Toggle key - token length:', authToken?.length || 0);
      
      // Only include Authorization header if we have a valid token
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (authToken && authToken !== 'null' && authToken.length > 10) {
        console.log('API Key Manager: Toggle key - using valid token');
        headers['Authorization'] = `Bearer ${authToken}`;
      } else {
        console.warn('API Key Manager: Toggle key - no valid token available');
      }
      
      const response = await fetch(`${baseUrl}/api-keys/${keyId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          is_active: isActive
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update API key');
      }
      
      await this._loadApiKeys();
    } catch (error) {
      console.error('Error updating API key:', error);
      this._error = `Error updating API key: ${error.message}`;
      this._loading = false;
      this.render();
    }
  }

  /**
   * Delete an API key
   * @param {string} keyId - API key ID
   * @private
   */
  async _deleteApiKey(keyId) {
    try {
      this._loading = true;
      this._error = null;
      this.render();
      
      // Use the ApiClient class for consistency
      const { ApiClient } = await import('../api-client.js');
      const baseUrl = ApiClient.baseUrl || '/api/1';
      
      // Get a valid token using the BaseComponent's getAuthToken method
      const authToken = await this.getAuthToken();
      
      // Debug the token we're about to use
      console.log('API Key Manager: Delete key - token length:', authToken?.length || 0);
      
      // Only include Authorization header if we have a valid token
      const headers = {
        'Accept': 'application/json'
      };
      
      if (authToken && authToken !== 'null' && authToken.length > 10) {
        console.log('API Key Manager: Delete key - using valid token');
        headers['Authorization'] = `Bearer ${authToken}`;
      } else {
        console.warn('API Key Manager: Delete key - no valid token available');
      }
      
      const response = await fetch(`${baseUrl}/api-keys/${keyId}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete API key');
      }
      
      await this._loadApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      this._error = `Error deleting API key: ${error.message}`;
      this._loading = false;
      this.render();
    }
  }

  /**
   * Copy API key to clipboard
   * @private
   */
  _copyToClipboard() {
    if (!this._newKeyValue) return;
    
    navigator.clipboard.writeText(this._newKeyValue)
      .then(() => {
        const copyButton = this.$('#copy-key-button');
        if (copyButton) {
          const originalText = copyButton.textContent;
          copyButton.textContent = 'Copied!';
          setTimeout(() => {
            copyButton.textContent = originalText;
          }, 2000);
        }
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        this._error = 'Failed to copy to clipboard. Please copy the key manually.';
        this.render();
      });
  }

}

// Define the custom element
if (!customElements.get('api-key-manager')) {
  customElements.define('api-key-manager', ApiKeyManager);
  console.log('API key manager component registered');
}