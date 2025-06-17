#!/usr/bin/env node

/**
 * Generator Script
 *
 * This script provides multiple generators for the application, with a distinction
 * between client-side and server-side components:
 *
 * Client-side commands:
 * - client route: Generates a new client-side route with HTML view, initializer function, and router configuration
 *
 * Server-side commands:
 * - server route: Generates a new server-side route handler
 * - server migration: Generates a new database migration file
 * - server controller: Generates a new server-side controller file
 *
 * Usage:
 *   node bin/generator.js <command> <subcommand> [options]
 *
 * Examples:
 *   node bin/generator.js client route --route="/my-feature" --name="My Feature" [--auth] [--subscription]
 *   node bin/generator.js server migration --name="add_user_fields"
 *   node bin/generator.js server controller --name="UserController"
 *   node bin/generator.js server route --path="/api/v1/users" --controller="UserController" --method="get"
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(path.join(__dirname, '..'));
const templatesDir = path.join(projectRoot, 'templates');

// Parse command line arguments
const args = process.argv.slice(2);
const category = args.length > 0 ? args[0] : null;
const command = args.length > 1 ? args[1] : null;
const commandArgs = args.slice(2);

// Show help if no arguments provided or if only --help is provided
if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
  showHelp();
  process.exit(0);
}

// Execute the appropriate command
try {
  switch (category) {
    case 'client':
      switch (command) {
        case 'route':
          generateClientRoute(commandArgs);
          break;
        case 'component':
          generateClientComponent(commandArgs);
          break;
        default:
          console.error(`Error: Unknown client command '${command}'`);
          showHelp();
          process.exit(1);
      }
      break;
    case 'server':
      switch (command) {
        case 'route':
          generateServerRoute(commandArgs);
          break;
        case 'migration':
          generateServerMigration(commandArgs);
          break;
        case 'controller':
          generateServerController(commandArgs);
          break;
        default:
          console.error(`Error: Unknown server command '${command}'`);
          showHelp();
          process.exit(1);
      }
      break;
    // For backward compatibility
    case 'route':
      console.warn('Warning: The "route" command is deprecated. Please use "client route" instead.');
      generateClientRoute(args.slice(1));
      break;
    case 'migration':
      console.warn('Warning: The "migration" command is deprecated. Please use "server migration" instead.');
      generateServerMigration(args.slice(1));
      break;
    case 'controller':
      console.warn('Warning: The "controller" command is deprecated. Please use "server controller" instead.');
      generateServerController(args.slice(1));
      break;
    default:
      console.error(`Error: Unknown category '${category}'`);
      showHelp();
      process.exit(1);
  }
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Generator Script

This script provides multiple generators for the application, with a distinction
between client-side and server-side components.

Usage:
  node bin/generator.js <category> <command> [options]

Categories:
  client       Client-side generators
  server       Server-side generators

Client Commands:
  route        Generate a new client-side route with HTML view and initializer
  component    Generate a new web component that extends BaseComponent

Server Commands:
  route        Generate a new server-side route handler
  migration    Generate a new database migration file
  controller   Generate a new server-side controller file

Examples:
  node bin/generator.js client route --route="/my-feature" --name="My Feature" [--auth] [--subscription]
  node bin/generator.js client component --name="MyComponent" --tag="my-component" [--description="Description"]
  node bin/generator.js server route --path="/api/v1/users" --controller="UserController" --method="get"
  node bin/generator.js server migration --name="add_user_fields"
  node bin/generator.js server controller --name="UserController"

For command-specific help:
  node bin/generator.js client route --help
  node bin/generator.js client component --help
  node bin/generator.js server route --help
  node bin/generator.js server migration --help
  node bin/generator.js server controller --help
  `);
}

/**
 * Parse command arguments into options object
 * @param {string[]} args - Command arguments
 * @returns {object} - Options object
 */
function parseCommandArgs(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const optionName = arg.substring(2).split('=')[0];
      
      if (arg.includes('=')) {
        options[optionName] = arg.split('=')[1];
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options[optionName] = args[++i];
      } else {
        options[optionName] = true;
      }
    }
  }
  
  return options;
}

/**
 * Generate a new client-side route
 * @param {string[]} args - Command arguments
 */
