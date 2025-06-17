# @profullstack/state-manager

Enhanced state manager with web component integration, persistence, and subscription management.

## Browser-Only Version

This module has been refactored to be browser-only, removing any Node.js-specific dependencies. It can be used directly in browser environments without any additional polyfills or bundling.

### No External Dependencies

The module now uses the browser's native EventTarget API instead of the eventemitter3 library, eliminating all external dependencies. This makes the module lighter and more efficient for browser usage.

## Features

- Simple and intuitive API for state management
- Immutable state updates
- Subscription system for state changes
- Path-based state access and updates
- Persistence with various storage adapters (localStorage, sessionStorage, IndexedDB, memory)
- Web component integration
- Middleware support for intercepting and modifying state updates
- Selectors for derived state

## Installation

```bash
npm install @profullstack/state-manager
```

## Usage

### Basic Usage

```javascript
import { createStateManager } from '@profullstack/state-manager';

// Create a state manager with initial state
const stateManager = createStateManager({
  user: {
    name: 'John Doe',
    preferences: {
      theme: 'light'
    }
  },
  todos: [
    { id: 1, text: 'Learn state management', completed: false }
  ]
});

// Subscribe to state changes
const unsubscribe = stateManager.subscribe((state, changedPaths) => {
  console.log('State changed:', state);
  console.log('Changed paths:', changedPaths);
});

// Update state
stateManager.setState({
  user: {
    preferences: {
      theme: 'dark'
    }
  }
});

// Get state
const theme = stateManager.getState('user.preferences.theme');
console.log('Theme:', theme); // 'dark'

// Unsubscribe when done
unsubscribe();
```

### Persistence

```javascript
import { createStateManager } from '@profullstack/state-manager';

// Create a state manager with persistence enabled
const stateManager = createStateManager({
  user: {
    name: 'John Doe'
  }
}, {
  enablePersistence: true,
  persistenceKey: 'my_app_state'
});

// State will be automatically saved to localStorage
stateManager.setState({
  user: {
    name: 'Jane Doe'
  }
});

// When the app is reloaded, the state will be restored from localStorage
```

### Web Component Integration

```javascript
import { createStateManager } from '@profullstack/state-manager';

// Create a state manager
const stateManager = createStateManager({
  todos: [
    { id: 1, text: 'Learn state management', completed: false }
  ]
});

// Create a connected web component
const { createConnectedComponent } = stateManager.webComponents;

class TodoListElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    this.render();
  }
  
  stateChanged(state, path, fullState) {
    this.render();
  }
  
  render() {
    const todos = this.getState('todos');
    
    this.shadowRoot.innerHTML = `
      <ul>
        ${todos.map(todo => `
          <li>${todo.text}</li>
        `).join('')}
      </ul>
    `;
  }
}

// Register the component
createConnectedComponent('todo-list', TodoListElement, {
  statePaths: ['todos']
});

// Use the component in HTML
// <todo-list></todo-list>
```

## API Reference

### createStateManager(initialState, options)

Creates a new state manager instance.

- `initialState`: Initial state object
- `options`: Configuration options
  - `enablePersistence`: Whether to enable persistence (default: false)
  - `persistenceKey`: Key for persistence storage (default: 'app_state')
  - `persistenceAdapter`: Persistence adapter (default: localStorage)
  - `persistentKeys`: Keys to persist (default: all)
  - `immutable`: Whether to use immutable state (default: true)
  - `debug`: Whether to enable debug logging (default: false)

### StateManager Methods

- `getState(path)`: Get the current state or a specific part of the state
- `setState(update, options)`: Update the state
- `resetState(initialState, options)`: Reset the state to initial values
- `subscribe(callback, paths)`: Subscribe to state changes
- `unsubscribe(callback)`: Unsubscribe a callback from all subscriptions
- `use(type, middleware)`: Add middleware to the state manager
- `createSelector(selectorFn, equalityFn)`: Create a selector function that memoizes the result

## License

MIT