/**
 * Campaign List Web Component
 * Displays a list of campaigns with filtering and actions
 */

import { BaseComponent } from './base-component.js';

export class CampaignList extends BaseComponent {
  constructor() {
    super();
    this.campaigns = [];
    this.filters = { status: '', type: '' };
    this.onEdit = null;
    this.onDelete = null;
    this.onCreate = null;
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
    // Filter event listeners
    this.addEventListener('change', (event) => {
      if (event.target.matches('#status-filter')) {
        this.filters.status = event.target.value;
        this.renderCampaigns();
      } else if (event.target.matches('#type-filter')) {
        this.filters.type = event.target.value;
        this.renderCampaigns();
      }
    });

    // Action button listeners
    this.addEventListener('click', (event) => {
      if (event.target.matches('.edit-button')) {
        const campaignId = event.target.dataset.campaignId;
        if (this.onEdit) {
          this.onEdit(campaignId);
        }
      } else if (event.target.matches('.delete-button')) {
        const campaignId = event.target.dataset.campaignId;
        if (this.onDelete) {
          this.onDelete(campaignId);
        }
      } else if (event.target.matches('#new-campaign-btn')) {
        // Navigate to campaign creation page using SPA router
        if (window.router && window.router.navigate) {
          window.router.navigate('/campaigns/new');
        } else {
          // Fallback to window.location if router is not available
          window.location.href = '/campaigns/new';
        }
      }
    });
  }

  setCampaigns(campaigns) {
    this.campaigns = campaigns;
    this.renderCampaigns();
  }

  setCallbacks({ onEdit, onDelete, onCreate }) {
    this.onEdit = onEdit;
    this.onDelete = onDelete;
    this.onCreate = onCreate;
  }

  renderCampaigns() {
    const campaignsContainer = this.$('#campaigns-container');
    if (!campaignsContainer) return;

    // Apply filters
    let filteredCampaigns = this.campaigns;
    
    if (this.filters.status) {
      filteredCampaigns = filteredCampaigns.filter(campaign => 
        campaign.status === this.filters.status
      );
    }
    
    if (this.filters.type) {
      filteredCampaigns = filteredCampaigns.filter(campaign => 
        campaign.type === this.filters.type
      );
    }

    if (filteredCampaigns.length === 0) {
      campaignsContainer.innerHTML = `
        <div class="empty-state">
          <p>No campaigns found. Create your first campaign to get started!</p>
        </div>
      `;
      return;
    }

    const campaignsHtml = filteredCampaigns.map(campaign => 
      this.renderCampaignCard(campaign)
    ).join('');

    campaignsContainer.innerHTML = campaignsHtml;
  }

  renderCampaignCard(campaign) {
    const createdDate = new Date(campaign.created_at).toLocaleDateString();
    const scheduledDate = campaign.scheduled_at 
      ? new Date(campaign.scheduled_at).toLocaleDateString()
      : 'Not scheduled';

    return `
      <div class="campaign-card">
        <div class="campaign-header">
          <h3 class="campaign-title">${this.escapeHtml(campaign.name)}</h3>
          <div class="campaign-actions">
            <button class="action-button edit-button" data-campaign-id="${campaign.id}">
              Edit
            </button>
            <button class="action-button delete-button" data-campaign-id="${campaign.id}">
              Delete
            </button>
          </div>
        </div>
        
        <div class="campaign-meta">
          <span class="campaign-status status-${campaign.status}">${campaign.status}</span>
          <span class="campaign-type">${campaign.type}</span>
        </div>
        
        ${campaign.description ? `
          <div class="campaign-description">
            ${this.escapeHtml(campaign.description)}
          </div>
        ` : ''}
        
        <div class="campaign-dates">
          Created: ${createdDate} | Scheduled: ${scheduledDate}
        </div>
      </div>
    `;
  }

  getStyles() {
    return `
      :host {
        display: block;
        width: 100%;
      }

      .campaigns-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .campaigns-actions {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .filter-group {
        display: flex;
        gap: 10px;
      }

      .primary-button {
        padding: 10px 20px;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }

      .primary-button:hover {
        background-color: var(--primary-dark);
      }

      select {
        padding: 8px 12px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background-color: var(--input-background-color);
        color: var(--text-color);
      }

      .campaign-card {
        background: var(--background-color-alt);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 15px;
        transition: box-shadow 0.2s ease;
      }

      .campaign-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .campaign-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
      }

      .campaign-title {
        font-size: 18px;
        font-weight: bold;
        margin: 0;
        color: var(--text-color);
      }

      .campaign-actions {
        display: flex;
        gap: 8px;
      }

      .campaign-meta {
        display: flex;
        gap: 15px;
        margin-bottom: 10px;
        font-size: 14px;
        color: var(--text-color-secondary);
      }

      .campaign-status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
      }

      .status-draft { background: #f0f0f0; color: #666; }
      .status-scheduled { background: #fff3cd; color: #856404; }
      .status-running { background: #d4edda; color: #155724; }
      .status-paused { background: #f8d7da; color: #721c24; }
      .status-completed { background: #d1ecf1; color: #0c5460; }
      .status-cancelled { background: #f5c6cb; color: #721c24; }

      .campaign-type {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        background: var(--primary-color);
        color: white;
      }

      .campaign-description {
        color: var(--text-color-secondary);
        margin-bottom: 10px;
      }

      .campaign-dates {
        font-size: 12px;
        color: var(--text-color-secondary);
      }

      .action-button {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
      }

      .edit-button {
        background-color: #007bff;
        color: white;
      }

      .edit-button:hover {
        background-color: #0056b3;
      }

      .delete-button {
        background-color: #dc3545;
        color: white;
      }

      .delete-button:hover {
        background-color: #c82333;
      }

      .loading-state, .empty-state, .error-state {
        text-align: center;
        padding: 40px;
        color: var(--text-color-secondary);
      }

      .error-state {
        color: #dc3545;
      }
    `;
  }

  getTemplate() {
    const isLoading = this.hasAttribute('loading');
    const error = this.getAttribute('error');

    return `
      <div class="campaigns-header">
        <div class="campaigns-actions">
          <button id="new-campaign-btn" class="primary-button">New Campaign</button>
          <div class="filter-group">
            <select id="status-filter">
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="running">Running</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select id="type-filter">
              <option value="">All Types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="phone">Phone</option>
              <option value="social">Social</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>
      </div>

      <div id="campaigns-container">
        ${isLoading ? `
          <div class="loading-state">
            <p>Loading campaigns...</p>
          </div>
        ` : error ? `
          <div class="error-state">
            <p>${this.escapeHtml(error)}</p>
          </div>
        ` : `
          <div class="empty-state">
            <p>No campaigns found. Create your first campaign to get started!</p>
          </div>
        `}
      </div>
    `;
  }
}

// Register the custom element
customElements.define('campaign-list', CampaignList);