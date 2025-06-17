/**
 * @profullstack/payment-gateway
 * 
 * Unified payment gateway abstraction for multiple payment providers
 */

import EventEmitter from 'eventemitter3';

/**
 * Payment Gateway Manager
 * @extends EventEmitter
 */
class PaymentGateway extends EventEmitter {
  /**
   * Create a new PaymentGateway
   * @param {Object} options - Configuration options
   * @param {Object} options.providers - Payment providers to use
   * @param {Object} options.defaultProvider - Default payment provider
   * @param {Object} options.webhookSecret - Webhook secret for verification
   * @param {Object} options.products - Product configuration
   * @param {Object} options.prices - Price configuration
   * @param {boolean} options.debug - Enable debug mode
   */
  constructor(options = {}) {
    super();
    
    // Default options
    this.options = {
      providers: {},
      defaultProvider: null,
      webhookSecret: null,
      products: {},
      prices: {},
      debug: false,
      ...options
    };
    
    // Initialize providers
    this.providers = {};
    
    // Register providers
    if (this.options.providers) {
      for (const [name, provider] of Object.entries(this.options.providers)) {
        this.registerProvider(name, provider);
      }
    }
    
    // Set default provider
    this.defaultProvider = this.options.defaultProvider;
    
    // Initialize products and prices
    this.products = this.options.products || {};
    this.prices = this.options.prices || {};
    
    this._log('PaymentGateway initialized');
  }
  
  /**
   * Register a payment provider
   * @param {string} name - Provider name
   * @param {Object} provider - Provider instance
   * @returns {PaymentGateway} - This instance for chaining
   */
  registerProvider(name, provider) {
    if (!name || typeof name !== 'string') {
      throw new Error('Provider name must be a string');
    }
    
    if (!provider || typeof provider !== 'object') {
      throw new Error('Provider must be an object');
    }
    
    // Check if provider has required methods
    const requiredMethods = [
      'createCheckoutSession',
      'createSubscription',
      'getSubscription',
      'cancelSubscription',
      'handleWebhook'
    ];
    
    for (const method of requiredMethods) {
      if (typeof provider[method] !== 'function') {
        throw new Error(`Provider ${name} must implement ${method} method`);
      }
    }
    
    // Register provider
    this.providers[name] = provider;
    
    // Set as default if no default provider is set
    if (!this.defaultProvider) {
      this.defaultProvider = name;
    }
    
    this._log(`Provider ${name} registered`);
    
    return this;
  }
  
  /**
   * Get a registered provider
   * @param {string} name - Provider name
   * @returns {Object} - Provider instance
   */
  getProvider(name) {
    const providerName = name || this.defaultProvider;
    
    if (!providerName) {
      throw new Error('No provider specified and no default provider set');
    }
    
    const provider = this.providers[providerName];
    
    if (!provider) {
      throw new Error(`Provider ${providerName} not registered`);
    }
    
    return provider;
  }
  
  /**
   * Create a checkout session
   * @param {Object} options - Checkout options
   * @param {string} options.provider - Provider name (optional, uses default if not specified)
   * @param {string} options.customerId - Customer ID (optional)
   * @param {string} options.customerEmail - Customer email (optional)
   * @param {string} options.priceId - Price ID
   * @param {string} options.productId - Product ID (optional if priceId is provided)
   * @param {string} options.planId - Plan ID (optional if priceId is provided)
   * @param {string} options.successUrl - Success URL
   * @param {string} options.cancelUrl - Cancel URL
   * @param {Object} options.metadata - Additional metadata
   * @param {string} options.mode - Checkout mode (payment, subscription, setup)
   * @param {string} options.currency - Currency code (default: USD)
   * @param {number} options.amount - Amount in smallest currency unit (e.g., cents)
   * @returns {Promise<Object>} - Checkout session
   */
  async createCheckoutSession(options = {}) {
    const provider = this.getProvider(options.provider);
    
    try {
      // Resolve price ID if not provided directly
      if (!options.priceId && (options.productId || options.planId)) {
        options.priceId = this._resolvePriceId(options);
      }
      
      // Create checkout session
      const session = await provider.createCheckoutSession(options);
      
      // Emit event
      this.emit('checkout.created', {
        provider: options.provider || this.defaultProvider,
        session
      });
      
      return session;
    } catch (error) {
      this._log('Error creating checkout session:', error);
      throw error;
    }
  }
  
