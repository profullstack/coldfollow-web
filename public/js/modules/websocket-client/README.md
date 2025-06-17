# @profullstack/websocket-client

A robust WebSocket client with connection management, reconnection logic, and message handling.

## Features

- **Universal**: Works in both browser and Node.js environments
- **Reconnection**: Automatic reconnection with exponential backoff
- **Event-based**: Simple event-based API
- **Message Queue**: Queues messages sent before connection is established
- **Adapters**: Pluggable adapters for different environments
- **Customizable**: Configurable reconnection behavior, protocols, and headers

## Installation

```bash
npm install @profullstack/websocket-client
```

## Basic Usage

```javascript
import { createWebSocketClient } from '@profullstack/websocket-client';

// Create a WebSocket client
const client = createWebSocketClient({
  url: 'wss://echo.websocket.org'
});

// Listen for connection open
client.on('open', () => {
  console.log('Connected!');
  
  // Send a message
  client.send('Hello WebSocket!');
  
  // Send a JSON message
  client.send({
    type: 'greeting',
    content: 'Hello from client!'
  });
});

// Listen for messages
client.on('message', (data) => {
  console.log('Received:', data);
});

// Listen for connection close
client.on('close', (event) => {
  console.log(`Connection closed: ${event.code} ${event.reason}`);
});

// Listen for errors
client.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

## API Reference

### Creating a WebSocket Client

```javascript
import { createWebSocketClient } from '@profullstack/websocket-client';

const client = createWebSocketClient({
  // WebSocket server URL (required)
  url: 'wss://example.com/socket',
  
  // WebSocket protocols (optional)
  protocols: ['v1.protocol.example'],
  
  // Additional headers for the connection (Node.js only, optional)
  headers: {
    'Authorization': 'Bearer token123'
  },
  
  // Reconnection interval in milliseconds (default: 1000)
  reconnectInterval: 1000,
  
  // Maximum reconnection interval in milliseconds (default: 30000)
  maxReconnectInterval: 30000,
  
  // Reconnection decay factor (default: 1.5)
  reconnectDecay: 1.5,
  
  // Maximum number of reconnection attempts (default: Infinity)
  maxReconnectAttempts: 10,
  
  // Whether to automatically connect on instantiation (default: true)
  automaticOpen: true,
  
  // Whether to automatically reconnect on disconnect (default: true)
  automaticReconnect: true,
  
  // Function to determine whether to reconnect (default: always)
  shouldReconnect: (event) => event.code !== 1000,
  
  // Custom WebSocket adapter (default: auto-detect)
  adapter: null
});
```

### Connection Management

```javascript
// Connect to the WebSocket server
await client.connect();

// Disconnect from the WebSocket server
client.disconnect(1000, 'Normal closure');

// Manually trigger reconnection
client.reconnect();
```

### Sending Messages

```javascript
// Send a string message
client.send('Hello WebSocket!');

// Send a JSON message (automatically stringified)
client.send({
  type: 'greeting',
  content: 'Hello from client!'
});

// Send binary data (ArrayBuffer or Blob)
const buffer = new ArrayBuffer(8);
client.send(buffer);
```

### Event Handling

```javascript
// Connection opened
client.on('open', (event) => {
  console.log('Connected!');
});

// Message received
client.on('message', (data, event) => {
  console.log('Received:', data);
});

// Connection closed
client.on('close', (event) => {
  console.log(`Connection closed: ${event.code} ${event.reason}`);
});

// Connection error
client.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Reconnecting
client.on('reconnecting', (info) => {
  console.log(`Reconnecting... Attempt ${info.attempt} after ${info.interval}ms`);
});

// Reconnection failed
client.on('reconnect_failed', () => {
  console.error('Failed to reconnect after maximum attempts');
});

// Remove event listener
const onMessage = (data) => console.log('Received:', data);
client.on('message', onMessage);
client.off('message', onMessage);
```

## Advanced Usage

### Custom Adapter

```javascript
import { createWebSocketClient, createBrowserAdapter } from '@profullstack/websocket-client';

// Create a custom adapter
const customAdapter = createBrowserAdapter();

// Use the custom adapter
const client = createWebSocketClient({
  url: 'wss://example.com/socket',
  adapter: customAdapter
});
```

### Custom Reconnection Logic

```javascript
const client = createWebSocketClient({
  url: 'wss://example.com/socket',
  
  // Custom reconnection interval
  reconnectInterval: 2000,
  
  // Maximum reconnection interval
  maxReconnectInterval: 60000,
  
  // Exponential backoff factor
  reconnectDecay: 2.0,
  
  // Maximum number of reconnection attempts
  maxReconnectAttempts: 5,
  
  // Custom logic to determine whether to reconnect
  shouldReconnect: (event) => {
    // Don't reconnect on normal closure or if the server is going away
    if (event.code === 1000 || event.code === 1001) {
      return false;
    }
    
    // Don't reconnect if the server rejected the connection
    if (event.code === 1003 || event.code === 1008 || event.code === 1009) {
      return false;
    }
    
    // Reconnect on all other close codes
    return true;
  }
});
```

### Node.js Usage with Headers

```javascript
import { createWebSocketClient } from '@profullstack/websocket-client';

const client = createWebSocketClient({
  url: 'wss://api.example.com/socket',
  headers: {
    'Authorization': 'Bearer token123',
    'User-Agent': 'MyApp/1.0',
    'X-Custom-Header': 'CustomValue'
  }
});
```

## Browser Support

The WebSocket client works in all modern browsers that support the WebSocket API:

- Chrome 4+
- Firefox 4+
- Safari 5+
- Edge 12+
- Opera 10.7+
- iOS Safari 4.2+
- Android Browser 4.4+
- Chrome for Android 86+

## Examples

See the [examples](./examples) directory for complete usage examples.

## License

MIT