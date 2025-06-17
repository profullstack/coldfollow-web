/**
 * Authentication utility functions
 */

/**
 * Check if the user is logged in
 * @returns {boolean} True if user is logged in
 */
export function isLoggedIn() {
  // Check for JWT token in localStorage
  const jwtToken = getToken();
  return !!jwtToken && jwtToken !== 'null' && jwtToken.length > 100;
}

/**
 * Get the user's JWT token
 * @returns {string|null} JWT token or null if not found
 */
export function getToken() {
  return localStorage.getItem('jwt_token');
}

/**
 * Get the current user ID
 * @returns {string|null} User ID or null if not logged in
 */
export function getUserId() {
  try {
    // Try to get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id;
    }
    return null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

/**
 * Log out the current user
 */
export function logout() {
  // Clear authentication data
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user');
  localStorage.removeItem('username');
  localStorage.removeItem('session_data');
  sessionStorage.removeItem('backup_jwt_token');
  
  // Redirect to login page
  window.location.href = '/login';
}

/**
 * Helper method to create Authorization header
 * @returns {Object} Headers object with Authorization header
 */
export function getAuthHeaders() {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}
