/**
 * Browser WebSocket Adapter
 * 
 * Provides a WebSocket adapter for browser environments
 */

/**
 * Create a browser WebSocket adapter
 * @returns {Object} Browser WebSocket adapter
 */
export function createBrowserAdapter() {
  /**
   * Create a WebSocket instance
   * @param {string} url - WebSocket server URL
   * @param {string|string[]} protocols - WebSocket protocols
   * @returns {WebSocket} WebSocket instance
   */
  function createWebSocket(url, protocols) {
    return new WebSocket(url, protocols);
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
   * @param {string|ArrayBuffer|Blob} data - Data to send
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

export default createBrowserAdapter;