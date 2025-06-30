/**
 * Campaign Management API Routes
 * Provides CRUD operations for marketing campaigns
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get all campaigns for the authenticated user
 */
export const getCampaignsRoute = {
  method: 'GET',
  path: '/api/campaigns',
  handler: async (c) => {
    try {
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        return c.json({ error: 'Failed to fetch campaigns' }, 500);
      }

      return c.json({ campaigns: campaigns || [] });
    } catch (error) {
      console.error('Error in getCampaigns:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
};

/**
 * Get a specific campaign by ID
 */
export const getCampaignRoute = {
  method: 'GET',
  path: '/api/campaigns/:id',
  handler: async (c) => {
    try {
      const userId = c.get('userId');
      const campaignId = c.req.param('id');

      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return c.json({ error: 'Campaign not found' }, 404);
        }
        console.error('Error fetching campaign:', error);
        return c.json({ error: 'Failed to fetch campaign' }, 500);
      }

      return c.json({ campaign });
    } catch (error) {
      console.error('Error in getCampaign:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
};

/**
 * Create a new campaign
 */
export const createCampaignRoute = {
  method: 'POST',
  path: '/api/campaigns',
  handler: async (c) => {
    try {
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const body = await c.req.json();
      const {
        name,
        description,
        type,
        status = 'draft',
        scheduled_at,
        target_audience = '{}',
        settings = '{}'
      } = body;

      // Validate required fields
      if (!name || !type) {
        return c.json({ error: 'Name and type are required' }, 400);
      }

      // Validate type
      const validTypes = ['email', 'sms', 'phone', 'social', 'mixed'];
      if (!validTypes.includes(type)) {
        return c.json({ error: 'Invalid campaign type' }, 400);
      }

      // Validate status
      const validStatuses = ['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return c.json({ error: 'Invalid campaign status' }, 400);
      }

      // Parse and validate JSON fields
      let parsedTargetAudience, parsedSettings;
      try {
        parsedTargetAudience = typeof target_audience === 'string' 
          ? JSON.parse(target_audience) 
          : target_audience;
        parsedSettings = typeof settings === 'string' 
          ? JSON.parse(settings) 
          : settings;
      } catch (error) {
        return c.json({ error: 'Invalid JSON format in target_audience or settings' }, 400);
      }

      // Prepare campaign data
      const campaignData = {
        user_id: userId,
        name: name.trim(),
        description: description?.trim() || null,
        type,
        status,
        scheduled_at: scheduled_at || null,
        target_audience: parsedTargetAudience,
        settings: parsedSettings
      };

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) {
        console.error('Error creating campaign:', error);
        return c.json({ error: 'Failed to create campaign' }, 500);
      }

      return c.json({ campaign }, 201);
    } catch (error) {
      console.error('Error in createCampaign:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
};

/**
 * Update an existing campaign
 */
export const updateCampaignRoute = {
  method: 'PUT',
  path: '/api/campaigns/:id',
  handler: async (c) => {
    try {
      const userId = c.get('userId');
      const campaignId = c.req.param('id');

      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const body = await c.req.json();
      const {
        name,
        description,
        type,
        status,
        scheduled_at,
        target_audience,
        settings
      } = body;

      // Validate required fields
      if (!name || !type) {
        return c.json({ error: 'Name and type are required' }, 400);
      }

      // Validate type
      const validTypes = ['email', 'sms', 'phone', 'social', 'mixed'];
      if (!validTypes.includes(type)) {
        return c.json({ error: 'Invalid campaign type' }, 400);
      }

      // Validate status
      const validStatuses = ['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'];
      if (status && !validStatuses.includes(status)) {
        return c.json({ error: 'Invalid campaign status' }, 400);
      }

      // Parse and validate JSON fields
      let parsedTargetAudience, parsedSettings;
      try {
        if (target_audience) {
          parsedTargetAudience = typeof target_audience === 'string' 
            ? JSON.parse(target_audience) 
            : target_audience;
        }
        if (settings) {
          parsedSettings = typeof settings === 'string' 
            ? JSON.parse(settings) 
            : settings;
        }
      } catch (error) {
        return c.json({ error: 'Invalid JSON format in target_audience or settings' }, 400);
      }

      // Prepare update data
      const updateData = {
        name: name.trim(),
        description: description?.trim() || null,
        type,
        status: status || 'draft',
        scheduled_at: scheduled_at || null
      };

      if (parsedTargetAudience !== undefined) {
        updateData.target_audience = parsedTargetAudience;
      }
      if (parsedSettings !== undefined) {
        updateData.settings = parsedSettings;
      }

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', campaignId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return c.json({ error: 'Campaign not found' }, 404);
        }
        console.error('Error updating campaign:', error);
        return c.json({ error: 'Failed to update campaign' }, 500);
      }

      return c.json({ campaign });
    } catch (error) {
      console.error('Error in updateCampaign:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
};

/**
 * Delete a campaign
 */
export const deleteCampaignRoute = {
  method: 'DELETE',
  path: '/api/campaigns/:id',
  handler: async (c) => {
    try {
      const userId = c.get('userId');
      const campaignId = c.req.param('id');

      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting campaign:', error);
        return c.json({ error: 'Failed to delete campaign' }, 500);
      }

      return c.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
      console.error('Error in deleteCampaign:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
};

/**
 * Update campaign status (for quick status changes)
 */
export const updateCampaignStatusRoute = {
  method: 'PATCH',
  path: '/api/campaigns/:id/status',
  handler: async (c) => {
    try {
      const userId = c.get('userId');
      const campaignId = c.req.param('id');

      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const body = await c.req.json();
      const { status } = body;

      // Validate status
      const validStatuses = ['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'];
      if (!status || !validStatuses.includes(status)) {
        return c.json({ error: 'Invalid campaign status' }, 400);
      }

      // Prepare update data with timestamps
      const updateData = { status };
      
      // Set appropriate timestamps based on status
      if (status === 'running' && !updateData.started_at) {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed' && !updateData.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', campaignId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return c.json({ error: 'Campaign not found' }, 404);
        }
        console.error('Error updating campaign status:', error);
        return c.json({ error: 'Failed to update campaign status' }, 500);
      }

      return c.json({ campaign });
    } catch (error) {
      console.error('Error in updateCampaignStatus:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
};

/**
 * Export all campaign routes
 */
export const campaignRoutes = [
  getCampaignsRoute,
  getCampaignRoute,
  createCampaignRoute,
  updateCampaignRoute,
  deleteCampaignRoute,
  updateCampaignStatusRoute
];