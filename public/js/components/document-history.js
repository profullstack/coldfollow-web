import { BaseComponent } from './base-component.js';
import { commonStyles } from './common-styles.js';
import { ApiClient } from '../api-client.js';

/**
 * Document history component
 */
export class DocumentHistory extends BaseComponent {
  /**
   * Create a new document history component
   */
  constructor() {
    super();
    this._history = [];
    this._pagination = {
      limit: 10,
      offset: 0,
      total: 0
    };
    this._loading = false;
    this._error = null;
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
      }
      
      .history-list {
        width: 100%;
        list-style-position: inside;
        padding: 0;
        margin-bottom: 20px;
      }
      
      .history-item {
        padding: 15px;
        margin-bottom: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: var(--background-color);
      }
      
      .history-item:hover {
        background-color: var(--hover-color, rgba(0, 0, 0, 0.05));
      }
      
      .history-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .history-item-type {
        font-weight: bold;
        font-size: 16px;
      }
      
      .history-item-date {
        color: #666;
        font-size: 14px;
      }
      
      .history-item-details {
        margin-bottom: 10px;
      }
      
      .history-item-detail {
        margin-bottom: 5px;
      }
      
      .history-item-label {
        font-weight: bold;
        display: inline-block;
        margin-right: 5px;
      }
      
