/**
 * Campaign Creation Page Controller
 * Manages the campaign creation form and handles form submission
 */

import '../components/campaign-form.js';

class CampaignNewManager {
  constructor() {
    this.campaignForm = null;
    this.init();
  }

  async init() {
    console.log('Campaign creation page loaded');
    
    // Wait for components to be defined and rendered
    await this.waitForComponents();
    
    // Set up component callbacks
    this.setupComponents();
  }

  async waitForComponents() {
    // Wait for custom elements to be defined
    await customElements.whenDefined('campaign-form');
    
    // Wait for next tick to ensure components are rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Additional wait for Shadow DOM to be fully rendered
    let retries = 0;
    const maxRetries = 10;
    
    while (retries < maxRetries) {
      this.campaignForm = document.getElementById('campaign-form');
      
      if (this.campaignForm) {
        // Wait a bit more for Shadow DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 50));
        break;
      }
      
      retries++;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('Campaign form component ready after', retries, 'retries');
  }

  setupComponents() {
    // Set up campaign form callbacks
    if (this.campaignForm) {
      console.log('Setting up campaign form callbacks');
      this.campaignForm.setCallbacks({
        onSave: (campaignData) => this.saveCampaign(campaignData),
        onCancel: () => this.cancelForm()
      });
    } else {
      console.error('Campaign form component not found');
    }
  }

  async saveCampaign(campaignData) {
    try {
      console.log('Saving new campaign:', campaignData);
      
      // Show loading state
      if (this.campaignForm) {
        this.campaignForm.setAttribute('loading', 'true');
      }

      // Get auth token
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Make API request to create campaign
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(campaignData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }

      const result = await response.json();
      console.log('Campaign created successfully:', result);

      // Show success message
      this.showSuccessMessage('Campaign created successfully!');

      // Navigate to dashboard after a short delay using SPA router
      setTimeout(() => {
        if (window.router && window.router.navigate) {
          window.router.navigate('/dashboard');
        } else {
          window.location.href = '/dashboard';
        }
      }, 1500);

    } catch (error) {
      console.error('Error creating campaign:', error);
      
      // Show error message
      if (this.campaignForm) {
        this.campaignForm.setAttribute('error', error.message);
      }
    } finally {
      // Hide loading state
      if (this.campaignForm) {
        this.campaignForm.removeAttribute('loading');
      }
    }
  }

  cancelForm() {
    console.log('Campaign creation cancelled');
    
    // Navigate back to dashboard using SPA router
    if (window.router && window.router.navigate) {
      window.router.navigate('/dashboard');
    } else {
      window.location.href = '/dashboard';
    }
  }

  showSuccessMessage(message) {
    // Create a simple success notification
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
      font-size: 14px;
      font-weight: bold;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Initialize the campaign creation manager when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CampaignNewManager();
  });
} else {
  new CampaignNewManager();
}