  /**
   * Create a subscription
   * @param {Object} options - Subscription options
   * @param {string} options.provider - Provider name (optional, uses default if not specified)
   * @param {string} options.customerId - Customer ID
   * @param {string} options.customerEmail - Customer email (optional)
   * @param {string} options.priceId - Price ID
   * @param {string} options.planId - Plan ID (optional if priceId is provided)
   * @param {Object} options.metadata - Additional metadata
   * @param {string} options.paymentMethodId - Payment method ID (optional)
   * @returns {Promise<Object>} - Subscription
   */
  async createSubscription(options = {}) {
    const provider = this.getProvider(options.provider);
    
    try {
      // Resolve price ID if not provided directly
      if (!options.priceId && options.planId) {
        options.priceId = this._resolvePriceId(options);
      }
      
      // Create subscription
      const subscription = await provider.createSubscription(options);
      
      // Emit event
      this.emit('subscription.created', {
        provider: options.provider || this.defaultProvider,
        subscription
      });
      
      return subscription;
    } catch (error) {
      this._log('Error creating subscription:', error);
      throw error;
    }
  }
  
  /**
   * Get a subscription
   * @param {Object} options - Subscription options
   * @param {string} options.provider - Provider name (optional, uses default if not specified)
   * @param {string} options.subscriptionId - Subscription ID
   * @param {string} options.customerId - Customer ID (optional)
   * @param {string} options.customerEmail - Customer email (optional)
   * @returns {Promise<Object>} - Subscription
   */
  async getSubscription(options = {}) {
    const provider = this.getProvider(options.provider);
    
    try {
      // Get subscription
      return await provider.getSubscription(options);
    } catch (error) {
      this._log('Error getting subscription:', error);
      throw error;
    }
  }
  
  /**
   * Cancel a subscription
   * @param {Object} options - Subscription options
   * @param {string} options.provider - Provider name (optional, uses default if not specified)
   * @param {string} options.subscriptionId - Subscription ID
   * @param {string} options.customerId - Customer ID (optional)
   * @param {string} options.customerEmail - Customer email (optional)
   * @param {boolean} options.atPeriodEnd - Whether to cancel at the end of the billing period
   * @returns {Promise<Object>} - Cancellation result
   */
  async cancelSubscription(options = {}) {
    const provider = this.getProvider(options.provider);
    
    try {
      // Cancel subscription
      const result = await provider.cancelSubscription(options);
      
      // Emit event
      this.emit('subscription.canceled', {
        provider: options.provider || this.defaultProvider,
        subscriptionId: options.subscriptionId,
        result
      });
      
      return result;
    } catch (error) {
      this._log('Error canceling subscription:', error);
      throw error;
    }
  }
  
  /**
   * Handle a webhook event
   * @param {Object} options - Webhook options
   * @param {string} options.provider - Provider name (optional, uses default if not specified)
   * @param {string} options.body - Webhook body
   * @param {Object} options.headers - Webhook headers
   * @param {string} options.signature - Webhook signature
   * @returns {Promise<Object>} - Webhook handling result
   */
  async handleWebhook(options = {}) {
    const provider = this.getProvider(options.provider);
    
    try {
      // Handle webhook
      const result = await provider.handleWebhook(options);
      
      // Emit event
      if (result.event) {
        this.emit(`webhook.${result.event}`, {
          provider: options.provider || this.defaultProvider,
          result
        });
      }
      
      return result;
    } catch (error) {
      this._log('Error handling webhook:', error);
      throw error;
    }
  }
  
  /**
   * Create a customer
   * @param {Object} options - Customer options
   * @param {string} options.provider - Provider name (optional, uses default if not specified)
   * @param {string} options.email - Customer email
   * @param {string} options.name - Customer name (optional)
   * @param {Object} options.metadata - Additional metadata
   * @returns {Promise<Object>} - Customer
   */
  async createCustomer(options = {}) {
    const provider = this.getProvider(options.provider);
    
    try {
      // Check if provider supports createCustomer
      if (typeof provider.createCustomer !== 'function') {
        throw new Error(`Provider ${options.provider || this.defaultProvider} does not support createCustomer`);
      }
      
      // Create customer
      const customer = await provider.createCustomer(options);
      
      // Emit event
      this.emit('customer.created', {
        provider: options.provider || this.defaultProvider,
        customer
      });
      
      return customer;
    } catch (error) {
      this._log('Error creating customer:', error);
      throw error;
    }
  }
  
