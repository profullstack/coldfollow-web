/**
 * Dashboard View Controller
 * Manages the campaign management interface using web components
 */

import '../components/campaign-list.js';
import '../components/campaign-form.js';

class DashboardManager {
  constructor() {
    this.campaignList = null;
    this.campaignForm = null;
    this.currentView = 'campaigns';
    this.editingCampaign = null;
    this.init();
  }

  async init() {
    this.setupTabNavigation();
    await this.waitForComponents();
    this.setupComponents();
    await this.loadCampaigns();
  }

  async waitForComponents() {
    // Wait for web components to be defined
    await Promise.all([
      customElements.whenDefined('campaign-list'),
      customElements.whenDefined('campaign-form')
    ]);
    
    // Wait a bit more for components to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Additional wait for Shadow DOM to be fully rendered
    let retries = 0;
    const maxRetries = 10;
    
    while (retries < maxRetries) {
      const campaignList = document.getElementById('campaign-list');
      const campaignForm = document.getElementById('campaign-form');
      
      if (campaignList && campaignForm) {
        // Wait a bit more for Shadow DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 50));
        break;
      }
      
      retries++;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('Components ready after', retries, 'retries');
  }

  setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show/hide tab content
        tabContents.forEach(content => {
          if (content.id === `${targetTab}-tab`) {
            content.style.display = 'block';
            this.currentView = targetTab;
          } else {
            content.style.display = 'none';
          }
        });

        // Reset form when switching to create tab
        if (targetTab === 'create') {
          this.resetForm();
        }
      });
    });
  }

  setupComponents() {
    // Get component references
    this.campaignList = document.getElementById('campaign-list');
    this.campaignForm = document.getElementById('campaign-form');

    console.log('Setting up components:', {
      campaignList: this.campaignList,
      campaignForm: this.campaignForm
    });

    // Set up campaign list callbacks
    if (this.campaignList) {
      console.log('Setting up campaign list callbacks');
      this.campaignList.setCallbacks({
        onEdit: (campaignId) => this.editCampaign(campaignId),
        onDelete: (campaignId) => this.deleteCampaign(campaignId),
        onCreate: () => this.showCreateForm()
      });
    } else {
      console.error('Campaign list component not found');
    }

    // Set up campaign form callbacks
    if (this.campaignForm) {
      console.log('Setting up campaign form callbacks');
      this.campaignForm.setCallbacks({
        onSave: (campaignData, campaignId) => this.saveCampaign(campaignData, campaignId),
        onCancel: () => this.cancelForm()
      });
    } else {
      console.error('Campaign form component not found');
    }
  }

  async loadCampaigns() {
    if (!this.campaignList) return;

    try {
      this.campaignList.setAttribute('loading', '');
      
      const response = await fetch('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load campaigns: ${response.statusText}`);
      }

      const campaigns = await response.json();
      this.campaignList.removeAttribute('loading');
      this.campaignList.setCampaigns(campaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      this.campaignList.removeAttribute('loading');
      this.campaignList.setAttribute('error', error.message);
    }
  }

  async editCampaign(campaignId) {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load campaign: ${response.statusText}`);
      }

      const campaign = await response.json();
      this.editingCampaign = campaign;
      
      // Switch to create tab and populate form
      this.switchToTab('create');
      this.campaignForm.setCampaign(campaign);
    } catch (error) {
      console.error('Error loading campaign for edit:', error);
      this.showError('Failed to load campaign for editing');
    }
  }

  async deleteCampaign(campaignId) {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete campaign: ${response.statusText}`);
      }

      // Reload campaigns list
      await this.loadCampaigns();
      this.showSuccess('Campaign deleted successfully');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      this.showError('Failed to delete campaign');
    }
  }

  showCreateForm() {
    this.switchToTab('create');
    this.resetForm();
  }

  async saveCampaign(campaignData, campaignId) {
    try {
      this.campaignForm.setAttribute('loading', '');
      
      const url = campaignId ? `/api/campaigns/${campaignId}` : '/api/campaigns';
      const method = campaignId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save campaign: ${response.statusText}`);
      }

      const savedCampaign = await response.json();
      this.campaignForm.removeAttribute('loading');
      
      // Switch back to campaigns tab and reload list
      this.switchToTab('campaigns');
      await this.loadCampaigns();
      
      const action = campaignId ? 'updated' : 'created';
      this.showSuccess(`Campaign ${action} successfully`);
      this.resetForm();
    } catch (error) {
      console.error('Error saving campaign:', error);
      this.campaignForm.removeAttribute('loading');
      this.campaignForm.showError(error.message);
    }
  }

  cancelForm() {
    this.switchToTab('campaigns');
    this.resetForm();
  }

  resetForm() {
    this.editingCampaign = null;
    if (this.campaignForm) {
      this.campaignForm.setCampaign(null);
      this.campaignForm.clearError();
    }
  }

  switchToTab(tabName) {
    const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (tabButton) {
      tabButton.click();
    }
  }

  getAuthToken() {
    // Try to get the token from localStorage
    const token = localStorage.getItem('jwt_token');
    
    if (token && token !== 'null' && token.length > 50) {
      return token;
    }
    
    // If no token is found, redirect to login
    console.warn('No authentication token found, redirecting to login');
    window.location.href = '/login';
    return null;
  }

  showSuccess(message) {
    // Create a simple success notification
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #d4edda;
      color: #155724;
      padding: 12px 20px;
      border-radius: 4px;
      border: 1px solid #c3e6cb;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  showError(message) {
    // Create a simple error notification
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f8d7da;
      color: #721c24;
      padding: 12px 20px;
      border-radius: 4px;
      border: 1px solid #f5c6cb;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DashboardManager();
});