// Using direct localStorage access for authentication checks
import { formatDate, formatCurrency } from '../utils.js';

// Initialize the subscription management page
export async function initSubscriptionManagement() {
  // Use the same auth check approach as the navbar component
  const jwtToken = localStorage.getItem('jwt_token');
  console.log('JWT token exists:', !!jwtToken);
  console.log('JWT token length:', jwtToken?.length || 0);
  const isLoggedIn = !!jwtToken;
  
  if (!isLoggedIn) {
    console.log('Not logged in, redirecting to login page');
    window.location.href = '/login?redirect=' + encodeURIComponent('/manage-subscription');
    return;
  }

  // Setup UI event listeners
  setupEventListeners();
  
  // Load subscription data
  await loadSubscriptionData();
}

// Setup event listeners for the page
function setupEventListeners() {
  // Stripe Portal button
  const stripePortalBtn = document.getElementById('open-stripe-portal');
  if (stripePortalBtn) {
    stripePortalBtn.addEventListener('click', openStripePortal);
  }

  // Cancel subscription button
  const cancelBtn = document.getElementById('cancel-subscription');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', showCancelModal);
  }

  // Cancel confirmation
  const confirmCancelBtn = document.getElementById('confirm-cancel');
  if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', cancelSubscription);
  }

  // Modal close buttons
  const closeButtons = document.querySelectorAll('.close-modal');
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      document.getElementById('cancel-modal').style.display = 'none';
    });
  });

  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    const modal = document.getElementById('cancel-modal');
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Update payment method button
  const updatePaymentBtn = document.getElementById('manage-payment-method');
  if (updatePaymentBtn) {
    updatePaymentBtn.addEventListener('click', updatePaymentMethod);
  }
}

