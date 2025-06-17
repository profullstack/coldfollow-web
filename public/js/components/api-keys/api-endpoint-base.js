import { BaseComponent } from '../base-component.js';

/**
 * Base API Endpoint component
 * Contains common styles and functionality for all endpoint components
 */
export class ApiEndpointBase extends BaseComponent {
  /**
   * Create a new API endpoint component
   */
  constructor() {
    super();
    this._activeCodeTab = 'curl';
  }

  /**
   * Escape HTML characters to prevent rendering as HTML
   * @param {string} str - String to escape
   * @returns {string} - Escaped string
   */
  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Get the component's styles
   * @returns {string} - CSS styles
   */
  getStyles() {
    return `
      :host {
        display: block;
        margin-bottom: var(--spacing-xl);
        padding: var(--spacing-lg);
        background-color: var(--card-background);
        border-radius: var(--border-radius-lg);
        border: 1px solid var(--border-color);
      }
      
      .endpoint-header {
        display: flex;
        align-items: center;
        margin-bottom: var(--spacing-md);
      }
      
      .http-method {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-sm);
        font-weight: var(--font-weight-bold);
        font-family: monospace;
        margin-right: var(--spacing-md);
      }
      
      .method-post {
        background-color: #10B981;
        color: white;
      }
      
      .method-get {
        background-color: #3B82F6;
        color: white;
      }
      
      .method-put {
        background-color: #F59E0B;
        color: white;
      }
      
      .method-delete {
        background-color: #EF4444;
        color: white;
      }
      
      .endpoint-path {
        font-family: monospace;
        font-size: var(--font-size-lg);
        color: var(--text-primary);
      }
      
      .endpoint-description {
        margin-bottom: var(--spacing-md);
        color: var(--text-secondary);
      }
      
      .section-title {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--spacing-sm);
        color: var(--text-primary);
      }
      
      .code-block {
        background-color: var(--surface-variant);
        padding: var(--spacing-md);
        border-radius: var(--border-radius-md);
        overflow-x: auto;
        margin-bottom: var(--spacing-md);
        max-width: 100%;
      }
      
      pre {
        margin: 0;
        font-family: monospace;
        color: var(--text-primary);
        white-space: pre-wrap;
        word-wrap: break-word;
        word-break: break-word;
        font-size: 0.9em;
        line-height: 1.5;
      }
      
      .parameter-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: var(--spacing-md);
      }
      
      .parameter-table th,
      .parameter-table td {
        padding: var(--spacing-sm) var(--spacing-md);
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }
      
      .parameter-table th {
        font-weight: var(--font-weight-semibold);
        color: var(--text-secondary);
        background-color: var(--surface-variant);
      }
      
      .parameter-required {
        color: var(--error-color);
        font-weight: var(--font-weight-semibold);
      }
      
      .parameter-optional {
        color: var(--text-tertiary);
        font-style: italic;
      }
      
      /* Mobile parameter list styles */
      .parameter-list {
        margin-bottom: var(--spacing-md);
      }
      
      .parameter-item {
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        margin-bottom: var(--spacing-sm);
        background-color: var(--surface-variant);
      }
      
      .parameter-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--spacing-xs);
      }
      
      .parameter-name {
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
      }
      
      .parameter-type {
        margin-bottom: var(--spacing-xs);
        color: var(--text-secondary);
      }
      
      .parameter-desc {
        color: var(--text-secondary);
        font-size: 0.9em;
      }
      
      /* Code examples tabs */
      .code-examples {
        margin-bottom: var(--spacing-lg);
      }
      
      .code-tabs {
        display: flex;
        flex-wrap: wrap;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: var(--spacing-sm);
      }
      
      .code-tab {
        padding: var(--spacing-xs) var(--spacing-sm);
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
        font-size: var(--font-size-sm);
        margin-right: var(--spacing-xs);
      }
      
      .code-tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
        font-weight: var(--font-weight-bold);
      }
      
      .code-content {
        display: none;
      }
      
      .code-content.active {
        display: block;
      }
      
      @media (max-width: 768px) {
        :host {
          padding: var(--spacing-md);
        }
        
        .endpoint-header {
          flex-direction: column;
          align-items: flex-start;
        }
        
        .http-method {
          margin-bottom: var(--spacing-xs);
        }
        
        .endpoint-path {
          font-size: var(--font-size-md);
          word-break: break-all;
        }
        
        .code-tabs {
          flex-wrap: wrap;
        }
        
        .code-tab {
          margin-bottom: var(--spacing-xs);
          font-size: var(--font-size-xs);
          padding: var(--spacing-xs) var(--spacing-xs);
        }
        
        .code-block {
          padding: var(--spacing-sm);
        }
        
        pre {
          font-size: 0.8em;
        }
        
        .parameter-table th,
        .parameter-table td {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: 0.9em;
        }
      }
    `;
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Set up code example tabs
    const codeTabs = this.shadowRoot.querySelectorAll('.code-tab');
    codeTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const codeType = tab.dataset.code;
        this._activeCodeTab = codeType;
        
        // Remove active class from all tabs
        codeTabs.forEach((t) => t.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Hide all code content
        const codeContents = this.shadowRoot.querySelectorAll('.code-content');
        codeContents.forEach((content) => {
          content.style.display = 'none';
        });
        
        // Show selected code content
        const codeContent = this.shadowRoot.querySelector(`.code-content[data-code="${codeType}"]`);
        if (codeContent) {
          codeContent.style.display = 'block';
        }
      });
    });
  }

  /**
   * Render code examples section
   * @param {Object} examples - Code examples for different languages
   * @returns {string} - HTML for code examples section
   */
  renderCodeExamples(examples) {
    return `
      <div class="section-title">Code Examples</div>
      <div class="code-examples">
        <div class="code-tabs">
          <button class="code-tab ${this._activeCodeTab === 'curl' ? 'active' : ''}" data-code="curl">curl</button>
          <button class="code-tab ${this._activeCodeTab === 'fetch' ? 'active' : ''}" data-code="fetch">JavaScript (fetch)</button>
          <button class="code-tab ${this._activeCodeTab === 'nodejs' ? 'active' : ''}" data-code="nodejs">Node.js</button>
          <button class="code-tab ${this._activeCodeTab === 'python' ? 'active' : ''}" data-code="python">Python</button>
          <button class="code-tab ${this._activeCodeTab === 'php' ? 'active' : ''}" data-code="php">PHP</button>
          <button class="code-tab ${this._activeCodeTab === 'ruby' ? 'active' : ''}" data-code="ruby">Ruby</button>
        </div>
        
        <div class="code-content ${this._activeCodeTab === 'curl' ? 'active' : ''}" data-code="curl" style="display: ${this._activeCodeTab === 'curl' ? 'block' : 'none'}">
          <div class="code-block">
            <pre>${this.escapeHtml(examples.curl)}</pre>
          </div>
        </div>
        
        <div class="code-content ${this._activeCodeTab === 'fetch' ? 'active' : ''}" data-code="fetch" style="display: ${this._activeCodeTab === 'fetch' ? 'block' : 'none'}">
          <div class="code-block">
            <pre>${this.escapeHtml(examples.fetch)}</pre>
          </div>
        </div>
        
        <div class="code-content ${this._activeCodeTab === 'nodejs' ? 'active' : ''}" data-code="nodejs" style="display: ${this._activeCodeTab === 'nodejs' ? 'block' : 'none'}">
          <div class="code-block">
            <pre>${this.escapeHtml(examples.nodejs)}</pre>
          </div>
        </div>
        
        <div class="code-content ${this._activeCodeTab === 'python' ? 'active' : ''}" data-code="python" style="display: ${this._activeCodeTab === 'python' ? 'block' : 'none'}">
          <div class="code-block">
            <pre>${this.escapeHtml(examples.python)}</pre>
          </div>
        </div>
        
        <div class="code-content ${this._activeCodeTab === 'php' ? 'active' : ''}" data-code="php" style="display: ${this._activeCodeTab === 'php' ? 'block' : 'none'}">
          <div class="code-block">
            <pre>${this.escapeHtml(examples.php)}</pre>
          </div>
        </div>
        
        <div class="code-content ${this._activeCodeTab === 'ruby' ? 'active' : ''}" data-code="ruby" style="display: ${this._activeCodeTab === 'ruby' ? 'block' : 'none'}">
          <div class="code-block">
            <pre>${this.escapeHtml(examples.ruby)}</pre>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render parameters table
   * @param {Array} parameters - Array of parameter objects
   * @returns {string} - HTML for parameters table
   */
  renderParametersTable(parameters) {
    if (!parameters || parameters.length === 0) {
      return '';
    }

    // For mobile, use a list-based approach
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      return `
        <div class="section-title">Request Parameters</div>
        <div class="parameter-list">
          ${parameters.map(param => `
            <div class="parameter-item">
              <div class="parameter-header">
                <span class="parameter-name">${param.name}</span>
                <span class="${param.required ? 'parameter-required' : 'parameter-optional'}">${param.required ? 'required' : 'optional'}</span>
              </div>
              <div class="parameter-type"><strong>Type:</strong> ${param.type}</div>
              <div class="parameter-desc">${param.description}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // For desktop, use the table approach
    return `
      <div class="section-title">Request Parameters</div>
      <table class="parameter-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${parameters.map(param => `
            <tr>
              <td>${param.name} <span class="${param.required ? 'parameter-required' : 'parameter-optional'}">${param.required ? 'required' : 'optional'}</span></td>
              <td>${param.type}</td>
              <td>${param.description}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Render response section
   * @param {string} responseExample - Response example JSON
   * @returns {string} - HTML for response section
   */
  renderResponse(responseExample) {
    return `
      <div class="section-title">Response</div>
      <div class="code-block">
        <pre>${this.escapeHtml(responseExample)}</pre>
      </div>
    `;
  }
}