  /**
   * Get a customer
   * @param {Object} options - Customer options
   * @param {string} options.provider - Provider name (optional, uses default if not specified)
   * @param {string} options.customerId - Customer ID
   * @param {string} options.email - Customer email (optional)
   * @returns {Promise<Object>} - Customer
   */
  async getCustomer(options = {}) {
    const provider = this.getProvider(options.provider);
    
    try {
      // Check if provider supports getCustomer
      if (typeof provider.getCustomer !== 'function') {
        throw new Error(`Provider ${options.provider || this.defaultProvider} does not support getCustomer`);
      }
      
      // Get customer
      return await provider.getCustomer(options);
    } catch (error) {
      this._log('Error getting customer:', error);
      throw error;
    }
  }
  
  /**
   * Update a customer
   * @param {Object} options - Customer options
   * @param {string} options.provider - Provider name (optional, uses default if not specified)
   * @param {string} options.customerId - Customer ID
   * @param {string} options.email - Customer email (optional)
   * @param {string} options.name - Customer name (optional)
   * @param {Object} options.metadata - Additional metadata
   * @returns {Promise<Object>} - Updated customer
   */
  async updateCustomer(options = {}) {
    const provider = this.getProvider(options.provider);
    
    try {
      // Check if provider supports updateCustomer
      if (typeof provider.updateCustomer !== 'function') {
        throw new Error(`Provider ${options.provider || this.defaultProvider} does not support updateCustomer`);
      }
      
      // Update customer
      const customer = await provider.updateCustomer(options);
      
      // Emit event
      this.emit('customer.updated', {
        provider: options.provider || this.defaultProvider,
        customer
      });
      
      return customer;
    } catch (error) {
      this._log('Error updating customer:', error);
      throw error;
    }
  }
  
  /**
   * Create a payment method
   * @param {Object} options - Payment method options
   * @param {string} options.provider - Provider name (optional, uses default if not specified)
   * @param {string} options.customerId - Customer ID
   * @param {string} options.type - Payment method type
   * @param {Object} options.data - Payment method data
   * @returns {Promise<Object>} - Payment method
   */
  async createPaymentMethod(options = {}) {
    const provider = this.getProvider(options.provider);
    
    try {
      // Check if provider supports createPaymentMethod
      if (typeof provider.createPaymentMethod !== 'function') {
        throw new Error(`Provider ${options.provider || this.defaultProvider} does not support createPaymentMethod`);
      }
      
      // Create payment method
      const paymentMethod = await provider.createPaymentMethod(options);
      
      // Emit event
      this.emit('paymentMethod.created', {
        provider: options.provider || this.defaultProvider,
        paymentMethod
      });
      
      return paymentMethod;
    } catch (error) {
      this._log('Error creating payment method:', error);
      throw error;
    }
  }
  
  /**
   * Get payment methods for a customer
   * @param {Object} options - Payment method options
   * @param {string} options.provider - Provider name (optional, uses default if not specified)
   * @param {string} options.customerId - Customer ID
   * @param {string} options.type - Payment method type (optional)
   * @returns {Promise<Array>} - Payment methods
   */
  async getPaymentMethods(options = {}) {
    const provider = this.getProvider(options.provider);
    
    try {
      // Check if provider supports getPaymentMethods
      if (typeof provider.getPaymentMethods !== 'function') {
        throw new Error(`Provider ${options.provider || this.defaultProvider} does not support getPaymentMethods`);
      }
      
      // Get payment methods
      return await provider.getPaymentMethods(options);
    } catch (error) {
      this._log('Error getting payment methods:', error);
      throw error;
    }
  }
  
  /**
   * Create a product
   * @param {Object} options - Product options
   * @param {string} options.provider - Provider name (optional, uses default if not specified)
   * @param {string} options.name - Product name
   * @param {string} options.description - Product description (optional)
   * @param {Object} options.metadata - Additional metadata
   * @returns {Promise<Object>} - Product
   */
  async createProduct(options = {}) {
    const provider = this.getProvider(options.provider);
    
    try {
      // Check if provider supports createProduct
      if (typeof provider.createProduct !== 'function') {
        throw new Error(`Provider ${options.provider || this.defaultProvider} does not support createProduct`);
      }
      
      // Create product
      const product = await provider.createProduct(options);
      
      // Add to products cache
      if (product.id) {
        this.products[product.id] = product;
      }
      
      // Emit event
      this.emit('product.created', {
        provider: options.provider || this.defaultProvider,
        product
      });
      
      return product;
    } catch (error) {
      this._log('Error creating product:', error);
      throw error;
    }
  }
  
