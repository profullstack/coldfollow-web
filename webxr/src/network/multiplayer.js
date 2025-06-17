/**
 * NetworkManager
 * Handles multiplayer functionality and network communication
 */

export class NetworkManager {
  /**
   * Create a new NetworkManager
   */
  constructor() {
    // Network state
    this.isConnected = false;
    this.isHost = false;
    this.roomId = null;
    this.userId = null;
    this.peers = new Map();
    
    // WebSocket connection
    this.socket = null;
    
    // WebRTC connections
    this.peerConnections = new Map();
    this.dataChannels = new Map();
    
    // ICE servers configuration for WebRTC
    this.iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    // Message handlers
    this.messageHandlers = new Map();
    
    // Entity synchronization
    this.entities = new Map();
    this.localEntities = new Map();
    
    // Network settings
    this.settings = {
      updateRate: 10, // Updates per second
      interpolation: true,
      compression: true
    };
    
    // Update timing
    this.lastUpdateTime = 0;
    this.updateInterval = 1000 / this.settings.updateRate;
  }
  
  /**
   * Initialize the network manager
   * @param {string} serverUrl - The WebSocket server URL
   * @returns {Promise} Promise that resolves when connected
   */
  init(serverUrl) {
    return new Promise((resolve, reject) => {
      // This is a placeholder implementation
      // In a real application, you would connect to a WebSocket server
      console.log('Network manager initialized (placeholder)');
      
      // For demo purposes, we'll simulate a successful connection
      setTimeout(() => {
        this.isConnected = true;
        this.userId = 'user_' + Math.floor(Math.random() * 10000);
        resolve();
      }, 500);
    });
  }
  
