import { supabase } from '../utils/supabase.js';
import crypto from 'crypto';

/**
 * Service for managing API keys
 */
export const apiKeyService = {
  /**
   * Generate a random API key
   * @returns {string} - Random API key
   * @private
   */
  _generateApiKey() {
    return `pfs_${crypto.randomBytes(32).toString('hex')}`;
  },

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User object or null if not found
   * @private
   */
  async _getUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      throw error;
    }
    
    return data;
  },

  /**
   * Create user if not exists
   * @param {string} email - User email
   * @param {boolean} is_admin - Whether the user is an admin
   * @returns {Promise<Object|null>} - User object or null if couldn't be created
   * @private
   */
  async _createUserIfNotExists(email, is_admin = false) {
    try {
      // Check if user exists
      const user = await this._getUserByEmail(email);
      
      if (user) {
        console.log(`API Key Service: User ${email} already exists`);
        return user;
      }
      
      console.log(`API Key Service: User ${email} does not exist, attempting to create`);
      
      // Try to create user, but handle permission errors gracefully
      try {
        const { data, error } = await supabase
          .from('users')
          .insert([{
            email,
            is_admin: is_admin
          }])
          .select()
          .single();
        
        if (error) {
          if (error.code === '42501') { // Permission denied error
            console.warn(`API Key Service: Permission denied to create user ${email}, proceeding anyway`);
            // Return a temporary user object with just the email
            // This allows operations to proceed without failing entirely
            return { email, id: null, is_admin: is_admin, temp_user: true };
          } else {
            throw error;
          }
        }
        
        console.log(`API Key Service: User ${email} created successfully`);
        return data;
      } catch (insertError) {
        console.error(`API Key Service: Error creating user ${email}:`, insertError);
        
        if (insertError.code === '42501') { // Permission denied error
          console.warn(`API Key Service: Permission denied to create user ${email}, proceeding anyway`);
          // Return a temporary user object with just the email
          return { email, id: null, is_admin: is_admin, temp_user: true };
        } else {
          throw insertError;
        }
      }
    } catch (error) {
      console.error(`API Key Service: Error in _createUserIfNotExists for ${email}:`, error);
      // Return a temporary user object to allow operations to continue
      return { email, id: null, is_admin: is_admin, temp_user: true };
    }
  },

  /**
   * Create a new API key
   * @param {string} email - User email
   * @param {string} name - API key name
   * @returns {Promise<Object>} - API key object
   */
  async createApiKey(email, name) {
    try {
      // Create user if not exists
      const user = await this._createUserIfNotExists(email);
      
      // Check if user is a temporary user (no ID)
      if (!user || !user.id) {
        console.error(`API Key Service: Cannot create API key for user ${email} - no valid user ID`);
        
        // Try to get or create the user directly with Supabase auth
        console.log(`API Key Service: Attempting to get user ID from Supabase auth for ${email}`);
        
        // First, try to get the user from the users table again
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single();
        
        if (userError || !userData) {
          console.error(`API Key Service: Failed to get user ID for ${email}:`, userError);
          throw new Error(`Cannot create API key: User ${email} not found or has no ID`);
        }
        
        // Use the user ID from the direct query
        user.id = userData.id;
        console.log(`API Key Service: Retrieved user ID ${user.id} for ${email}`);
      }
      
      // Generate API key
      const key = this._generateApiKey();
      
      console.log(`API Key Service: Creating API key for user ${email} with ID ${user.id}`);
      
      // Create API key
      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          user_id: user.id,
          name,
          key
        }])
        .select()
        .single();
      
      if (error) {
        console.error(`API Key Service: Error creating API key:`, error);
        throw error;
      }
      
      console.log(`API Key Service: Successfully created API key for ${email}`);
      return data;
    } catch (error) {
      console.error(`API Key Service: Error in createApiKey:`, error);
      throw error;
    }
  },

  /**
   * Get API keys for a user
   * @param {string} email - User email
   * @returns {Promise<Array>} - Array of API key objects
   */
  async getApiKeys(email) {
    // Get user
    const user = await this._getUserByEmail(email);
    
    if (!user) {
      return [];
    }
    
    // Get API keys
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  },

  /**
   * Update an API key
   * @param {string} email - User email
   * @param {string} keyId - API key ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Updated API key object
   */
  async updateApiKey(email, keyId, updates) {
    // Get user
    const user = await this._getUserByEmail(email);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Validate updates
    const validUpdates = {};
    if (updates.name !== undefined) validUpdates.name = updates.name;
    if (updates.is_active !== undefined) validUpdates.is_active = updates.is_active;
    
    // Update API key
    const { data, error } = await supabase
      .from('api_keys')
      .update(validUpdates)
      .eq('id', keyId)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  },

  /**
   * Delete an API key
   * @param {string} email - User email
   * @param {string} keyId - API key ID
   * @returns {Promise<boolean>} - Whether the API key was deleted
   */
  async deleteApiKey(email, keyId) {
    // Get user
    const user = await this._getUserByEmail(email);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Delete API key
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id);
    
    if (error) {
      throw error;
    }
    
    return true;
  },

  /**
   * Validate an API key
   * @param {string} apiKey - API key to validate
   * @returns {Promise<Object|null>} - User object if valid, null otherwise
   */
  async validateApiKey(apiKey) {
    // Get API key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*, user:user_id(*)')
      .eq('key', apiKey)
      .eq('is_active', true)
      .single();
    
    if (keyError || !keyData) {
      return null;
    }
    
    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);
    
    return keyData.user;
  },

  /**
   * Check if a user has an active subscription or is an admin
   * @param {string} email - User email
   * @returns {Promise<boolean>} - Whether the user has access
   */
  async hasAccess(email) {
    // Get user
    const user = await this._getUserByEmail(email);
    
    if (!user) {
      return false;
    }
    
    // Check if user is an admin
    if (user.is_admin) {
      return true;
    }
    
    // Check if user has an active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('email', email)
      .eq('status', 'active')
      .gte('expiration_date', new Date().toISOString())
      .order('expiration_date', { ascending: false })
      .limit(1);
    
    return subscription && subscription.length > 0;
  }
};