function generateClientRoute(args) {
  // Show client route-specific help if requested
  if (args.includes('--help')) {
    helpClientRoute();
    return;
  }
  
  // Parse route options
  const options = parseCommandArgs(args);
  options.auth = !!options.auth;
  options.subscription = !!options.subscription;
  
  // Validate required options
  if (!options.route) {
    console.error('Error: --route option is required');
    showClientRouteHelp();
    process.exit(1);
  }

  if (!options.name) {
    console.error('Error: --name option is required');
    showClientRouteHelp();
    process.exit(1);
  }

  // Clean up route path
  if (!options.route.startsWith('/')) {
    options.route = '/' + options.route;
  }

  // Remove trailing slash if present
  if (options.route.endsWith('/') && options.route !== '/') {
    options.route = options.route.slice(0, -1);
  }

  // Generate kebab-case and camelCase versions of the route name
  const routePath = options.route.substring(1); // Remove leading slash
  const kebabCase = routePath;
  const camelCase = kebabToCamelCase(kebabCase);
  const pascalCase = kebabToPascalCase(kebabCase);

  // Define file paths
  const viewsDir = path.join(projectRoot, 'public', 'views');
  const viewFilePath = path.join(viewsDir, `${kebabCase}.html`);
  const initializerName = `init${pascalCase}Page`;
  const pageInitializersPath = path.join(projectRoot, 'public', 'js', 'page-initializers.js');
  const routerPath = path.join(projectRoot, 'public', 'js', 'router.js');

  // Create the files
  try {
    // 1. Create the HTML view file
    createViewFile(viewFilePath, options.name, kebabCase);
    console.log(`✅ Created view file: ${viewFilePath}`);

    // 2. Add initializer function to page-initializers.js
    addInitializerFunction(pageInitializersPath, initializerName, kebabCase);
    console.log(`✅ Added initializer function: ${initializerName} to page-initializers.js`);

    // 3. Add route to router.js
    addRouteToRouter(routerPath, options.route, kebabCase, initializerName, options.auth, options.subscription);
    console.log(`✅ Added route: ${options.route} to router.js`);

    console.log('\n🎉 Client route generation complete!');
    console.log(`\nYou can now access your new page at: ${options.route}`);
    
    // Suggest next steps
    console.log('\nNext steps:');
    console.log('1. Customize the HTML in the view file');
    console.log('2. Add event listeners and logic to the initializer function');
    console.log('3. Restart the development server if needed');
  } catch (error) {
    throw error;
  }
}

/**
 * Show client route-specific help information
 */
function helpClientRoute() {
  console.log(`
Client Route Generator

Generates all the necessary files and code for a new client-side route in the application.

Usage:
  node bin/generator.js client route --route="/my-feature" --name="My Feature" [--auth] [--subscription]

Options:
  --route          Route path (required, e.g., "/my-feature")
  --name           Feature name (required, e.g., "My Feature")
  --auth           Require authentication (optional)
  --subscription   Require subscription (optional)
  --help           Show this help information
  `);
}

/**
 * Generate a new server-side route
 * @param {string[]} args - Command arguments
 */
