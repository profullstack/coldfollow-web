/**
 * Basic usage examples for @profullstack/state-manager
 */

import { createStateManager, createLoggerMiddleware } from '../src/index.js';

/**
 * Run the examples
 */
async function runExamples() {
  try {
    console.log('Running state manager examples...\n');
    
    // Example 1: Create a state manager with initial state
    console.log('Example 1: Creating a state manager with initial state');
    
    const stateManager = createStateManager({
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        preferences: {
          theme: 'light',
          notifications: true
        }
      },
      todos: [
        { id: 1, text: 'Learn state management', completed: false },
        { id: 2, text: 'Build an app', completed: false }
      ],
      ui: {
        sidebar: {
          open: true,
          width: 250
        },
        modal: {
          open: false,
          content: null
        }
      }
    }, {
      enablePersistence: true,
      persistenceKey: 'state_manager_example',
      debug: true
    });
    
    // Add logger middleware
    const loggerMiddleware = createLoggerMiddleware({
      logBefore: true,
      logAfter: true
    });
    
    stateManager.use('beforeUpdate', loggerMiddleware.beforeUpdate);
    stateManager.use('afterUpdate', loggerMiddleware.afterUpdate);
    
    console.log('Initial state:', stateManager.getState());
    console.log();
    
    // Example 2: Subscribe to state changes
    console.log('Example 2: Subscribing to state changes');
    
    // Subscribe to all state changes
    const globalUnsubscribe = stateManager.subscribe((state, changedPaths) => {
      console.log('Global subscriber called with changed paths:', changedPaths);
    });
    
    // Subscribe to specific path
    const userUnsubscribe = stateManager.subscribe((userData, path) => {
      console.log(`User subscriber called with path: ${path}`);
      console.log('User data:', userData);
    }, 'user');
    
    // Subscribe to nested path
    const themeUnsubscribe = stateManager.subscribe((theme, path) => {
      console.log(`Theme subscriber called with path: ${path}`);
      console.log('Theme:', theme);
    }, 'user.preferences.theme');
    
    // Subscribe to array
    const todosUnsubscribe = stateManager.subscribe((todos, path) => {
      console.log(`Todos subscriber called with path: ${path}`);
      console.log('Todos:', todos);
    }, 'todos');
    
    console.log('Subscribers added');
    console.log();
    
    // Example 3: Update state
    console.log('Example 3: Updating state');
    
    // Update a simple value
    stateManager.setState({
      user: {
        preferences: {
          theme: 'dark'
        }
      }
    });
    
    // Update using a function
    stateManager.setState(state => ({
      todos: [
        ...state.todos,
        { id: 3, text: 'Write documentation', completed: false }
      ]
    }));
    
    // Update multiple paths
    stateManager.setState({
      user: {
        name: 'Jane Doe'
      },
      ui: {
        sidebar: {
          width: 300
        }
      }
    });
    
    console.log('State after updates:', stateManager.getState());
    console.log();
    
    // Example 4: Using selectors
    console.log('Example 4: Using selectors');
    
    // Create a selector for completed todos
    const getCompletedTodos = stateManager.createSelector(state => {
      return state.todos.filter(todo => todo.completed);
    });
    
    // Create a selector for incomplete todos
    const getIncompleteTodos = stateManager.createSelector(state => {
      return state.todos.filter(todo => !todo.completed);
    });
    
    // Create a selector for todo count
    const getTodoCount = stateManager.createSelector(state => {
      return {
        total: state.todos.length,
        completed: state.todos.filter(todo => todo.completed).length,
        incomplete: state.todos.filter(todo => !todo.completed).length
      };
    });
    
    console.log('Completed todos:', getCompletedTodos());
    console.log('Incomplete todos:', getIncompleteTodos());
    console.log('Todo counts:', getTodoCount());
    
    // Mark a todo as completed
    stateManager.setState(state => ({
      todos: state.todos.map(todo => 
        todo.id === 1 ? { ...todo, completed: true } : todo
      )
    }));
    
    console.log('After marking todo as completed:');
    console.log('Completed todos:', getCompletedTodos());
    console.log('Incomplete todos:', getIncompleteTodos());
    console.log('Todo counts:', getTodoCount());
    console.log();
    
    // Example 5: Unsubscribing
    console.log('Example 5: Unsubscribing');
    
    // Unsubscribe from specific paths
    userUnsubscribe();
    themeUnsubscribe();
    
    console.log('Unsubscribed from user and theme paths');
    
    // Update state again
    stateManager.setState({
      user: {
        preferences: {
          theme: 'system'
        }
      }
    });
    
    // Unsubscribe from all remaining subscriptions
    globalUnsubscribe();
    todosUnsubscribe();
    
    console.log('Unsubscribed from all remaining subscriptions');
    console.log();
    
    // Example 6: Using paths with dot notation and arrays
    console.log('Example 6: Using paths with dot notation and arrays');
    
    // Get nested values
    const theme = stateManager.getState('user.preferences.theme');
    console.log('Theme:', theme);
    
    const secondTodo = stateManager.getState('todos.1');
    console.log('Second todo:', secondTodo);
    
    // Update nested values
    stateManager.setState({
      'todos.1.completed': true
    });
    
    console.log('Updated second todo:', stateManager.getState('todos.1'));
    console.log();
    
    // Example 7: Reset state
    console.log('Example 7: Resetting state');
    
    // Reset to new initial state
    stateManager.resetState({
      user: {
        name: 'New User',
        email: 'new@example.com',
        preferences: {
          theme: 'light',
          notifications: false
        }
      },
      todos: [],
      ui: {
        sidebar: {
          open: false,
          width: 200
        },
        modal: {
          open: false,
          content: null
        }
      }
    });
    
    console.log('State after reset:', stateManager.getState());
    console.log();
    
    // Example 8: Web Component Integration
    console.log('Example 8: Web Component Integration');
    
    // Create a connected component
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
        console.log(`TodoList component received state change for path: ${path}`);
        this.render();
      }
      
      render() {
        const todos = this.getState('todos');
        
        this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: block;
              font-family: sans-serif;
            }
            ul {
              list-style: none;
              padding: 0;
            }
            li {
              padding: 8px;
              margin-bottom: 4px;
              background-color: #f5f5f5;
              border-radius: 4px;
            }
            .completed {
              text-decoration: line-through;
              opacity: 0.7;
            }
          </style>
          <h2>Todo List</h2>
          <ul>
            ${todos.map(todo => `
              <li class="${todo.completed ? 'completed' : ''}">
                ${todo.text}
              </li>
            `).join('')}
          </ul>
          <button id="add">Add Todo</button>
        `;
        
        // Add event listener to add button
        this.shadowRoot.querySelector('#add').addEventListener('click', () => {
          const newTodo = {
            id: Date.now(),
            text: `New todo ${Date.now()}`,
            completed: false
          };
          
          this.setState(state => ({
            todos: [...state.todos, newTodo]
          }));
        });
      }
    }
    
    createConnectedComponent('todo-list', TodoListElement, {
      statePaths: ['todos']
    });
    
    console.log('Created todo-list web component');
    console.log('You can use it in HTML with <todo-list></todo-list>');
    
    // Add some todos for demonstration
    stateManager.setState({
      todos: [
        { id: 1, text: 'Web component todo 1', completed: false },
        { id: 2, text: 'Web component todo 2', completed: true }
      ]
    });
    
    console.log();
    
    console.log('All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples
runExamples();