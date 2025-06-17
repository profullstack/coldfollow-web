import { paymentService } from '../services/payment-service.js';
import { apiKeyService } from '../services/api-key-service.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Middleware to check if a user has an active subscription
 * @param {Object} c - Hono context
 * @param {Function} next - Next middleware function
 * @returns {Promise<Response>} - Response object
 */
export async function subscriptionCheck(c, next) {
  try {
    // Skip subscription check for free endpoints
    const freeEndpoints = [
      '/api/1/subscription',
      '/api/1/subscription-status'
    ];
    
    if (freeEndpoints.includes(c.req.path)) {
      return next();
    }

    // Bypass subscription check for admin users
    const user = c.get('user');
    if (user && user.is_admin) {
      return next();
    }

    // Get API key from header
    const apiKey = c.req.header('X-API-Key');
    
    if (!apiKey) {
      return c.json({ 
        error: 'API key is required', 
        subscription_required: true 
      }, 401);
    }
    
    // Extract email from API key (in a real implementation, you would validate the API key)
    // For simplicity, we're using the API key as the email address
    const email = apiKey;
    
    // Check if user has an active subscription or is an admin
    const hasAccess = await apiKeyService.hasAccess(email);
    
    if (!hasAccess) {
      return c.json({ 
        error: 'Active subscription required', 
        subscription_required: true,
        subscription_url: `${process.env.API_BASE_URL || 'https://convert2doc.com'}/subscription`
      }, 402); // 402 Payment Required
    }
    
    // Set user email in context for later use
    c.set('userEmail', email);
    
    // Continue to the next middleware or route handler
    return next();
  } catch (error) {
    console.error('Error checking subscription:', error);
    return errorUtils.handleError(error, c);
  }
}