  /**
   * Connect to a multiplayer server
   * @param {string} serverUrl - The WebSocket server URL
   * @returns {Promise} Promise that resolves when connected
   */
  connect(serverUrl) {
    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket connection
        this.socket = new WebSocket(serverUrl);
        
        // Set up event handlers
        this.socket.onopen = () => {
          console.log('Connected to server');
          this.isConnected = true;
          resolve();
        };
        
        this.socket.onclose = () => {
          console.log('Disconnected from server');
          this.isConnected = false;
          this.handleDisconnect();
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
        this.socket.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        console.error('Failed to connect to server:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    // Close all peer connections
    this.peerConnections.forEach((connection) => {
      connection.close();
    });
    
    this.peerConnections.clear();
    this.dataChannels.clear();
    this.peers.clear();
    
    this.isConnected = false;
    this.roomId = null;
    
    console.log('Disconnected from multiplayer');
  }
  
  /**
   * Handle disconnection
   */
  handleDisconnect() {
    // Clean up resources
    this.peerConnections.forEach((connection) => {
      connection.close();
    });
    
    this.peerConnections.clear();
    this.dataChannels.clear();
    
    // Notify application of disconnection
    this.dispatchEvent('disconnected');
  }
  
  /**
   * Create or join a room
   * @param {string} roomId - The room ID to create or join
   * @param {Object} options - Room options
   * @returns {Promise} Promise that resolves when room is created or joined
   */
  joinRoom(roomId, options = {}) {
    if (!this.isConnected) {
      return Promise.reject(new Error('Not connected to server'));
    }
    
    return new Promise((resolve, reject) => {
      // This is a placeholder implementation
      // In a real application, you would send a join room message to the server
      console.log(`Joining room: ${roomId}`);
      
      // For demo purposes, we'll simulate a successful room join
      setTimeout(() => {
        this.roomId = roomId;
        this.isHost = options.create === true;
        
        // Simulate other peers in the room
        if (!this.isHost) {
          this.peers.set('host_user', {
            id: 'host_user',
            name: 'Host',
            position: { x: 0, y: 1.6, z: -3 },
            rotation: { x: 0, y: 0, z: 0 }
          });
        }
        
        resolve({
          roomId: this.roomId,
          isHost: this.isHost,
          peers: Array.from(this.peers.values())
        });
      }, 500);
    });
  }
  
  /**
   * Leave the current room
   */
  leaveRoom() {
    if (!this.isConnected || !this.roomId) {
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      // This is a placeholder implementation
      // In a real application, you would send a leave room message to the server
      console.log(`Leaving room: ${this.roomId}`);
      
      // For demo purposes, we'll simulate a successful room leave
      setTimeout(() => {
        this.roomId = null;
        this.isHost = false;
        this.peers.clear();
        
        resolve();
      }, 200);
    });
  }
  
  /**
   * Send a message to all peers
   * @param {string} type - The message type
   * @param {Object} data - The message data
   */
  sendMessage(type, data) {
    if (!this.isConnected) {
      console.warn('Cannot send message: Not connected');
      return;
    }
    
    const message = {
      type,
      data,
      senderId: this.userId,
      timestamp: Date.now()
    };
    
    // Send via WebSocket if available
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
    
    // Send via WebRTC data channels
    this.dataChannels.forEach((channel) => {
      if (channel.readyState === 'open') {
        channel.send(JSON.stringify(message));
      }
    });
  }
  
  /**
   * Handle incoming message
   * @param {string} messageData - The raw message data
   */
  handleMessage(messageData) {
    try {
      const message = JSON.parse(messageData);
      
      // Ignore messages from self
      if (message.senderId === this.userId) {
        return;
      }
      
      // Handle message based on type
      if (this.messageHandlers.has(message.type)) {
        this.messageHandlers.get(message.type)(message.data, message.senderId);
      } else {
        console.warn(`No handler for message type: ${message.type}`);
      }
      
      // Dispatch event for the message
      this.dispatchEvent('message', { message });
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }
  
  /**
   * Register a message handler
   * @param {string} type - The message type to handle
   * @param {Function} handler - The handler function
   */
  registerMessageHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }
  
  /**
   * Unregister a message handler
   * @param {string} type - The message type to unregister
   */
  unregisterMessageHandler(type) {
    this.messageHandlers.delete(type);
  }
  
  /**
   * Synchronize an entity across the network
   * @param {string} entityId - The entity ID
   * @param {Object} entityData - The entity data
   */
  syncEntity(entityId, entityData) {
    // Add to local entities
    this.localEntities.set(entityId, {
      ...entityData,
      lastUpdated: Date.now()
    });
    
    // Send update to peers
    this.sendMessage('entity_update', {
      entityId,
      data: entityData
    });
  }
  
  /**
   * Update an entity's position and rotation
   * @param {string} entityId - The entity ID
   * @param {Object} position - The position {x, y, z}
   * @param {Object} rotation - The rotation {x, y, z}
   */
  updateEntityTransform(entityId, position, rotation) {
    const entity = this.localEntities.get(entityId);
    
    if (entity) {
      entity.position = position;
      entity.rotation = rotation;
      entity.lastUpdated = Date.now();
      
      // Send update to peers
      this.sendMessage('entity_transform', {
        entityId,
        position,
        rotation
      });
    }
  }
  
  /**
   * Handle entity update from network
   * @param {Object} data - The entity update data
   * @param {string} senderId - The sender ID
   */
  handleEntityUpdate(data, senderId) {
    const { entityId, data: entityData } = data;
    
    // Update or create entity
    this.entities.set(entityId, {
      ...entityData,
      senderId,
      lastUpdated: Date.now()
    });
    
    // Dispatch event
    this.dispatchEvent('entity_updated', { entityId, entityData });
  }
  
  /**
   * Handle entity transform update from network
   * @param {Object} data - The transform update data
   * @param {string} senderId - The sender ID
   */
  handleEntityTransform(data, senderId) {
    const { entityId, position, rotation } = data;
    
    // Get existing entity or create new one
    let entity = this.entities.get(entityId);
    
    if (!entity) {
      entity = {
        senderId,
        position,
        rotation,
        lastUpdated: Date.now()
      };
      this.entities.set(entityId, entity);
    } else {
      // Update entity
      entity.position = position;
      entity.rotation = rotation;
      entity.lastUpdated = Date.now();
    }
    
    // Dispatch event
    this.dispatchEvent('entity_transform_updated', { entityId, position, rotation });
  }
  
  /**
   * Initialize WebRTC peer connection
   * @param {string} peerId - The peer ID
   * @returns {RTCPeerConnection} The peer connection
   */
  initPeerConnection(peerId) {
    // Create new peer connection
    const peerConnection = new RTCPeerConnection(this.iceServers);
    
    // Set up event handlers
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to peer via signaling server
        this.sendMessage('ice_candidate', {
          targetId: peerId,
          candidate: event.candidate
        });
      }
    };
    
    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer connection state: ${peerConnection.connectionState}`);
      
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed' ||
          peerConnection.connectionState === 'closed') {
        // Handle disconnection
        this.peers.delete(peerId);
        this.peerConnections.delete(peerId);
        this.dataChannels.delete(peerId);
        
        // Dispatch event
        this.dispatchEvent('peer_disconnected', { peerId });
      }
    };
    
    // Create data channel
    const dataChannel = peerConnection.createDataChannel('data', {
      ordered: true
    });
    
    // Set up data channel event handlers
    dataChannel.onopen = () => {
      console.log(`Data channel opened with peer: ${peerId}`);
      this.dataChannels.set(peerId, dataChannel);
      
      // Dispatch event
      this.dispatchEvent('peer_connected', { peerId });
    };
    
    dataChannel.onclose = () => {
      console.log(`Data channel closed with peer: ${peerId}`);
      this.dataChannels.delete(peerId);
    };
    
    dataChannel.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    
    // Store peer connection
    this.peerConnections.set(peerId, peerConnection);
    
    return peerConnection;
  }
  
  /**
   * Handle ICE candidate from peer
   * @param {Object} data - The ICE candidate data
   */
  handleIceCandidate(data) {
    const { targetId, candidate } = data;
    
    // Ignore if not the target
    if (targetId !== this.userId) return;
    
    const senderId = data.senderId;
    const peerConnection = this.peerConnections.get(senderId);
    
    if (peerConnection) {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
        .catch((error) => {
          console.error('Error adding ICE candidate:', error);
        });
    }
  }
  
  /**
   * Dispatch a custom event
   * @param {string} type - The event type
   * @param {Object} detail - The event detail
   */
  dispatchEvent(type, detail = {}) {
    // This is a placeholder implementation
    // In a real application, you would use a proper event system
    console.log(`Event: ${type}`, detail);
  }
  
  /**
   * Update network state
   */
  update() {
    const now = Date.now();
    
    // Check if it's time to send updates
    if (now - this.lastUpdateTime >= this.updateInterval) {
      this.lastUpdateTime = now;
      
      // Send updates for local entities
      this.localEntities.forEach((entity, entityId) => {
        // Only send updates for entities that have changed
        if (entity.lastUpdated > this.lastUpdateTime - this.updateInterval) {
          this.sendMessage('entity_transform', {
            entityId,
            position: entity.position,
            rotation: entity.rotation
          });
        }
      });
    }
  }
  
  /**
   * Get all peers
   * @returns {Array} Array of peer objects
   */
  getPeers() {
    return Array.from(this.peers.values());
  }
  
  /**
   * Get all entities
   * @returns {Map} Map of entities
   */
  getEntities() {
    return this.entities;
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Disconnect from server
    this.disconnect();
    
    // Clear all collections
    this.peers.clear();
    this.entities.clear();
    this.localEntities.clear();
    this.messageHandlers.clear();
    
    console.log('Network manager disposed');
  }
}