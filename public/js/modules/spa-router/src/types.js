/**
 * TypeScript definitions for @profullstack/spa-router
 */

/**
 * @typedef {Object} RouteParams
 * @property {string} [paramName] - Dynamic route parameter
 */

/**
 * @typedef {Object} RouteConfig
 * @property {Function|string} [view] - View function or HTML string
 * @property {string|Function} [component] - Web component name or dynamic import function
 * @property {Object} [props] - Props to pass to the component
 * @property {Function} [beforeEnter] - Guard called before entering the route
 * @property {Function} [afterRender] - Function called after rendering the route
 * @property {boolean} [requiresAuth] - Whether the route requires authentication
 */

/**
 * @typedef {Object} RouterOptions
 * @property {Object.<string, RouteConfig>} [routes] - Route definitions
 * @property {string} [rootElement] - Root element selector
 * @property {Function} [errorHandler] - 404 error handler
 * @property {Function} [transition] - Transition function
 */

/**
 * @typedef {Object} TransitionOptions
 * @property {number} [duration] - Transition duration in ms
 * @property {string} [direction] - Slide direction ('left', 'right', 'up', 'down')
 */

/**
 * @typedef {Object} Route
 * @property {string} path - Route path
 * @property {Function|string} [view] - View function or HTML string
 * @property {string|Function} [component] - Web component name or dynamic import function
 * @property {Object} [props] - Props to pass to the component
 * @property {Function} [beforeEnter] - Guard called before entering the route
 * @property {Function} [afterRender] - Function called after rendering the route
 * @property {boolean} [requiresAuth] - Whether the route requires authentication
 * @property {RegExp} regex - Route regex for matching
 * @property {string[]} paramNames - Parameter names
 * @property {RouteParams} [params] - Route parameters
 */

/**
 * @typedef {Object} NavigationTarget
 * @property {string} path - Target path
 * @property {RouteParams} [params] - Route parameters
 */

/**
 * @callback MiddlewareNext
 * @param {string} [path] - Path to redirect to
 * @returns {Promise<void>}
 */

/**
 * @callback Middleware
 * @param {NavigationTarget} to - Target route
 * @param {string|null} from - Previous route path
 * @param {MiddlewareNext} next - Function to continue middleware chain
 * @returns {Promise<void>}
 */

/**
 * @callback RouteGuard
 * @param {Route} to - Target route
 * @param {Route|null} from - Previous route
 * @param {Function} next - Function to continue navigation
 * @returns {boolean|Promise<boolean>}
 */

/**
 * @callback TransitionFunction
 * @param {string} oldContent - Old content
 * @param {string} newContent - New content
 * @param {HTMLElement} rootElement - Root element
 * @returns {Promise<void>}
 */

/**
 * @callback ErrorHandler
 * @param {string} path - Path that caused the error
 * @param {HTMLElement} rootElement - Root element
 * @returns {string} - Error page HTML
 */