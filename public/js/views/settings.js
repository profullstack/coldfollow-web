/**
 * Initialize the settings page
 */
function initSettingsPage() {
  // Check if user is logged in using JWT token
  const jwtToken = localStorage.getItem('jwt_token');
  const userJson = localStorage.getItem('user');
  let user = null;
  
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch (e) {
      console.error('Error parsing user JSON:', e);
    }
  }
  
  if (!jwtToken) {
    // Redirect to login page if not logged in
    window.location.href = '/login';
    throw new Error('Not logged in');
  }
  
  // Populate form fields
  const username = localStorage.getItem('username');
  document.getElementById('email').value = user?.email || username || '';
  document.getElementById('display-name').value = user?.username || username || '';
  
  // Populate subscription info if available
  if (user?.subscription) {
    document.getElementById('current-plan').textContent =
      user.subscription.plan === 'yearly' ? 'Yearly ($30/year)' : 'Monthly ($5/month)';
    
    if (user.subscription.expiresAt) {
      const expiryDate = new Date(user.subscription.expiresAt);
      document.getElementById('next-billing').textContent = expiryDate.toLocaleDateString();
    }
  }
  
  // Handle profile form submission
  document.getElementById('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const displayName = document.getElementById('display-name').value;
    
    // Update username in localStorage
    localStorage.setItem('username', displayName);
    
    // Update user object
    if (user) {
      user.username = displayName;
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    // Dispatch auth changed event to update the header
    window.dispatchEvent(new CustomEvent('auth-changed'));
    
    // Show success message
    alert('Profile updated successfully!');
  });
  
  // Handle password form submission
  document.getElementById('password-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    // In a real implementation, this would validate the current password
    // and update the password on the server
    
    alert('Password changed successfully!');
    
    // Clear form
    e.target.reset();
  });
  
  // Handle delete account button
  document.getElementById('delete-account').addEventListener('click', () => {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    
    if (confirmed) {
      // In a real implementation, this would delete the account on the server
      
      // Clear all localStorage
      localStorage.clear();
      
      // Clear all cookies
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
      
      // Dispatch auth changed event
      window.dispatchEvent(new CustomEvent('auth-changed'));
      
      // Redirect to home page
      window.location.href = '/';
    }
  });
}

// Initialize the page when the DOM is loaded
initSettingsPage();

// Also initialize on spa-transition-end event for SPA router
document.addEventListener('spa-transition-end', initSettingsPage);