      .download-link {
        display: inline-block;
        padding: 5px 10px;
        background-color: var(--primary-color);
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .download-link:hover {
        background-color: var(--primary-dark);
      }
      
      .edit-link {
        display: inline-block;
        padding: 5px 10px;
        background-color: var(--secondary-color, #6c757d);
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-size: 14px;
        margin-left: 5px;
      }
      
      .edit-link:hover {
        background-color: var(--secondary-dark, #5a6268);
      }
      
      .action-buttons {
        display: flex;
        gap: 5px;
      }
      
      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 20px;
      }
      
      .pagination-info {
        font-size: 14px;
      }
      
      .pagination-buttons {
        display: flex;
        gap: 10px;
      }
      
      .pagination-button {
        padding: 5px 10px;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .pagination-button:hover {
        background-color: #e5e5e5;
      }
      
      .pagination-button:disabled {
        background-color: #f5f5f5;
        color: #aaa;
        cursor: not-allowed;
      }
      
      .loading {
        text-align: center;
        padding: 20px;
        font-style: italic;
        color: #666;
      }
      
      .error {
        padding: 10px;
        background-color: #f8d7da;
        color: #721c24;
        border-radius: 4px;
        margin-bottom: 20px;
      }
      
      .refresh-button {
        padding: 5px 10px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-bottom: 20px;
      }
      
      .refresh-button:hover {
        background-color: #45a049;
      }
      
      .empty-state {
        text-align: center;
        padding: 40px;
        color: #666;
        font-style: italic;
      }
      
      .metadata-container {
        max-width: 300px;
        max-height: 200px;
        overflow: auto;
        padding: 5px;
        background-color: var(--background-color-alt);
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
      }
      
      .metadata-container pre {
        margin: 0;
        white-space: pre-wrap;
      }
    `;
  }

  /**
   * Get the component's template
   * @returns {string} - HTML template
   */
  getTemplate() {
    return `
      <h2>Document Generation History</h2>
      
      <button id="refresh-button" class="refresh-button">Refresh</button>
      
      ${this._error ? `<div class="error">${this._error}</div>` : ''}
      
      ${this._loading ? `
        <div class="loading">Loading document history...</div>
      ` : this._renderHistory()}
      
      <div class="pagination">
        <div class="pagination-info">
          Showing ${this._pagination.offset + 1} to ${Math.min(this._pagination.offset + this._history.length, this._pagination.offset + this._pagination.limit)} items
        </div>
        <div class="pagination-buttons">
          <button id="prev-page" class="pagination-button" ${this._pagination.offset === 0 ? 'disabled' : ''}>Previous</button>
          <button id="next-page" class="pagination-button" ${this._history.length < this._pagination.limit ? 'disabled' : ''}>Next</button>
        </div>
      </div>
    `;
  }

  /**
   * Render the history table
   * @returns {string} - HTML for the history table
   * @private
   */
  _renderHistory() {
    if (this._history.length === 0) {
      return `<div class="empty-state">No document generation history found.</div>`;
    }
    
    return `
      <ol class="history-list">
        ${this._history.map(item => `
          <li class="history-item">
            <div class="history-item-header">
              <div class="history-item-type">${this._formatDocumentType(item.document_type)}</div>
              <div class="history-item-date">${this._formatDate(item.generated_at)}</div>
            </div>
            
            <div class="history-item-details">
              <div class="history-item-detail">
                <span class="history-item-label">Storage Path:</span>
                <span>${item.storage_path}</span>
              </div>
              
              <div class="history-item-detail">
                <span class="history-item-label">Metadata:</span>
                <div>${this._formatMetadata(item.metadata)}</div>
              </div>
            </div>
            
            <div class="action-buttons">
              <button class="download-link" data-path="${item.storage_path}">Download</button>
              ${item.source_doc ? `<button class="edit-link" data-source="${encodeURIComponent(item.source_doc)}" data-type="${item.document_type}">Edit</button>` : ''}
            </div>
          </li>
        `).join('')}
      </ol>
    `;
  }

  /**
   * Format a document type
   * @param {string} type - Document type
   * @returns {string} - Formatted document type
   * @private
   */
  _formatDocumentType(type) {
    const types = {
      pdf: 'PDF',
      doc: 'Word Document',
      excel: 'Excel Spreadsheet',
      ppt: 'PowerPoint',
      epub: 'EPUB'
    };
    
    return types[type] || type;
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
   * Format metadata
   * @param {Object} metadata - Metadata object
   * @returns {string} - Formatted metadata
   * @private
   */
  _formatMetadata(metadata) {
    if (!metadata) return '';
    
    try {
      if (typeof metadata === 'string') {
        metadata = JSON.parse(metadata);
      }
      
      // Format the metadata as a pretty-printed JSON string
      const formattedJson = JSON.stringify(metadata, null, 2);
      
      // Return the formatted metadata in a container
      return `<div class="metadata-container"><pre>${formattedJson}</pre></div>`;
    } catch (error) {
      return String(metadata);
    }
  }

  /**
   * Get the download URL for a document
   * @param {Object} item - Document history item
   * @returns {string} - Download URL
   * @private
   */
  _getDownloadUrl(item) {
    // If the storage path is empty, return a placeholder
    if (!item.storage_path) {
      return '#';
    }

    // For Supabase storage, we need to construct a URL to the file
    // The format is: /api/1/download-document?path={storagePath}
    
    // Create a download URL that points to the document in Supabase storage
    const baseUrl = window.location.origin;
    const downloadUrl = `${baseUrl}/api/1/download-document?path=${encodeURIComponent(item.storage_path)}`;
    
    return downloadUrl;
  }

  /**
   * Download a document with proper authorization
   * @param {string} path - Storage path of the document
   * @private
   */
  async _downloadDocument(path) {
    try {
      // Get the filename from the path
      const filename = path.split('/').pop();
      
      // Create the download URL
      const downloadUrl = `${window.location.origin}/api/1/download-document?path=${encodeURIComponent(path)}`;
      
      // Get the authorization token from the base component
      const token = await this.getAuthToken();
      
      // Fetch the document with authorization header
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.statusText}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      
      // Add the link to the document
      document.body.appendChild(link);
      
      // Click the link to trigger the download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert(`Error downloading document: ${error.message}`);
    }
  }
  
  /**
   * Edit a document by pre-filling the HTML editor with the source document content
   * @param {string} sourceDocEncoded - URL-encoded source document content
   * @param {string} documentType - Type of document (pdf, doc, etc.)
   * @private
   */
  _editDocument(sourceDocEncoded, documentType) {
    try {
      // Decode the source document content
      const sourceDoc = decodeURIComponent(sourceDocEncoded);
      
      // Dispatch a custom event with the source document content
      const event = new CustomEvent('edit-document', {
        bubbles: true,
        composed: true,
        detail: {
          sourceDoc,
          documentType
        }
      });
      
      this.dispatchEvent(event);
      
      // Scroll to the top of the page to show the editor
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Show a notification to the user
      alert('The editor has been pre-filled with the original content. You can now make changes and regenerate the document.');
    } catch (error) {
      console.error('Error editing document:', error);
      alert(`Error editing document: ${error.message}`);
    }
  }
  
  /**
   * Initialize event listeners
   */
  initEventListeners() {
    const refreshButton = this.$('#refresh-button');
    const prevPageButton = this.$('#prev-page');
    const nextPageButton = this.$('#next-page');
    
    refreshButton.addEventListener('click', () => this.loadHistory());
    
    prevPageButton.addEventListener('click', () => {
      if (this._pagination.offset > 0) {
        this._pagination.offset = Math.max(0, this._pagination.offset - this._pagination.limit);
        this.loadHistory();
      }
    });
    
    nextPageButton.addEventListener('click', () => {
      if (this._history.length === this._pagination.limit) {
        this._pagination.offset += this._pagination.limit;
        this.loadHistory();
      }
    });
    
    // Add event delegation for download and edit buttons
    this.shadowRoot.addEventListener('click', (event) => {
      // Handle download button clicks
      const downloadButton = event.target.closest('.download-link');
      if (downloadButton) {
        const path = downloadButton.dataset.path;
        if (path) {
          this._downloadDocument(path);
        }
      }
      
      // Handle edit button clicks
      const editButton = event.target.closest('.edit-link');
      if (editButton) {
        const sourceDoc = editButton.dataset.source;
        const documentType = editButton.dataset.type;
        if (sourceDoc) {
          this._editDocument(sourceDoc, documentType);
        }
      }
    });
  }

  /**
   * Called when the element is connected to the DOM
   */
  connectedCallback() {
    super.connectedCallback();
    this.loadHistory();
  }

  /**
   * Load document history
   */
  async loadHistory() {
    try {
      this._loading = true;
      this._error = null;
      this.render();
      
      const result = await ApiClient.getDocumentHistory(
        this._pagination.limit,
        this._pagination.offset
      );
      
      this._history = result.data;
      this._pagination = result.pagination;
      this._loading = false;
      this._error = null;
    } catch (error) {
      console.error('Error loading document history:', error);
      this._error = `Error loading document history: ${error.message}`;
      this._loading = false;
    } finally {
      this.render();
    }
  }
}

// Define the custom element
customElements.define('document-history', DocumentHistory);