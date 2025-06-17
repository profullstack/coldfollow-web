/**
 * Node.js WebSocket Adapter
 * 
 * Provides a WebSocket adapter for Node.js environments using the 'ws' package
 */

import WebSocket from 'ws';

/**
 * Create a Node.js WebSocket adapter
 * @returns {Object} Node.js WebSocket adapter
 */
export function createNodeAdapter() {
  /**
   * Create a WebSocket instance
   * @param {string} url - WebSocket server URL
   * @param {string|string[]} protocols - WebSocket protocols
   * @param {Object} headers - Additional headers
   * @returns {WebSocket} WebSocket instance
   */
  function createWebSocket(url, protocols, headers = {}) {
    const options = {
      headers
    };
    
    if (protocols) {
      options.protocol = Array.isArray(protocols) ? protocols.join(',') : protocols;
    }
    
    const socket = new WebSocket(url, options);
    
    // Add browser-like event handlers
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.onerror = null;
    
    // Set up event listeners
    socket.on('open', (event) => {
      if (socket.onopen) socket.onopen(event);
    });
    
    socket.on('message', (data, isBinary) => {
      if (socket.onmessage) {
        const messageEvent = {
          data: isBinary ? data : data.toString(),
          type: 'message',
          target: socket
        };
        socket.onmessage(messageEvent);
      }
    });
    
    socket.on('close', (code, reason) => {
      if (socket.onclose) {
        const closeEvent = {
          code,
          reason: reason ? reason.toString() : '',
          wasClean: code === 1000,
          type: 'close',
          target: socket
        };
        socket.onclose(closeEvent);
      }
    });
    
    socket.on('error', (error) => {
      if (socket.onerror) {
        const errorEvent = {
          error,
          message: error.message,
          type: 'error',
          target: socket
        };
        socket.onerror(errorEvent);
      }
    });
    
    return socket;
  }
  
  /**
   * Close a WebSocket connection
   * @param {WebSocket} socket - WebSocket instance
   * @param {number} code - Close code
   * @param {string} reason - Close reason
   */
  function closeWebSocket(socket, code, reason) {
    socket.close(code, reason);
  }
  
  /**
   * Send a message through a WebSocket connection
   * @param {WebSocket} socket - WebSocket instance
   * @param {string|Buffer} data - Data to send
   */
  function sendMessage(socket, data) {
    socket.send(data);
  }
  
  /**
   * Check if a WebSocket is connected
   * @param {WebSocket} socket - WebSocket instance
   * @returns {boolean} Whether the WebSocket is connected
   */
  function isConnected(socket) {
    return socket && socket.readyState === WebSocket.OPEN;
  }
  
  /**
   * Get the WebSocket ready state
   * @param {WebSocket} socket - WebSocket instance
   * @returns {number} WebSocket ready state
   */
  function getReadyState(socket) {
    return socket ? socket.readyState : -1;
  }
  
  // Return the adapter
  return {
    createWebSocket,
    closeWebSocket,
    sendMessage,
    isConnected,
    getReadyState,
    CONNECTING: WebSocket.CONNECTING,
    OPEN: WebSocket.OPEN,
    CLOSING: WebSocket.CLOSING,
    CLOSED: WebSocket.CLOSED
  };
}

export default createNodeAdapter;