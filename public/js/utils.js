/**
 * Utility functions for the application
 */

/**
 * Format a date string to a human-readable format
 * @param {string|Date} dateString - Date string or Date object
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Default options
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error formatting date';
  }
}

/**
 * Format a currency value
 * @param {number|string} amount - Amount to format
 * @param {string} currencyCode - Currency code (e.g., 'USD', 'BTC')
 * @param {Object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currencyCode = 'USD', options = {}) {
  if (amount === undefined || amount === null) {
    return 'N/A';
  }
  
  try {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Handle different currency types
    if (isCryptoCurrency(currencyCode)) {
      return formatCryptoCurrency(numAmount, currencyCode);
    } else {
      // Default options for fiat currencies
      const defaultOptions = {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options
      };
      
      return new Intl.NumberFormat('en-US', defaultOptions).format(numAmount);
    }
  } catch (error) {
    console.error('Error formatting currency:', error, amount, currencyCode);
    return `${amount} ${currencyCode}`;
  }
}

/**
 * Check if a currency code is a cryptocurrency
 * @param {string} currencyCode - Currency code to check
 * @returns {boolean} True if cryptocurrency
 */
function isCryptoCurrency(currencyCode) {
  const cryptoCurrencies = ['BTC', 'ETH', 'SOL', 'USDC', 'USDT'];
  return cryptoCurrencies.includes(currencyCode?.toUpperCase());
}

/**
 * Format a cryptocurrency amount
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Cryptocurrency code
 * @returns {string} Formatted cryptocurrency string
 */
function formatCryptoCurrency(amount, currencyCode) {
  // Determine decimal places based on cryptocurrency
  let decimals = 2; // Default
  
  switch (currencyCode?.toUpperCase()) {
    case 'BTC':
      decimals = 8; // Bitcoin typically shows 8 decimal places
      break;
    case 'ETH':
      decimals = 6; // Ethereum typically shows 6 decimal places
      break;
    case 'SOL':
      decimals = 4; // Solana typically shows 4 decimal places
      break;
    case 'USDC':
    case 'USDT':
      decimals = 2; // Stablecoins typically show 2 decimal places
      break;
  }
  
  const formattedAmount = parseFloat(amount).toFixed(decimals);
  return `${formattedAmount} ${currencyCode.toUpperCase()}`;
}
