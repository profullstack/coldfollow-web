/**
 * @profullstack/websocket-client
 * 
 * A robust WebSocket client with connection management, reconnection logic, and message handling
 */

import EventEmitter from 'eventemitter3';
import { createNodeAdapter } from './node.js';
import { createBrowserAdapter } from './browser.js';

/**
 * WebSocket Client
 * @extends EventEmitter
 */
class WebSocketClient extends EventEmitter {
  /**
   * Create a new WebSocketClient
   * @param {Object} options - Configuration options
   * @param {string} options.url - WebSocket server URL
   * @param {Object} options.protocols - WebSocket protocols
   * @param {Object} options.headers - Additional headers for the connection (Node.js only)
   * @param {number} options.reconnectInterval - Reconnection interval in milliseconds (default: 1000)
   * @param {number} options.maxReconnectInterval - Maximum reconnection interval in milliseconds (default: 30000)
   * @param {number} options.reconnectDecay - Reconnection decay factor (default: 1.5)
   * @param {number} options.maxReconnectAttempts - Maximum number of reconnection attempts (default: Infinity)
   * @param {boolean} options.automaticOpen - Whether to automatically connect on instantiation (default: true)
   * @param {boolean} options.automaticReconnect - Whether to automatically reconnect on disconnect (default: true)
   * @param {Function} options.shouldReconnect - Function to determine whether to reconnect (default: always)
   * @param {Object} options.adapter - Custom WebSocket adapter (default: auto-detect)
   */
  constructor(options = {}) {
    super();
    
    // Default options
    this.options = {
      url: null,
      protocols: null,
      headers: {},
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      reconnectDecay: 1.5,
      maxReconnectAttempts: Infinity,
      automaticOpen: true,
      automaticReconnect: true,
      shouldReconnect: () => true,
      adapter: null,
      ...options
    };
    
    // Validate URL
    if (!this.options.url) {
      throw new Error('WebSocket URL is required');
    }
    
    // State
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.currentReconnectInterval = this.options.reconnectInterval;
    
    // Message queue for messages sent before connection is established
    this.messageQueue = [];
    
    // Create adapter
    this.adapter = this.options.adapter || this._createAdapter();
    
    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this._handleOpen = this._handleOpen.bind(this);
    this._handleMessage = this._handleMessage.bind(this);
    this._handleClose = this._handleClose.bind(this);
    this._handleError = this._handleError.bind(this);
    
    // Auto-connect if enabled
    if (this.options.automaticOpen) {
      this.connect();
    }
  }
  
  /**
   * Create the appropriate WebSocket adapter based on the environment
   * @private
   * @returns {Object} WebSocket adapter
   */
  _createAdapter() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && window.WebSocket) {
      return createBrowserAdapter();
    }
    
    // Otherwise, use Node.js adapter
    return createNodeAdapter();
  }
  
  /**
   * Connect to the WebSocket server
   * @returns {Promise<void>} Resolves when connected
   */
  connect() {
    // If already connected or connecting, return
    if (this.isConnected || this.isConnecting) {
      return Promise.resolve();
    }
    
    this.isConnecting = true;
    
    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket connection
        this.socket = this.adapter.createWebSocket(
          this.options.url,
          this.options.protocols,
          this.options.headers
        );
        
        // Set up event handlers
        this.socket.onopen = (event) => {
          this._handleOpen(event);
          resolve();
        };
        
        this.socket.onmessage = this._handleMessage;
        this.socket.onclose = this._handleClose;
        this.socket.onerror = (event) => {
          this._handleError(event);
          if (this.isConnecting) {
            reject(new Error('Failed to connect to WebSocket server'));
            this.isConnecting = false;
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from the WebSocket server
   * @param {number} code - Close code
   * @param {string} reason - Close reason
   */
  disconnect(code = 1000, reason = 'Normal closure') {
    // Clear reconnect timer
    this._clearReconnectTimer();
    
    // Close socket if it exists
    if (this.socket) {
      // Prevent reconnection on this close
      this._preventReconnect = true;
      
      // Close the socket
      this.adapter.closeWebSocket(this.socket, code, reason);
      this.socket = null;
    }
    
    // Update state
    this.isConnected = false;
    this.isConnecting = false;
  }
  
  /**
   * Send a message to the WebSocket server
   * @param {string|Object|ArrayBuffer|Blob} data - Data to send
   * @returns {boolean} Whether the message was sent or queued
   */
  send(data) {
    // If not connected, queue the message
    if (!this.isConnected) {
      this.messageQueue.push(data);
      return false;
    }
    
    // Convert objects to JSON strings
    let message = data;
    if (typeof data === 'object' && !(data instanceof ArrayBuffer) && !(data instanceof Blob)) {
      message = JSON.stringify(data);
    }
    
    // Send the message
    try {
      this.adapter.sendMessage(this.socket, message);
      return true;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }
  
  /**
   * Reconnect to the WebSocket server
   */
  reconnect() {
    // Clear any existing reconnect timer
    this._clearReconnectTimer();
    
    // If we've reached the maximum number of reconnect attempts, give up
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.emit('reconnect_failed');
      return;
    }
    
    // Increment reconnect attempts
    this.reconnectAttempts++;
    
    // Calculate next reconnect interval with exponential backoff
    this.currentReconnectInterval = Math.min(
      this.currentReconnectInterval * this.options.reconnectDecay,
      this.options.maxReconnectInterval
    );
    
    // Emit reconnecting event
    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      interval: this.currentReconnectInterval
    });
    
    // Set timer to reconnect
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        this.emit('error', error);
      });
    }, this.currentReconnectInterval);
  }
  
  /**
   * Clear the reconnect timer
   * @private
   */
  _clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  /**
   * Handle WebSocket open event
   * @private
   * @param {Event} event - Open event
   */
  _handleOpen(event) {
    this.isConnected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.currentReconnectInterval = this.options.reconnectInterval;
    this._preventReconnect = false;
    
    // Emit open event
    this.emit('open', event);
    
    // Send any queued messages
    while (this.messageQueue.length > 0) {
      this.send(this.messageQueue.shift());
    }
  }
  
  /**
   * Handle WebSocket message event
   * @private
   * @param {MessageEvent} event - Message event
   */
  _handleMessage(event) {
    let data = event.data;
    
    // Try to parse JSON data
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (error) {
        // Not JSON, use the raw data
      }
    }
    
    // Emit message event
    this.emit('message', data, event);
  }
  
  /**
   * Handle WebSocket close event
   * @private
   * @param {CloseEvent} event - Close event
   */
  _handleClose(event) {
    this.isConnected = false;
    this.socket = null;
    
    // Emit close event
    this.emit('close', event);
    
    // Reconnect if automatic reconnect is enabled and we should reconnect
    if (
      this.options.automaticReconnect &&
      !this._preventReconnect &&
      this.options.shouldReconnect(event)
    ) {
      this.reconnect();
    }
    
    // Reset prevent reconnect flag
    this._preventReconnect = false;
  }
  
  /**
   * Handle WebSocket error event
   * @private
   * @param {Event} event - Error event
   */
  _handleError(event) {
    // Emit error event
    this.emit('error', event);
  }
}

/**
 * Create a new WebSocketClient
 * @param {Object} options - Configuration options
 * @returns {WebSocketClient} WebSocket client instance
 */
export function createWebSocketClient(options = {}) {
  return new WebSocketClient(options);
}

// Export the WebSocketClient class
export { WebSocketClient };

// Export adapters
export { createNodeAdapter } from './node.js';
export { createBrowserAdapter } from './browser.js';

// Default export
export default createWebSocketClient;