function generateServerRoute(args) {
  // Show server route-specific help if requested
  if (args.includes('--help')) {
    showServerRouteHelp();
    return;
  }
  
  // Parse route options
  const options = parseCommandArgs(args);
  
  // Validate required options
  if (!options.path) {
    console.error('Error: --path option is required');
    showServerRouteHelp();
    process.exit(1);
  }

  if (!options.controller) {
    console.error('Error: --controller option is required');
    showServerRouteHelp();
    process.exit(1);
  }

  if (!options.method) {
    console.error('Error: --method option is required');
    showServerRouteHelp();
    process.exit(1);
  }

  // Clean up route path
  if (!options.path.startsWith('/')) {
    options.path = '/' + options.path;
  }

  // Ensure controller name ends with "Controller"
  let controllerName = options.controller;
  if (!controllerName.endsWith('Controller')) {
    controllerName += 'Controller';
  }

  // Validate method
  const validMethods = ['get', 'post', 'put', 'delete', 'patch'];
  if (!validMethods.includes(options.method.toLowerCase())) {
    console.error(`Error: Invalid method '${options.method}'. Valid methods are: ${validMethods.join(', ')}`);
    showServerRouteHelp();
    process.exit(1);
  }

  // Generate route file name based on path
  const routePath = options.path.substring(1).replace(/\//g, '-');
  const routesDir = path.join(projectRoot, 'src', 'routes');
  
  // Determine the appropriate file to modify or create
  let routeFile;
  
  // Check if the path matches an existing route file
  const routeFiles = fs.readdirSync(routesDir);
  const matchingFile = routeFiles.find(file => {
    const filePath = path.join(routesDir, file);
    if (fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes(`router.${options.method.toLowerCase()}('${options.path}'`);
    }
    return false;
  });
  
  if (matchingFile) {
    routeFile = path.join(routesDir, matchingFile);
  } else {
    // Create a new file based on the controller name
    const controllerBaseName = controllerName.replace('Controller', '').toLowerCase();
    routeFile = path.join(routesDir, `${controllerBaseName}.js`);
    
    // Check if the file exists
    if (!fs.existsSync(routeFile)) {
      // Create routes directory if it doesn't exist
      if (!fs.existsSync(routesDir)) {
        fs.mkdirSync(routesDir, { recursive: true });
      }
      
      // Get the template path
      const templatePath = path.join(templatesDir, 'server', 'route.js.template');
      
      // Create a new route file from template
      const entityName = controllerName.replace('Controller', '');
      const controllerFileName = controllerName.charAt(0).toLowerCase() + controllerName.slice(1);
      
      // Determine the method name in the controller
      let methodName;
      switch (options.method.toLowerCase()) {
        case 'get':
          if (options.path.includes(':id')) {
            methodName = 'getById';
          } else {
            methodName = 'getAll';
          }
          break;
        case 'post':
          methodName = 'create';
          break;
        case 'put':
          methodName = 'update';
          break;
        case 'delete':
          methodName = 'remove';
          break;
        case 'patch':
          methodName = 'update';
          break;
        default:
          methodName = options.method.toLowerCase();
      }
      
      const routeContent = readAndProcessTemplate(templatePath, {
        entityName,
        controllerName,
        controllerFileName,
        routePath: options.path,
        methodUpper: options.method.toUpperCase(),
        methodLower: options.method.toLowerCase(),
        methodName
      });
      
      fs.writeFileSync(routeFile, routeContent);
      console.log(`✅ Created route file: ${routeFile}`);
    } else {
      // Read the current content of the route file
      const routeContent = fs.readFileSync(routeFile, 'utf8');
      
      // Check if the route already exists
      if (routeContent.includes(`router.${options.method.toLowerCase()}('${options.path}'`)) {
        console.error(`Error: Route ${options.method.toUpperCase()} ${options.path} already exists in ${routeFile}`);
        process.exit(1);
      }
      
      // Determine the method name in the controller
      let methodName;
      switch (options.method.toLowerCase()) {
        case 'get':
          if (options.path.includes(':id')) {
            methodName = 'getById';
          } else {
            methodName = 'getAll';
          }
          break;
        case 'post':
          methodName = 'create';
          break;
        case 'put':
          methodName = 'update';
          break;
        case 'delete':
          methodName = 'remove';
          break;
        case 'patch':
          methodName = 'update';
          break;
        default:
          methodName = options.method.toLowerCase();
      }
      
      // Add the route to the file
      const routeDefinition = `
// ${options.method.toUpperCase()} ${options.path}
router.${options.method.toLowerCase()}('${options.path}', ${controllerName}.${methodName});`;
      
      // Find the position to insert the route
      const insertPosition = routeContent.indexOf('export default router;');
      if (insertPosition === -1) {
        console.error(`Error: Could not find export statement in ${routeFile}`);
        process.exit(1);
      }
      
      // Insert the route definition
      const newContent = routeContent.slice(0, insertPosition) + routeDefinition + '\n\n' + routeContent.slice(insertPosition);
      
      // Write the updated content back to the file
      fs.writeFileSync(routeFile, newContent);
    }
  }
  
  console.log(`✅ Added route: ${options.method.toUpperCase()} ${options.path} to ${routeFile}`);
  
  console.log('\n🎉 Server route generation complete!');
  
  // Determine the method name in the controller
  let methodName;
  switch (options.method.toLowerCase()) {
    case 'get':
      if (options.path.includes(':id')) {
        methodName = 'getById';
      } else {
        methodName = 'getAll';
      }
      break;
    case 'post':
      methodName = 'create';
      break;
    case 'put':
      methodName = 'update';
      break;
    case 'delete':
      methodName = 'remove';
      break;
    case 'patch':
      methodName = 'update';
      break;
    default:
      methodName = options.method.toLowerCase();
  }
  
  // Suggest next steps
  console.log('\nNext steps:');
  console.log(`1. Implement the ${methodName} method in the ${controllerName} controller if needed`);
  console.log('2. Test the route with an API client');
  console.log('3. Restart the server if needed');
}

/**
 * Show server route-specific help information
 */
function showServerRouteHelp() {
  console.log(`
Server Route Generator

Generates a new server-side route handler.

Usage:
  node bin/generator.js server route --path="/api/v1/users" --controller="UserController" --method="get"

Options:
  --path           Route path (required, e.g., "/api/v1/users")
  --controller     Controller name (required, e.g., "UserController" or "User")
  --method         HTTP method (required, e.g., "get", "post", "put", "delete", "patch")
  --help           Show this help information
  `);
}

/**
 * Generate a new server-side migration
 * @param {string[]} args - Command arguments
 */
function generateServerMigration(args) {
  // Show migration-specific help if requested
  if (args.includes('--help')) {
    showServerMigrationHelp();
    return;
  }
  
  // Parse migration options
  const options = parseCommandArgs(args);
  
  // Validate required options
  if (!options.name) {
    console.error('Error: --name option is required');
    showServerMigrationHelp();
    process.exit(1);
  }

  // Generate migration file name with timestamp
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '');
  const migrationName = options.name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  const fileName = `${timestamp}_${migrationName}.sql`;
  const migrationsDir = path.join(projectRoot, 'supabase', 'migrations');
  const filePath = path.join(migrationsDir, fileName);

  // Create the migration file
  try {
    // Create migrations directory if it doesn't exist
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    // Get the template path
    const templatePath = path.join(templatesDir, 'server', 'migration.sql.template');
    
    // Create migration file content from template
    const migrationContent = readAndProcessTemplate(templatePath, {
      migrationName: options.name,
      timestamp: new Date().toISOString()
    });

    // Write the file
    fs.writeFileSync(filePath, migrationContent);
    console.log(`✅ Created migration file: ${filePath}`);
    
    console.log('\n🎉 Migration generation complete!');
    
    // Suggest next steps
    console.log('\nNext steps:');
    console.log('1. Edit the migration file to add your SQL commands');
    console.log('2. Apply the migration using the appropriate command');
    console.log('   Example: node bin/apply-migration.js');
  } catch (error) {
    throw error;
  }
}