  /**
   * Create a price
   * @param {Object} options - Price options
   * @param {string} options.provider - Provider name (optional, uses default if not specified)
   * @param {string} options.productId - Product ID
   * @param {string} options.currency - Currency code (default: USD)
   * @param {number} options.unitAmount - Amount in smallest currency unit (e.g., cents)
   * @param {string} options.interval - Billing interval (day, week, month, year)
   * @param {number} options.intervalCount - Number of intervals (default: 1)
   * @param {Object} options.metadata - Additional metadata
   * @returns {Promise<Object>} - Price
   */
  async createPrice(options = {}) {
    const provider = this.getProvider(options.provider);
    
    try {
      // Check if provider supports createPrice
      if (typeof provider.createPrice !== 'function') {
        throw new Error(`Provider ${options.provider || this.defaultProvider} does not support createPrice`);
      }
      
      // Create price
      const price = await provider.createPrice(options);
      
      // Add to prices cache
      if (price.id) {
        this.prices[price.id] = price;
        
        // Also add to product-specific prices
        if (options.productId) {
          if (!this.prices[options.productId]) {
            this.prices[options.productId] = {};
          }
          
          // Create a key based on interval and currency
          const key = `${options.interval || 'one-time'}_${options.currency || 'usd'}`;
          this.prices[options.productId][key] = price;
        }
      }
      
      // Emit event
      this.emit('price.created', {
        provider: options.provider || this.defaultProvider,
        price
      });
      
      return price;
    } catch (error) {
      this._log('Error creating price:', error);
      throw error;
    }
  }
  
  /**
   * Create a payment
   * @param {Object} options - Payment options
   * @param {string} options.provider - Provider name (optional, uses default if not specified)
   * @param {string} options.customerId - Customer ID
   * @param {number} options.amount - Amount in smallest currency unit (e.g., cents)
   * @param {string} options.currency - Currency code (default: USD)
   * @param {string} options.description - Payment description (optional)
   * @param {Object} options.metadata - Additional metadata
   * @returns {Promise<Object>} - Payment
   */
  async createPayment(options = {}) {
    const provider = this.getProvider(options.provider);
    
    try {
      // Check if provider supports createPayment
      if (typeof provider.createPayment !== 'function') {
        throw new Error(`Provider ${options.provider || this.defaultProvider} does not support createPayment`);
      }
      
      // Create payment
      const payment = await provider.createPayment(options);
      
      // Emit event
      this.emit('payment.created', {
        provider: options.provider || this.defaultProvider,
        payment
      });
      
      return payment;
    } catch (error) {
      this._log('Error creating payment:', error);
      throw error;
    }
  }
  
  /**
   * Resolve a price ID from product ID and plan ID
   * @param {Object} options - Options
   * @param {string} options.productId - Product ID
   * @param {string} options.planId - Plan ID
   * @param {string} options.currency - Currency code (default: USD)
   * @returns {string} - Price ID
   * @private
   */
  _resolvePriceId(options) {
    const { productId, planId, currency = 'usd' } = options;
    
    // If we have a direct price mapping for the plan, use it
    if (planId && this.prices[planId]) {
      return planId;
    }
    
    // If we have a product ID and plan ID, try to find the price
    if (productId && planId && this.prices[productId]) {
      const key = `${planId}_${currency}`;
      if (this.prices[productId][key]) {
        return this.prices[productId][key].id;
      }
    }
    
    // If we have a product ID, try to find a default price
    if (productId && this.products[productId] && this.products[productId].default_price) {
      return this.products[productId].default_price;
    }
    
    throw new Error(`Could not resolve price ID for product ${productId} and plan ${planId}`);
  }
  
  /**
   * Log debug messages
   * @param {...any} args - Arguments to log
   * @private
   */
  _log(...args) {
    if (this.options.debug) {
      console.log('[PaymentGateway]', ...args);
    }
  }
}

/**
 * Create a payment gateway
 * @param {Object} options - Configuration options
 * @returns {PaymentGateway} - Payment gateway instance
 */
export function createPaymentGateway(options = {}) {
  return new PaymentGateway(options);
}

// Export the PaymentGateway class
export { PaymentGateway };

// Export provider factories
export { createStripeProvider } from './providers/stripe.js';
export { createPayPalProvider } from './providers/paypal.js';
export { createCryptoProvider } from './providers/crypto.js';
export { createMockProvider } from './providers/mock.js';

// Default export
export default createPaymentGateway;