// Load subscription data from the server
async function loadSubscriptionData() {
  try {
    // Use the same auth check as the header component
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.log('No JWT token found, redirecting to login...');
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?redirect=${returnUrl}`;
      return;
    }
    
    // Ensure token is not trimmed or modified in any way
    console.log('Making API call with token length:', token?.length || 0);
    console.log('Token starts with:', token?.substring(0, 10));
    
    const response = await fetch(`${window.API_BASE_URL}/api/subscription/details`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('API response status:', response.status, response.statusText);
    if (response.status === 401) {
      console.log('401 Unauthorized received from API');
      try {
        // Try to read response body for more details
        const errorData = await response.text();
        console.log('Error response body:', errorData);
      } catch (e) {
        console.log('Could not read error response body', e);
      }
      
      // Examine token again for debugging
      console.log('JWT token when 401 received:', token ? 'exists' : 'missing');
      console.log('JWT token format check:', token?.startsWith('ey') ? 'looks valid' : 'invalid format');
      
      // Don't redirect automatically for debugging
      console.error('AUTHENTICATION FAILED: 401 Unauthorized - Check console logs');
      alert('Authentication failed. Check console for details. Click OK to try the login page.');
      
      // Save the current URL to redirect back after login
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?redirect=${returnUrl}`;
      return;
    } else if (!response.ok) {
      throw new Error(`Failed to load subscription data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Hide loading indicator
    document.getElementById('loading-subscriptions').style.display = 'none';
    
    if (!data.hasSubscription) {
      // Show no subscription message
      document.getElementById('no-subscription').style.display = 'block';
      return;
    }

    // Display subscription details
    document.getElementById('subscription-details').style.display = 'block';
    populateSubscriptionDetails(data);
    populatePaymentHistory(data.payments || []);
  } catch (error) {
    console.error('Error loading subscription data:', error);
    document.getElementById('loading-subscriptions').style.display = 'none';
    alert('Failed to load subscription data. Please try again later.');
  }
}

// Populate subscription details in the UI
function populateSubscriptionDetails(data) {
  // Set subscription status badge
  const badgeEl = document.getElementById('subscription-badge');
  badgeEl.textContent = data.status || 'Active';
  badgeEl.className = 'badge';
  
  if (data.status === 'Active') {
    badgeEl.classList.add('success');
  } else if (data.status === 'Past Due') {
    badgeEl.classList.add('warning');
  } else if (data.status === 'Canceled') {
    badgeEl.classList.add('danger');
  }

  // Set basic subscription info
  document.getElementById('subscription-plan').textContent = data.plan || 'Monthly';
  document.getElementById('subscription-price').textContent = formatCurrency(data.amount, data.currency);
  
  // Format dates
  if (data.startDate) {
    document.getElementById('subscription-start').textContent = formatDate(data.startDate);
  }
  
  if (data.renewalDate) {
    document.getElementById('subscription-renewal').textContent = formatDate(data.renewalDate);
    document.getElementById('access-until-date').textContent = formatDate(data.renewalDate);
  }

  // Set payment method display
  const paymentMethod = document.getElementById('payment-method');
  if (data.paymentType === 'stripe') {
    paymentMethod.textContent = data.cardBrand && data.cardLast4 
      ? `${data.cardBrand} •••• ${data.cardLast4}` 
      : 'Credit Card (Stripe)';
    
    // Show stripe actions
    document.getElementById('stripe-actions').style.display = 'flex';
    document.getElementById('crypto-actions').style.display = 'none';
  } else if (data.paymentType === 'crypto') {
    paymentMethod.textContent = `Cryptocurrency (${data.cryptoCurrency || 'ETH'})`;
    
    // Show crypto actions and details
    document.getElementById('stripe-actions').style.display = 'none';
    document.getElementById('crypto-actions').style.display = 'block';
    
    // Set crypto details
    if (data.walletAddress) {
      const shortAddress = data.walletAddress.length > 10 
        ? `${data.walletAddress.slice(0, 6)}...${data.walletAddress.slice(-4)}` 
        : data.walletAddress;
      document.getElementById('crypto-wallet').textContent = shortAddress;
    }
    
    if (data.cryptoCurrency) {
      let cryptoName = 'Unknown';
      if (data.cryptoCurrency === 'BTC') cryptoName = 'Bitcoin (BTC)';
      if (data.cryptoCurrency === 'ETH') cryptoName = 'Ethereum (ETH)';
      if (data.cryptoCurrency === 'SOL') cryptoName = 'Solana (SOL)';
      if (data.cryptoCurrency === 'USDC') cryptoName = 'USD Coin (USDC)';
      document.getElementById('crypto-currency').textContent = cryptoName;
    }
  }

  // Disable cancel button if already canceled
  if (data.status === 'Canceled') {
    document.getElementById('cancel-subscription').disabled = true;
    document.getElementById('cancel-subscription').textContent = 'Subscription Canceled';
  }
}

// Populate payment history table
function populatePaymentHistory(payments) {
  const tableBody = document.getElementById('payment-history-table');
  const noPaymentsEl = document.getElementById('no-payments');
  
  if (!payments || payments.length === 0) {
    tableBody.innerHTML = '';
    noPaymentsEl.style.display = 'block';
    return;
  }
  
  noPaymentsEl.style.display = 'none';
  tableBody.innerHTML = '';
  
  payments.forEach(payment => {
    const row = document.createElement('tr');
    
    // Date
    const dateCell = document.createElement('td');
    dateCell.textContent = formatDate(payment.date);
    row.appendChild(dateCell);
    
    // Amount
    const amountCell = document.createElement('td');
    amountCell.textContent = formatCurrency(payment.amount, payment.currency);
    row.appendChild(amountCell);
    
    // Status
    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.textContent = payment.status || 'Paid';
    statusBadge.className = 'badge small';
    
    if (payment.status === 'paid' || payment.status === 'succeeded') {
      statusBadge.classList.add('success');
      statusBadge.textContent = 'Paid';
    } else if (payment.status === 'pending') {
      statusBadge.classList.add('warning');
      statusBadge.textContent = 'Pending';
    } else if (payment.status === 'failed') {
      statusBadge.classList.add('danger');
      statusBadge.textContent = 'Failed';
    }
    
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);
    
    // Method
    const methodCell = document.createElement('td');
    methodCell.textContent = payment.paymentType === 'stripe' 
      ? 'Credit Card' 
      : `Crypto (${payment.cryptoCurrency || 'ETH'})`;
    row.appendChild(methodCell);
    
    // Receipt
    const receiptCell = document.createElement('td');
    if (payment.receiptUrl) {
      const receiptLink = document.createElement('a');
      receiptLink.href = payment.receiptUrl;
      receiptLink.textContent = 'View';
      receiptLink.target = '_blank';
      receiptCell.appendChild(receiptLink);
    } else {
      receiptCell.textContent = '-';
    }
    row.appendChild(receiptCell);
    
    tableBody.appendChild(row);
  });
}

// Open Stripe Customer Portal
async function openStripePortal() {
  try {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${window.API_BASE_URL}/api/stripe/create-portal-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    const { url } = await response.json();
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No portal URL received');
    }
  } catch (error) {
    console.error('Error opening Stripe portal:', error);
    alert('Failed to open Stripe Customer Portal. Please try again later.');
  }
}

// Show the cancellation confirmation modal
function showCancelModal() {
  document.getElementById('cancel-modal').style.display = 'flex';
}

// Cancel the subscription
async function cancelSubscription() {
  try {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${window.API_BASE_URL}/api/subscription/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    // Close modal
    document.getElementById('cancel-modal').style.display = 'none';
    
    // Reload data
    await loadSubscriptionData();
    
    // Show success message
    alert('Your subscription has been canceled and will end at the end of your current billing period.');
  } catch (error) {
    console.error('Error canceling subscription:', error);
    alert('Failed to cancel subscription. Please try again later.');
  }
}

// Update payment method
function updatePaymentMethod() {
  // For simplicity, we'll just open the Stripe portal which handles this
  openStripePortal();
}

// Add small CSS to the existing styles
const style = document.createElement('style');
style.textContent = `
  .badge.small {
    font-size: 0.75rem;
    padding: 0.15rem 0.5rem;
  }
  
  .badge.success {
    background-color: var(--success-color);
  }
  
  .badge.warning {
    background-color: var(--warning-color);
  }
  
  .badge.danger {
    background-color: var(--danger-color);
  }
`;
document.head.appendChild(style);

// Don't use DOMContentLoaded when importing as a module - the initialization happens via the exported function