/**
 * Show server migration-specific help information
 */
function showServerMigrationHelp() {
  console.log(`
Server Migration Generator

Generates a new SQL migration file with a timestamp prefix.

Usage:
  node bin/generator.js server migration --name="add_user_fields"

Options:
  --name           Migration name (required, e.g., "add_user_fields" or "AddUserFields")
  --help           Show this help information
  `);
}

/**
 * Generate a new server-side controller
 * @param {string[]} args - Command arguments
 */
function generateServerController(args) {
  // Show controller-specific help if requested
  if (args.includes('--help')) {
    showServerControllerHelp();
    return;
  }
  
  // Parse controller options
  const options = parseCommandArgs(args);
  
  // Validate required options
  if (!options.name) {
    console.error('Error: --name option is required');
    showServerControllerHelp();
    process.exit(1);
  }

  // Ensure name ends with "Controller"
  let controllerName = options.name;
  if (!controllerName.endsWith('Controller')) {
    controllerName += 'Controller';
  }
  
  // Generate file name and path
  const fileName = `${controllerName.charAt(0).toLowerCase() + controllerName.slice(1)}.js`;
  const controllersDir = path.join(projectRoot, 'src', 'controllers');
  const filePath = path.join(controllersDir, fileName);

  // Create the controller file
  try {
    // Create controllers directory if it doesn't exist
    if (!fs.existsSync(controllersDir)) {
      fs.mkdirSync(controllersDir, { recursive: true });
    }
    
    // Get the template path
    const templatePath = path.join(templatesDir, 'server', 'controller.js.template');
    
    // Create controller file content from template
    const entityName = controllerName.replace('Controller', '');
    const controllerContent = readAndProcessTemplate(templatePath, {
      controllerName,
      entityName
    });

    // Write the file
    fs.writeFileSync(filePath, controllerContent);
    console.log(`✅ Created controller file: ${filePath}`);
    
    console.log('\n🎉 Controller generation complete!');
    
    // Suggest next steps
    console.log('\nNext steps:');
    console.log('1. Implement the controller methods');
    console.log('2. Create routes that use this controller');
    console.log('3. Test the controller endpoints');
  } catch (error) {
    throw error;
  }
}

