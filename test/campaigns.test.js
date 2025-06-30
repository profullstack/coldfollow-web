/**
 * Campaign Management Tests
 * Tests for the campaign CRUD functionality
 */

import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';

// Mock campaign data for testing
const mockCampaign = {
  name: 'Test Campaign',
  description: 'A test campaign for unit testing',
  type: 'email',
  status: 'draft',
  target_audience: { age_range: '25-45', location: 'US' },
  settings: { send_time: '09:00', frequency: 'daily' }
};

const mockCampaignUpdate = {
  name: 'Updated Test Campaign',
  description: 'An updated test campaign',
  type: 'sms',
  status: 'scheduled',
  scheduled_at: '2025-07-01T09:00:00Z'
};

describe('Campaign Management', () => {
  let campaignManager;
  let mockFetch;
  let originalFetch;

  beforeEach(() => {
    // Mock fetch for testing
    originalFetch = global.fetch;
    mockFetch = (url, options) => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ campaigns: [], campaign: mockCampaign })
      });
    };
    global.fetch = mockFetch;

    // Mock DOM elements
    global.document = {
      getElementById: (id) => ({
        value: '',
        addEventListener: () => {},
        style: {},
        innerHTML: '',
        textContent: ''
      }),
      querySelector: () => ({
        click: () => {},
        classList: { add: () => {}, remove: () => {} }
      }),
      querySelectorAll: () => [],
      addEventListener: () => {},
      createElement: () => ({ textContent: '', innerHTML: '' })
    };

    global.localStorage = {
      getItem: () => 'mock-token',
      setItem: () => {},
      removeItem: () => {}
    };

    global.sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    };

    global.alert = () => {};
    global.confirm = () => true;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Campaign Data Validation', () => {
    it('should validate required fields', () => {
      const isValid = validateCampaignData({});
      expect(isValid.valid).to.be.false;
      expect(isValid.errors).to.include('Name is required');
      expect(isValid.errors).to.include('Type is required');
    });

    it('should validate campaign type', () => {
      const isValid = validateCampaignData({
        name: 'Test',
        type: 'invalid-type'
      });
      expect(isValid.valid).to.be.false;
      expect(isValid.errors).to.include('Invalid campaign type');
    });

    it('should validate campaign status', () => {
      const isValid = validateCampaignData({
        name: 'Test',
        type: 'email',
        status: 'invalid-status'
      });
      expect(isValid.valid).to.be.false;
      expect(isValid.errors).to.include('Invalid campaign status');
    });

    it('should validate JSON fields', () => {
      const isValid = validateCampaignData({
        name: 'Test',
        type: 'email',
        target_audience: 'invalid-json'
      });
      expect(isValid.valid).to.be.false;
      expect(isValid.errors).to.include('Invalid JSON in target_audience');
    });

    it('should pass validation with valid data', () => {
      const isValid = validateCampaignData(mockCampaign);
      expect(isValid.valid).to.be.true;
      expect(isValid.errors).to.be.empty;
    });
  });

  describe('Campaign CRUD Operations', () => {
    it('should format campaign data correctly for API', () => {
      const formatted = formatCampaignForApi(mockCampaign);
      
      expect(formatted.name).to.equal(mockCampaign.name);
      expect(formatted.type).to.equal(mockCampaign.type);
      expect(formatted.status).to.equal(mockCampaign.status);
      expect(typeof formatted.target_audience).to.equal('object');
      expect(typeof formatted.settings).to.equal('object');
    });

    it('should handle JSON string conversion', () => {
      const campaignWithStringJson = {
        ...mockCampaign,
        target_audience: '{"age": "25-45"}',
        settings: '{"frequency": "daily"}'
      };
      
      const formatted = formatCampaignForApi(campaignWithStringJson);
      expect(typeof formatted.target_audience).to.equal('object');
      expect(typeof formatted.settings).to.equal('object');
    });

    it('should escape HTML content properly', () => {
      const maliciousContent = '<script>alert("xss")</script>';
      const escaped = escapeHtml(maliciousContent);
      
      expect(escaped).to.not.include('<script>');
      expect(escaped).to.include('&lt;script&gt;');
    });
  });

  describe('Campaign Status Management', () => {
    it('should handle status transitions correctly', () => {
      const transitions = getValidStatusTransitions('draft');
      expect(transitions).to.include('scheduled');
      expect(transitions).to.include('running');
      expect(transitions).to.not.include('completed');
    });

    it('should set appropriate timestamps for status changes', () => {
      const statusUpdate = prepareStatusUpdate('running');
      expect(statusUpdate.status).to.equal('running');
      expect(statusUpdate.started_at).to.be.a('string');
    });

    it('should handle completion status', () => {
      const statusUpdate = prepareStatusUpdate('completed');
      expect(statusUpdate.status).to.equal('completed');
      expect(statusUpdate.completed_at).to.be.a('string');
    });
  });

  describe('Campaign Filtering', () => {
    const campaigns = [
      { ...mockCampaign, status: 'draft', type: 'email' },
      { ...mockCampaign, status: 'running', type: 'sms' },
      { ...mockCampaign, status: 'completed', type: 'email' }
    ];

    it('should filter by status', () => {
      const filtered = filterCampaigns(campaigns, { status: 'draft' });
      expect(filtered).to.have.length(1);
      expect(filtered[0].status).to.equal('draft');
    });

    it('should filter by type', () => {
      const filtered = filterCampaigns(campaigns, { type: 'email' });
      expect(filtered).to.have.length(2);
      filtered.forEach(campaign => {
        expect(campaign.type).to.equal('email');
      });
    });

    it('should filter by both status and type', () => {
      const filtered = filterCampaigns(campaigns, { status: 'completed', type: 'email' });
      expect(filtered).to.have.length(1);
      expect(filtered[0].status).to.equal('completed');
      expect(filtered[0].type).to.equal('email');
    });

    it('should return all campaigns when no filters applied', () => {
      const filtered = filterCampaigns(campaigns, {});
      expect(filtered).to.have.length(3);
    });
  });
});

