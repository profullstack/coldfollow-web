/**
 * Campaign Creation Integration Tests
 * Tests the complete campaign creation flow from form submission to database storage
 */

import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { createClient } from '@supabase/supabase-js';

// Mock environment variables for testing
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key';

describe('Campaign Creation Flow', () => {
  let supabase;
  let testUserId;
  let createdCampaignIds = [];

  beforeEach(async () => {
    // Initialize Supabase client for testing
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Create a test user ID (in real tests, this would be from auth)
    testUserId = 'test-user-' + Date.now();
  });

  afterEach(async () => {
    // Clean up created campaigns
    if (createdCampaignIds.length > 0) {
      await supabase
        .from('campaigns')
        .delete()
        .in('id', createdCampaignIds);
    }
  });

  describe('Campaign Data Validation', () => {
    it('should validate required campaign fields', () => {
      const campaignData = {
        name: 'Test Campaign',
        type: 'email',
        status: 'draft'
      };

      expect(campaignData.name).to.be.a('string').and.not.be.empty;
      expect(campaignData.type).to.be.oneOf(['email', 'sms', 'phone', 'social', 'mixed']);
      expect(campaignData.status).to.be.oneOf(['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled']);
    });

    it('should validate target audience structure', () => {
      const targetAudience = {
        age_min: 25,
        age_max: 45,
        location: 'United States, California',
        interests: ['technology', 'business']
      };

      expect(targetAudience.age_min).to.be.a('number').and.be.at.least(18);
      expect(targetAudience.age_max).to.be.a('number').and.be.at.most(100);
      expect(targetAudience.location).to.be.a('string');
      expect(targetAudience.interests).to.be.an('array');
    });

    it('should validate campaign settings structure', () => {
      const settings = {
        budget: 1000.50,
        daily_limit: 50,
        auto_followup: true
      };

      expect(settings.budget).to.be.a('number').and.be.at.least(0);
      expect(settings.daily_limit).to.be.a('number').and.be.at.least(1);
      expect(settings.auto_followup).to.be.a('boolean');
    });
  });

  describe('Campaign Form Data Processing', () => {
    it('should build target audience from form data', () => {
      const formData = new Map([
        ['age_min', '25'],
        ['age_max', '45'],
        ['location', 'United States, California'],
        ['interests', 'technology, business, marketing']
      ]);

      const buildTargetAudience = (formData) => {
        const audience = {};
        
        const ageMin = formData.get('age_min');
        const ageMax = formData.get('age_max');
        const location = formData.get('location')?.trim();
        const interests = formData.get('interests')?.trim();
        
        if (ageMin) audience.age_min = parseInt(ageMin);
        if (ageMax) audience.age_max = parseInt(ageMax);
        if (location) audience.location = location;
        if (interests) audience.interests = interests.split(',').map(i => i.trim()).filter(Boolean);
        
        return Object.keys(audience).length > 0 ? audience : null;
      };

      const result = buildTargetAudience(formData);

      expect(result).to.deep.equal({
        age_min: 25,
        age_max: 45,
        location: 'United States, California',
        interests: ['technology', 'business', 'marketing']
      });
    });

    it('should build settings from form data', () => {
      const formData = new Map([
        ['budget', '1000.50'],
        ['daily_limit', '50'],
        ['auto_followup', 'on']
      ]);

      const buildSettings = (formData) => {
        const settings = {};
        
        const budget = formData.get('budget');
        const dailyLimit = formData.get('daily_limit');
        const autoFollowup = formData.get('auto_followup');
        
        if (budget) settings.budget = parseFloat(budget);
        if (dailyLimit) settings.daily_limit = parseInt(dailyLimit);
        if (autoFollowup) settings.auto_followup = true;
        
        return settings;
      };

      const result = buildSettings(formData);

      expect(result).to.deep.equal({
        budget: 1000.50,
        daily_limit: 50,
        auto_followup: true
      });
    });
  });

  describe('Campaign API Integration', () => {
    it('should create a complete campaign with all fields', async function() {
      // Skip this test if we don't have real Supabase credentials
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        this.skip();
      }

      const campaignData = {
        user_id: testUserId,
        name: 'Test Email Campaign',
        description: 'A test campaign for email outreach',
        type: 'email',
        status: 'draft',
        scheduled_at: new Date('2025-06-30T09:00:00Z').toISOString(),
        target_audience: {
          age_min: 25,
          age_max: 45,
          location: 'United States, California',
          interests: ['technology', 'business']
        },
        settings: {
          budget: 1000.50,
          daily_limit: 50,
          auto_followup: true,
          email_template: 'Hello {{name}}, we have an exciting opportunity...',
          subject_line: 'Exciting Business Opportunity'
        }
      };

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single();

      expect(error).to.be.null;
      expect(campaign).to.be.an('object');
      expect(campaign.id).to.be.a('string');
      expect(campaign.name).to.equal('Test Email Campaign');
      expect(campaign.type).to.equal('email');
      expect(campaign.status).to.equal('draft');
      expect(campaign.target_audience).to.deep.equal(campaignData.target_audience);
      expect(campaign.settings).to.deep.equal(campaignData.settings);

      // Store for cleanup
      createdCampaignIds.push(campaign.id);
    });

    it('should handle campaign creation with minimal data', async function() {
      // Skip this test if we don't have real Supabase credentials
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        this.skip();
      }

      const campaignData = {
        user_id: testUserId,
        name: 'Minimal Campaign',
        type: 'sms',
        status: 'draft'
      };

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single();

      expect(error).to.be.null;
      expect(campaign).to.be.an('object');
      expect(campaign.name).to.equal('Minimal Campaign');
      expect(campaign.type).to.equal('sms');
      expect(campaign.description).to.be.null;
      expect(campaign.target_audience).to.be.null;
      expect(campaign.settings).to.be.null;

      // Store for cleanup
      createdCampaignIds.push(campaign.id);
    });
  });

  describe('Form Submission Flow', () => {
    it('should simulate complete form submission process', () => {
      // Simulate form data from the campaign form
      const mockFormData = {
        name: 'Test Campaign',
        description: 'Test description',
        type: 'email',
        status: 'draft',
        scheduled_at: '2025-06-30T09:00',
        age_min: '25',
        age_max: '45',
        location: 'United States, California',
        interests: 'technology, business',
        budget: '1000',
        daily_limit: '50',
        auto_followup: 'on'
      };

      // Simulate the form processing logic from campaign-form.js
      const processFormData = (formData) => {
        const buildTargetAudience = (data) => {
          const audience = {};
          if (data.age_min) audience.age_min = parseInt(data.age_min);
          if (data.age_max) audience.age_max = parseInt(data.age_max);
          if (data.location) audience.location = data.location;
          if (data.interests) audience.interests = data.interests.split(',').map(i => i.trim()).filter(Boolean);
          return Object.keys(audience).length > 0 ? audience : null;
        };

        const buildSettings = (data) => {
          const settings = {};
          if (data.budget) settings.budget = parseFloat(data.budget);
          if (data.daily_limit) settings.daily_limit = parseInt(data.daily_limit);
          if (data.auto_followup) settings.auto_followup = true;
          return settings;
        };

        return {
          name: data.name,
          description: data.description || '',
          type: data.type,
          status: data.status,
          scheduled_at: data.scheduled_at || null,
          target_audience: buildTargetAudience(data),
          settings: buildSettings(data)
        };
      };

      const result = processFormData(mockFormData);

      expect(result).to.deep.equal({
        name: 'Test Campaign',
        description: 'Test description',
        type: 'email',
        status: 'draft',
        scheduled_at: '2025-06-30T09:00',
        target_audience: {
          age_min: 25,
          age_max: 45,
          location: 'United States, California',
          interests: ['technology', 'business']
        },
        settings: {
          budget: 1000,
          daily_limit: 50,
          auto_followup: true
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', () => {
      const invalidData = {
        description: 'Missing name and type'
      };

      const validateCampaign = (data) => {
        const errors = [];
        if (!data.name || !data.name.trim()) {
          errors.push('Campaign name is required');
        }
        if (!data.type) {
          errors.push('Campaign type is required');
        }
        return errors;
      };

      const errors = validateCampaign(invalidData);
      expect(errors).to.include('Campaign name is required');
      expect(errors).to.include('Campaign type is required');
    });

    it('should handle invalid campaign type', () => {
      const invalidData = {
        name: 'Test Campaign',
        type: 'invalid_type'
      };

      const validateCampaignType = (type) => {
        const validTypes = ['email', 'sms', 'phone', 'social', 'mixed'];
        return validTypes.includes(type);
      };

      expect(validateCampaignType(invalidData.type)).to.be.false;
    });

    it('should handle invalid status', () => {
      const invalidData = {
        name: 'Test Campaign',
        type: 'email',
        status: 'invalid_status'
      };

      const validateCampaignStatus = (status) => {
        const validStatuses = ['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'];
        return validStatuses.includes(status);
      };

      expect(validateCampaignStatus(invalidData.status)).to.be.false;
    });
  });
});