/**
 * Show server controller-specific help information
 */
function showServerControllerHelp() {
  console.log(`
Server Controller Generator

Generates a new server-side controller file with standard CRUD methods.

Usage:
  node bin/generator.js server controller --name="UserController"

Options:
  --name           Controller name (required, e.g., "UserController" or "User")
  --help           Show this help information
  `);
}

/**
 * Generate a new client-side component
 * @param {string[]} args - Command arguments
 */
function generateClientComponent(args) {
  // Show client component-specific help if requested
  if (args.includes('--help')) {
    helpClientComponent();
    return;
  }
  
  // Parse component options
  const options = parseCommandArgs(args);
  
  // Validate required options
  if (!options.name) {
    console.error('Error: --name option is required');
    helpClientComponent();
    process.exit(1);
  }

  // Generate component name variations
  const componentName = options.name;
  const className = componentName.includes('-') ? kebabToPascalCase(componentName) : componentName;
  const kebabCase = className.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  
  // Use provided tag name or generate from component name
  const tagName = options.tag || kebabCase;
  
  // Use provided description or generate a default one
  const componentDescription = options.description || `A custom ${componentName} component`;
  
  // Define file paths
  const componentsDir = path.join(projectRoot, 'public', 'js', 'components');
  const componentFilePath = path.join(componentsDir, `${kebabCase}.js`);
  
  // Create the component file
  try {
    // Create components directory if it doesn't exist
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true });
    }
    
    // Check if file already exists
    if (fs.existsSync(componentFilePath)) {
      throw new Error(`Component file already exists: ${componentFilePath}`);
    }
    
    // Get the template path
    const templatePath = path.join(templatesDir, 'client', 'component', 'component.js.template');
    
    // Create component file content from template
    const componentContent = readAndProcessTemplate(templatePath, {
      componentName,
      componentDescription,
      className,
      tagName,
      kebabCase
    });
    
    // Write the file
    fs.writeFileSync(componentFilePath, componentContent);
    console.log(`✅ Created component file: ${componentFilePath}`);
    
    console.log('\n🎉 Component generation complete!');
    
    // Suggest next steps
    console.log('\nNext steps:');
    console.log('1. Customize the component template and styles');
    console.log('2. Add event listeners and logic to the component');
    console.log(`3. Use the component in your HTML with <${tagName}></${tagName}>`);
    console.log('4. Import the component where needed:');
    console.log(`   import { ${className} } from './components/${kebabCase}.js';`);
  } catch (error) {
    throw error;
  }
}

/**
 * Show client component-specific help information
 */
function helpClientComponent() {
  console.log(`
Client Component Generator

Generates a new web component that extends BaseComponent.

Usage:
  node bin/generator.js client component --name="MyComponent" [--tag="my-component"] [--description="Description"]

Options:
  --name           Component name (required, e.g., "UserCard" or "DataTable")
  --tag            Custom HTML tag name (optional, default: kebab-case of component name)
  --description    Component description (optional)
  --help           Show this help information
  `);
}

/**
 * Create the HTML view file
 * @param {string} filePath - Path to the view file
 * @param {string} featureName - Name of the feature
 * @param {string} kebabCase - Kebab-case version of the route name
 */
