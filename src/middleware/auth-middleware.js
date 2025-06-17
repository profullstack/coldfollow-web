import { apiKeyService } from '../services/api-key-service.js';
import { errorUtils } from '../utils/error-utils.js';
import { supabase, supabaseUtils } from '../utils/supabase.js';

/**
 * Authentication middleware
 * @param {Object} c - Hono context
 * @param {Function} next - Next middleware function
 * @returns {Promise<Response>} - Response object
 */
export async function authMiddleware(c, next) {
  try {
    // Skip authentication for public endpoints
    const publicEndpoints = [
      '/api/1/payments/cryptapi/callback',
      '/api/1/subscription',
      '/api/1/subscription-status'
    ];
    
    if (publicEndpoints.includes(c.req.path)) {
      console.log(`Auth middleware: Skipping authentication for public endpoint: ${c.req.path}`);
      return next();
    }
    
    // Get API key from header
    const authHeader = c.req.header('Authorization');
    const apiKeyHeader = c.req.header('X-API-Key');
    
    let user = null;
    
    // Check Authorization header (Bearer token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();

      console.log(`Auth middleware: Processing request for path ${c.req.path}`);
      console.log(`Auth middleware: Found Bearer token of length ${token.length}`);
      
      // Handle invalid token cases including literal "null" string
      if (!token || token === 'null' || token.length < 100) {
        console.error('Auth middleware: Token appears to be malformed or truncated:', token);
        console.error('Auth middleware: Skipping JWT verification for invalid token');
        // Skip to API key validation and try as API key
        console.log('Auth middleware: Attempting to validate as API key');
        user = await apiKeyService.validateApiKey(token);
        if (user) {
          console.log('Auth middleware: API key validation successful');
        } else {
          console.log('Auth middleware: API key validation failed');
        }
      } else {
        // First, try to validate as JWT token
        try {
          console.log('Auth middleware: Attempting to verify JWT token');
          // Verify JWT token with Supabase
          const supabaseUser = await supabaseUtils.verifyJwtToken(token);
          
          if (supabaseUser) {
            console.log(`Auth middleware: JWT token verified for user ${supabaseUser.email}`);
            // Get user from database using email
            user = await apiKeyService._getUserByEmail(supabaseUser.email);
            
            if (!user) {
              console.log(`Auth middleware: Creating new user for ${supabaseUser.email}`);
              // Create user if not exists
              user = await apiKeyService._createUserIfNotExists(supabaseUser.email);
            }
          } else {
            console.log('Auth middleware: JWT token verification failed, no user returned');
          }
        } catch (jwtError) {
          console.error('Auth middleware: JWT validation error:', jwtError);
          console.error('Auth middleware: JWT validation error stack:', jwtError.stack);
          console.log('Auth middleware: JWT validation failed, trying as API key');
        }
        
        // If JWT validation failed, try as API key
        if (!user) {
          console.log('Auth middleware: Attempting to validate as API key');
          // Try to validate as API key
          user = await apiKeyService.validateApiKey(token);
          if (user) {
            console.log('Auth middleware: API key validation successful');
          } else {
            console.log('Auth middleware: API key validation failed');
          }
        }
      }
    }
    // Check X-API-Key header (for backward compatibility)
    else if (apiKeyHeader) {
      // If it looks like an API key (starts with pfs_), validate it
      if (apiKeyHeader.startsWith('pfs_')) {
        user = await apiKeyService.validateApiKey(apiKeyHeader);
      }
      // Otherwise, treat it as an email address (legacy behavior)
      else {
        const email = apiKeyHeader;
        const hasAccess = await apiKeyService.hasAccess(email);
        
        if (hasAccess) {
          user = { email, is_admin: false };
        }
      }
    }
    
    if (!user) {
      return c.json({
        error: 'Unauthorized. Valid API key or JWT token required.',
        subscription_required: true,
        subscription_url: `${process.env.API_BASE_URL || 'https://convert2doc.com'}/subscription`
      }, 401);
    }
    
    // Ensure is_admin is always present in user object
    if (typeof user.is_admin === 'undefined') {
      user.is_admin = false;
    }

    // Set user in context for later use
    c.set('user', user);
    
    // Also set user email for easier access
    c.set('userEmail', user.email);
    
    // Continue to the next middleware or route handler
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return errorUtils.handleError(error, c);
  }
}