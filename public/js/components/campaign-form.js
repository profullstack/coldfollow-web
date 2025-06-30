/**
 * Campaign Form Web Component
 * Handles creation and editing of campaigns
 */

import { BaseComponent } from './base-component.js';

export class CampaignForm extends BaseComponent {
  constructor() {
    super();
    this.campaign = null;
    this.isEditing = false;
    this.onSave = null;
    this.onCancel = null;
  }

  static get observedAttributes() {
    return ['loading', 'error'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  initEventListeners() {
    console.log('CampaignForm: Setting up event listeners');
    
    // Form submission - use event delegation from the shadow root
    this.addEventListener('submit', (event) => {
      console.log('CampaignForm: Submit event captured', event.target);
      if (event.target.matches('#campaign-form')) {
        console.log('CampaignForm: Preventing default form submission');
        event.preventDefault();
        event.stopPropagation();
        this.handleSubmit();
      }
    });

    // Cancel button
    this.addEventListener('click', (event) => {
      if (event.target.matches('#cancel-btn')) {
        event.preventDefault();
        if (this.onCancel) {
          this.onCancel();
        }
      }
    });

    // Dynamic target audience fields
    this.addEventListener('change', (event) => {
      if (event.target.matches('#type')) {
        this.updateFormFields();
      }
    });
  }

  setCampaign(campaign) {
    this.campaign = campaign;
    this.isEditing = !!campaign;
    this.render();
    this.populateForm();
  }

  setCallbacks({ onSave, onCancel }) {
    this.onSave = onSave;
    this.onCancel = onCancel;
  }

  populateForm() {
    if (!this.campaign) return;

    const form = this.$('#campaign-form');
    if (!form) return;

    // Populate basic fields
    form.querySelector('#name').value = this.campaign.name || '';
    form.querySelector('#description').value = this.campaign.description || '';
    form.querySelector('#type').value = this.campaign.type || 'email';
    form.querySelector('#status').value = this.campaign.status || 'draft';
    
    // Handle scheduled date
    if (this.campaign.scheduled_at) {
      const date = new Date(this.campaign.scheduled_at);
      form.querySelector('#scheduled_at').value = date.toISOString().slice(0, 16);
    }

    // Populate target audience
    if (this.campaign.target_audience) {
      const audience = typeof this.campaign.target_audience === 'string' 
        ? JSON.parse(this.campaign.target_audience)
        : this.campaign.target_audience;
      
      form.querySelector('#age_min').value = audience.age_min || '';
      form.querySelector('#age_max').value = audience.age_max || '';
      form.querySelector('#location').value = audience.location || '';
      form.querySelector('#interests').value = audience.interests?.join(', ') || '';
    }

    // Populate settings
    if (this.campaign.settings) {
      const settings = typeof this.campaign.settings === 'string'
        ? JSON.parse(this.campaign.settings)
        : this.campaign.settings;
      
      form.querySelector('#budget').value = settings.budget || '';
      form.querySelector('#daily_limit').value = settings.daily_limit || '';
      form.querySelector('#auto_followup').checked = settings.auto_followup || false;
    }

    this.updateFormFields();
  }

  updateFormFields() {
    const type = this.$('#type')?.value;
    const typeSpecificFields = this.$('#type-specific-fields');
    
    if (!typeSpecificFields) return;

    let additionalFields = '';
    
    switch (type) {
      case 'email':
        additionalFields = `
          <div class="form-group">
            <label for="email_template">Email Template:</label>
            <textarea id="email_template" rows="4" placeholder="Enter email template..."></textarea>
          </div>
          <div class="form-group">
            <label for="subject_line">Subject Line:</label>
            <input type="text" id="subject_line" placeholder="Enter subject line...">
          </div>
        `;
        break;
      case 'sms':
        additionalFields = `
          <div class="form-group">
            <label for="sms_message">SMS Message:</label>
            <textarea id="sms_message" rows="3" maxlength="160" placeholder="Enter SMS message (max 160 characters)..."></textarea>
          </div>
        `;
        break;
      case 'phone':
        additionalFields = `
          <div class="form-group">
            <label for="call_script">Call Script:</label>
            <textarea id="call_script" rows="6" placeholder="Enter call script..."></textarea>
          </div>
          <div class="form-group">
            <label for="call_duration">Expected Duration (minutes):</label>
            <input type="number" id="call_duration" min="1" max="60" placeholder="5">
          </div>
        `;
        break;
      case 'social':
        additionalFields = `
          <div class="form-group">
            <label for="social_platform">Platform:</label>
            <select id="social_platform">
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
          <div class="form-group">
            <label for="social_message">Message:</label>
            <textarea id="social_message" rows="4" placeholder="Enter social media message..."></textarea>
          </div>
        `;
        break;
    }
    
    typeSpecificFields.innerHTML = additionalFields;
  }

  async handleSubmit() {
    console.log('CampaignForm: handleSubmit called');
    
    const form = this.$('#campaign-form');
    if (!form) {
      console.error('CampaignForm: Form element not found');
      return;
    }
    
    console.log('CampaignForm: Form found, creating FormData');
    const formData = new FormData(form);
    
    // Log form data for debugging
    console.log('CampaignForm: Form data entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    // Validate required fields
    const name = formData.get('name')?.trim();
    if (!name) {
      console.log('CampaignForm: Validation failed - name is required');
      this.showError('Campaign name is required');
      return;
    }

    console.log('CampaignForm: Building campaign data');
    
    // Build campaign data
    const campaignData = {
      name,
      description: formData.get('description')?.trim() || '',
      type: formData.get('type'),
      status: formData.get('status'),
      scheduled_at: formData.get('scheduled_at') || null,
      target_audience: this.buildTargetAudience(formData),
      settings: this.buildSettings(formData)
    };

    // Add type-specific data
    const typeSpecificData = this.getTypeSpecificData(formData);
    if (typeSpecificData) {
      campaignData.settings = { ...campaignData.settings, ...typeSpecificData };
    }

    console.log('CampaignForm: Campaign data built:', campaignData);
    console.log('CampaignForm: onSave callback available:', !!this.onSave);

    if (this.onSave) {
      console.log('CampaignForm: Calling onSave callback');
      this.onSave(campaignData, this.isEditing ? this.campaign.id : null);
    } else {
      console.error('CampaignForm: No onSave callback available');
    }
  }

  buildTargetAudience(formData) {
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
  }

  buildSettings(formData) {
    const settings = {};
    
    const budget = formData.get('budget');
    const dailyLimit = formData.get('daily_limit');
    const autoFollowup = formData.get('auto_followup');
    
    if (budget) settings.budget = parseFloat(budget);
    if (dailyLimit) settings.daily_limit = parseInt(dailyLimit);
    if (autoFollowup) settings.auto_followup = true;
    
    return settings;
  }

  getTypeSpecificData(formData) {
    const type = formData.get('type');
    const data = {};
    
    switch (type) {
      case 'email':
        const emailTemplate = this.$('#email_template')?.value?.trim();
        const subjectLine = this.$('#subject_line')?.value?.trim();
        if (emailTemplate) data.email_template = emailTemplate;
        if (subjectLine) data.subject_line = subjectLine;
        break;
      case 'sms':
        const smsMessage = this.$('#sms_message')?.value?.trim();
        if (smsMessage) data.sms_message = smsMessage;
        break;
      case 'phone':
        const callScript = this.$('#call_script')?.value?.trim();
        const callDuration = this.$('#call_duration')?.value;
        if (callScript) data.call_script = callScript;
        if (callDuration) data.call_duration = parseInt(callDuration);
        break;
      case 'social':
        const socialPlatform = this.$('#social_platform')?.value;
        const socialMessage = this.$('#social_message')?.value?.trim();
        if (socialPlatform) data.social_platform = socialPlatform;
        if (socialMessage) data.social_message = socialMessage;
        break;
    }
    
    return Object.keys(data).length > 0 ? data : null;
  }

  showError(message) {
    const errorDiv = this.$('#form-error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  clearError() {
    const errorDiv = this.$('#form-error');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  getStyles() {
    return `
      :host {
        display: block;
        width: 100%;
      }

      .form-container {
        max-width: 800px;
        margin: 0 auto;
        background: var(--background-color-alt);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 30px;
      }

      .form-header {
        margin-bottom: 30px;
      }

      .form-title {
        font-size: 24px;
        font-weight: bold;
        margin: 0 0 10px 0;
        color: var(--text-color);
      }

      .form-subtitle {
        color: var(--text-color-secondary);
        margin: 0;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: var(--text-color);
      }

      input, select, textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background-color: var(--input-background-color);
        color: var(--text-color);
        font-size: 14px;
        box-sizing: border-box;
      }

      input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
      }

      textarea {
        resize: vertical;
        min-height: 80px;
      }

      .checkbox-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .checkbox-group input[type="checkbox"] {
        width: auto;
      }

      .form-section {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--border-color);
      }

      .form-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      .section-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 15px;
        color: var(--text-color);
      }

      .form-actions {
        display: flex;
        gap: 15px;
        justify-content: flex-end;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
      }

      .primary-button {
        padding: 12px 24px;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
      }

      .primary-button:hover {
        background-color: var(--primary-dark);
      }

      .primary-button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }

      .secondary-button {
        padding: 12px 24px;
        background-color: transparent;
        color: var(--text-color);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }

      .secondary-button:hover {
        background-color: var(--background-color-alt);
      }

      .error-message {
        background-color: #f8d7da;
        color: #721c24;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 20px;
        display: none;
      }

      @media (max-width: 768px) {
        .form-container {
          padding: 20px;
        }

        .form-row {
          grid-template-columns: 1fr;
        }

        .form-actions {
          flex-direction: column;
        }
      }
    `;
  }

  getTemplate() {
    const isLoading = this.hasAttribute('loading');

    return `
      <div class="form-container">
        <div class="form-header">
          <h2 class="form-title">
            ${this.isEditing ? 'Edit Campaign' : 'Create New Campaign'}
          </h2>
          <p class="form-subtitle">
            ${this.isEditing ? 'Update your campaign details below.' : 'Fill in the details to create a new marketing campaign.'}
          </p>
        </div>

        <div id="form-error" class="error-message"></div>

        <form id="campaign-form" action="javascript:void(0);" method="post">
          <div class="form-section">
            <h3 class="section-title">Basic Information</h3>
            
            <div class="form-group">
              <label for="name">Campaign Name *</label>
              <input type="text" id="name" name="name" required placeholder="Enter campaign name">
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" name="description" rows="3" placeholder="Describe your campaign..."></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="type">Campaign Type *</label>
                <select id="type" name="type" required>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="phone">Phone</option>
                  <option value="social">Social Media</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div class="form-group">
                <label for="status">Status</label>
                <select id="status" name="status">
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="running">Running</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="scheduled_at">Scheduled Date & Time</label>
              <input type="datetime-local" id="scheduled_at" name="scheduled_at">
            </div>
          </div>

          <div id="type-specific-fields"></div>

          <div class="form-section">
            <h3 class="section-title">Target Audience</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="age_min">Minimum Age</label>
                <input type="number" id="age_min" name="age_min" min="18" max="100" placeholder="18">
              </div>

              <div class="form-group">
                <label for="age_max">Maximum Age</label>
                <input type="number" id="age_max" name="age_max" min="18" max="100" placeholder="65">
              </div>
            </div>

            <div class="form-group">
              <label for="location">Location</label>
              <input type="text" id="location" name="location" placeholder="e.g., United States, California">
            </div>

            <div class="form-group">
              <label for="interests">Interests (comma-separated)</label>
              <input type="text" id="interests" name="interests" placeholder="e.g., technology, business, marketing">
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-title">Campaign Settings</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="budget">Budget ($)</label>
                <input type="number" id="budget" name="budget" min="0" step="0.01" placeholder="1000.00">
              </div>

              <div class="form-group">
                <label for="daily_limit">Daily Contact Limit</label>
                <input type="number" id="daily_limit" name="daily_limit" min="1" placeholder="50">
              </div>
            </div>

            <div class="form-group">
              <div class="checkbox-group">
                <input type="checkbox" id="auto_followup" name="auto_followup">
                <label for="auto_followup">Enable automatic follow-up</label>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" id="cancel-btn" class="secondary-button">Cancel</button>
            <button type="submit" class="primary-button" ${isLoading ? 'disabled' : ''}>
              ${isLoading ? 'Saving...' : (this.isEditing ? 'Update Campaign' : 'Create Campaign')}
            </button>
          </div>
        </form>
      </div>
    `;
  }

  render() {
    super.render();
    // Update form fields after render and set up form-specific event listeners
    setTimeout(() => {
      this.updateFormFields();
      this.setupFormEventListeners();
    }, 0);
  }

  setupFormEventListeners() {
    const form = this.$('#campaign-form');
    if (form) {
      console.log('CampaignForm: Setting up direct form event listener');
      
      // Remove any existing event listeners to avoid duplicates
      form.removeEventListener('submit', this.handleFormSubmit);
      
      // Bind the handler to maintain 'this' context
      this.handleFormSubmit = this.handleFormSubmit.bind(this);
      
      // Add the event listener directly to the form
      form.addEventListener('submit', this.handleFormSubmit);
      
      console.log('CampaignForm: Form event listener attached successfully');
    } else {
      console.error('CampaignForm: Could not find form element to attach listener');
    }
  }

  handleFormSubmit(event) {
    console.log('CampaignForm: Form submit handler called');
    event.preventDefault();
    event.stopPropagation();
    this.handleSubmit();
  }
}

// Register the custom element
customElements.define('campaign-form', CampaignForm);