function createViewFile(filePath, featureName, kebabCase) {
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    throw new Error(`View file already exists: ${filePath}`);
  }
  
  // Create the views directory if it doesn't exist
  const viewsDir = path.dirname(filePath);
  if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
  }
  
  // Generate i18n keys
  const i18nPrefix = kebabCase.replace(/-/g, '_');
  
  // Get the template path
  const templatePath = path.join(templatesDir, 'client', 'route', 'view.html.template');
  
  // Create HTML content from template
  const htmlContent = readAndProcessTemplate(templatePath, {
    featureName,
    kebabCase,
    i18nPrefix
  });

  // Write the file with just the template content (no full HTML wrapper)
  fs.writeFileSync(filePath, htmlContent);
  
  // Create the JS view file
  const jsViewsDir = path.join(projectRoot, 'public', 'js', 'views');
  if (!fs.existsSync(jsViewsDir)) {
    fs.mkdirSync(jsViewsDir, { recursive: true });
  }
  
  const jsViewPath = path.join(jsViewsDir, `${kebabCase}.js`);
  const jsTemplatePath = path.join(templatesDir, 'client', 'route', 'view.js.template');
  
  const jsContent = readAndProcessTemplate(jsTemplatePath, {
    featureName,
    kebabCase,
    pascalCase: kebabToPascalCase(kebabCase)
  });
  
  fs.writeFileSync(jsViewPath, jsContent);
  console.log(`✅ Created JS view file: ${jsViewPath}`);
}

/**
 * Add initializer function to page-initializers.js
 * @param {string} filePath - Path to page-initializers.js
 * @param {string} initializerName - Name of the initializer function
 * @param {string} kebabCase - Kebab-case version of the route name
 */
function addInitializerFunction(filePath, initializerName, kebabCase) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Page initializers file not found: ${filePath}`);
  }
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the initializer already exists
  if (content.includes(`export function ${initializerName}`)) {
    throw new Error(`Initializer function ${initializerName} already exists in ${filePath}`);
  }
  
  // Find the last export function
  const lastExportIndex = content.lastIndexOf('export function');
  if (lastExportIndex === -1) {
    throw new Error(`Could not find export functions in ${filePath}`);
  }
  
  // Find the end of the last function
  let lastFunctionEndIndex = content.indexOf('\n}\n', lastExportIndex);
  if (lastFunctionEndIndex === -1) {
    lastFunctionEndIndex = content.indexOf('\n}', lastExportIndex);
    if (lastFunctionEndIndex === -1) {
      throw new Error(`Could not find the end of the last function in ${filePath}`);
    }
    lastFunctionEndIndex += 2; // Include the closing brace and newline
  } else {
    lastFunctionEndIndex += 3; // Include the closing brace and newlines
  }
  
  // Get the template path
  const templatePath = path.join(templatesDir, 'client', 'route', 'initializer.js.template');
  
  // Create the initializer function from template
  const initializerFunction = readAndProcessTemplate(templatePath, {
    kebabCase,
    initializerName,
    pascalCase: kebabToPascalCase(kebabCase)
  });

  // Insert the initializer function after the last function
  const newContent = content.slice(0, lastFunctionEndIndex) + '\n' + initializerFunction + content.slice(lastFunctionEndIndex);
  
  // Update the exports if there's an export statement at the top
  let updatedContent = newContent;
  const exportStatement = updatedContent.match(/export\s*{\s*([^}]+)\s*}\s*from/);
  if (exportStatement) {
    const exportList = exportStatement[1];
    const lastExport = exportList.trim().split(',').pop().trim();
    const newExportList = exportList.replace(lastExport, `${lastExport},\n  ${initializerName}`);
    updatedContent = updatedContent.replace(exportList, newExportList);
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, updatedContent);
}

/**
 * Add route to router.js
 * @param {string} filePath - Path to router.js
 * @param {string} routePath - Route path (e.g., "/my-feature")
 * @param {string} kebabCase - Kebab-case version of the route name
 * @param {string} initializerName - Name of the initializer function
 * @param {boolean} requireAuth - Whether authentication is required
 * @param {boolean} requireSubscription - Whether subscription is required
 */
function addRouteToRouter(filePath, routePath, kebabCase, initializerName, requireAuth, requireSubscription) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Router file not found: ${filePath}`);
  }
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the createRoutes call
  const createRoutesIndex = content.indexOf('const routes = createRoutes({');
  if (createRoutesIndex === -1) {
    throw new Error(`Could not find createRoutes call in ${filePath}`);
  }
  
  // Find the end of the routes object
  const routesEndIndex = content.indexOf('});', createRoutesIndex);
  if (routesEndIndex === -1) {
    throw new Error(`Could not find the end of routes object in ${filePath}`);
  }
  
  // Check if the route already exists
  const routeRegex = new RegExp(`['"]${routePath}['"]\\s*:`);
  if (routeRegex.test(content.substring(createRoutesIndex, routesEndIndex))) {
    throw new Error(`Route ${routePath} already exists in ${filePath}`);
  }
  
  // Find the proper insertion point by looking for the last complete route definition
  // Extract the routes section content
  const routesContent = content.substring(createRoutesIndex, routesEndIndex);
  
  // Find all route definitions using a regex that matches the pattern
  // '/route-path': { ... } or '/route-path': '/views/...'
  const routePattern = /^\s*['"`]([^'"`]+)['"`]\s*:\s*(?:\{[\s\S]*?\}|['"`][^'"`]*['"`])\s*,?\s*$/gm;
  let lastRouteMatch = null;
  let match;
  
  while ((match = routePattern.exec(routesContent)) !== null) {
    lastRouteMatch = match;
  }
  
  if (!lastRouteMatch) {
    throw new Error(`Could not find any route definitions in ${filePath}`);
  }
  
  // Find the end position of the last route in the original content
  const lastRouteEnd = createRoutesIndex + lastRouteMatch.index + lastRouteMatch[0].length;
  const insertionPoint = lastRouteEnd;
  
  // Create the route definition
  let routeDefinition = `,\n  '${routePath}': {
    viewPath: '/views/${kebabCase}.html',
    afterRender: ${initializerName}`;
  
  if (requireAuth) {
    routeDefinition += ',\n    requireAuth: true';
  }
  
  if (requireSubscription) {
    routeDefinition += ',\n    requireSubscription: true';
  }
  
  routeDefinition += '\n  }';
  
  // Insert the route definition at the proper location
  const newContent = content.slice(0, insertionPoint) + routeDefinition + content.slice(insertionPoint);
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, newContent);
  
  // Update the import statement for the initializer
  updateImportStatement(filePath, initializerName);
}

