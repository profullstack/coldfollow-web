/**
 * Basic usage examples for @profullstack/websocket-client
 */

import { createWebSocketClient } from '../src/index.js';

// Create a WebSocket client
const client = createWebSocketClient({
  url: 'ws://localhost:8080',
  reconnectInterval: 1000,
  maxReconnectInterval: 30000,
  reconnectDecay: 1.5,
  maxReconnectAttempts: 10,
  automaticOpen: false // Don't connect automatically for this example
});

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Connection opened
  client.on('open', () => {
    console.log('Connection established!');
    
    // Send a message
    client.send('Hello Server!');
    
    // Send a JSON message
    client.send({
      type: 'greeting',
      content: 'Hello from client!',
      timestamp: Date.now()
    });
  });
  
  // Listen for messages
  client.on('message', (data) => {
    console.log('Message received:', data);
    
    // If the server sends a ping, respond with a pong
    if (data === 'ping') {
      console.log('Responding to ping with pong');
      client.send('pong');
    }
  });
  
  // Connection closed
  client.on('close', (event) => {
    console.log(`Connection closed: ${event.code} ${event.reason}`);
  });
  
  // Connection error
  client.on('error', (error) => {
    console.error('Connection error:', error);
  });
  
  // Reconnecting
  client.on('reconnecting', (info) => {
    console.log(`Reconnecting... Attempt ${info.attempt} after ${info.interval}ms`);
  });
  
  // Reconnection failed
  client.on('reconnect_failed', () => {
    console.error('Failed to reconnect after maximum attempts');
  });
}

/**
 * Run the example
 */
async function runExample() {
  try {
    console.log('WebSocket Client Example');
    
    // Set up event listeners
    setupEventListeners();
    
    // Connect to the server
    console.log('Connecting to WebSocket server...');
    await client.connect();
    
    // Send a message every 3 seconds
    const interval = setInterval(() => {
      if (client.isConnected) {
        const message = {
          type: 'ping',
          timestamp: Date.now()
        };
        console.log('Sending ping:', message);
        client.send(message);
      }
    }, 3000);
    
    // Disconnect after 15 seconds
    setTimeout(() => {
      console.log('Disconnecting...');
      client.disconnect();
      clearInterval(interval);
      
      // Reconnect after 5 seconds
      setTimeout(() => {
        console.log('Reconnecting...');
        client.connect();
        
        // Disconnect again after 10 seconds
        setTimeout(() => {
          console.log('Disconnecting again...');
          client.disconnect();
          
          console.log('Example complete!');
        }, 10000);
      }, 5000);
    }, 15000);
  } catch (error) {
    console.error('Error in example:', error);
  }
}

/**
 * Create a simple WebSocket server for testing
 */
async function createTestServer() {
  try {
    // Only import ws in Node.js environment
    const { WebSocketServer } = await import('ws');
    
    // Create WebSocket server
    const wss = new WebSocketServer({ port: 8080 });
    
    console.log('WebSocket server started on port 8080');
    
    // Handle connections
    wss.on('connection', (ws) => {
      console.log('Client connected');
      
      // Send welcome message
      ws.send('Welcome to the WebSocket server!');
      
      // Handle messages
      ws.on('message', (message) => {
        console.log('Received:', message.toString());
        
        // Echo the message back
        ws.send(`Echo: ${message}`);
        
        // If the message is 'pong', send a ping after 1 second
        if (message.toString() === 'pong') {
          setTimeout(() => {
            ws.send('ping');
          }, 1000);
        }
      });
      
      // Handle close
      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
    
    return wss;
  } catch (error) {
    console.log('Not in Node.js environment or ws package not installed');
    return null;
  }
}

// Check if this is being run directly
if (process.argv[1] === import.meta.url) {
  // Create test server if in Node.js environment and run the example
  (async () => {
    const server = await createTestServer();
    
    // Run the example
    runExample();
    
    // Close the server after 40 seconds
    if (server) {
      setTimeout(() => {
        console.log('Closing server...');
        server.close();
      }, 40000);
    }
  })();
}

export { runExample, createTestServer };