// Helper functions for testing
function validateCampaignData(data) {
  const errors = [];
  
  if (!data.name || !data.name.trim()) {
    errors.push('Name is required');
  }
  
  if (!data.type) {
    errors.push('Type is required');
  } else {
    const validTypes = ['email', 'sms', 'phone', 'social', 'mixed'];
    if (!validTypes.includes(data.type)) {
      errors.push('Invalid campaign type');
    }
  }
  
  if (data.status) {
    const validStatuses = ['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'];
    if (!validStatuses.includes(data.status)) {
      errors.push('Invalid campaign status');
    }
  }
  
  if (data.target_audience && typeof data.target_audience === 'string') {
    try {
      JSON.parse(data.target_audience);
    } catch (error) {
      errors.push('Invalid JSON in target_audience');
    }
  }
  
  if (data.settings && typeof data.settings === 'string') {
    try {
      JSON.parse(data.settings);
    } catch (error) {
      errors.push('Invalid JSON in settings');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function formatCampaignForApi(campaign) {
  const formatted = { ...campaign };
  
  if (typeof formatted.target_audience === 'string') {
    formatted.target_audience = JSON.parse(formatted.target_audience);
  }
  
  if (typeof formatted.settings === 'string') {
    formatted.settings = JSON.parse(formatted.settings);
  }
  
  return formatted;
}

function escapeHtml(text) {
  const div = { textContent: text, innerHTML: '' };
  div.innerHTML = div.textContent;
  return div.innerHTML;
}

function getValidStatusTransitions(currentStatus) {
  const transitions = {
    draft: ['scheduled', 'running'],
    scheduled: ['running', 'cancelled'],
    running: ['paused', 'completed', 'cancelled'],
    paused: ['running', 'cancelled'],
    completed: [],
    cancelled: []
  };
  
  return transitions[currentStatus] || [];
}

function prepareStatusUpdate(status) {
  const update = { status };
  
  if (status === 'running') {
    update.started_at = new Date().toISOString();
  } else if (status === 'completed') {
    update.completed_at = new Date().toISOString();
  }
  
  return update;
}

function filterCampaigns(campaigns, filters) {
  return campaigns.filter(campaign => {
    if (filters.status && campaign.status !== filters.status) {
      return false;
    }
    if (filters.type && campaign.type !== filters.type) {
      return false;
    }
    return true;
  });
}