/**
 * Update the import statement in router.js to include the new initializer
 * @param {string} filePath - Path to router.js
 * @param {string} initializerName - Name of the initializer function
 */
function updateImportStatement(filePath, initializerName) {
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the import statement for page-initializers.js
  const importRegex = /import\s*{([^}]+)}\s*from\s*['"]\.\/page-initializers\.js['"]/;
  const importMatch = content.match(importRegex);
  
  if (!importMatch) {
    throw new Error(`Could not find import statement for page-initializers.js in ${filePath}`);
  }
  
  // Check if the initializer is already imported
  const importList = importMatch[1];
  if (importList.includes(initializerName)) {
    return; // Already imported
  }
  
  // Add the initializer to the import list
  const newImportList = importList.trim() + `,\n  ${initializerName}`;
  const newImportStatement = `import {\n  ${newImportList}\n} from './page-initializers.js'`;
  
  // Replace the import statement
  const newContent = content.replace(importRegex, newImportStatement);
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, newContent);
}

/**
 * Convert kebab-case to camelCase
 * @param {string} str - Kebab-case string
 * @returns {string} - camelCase string
 */
function kebabToCamelCase(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Convert kebab-case to PascalCase
 * @param {string} str - Kebab-case string
 * @returns {string} - PascalCase string
 */
function kebabToPascalCase(str) {
  const camelCase = kebabToCamelCase(str);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

/**
 * Read a template file and return its content
 * @param {string} templatePath - Path to the template file
 * @returns {string} - Template content
 */
function readTemplate(templatePath) {
  try {
    return fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read template file: ${templatePath}. ${error.message}`);
  }
}

/**
 * Process a template by replacing placeholders with values
 * @param {string} template - Template content
 * @param {object} replacements - Object with placeholder keys and replacement values
 * @returns {string} - Processed template
 */
function processTemplate(template, replacements) {
  let result = template;
  
  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, value);
  }
  
  return result;
}

/**
 * Read and process a template file
 * @param {string} templatePath - Path to the template file
 * @param {object} replacements - Object with placeholder keys and replacement values
 * @returns {string} - Processed template content
 */
function readAndProcessTemplate(templatePath, replacements) {
  const template = readTemplate(templatePath);
  return processTemplate(template, replacements);
}