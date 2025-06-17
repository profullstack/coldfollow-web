/**
 * Crypto Provider for Payment Gateway
 * 
 * Implements the cryptocurrency payment provider interface.
 */

import EventEmitter from 'eventemitter3';
import crypto from 'crypto';

/**
 * Create a Crypto provider
 * @param {Object} options - Configuration options
 * @param {Object} options.wallets - Wallet addresses for different cryptocurrencies
 * @param {Object} options.exchangeRateProviders - Exchange rate providers for different cryptocurrencies
 * @param {Function} options.verificationCallback - Callback for verifying payments
 * @param {boolean} options.debug - Enable debug mode
 * @returns {Object} - Crypto provider
 */
export function createCryptoProvider(options = {}) {
  // Default options
  const config = {
    wallets: {
      btc: null,
      eth: null,
      sol: null,
      usdc: null
    },
    exchangeRateProviders: {},
    verificationCallback: null,
    debug: false,
    ...options
  };
  
  // Create event emitter for internal events
  const eventEmitter = new EventEmitter();
  
  // In-memory storage for subscriptions and payments
  const subscriptions = new Map();
  const payments = new Map();
  
  /**
   * Create a checkout session
   * @param {Object} options - Checkout options
   * @param {string} options.customerEmail - Customer email
   * @param {string} options.productId - Product ID
   * @param {string} options.planId - Plan ID (monthly, yearly)
   * @param {string} options.coin - Cryptocurrency code (btc, eth, sol, usdc)
   * @param {number} options.amount - Amount in USD
   * @param {string} options.successUrl - Success URL
   * @param {string} options.cancelUrl - Cancel URL
   * @param {Object} options.metadata - Additional metadata
   * @returns {Promise<Object>} - Checkout session
   */
  async function createCheckoutSession(options = {}) {
    try {
      _log('Creating crypto checkout session:', options);
      
      // Validate required options
      if (!options.customerEmail) {
        throw new Error('Customer email is required');
      }
      
      if (!options.amount) {
        throw new Error('Amount is required');
      }
      
      if (!options.coin) {
        throw new Error('Cryptocurrency is required');
      }
      
      // Validate coin
      const coin = options.coin.toLowerCase();
      if (!['btc', 'eth', 'sol', 'usdc'].includes(coin)) {
        throw new Error('Invalid cryptocurrency. Must be "btc", "eth", "sol", or "usdc".');
      }
      
      // Get wallet address for the selected coin
      const walletAddress = config.wallets[coin];
      if (!walletAddress) {
        throw new Error(`No wallet address configured for ${coin}`);
      }
      
      // Get exchange rate
      let cryptoAmount;
      let exchangeRate;
      
      try {
        exchangeRate = await _getExchangeRate(coin, 'USD');
        cryptoAmount = options.amount / exchangeRate;
        _log(`Converted ${options.amount} USD to ${cryptoAmount} ${coin} at rate ${exchangeRate}`);
      } catch (error) {
        _log('Error getting exchange rate:', error);
        throw new Error(`Could not get exchange rate for ${coin}: ${error.message}`);
      }
      
      // Create a unique session ID
      const sessionId = `crypto_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      
      // Create checkout session
      const session = {
        id: sessionId,
        customerEmail: options.customerEmail,
        coin,
        amount: options.amount,
        cryptoAmount,
        exchangeRate,
        walletAddress,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        metadata: options.metadata || {},
        successUrl: options.successUrl,
        cancelUrl: options.cancelUrl,
        planId: options.planId,
        productId: options.productId
      };
      
      // Store session
      payments.set(sessionId, session);
      
      _log('Crypto checkout session created:', sessionId);
      
      // Return a standardized response
      return {
        id: session.id,
        url: _generatePaymentUrl(session),
        status: session.status,
        customerEmail: session.customerEmail,
        amount: session.amount,
        currency: 'USD',
        metadata: session.metadata,
        expiresAt: session.expiresAt,
        provider: 'crypto',
        providerData: {
          coin: session.coin,
          cryptoAmount: session.cryptoAmount,
          exchangeRate: session.exchangeRate,
          walletAddress: session.walletAddress
        }
      };
    } catch (error) {
      _log('Error creating crypto checkout session:', error);
      throw error;
    }
  }
  
  /**
   * Create a subscription
   * @param {Object} options - Subscription options
   * @param {string} options.customerEmail - Customer email
   * @param {string} options.planId - Plan ID (monthly, yearly)
   * @param {string} options.coin - Cryptocurrency code (btc, eth, sol, usdc)
   * @param {number} options.amount - Amount in USD
   * @param {Object} options.metadata - Additional metadata
   * @returns {Promise<Object>} - Subscription
   */
  async function createSubscription(options = {}) {
    try {
      _log('Creating crypto subscription:', options);
      
      // Validate required options
      if (!options.customerEmail) {
        throw new Error('Customer email is required');
      }
      
      if (!options.planId) {
        throw new Error('Plan ID is required');
      }
      
      if (!options.coin) {
        throw new Error('Cryptocurrency is required');
      }
      
      if (!options.amount) {
        throw new Error('Amount is required');
      }
      
      // Validate coin
      const coin = options.coin.toLowerCase();
      if (!['btc', 'eth', 'sol', 'usdc'].includes(coin)) {
        throw new Error('Invalid cryptocurrency. Must be "btc", "eth", "sol", or "usdc".');
      }
      
      // Get wallet address for the selected coin
      const walletAddress = config.wallets[coin];
      if (!walletAddress) {
        throw new Error(`No wallet address configured for ${coin}`);
      }
      
      // Get exchange rate
      let cryptoAmount;
      let exchangeRate;
      
      try {
        exchangeRate = await _getExchangeRate(coin, 'USD');
        cryptoAmount = options.amount / exchangeRate;
        _log(`Converted ${options.amount} USD to ${cryptoAmount} ${coin} at rate ${exchangeRate}`);
      } catch (error) {
        _log('Error getting exchange rate:', error);
        throw new Error(`Could not get exchange rate for ${coin}: ${error.message}`);
      }
      
      // Create a unique subscription ID
      const subscriptionId = `crypto_sub_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      
      // Calculate expiration date based on plan
      const now = new Date();
      const expirationDate = new Date(now);
      
      if (options.planId === 'monthly') {
        expirationDate.setMonth(expirationDate.getMonth() + 1);
      } else if (options.planId === 'yearly') {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      } else {
        throw new Error('Invalid plan ID. Must be "monthly" or "yearly".');
      }
      
      // Create subscription
      const subscription = {
        id: subscriptionId,
        customerEmail: options.customerEmail,
        planId: options.planId,
        coin,
        amount: options.amount,
        cryptoAmount,
        exchangeRate,
        walletAddress,
        status: 'pending',
        createdAt: now.toISOString(),
        startDate: now.toISOString(),
        expirationDate: expirationDate.toISOString(),
        metadata: options.metadata || {},
        paymentStatus: 'pending',
        transactionId: null
      };
      
      // Store subscription
      subscriptions.set(subscriptionId, subscription);
      
      _log('Crypto subscription created:', subscriptionId);
      
      // Return a standardized response
      return {
        id: subscription.id,
        customerEmail: subscription.customerEmail,
        status: subscription.status,
        currentPeriodStart: subscription.startDate,
        currentPeriodEnd: subscription.expirationDate,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        metadata: subscription.metadata,
        provider: 'crypto',
        providerData: {
          coin: subscription.coin,
          cryptoAmount: subscription.cryptoAmount,
          exchangeRate: subscription.exchangeRate,
          walletAddress: subscription.walletAddress,
          paymentStatus: subscription.paymentStatus
        }
      };
    } catch (error) {
      _log('Error creating crypto subscription:', error);
      throw error;
    }
  }
  
  /**
   * Get a subscription
   * @param {Object} options - Subscription options
   * @param {string} options.subscriptionId - Subscription ID
   * @param {string} options.customerEmail - Customer email (optional)
   * @returns {Promise<Object>} - Subscription
   */
  async function getSubscription(options = {}) {
    try {
      _log('Getting crypto subscription:', options);
      
      // Validate required options
      if (!options.subscriptionId && !options.customerEmail) {
        throw new Error('Either subscription ID or customer email is required');
      }
      
      let subscription;
      
      if (options.subscriptionId) {
        // Get subscription by ID
        subscription = subscriptions.get(options.subscriptionId);
        
        if (!subscription) {
          return null;
        }
      } else {
        // Get subscriptions for customer email
        const customerSubscriptions = Array.from(subscriptions.values())
          .filter(sub => sub.customerEmail === options.customerEmail)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (customerSubscriptions.length === 0) {
          return null;
        }
        
        subscription = customerSubscriptions[0];
      }
      
      _log('Crypto subscription retrieved:', subscription.id);
      
      // Check if subscription needs verification
      if (subscription.status === 'pending' && config.verificationCallback) {
        try {
          const verified = await config.verificationCallback(subscription);
          
          if (verified) {
            subscription.status = 'active';
            subscription.paymentStatus = 'paid';
            
            _log('Crypto subscription verified and activated:', subscription.id);
          }
        } catch (error) {
          _log('Error verifying subscription:', error);
        }
      }
      
      // Return a standardized response
      return {
        id: subscription.id,
        customerEmail: subscription.customerEmail,
        status: subscription.status,
        currentPeriodStart: subscription.startDate,
        currentPeriodEnd: subscription.expirationDate,
        cancelAtPeriodEnd: false,
        canceledAt: subscription.canceledAt || null,
        metadata: subscription.metadata,
        provider: 'crypto',
        providerData: {
          coin: subscription.coin,
          cryptoAmount: subscription.cryptoAmount,
          exchangeRate: subscription.exchangeRate,
          walletAddress: subscription.walletAddress,
          paymentStatus: subscription.paymentStatus,
          transactionId: subscription.transactionId
        }
      };
    } catch (error) {
      _log('Error getting crypto subscription:', error);
      throw error;
    }
  }
  
  /**
   * Cancel a subscription
   * @param {Object} options - Subscription options
   * @param {string} options.subscriptionId - Subscription ID
   * @returns {Promise<Object>} - Cancellation result
   */
  async function cancelSubscription(options = {}) {
    try {
      _log('Canceling crypto subscription:', options);
      
      // Validate required options
      if (!options.subscriptionId) {
        throw new Error('Subscription ID is required');
      }
      
      // Get subscription
      const subscription = subscriptions.get(options.subscriptionId);
      
      if (!subscription) {
        throw new Error(`Subscription ${options.subscriptionId} not found`);
      }
      
      // Update subscription
      subscription.status = 'canceled';
      subscription.canceledAt = new Date().toISOString();
      
      _log('Crypto subscription canceled:', subscription.id);
      
      // Return a standardized response
      return {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: false,
        canceledAt: subscription.canceledAt,
        provider: 'crypto',
        success: true
      };
    } catch (error) {
      _log('Error canceling crypto subscription:', error);
      throw error;
    }
  }
  
  /**
   * Handle a webhook event
   * @param {Object} options - Webhook options
   * @param {Object} options.body - Webhook body
   * @param {Object} options.headers - Webhook headers
   * @returns {Promise<Object>} - Webhook handling result
   */
  async function handleWebhook(options = {}) {
    try {
      _log('Handling crypto webhook:', options);
      
      // Validate required options
      if (!options.body) {
        throw new Error('Webhook body is required');
      }
      
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      
      // Validate webhook data
      if (!body.address || !body.txid || !body.coin) {
        throw new Error('Invalid webhook data');
      }
      
      // Find matching subscription or payment
      let subscription;
      let payment;
      
      // Check subscriptions
      for (const [id, sub] of subscriptions.entries()) {
        if (sub.walletAddress === body.address && sub.coin === body.coin) {
          subscription = sub;
          break;
        }
      }
      
      // Check payments
      for (const [id, pay] of payments.entries()) {
        if (pay.walletAddress === body.address && pay.coin === body.coin) {
          payment = pay;
          break;
        }
      }
      
      if (!subscription && !payment) {
        throw new Error('No matching subscription or payment found');
      }
      
      let result;
      
      // Handle subscription payment
      if (subscription) {
        // Update subscription
        subscription.status = 'active';
        subscription.paymentStatus = 'paid';
        subscription.transactionId = body.txid;
        
        _log('Crypto subscription payment verified:', subscription.id);
        
        // Emit event
        eventEmitter.emit('subscription.paid', subscription);
        
        result = {
          event: 'subscription.paid',
          subscriptionId: subscription.id,
          customerEmail: subscription.customerEmail,
          transactionId: body.txid,
          amount: subscription.amount,
          cryptoAmount: subscription.cryptoAmount,
          coin: subscription.coin,
          status: subscription.status
        };
      }
      
      // Handle one-time payment
      if (payment) {
        // Update payment
        payment.status = 'completed';
        payment.transactionId = body.txid;
        
        _log('Crypto payment verified:', payment.id);
        
        // Emit event
        eventEmitter.emit('payment.completed', payment);
        
        result = {
          event: 'payment.completed',
          paymentId: payment.id,
          customerEmail: payment.customerEmail,
          transactionId: body.txid,
          amount: payment.amount,
          cryptoAmount: payment.cryptoAmount,
          coin: payment.coin,
          status: payment.status
        };
      }
      
      return {
        ...result,
        provider: 'crypto',
        originalEvent: body
      };
    } catch (error) {
      _log('Error handling crypto webhook:', error);
      throw error;
    }
  }
  
  /**
   * Verify a payment
   * @param {Object} options - Verification options
   * @param {string} options.subscriptionId - Subscription ID
   * @param {string} options.paymentId - Payment ID
   * @param {string} options.transactionId - Transaction ID
   * @returns {Promise<boolean>} - Whether the payment was verified
   */
  async function verifyPayment(options = {}) {
    try {
      _log('Verifying crypto payment:', options);
      
      // Validate required options
      if (!options.subscriptionId && !options.paymentId) {
        throw new Error('Either subscription ID or payment ID is required');
      }
      
      if (!options.transactionId) {
        throw new Error('Transaction ID is required');
      }
      
      let item;
      let isSubscription = false;
      
      if (options.subscriptionId) {
        item = subscriptions.get(options.subscriptionId);
        isSubscription = true;
      } else {
        item = payments.get(options.paymentId);
      }
      
      if (!item) {
        throw new Error(`${isSubscription ? 'Subscription' : 'Payment'} not found`);
      }
      
      // Verify payment using callback if provided
      if (config.verificationCallback) {
        const verified = await config.verificationCallback({
          ...item,
          transactionId: options.transactionId
        });
        
        if (verified) {
          // Update item
          if (isSubscription) {
            item.status = 'active';
            item.paymentStatus = 'paid';
            item.transactionId = options.transactionId;
            
            // Emit event
            eventEmitter.emit('subscription.paid', item);
          } else {
            item.status = 'completed';
            item.transactionId = options.transactionId;
            
            // Emit event
            eventEmitter.emit('payment.completed', item);
          }
          
          _log(`Crypto ${isSubscription ? 'subscription' : 'payment'} verified:`, item.id);
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      _log('Error verifying crypto payment:', error);
      throw error;
    }
  }
  
  /**
   * Get exchange rate for a cryptocurrency
   * @param {string} coin - Cryptocurrency code
   * @param {string} fiat - Fiat currency code
   * @returns {Promise<number>} - Exchange rate
   * @private
   */
  async function _getExchangeRate(coin, fiat) {
    try {
      const provider = config.exchangeRateProviders[coin];
      
      if (!provider) {
        throw new Error(`No exchange rate provider configured for ${coin}`);
      }
      
      return await provider(coin, fiat);
    } catch (error) {
      _log('Error getting exchange rate:', error);
      throw error;
    }
  }
  
  /**
   * Generate a payment URL
   * @param {Object} session - Checkout session
   * @returns {string} - Payment URL
   * @private
   */
  function _generatePaymentUrl(session) {
    // This would typically be a URL to a payment page
    // For now, we'll just return a placeholder
    return `crypto://${session.coin}/pay?address=${session.walletAddress}&amount=${session.cryptoAmount}&session=${session.id}`;
  }
  
  /**
   * Log debug messages
   * @param {...any} args - Arguments to log
   * @private
   */
  function _log(...args) {
    if (config.debug) {
      console.log('[CryptoProvider]', ...args);
    }
  }
  
  // Return the provider
  return {
    createCheckoutSession,
    createSubscription,
    getSubscription,
    cancelSubscription,
    handleWebhook,
    verifyPayment,
    on: eventEmitter.on.bind(eventEmitter),
    off: eventEmitter.off.bind(eventEmitter)
  };
}

export default createCryptoProvider;