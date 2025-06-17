/**
 * PayPal provider for @profullstack/payment-gateway
 */

/**
 * Create a PayPal provider
 * @param {Object} options - PayPal options
 * @param {string} options.clientId - PayPal client ID
 * @param {string} options.clientSecret - PayPal client secret
 * @param {boolean} options.sandbox - Whether to use sandbox environment (default: false)
 * @param {Object} options.webhookId - PayPal webhook ID for verification
 * @returns {Object} PayPal provider
 */
export function createPayPalProvider(options = {}) {
  // Validate required options
  if (!options.clientId) {
    throw new Error('PayPal client ID is required');
  }

  if (!options.clientSecret) {
    throw new Error('PayPal client secret is required');
  }

  // Configuration
  const config = {
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    sandbox: options.sandbox !== false,
    webhookId: options.webhookId || null,
    debug: options.debug || false
  };

  // API base URL based on environment
  const baseUrl = config.sandbox
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

  // Cache for access token
  let accessToken = null;
  let tokenExpiry = null;

  /**
   * Get access token for API calls
   * @private
   * @returns {Promise<string>} Access token
   */
  async function getAccessToken() {
    // Check if we have a valid token
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return accessToken;
    }

    // Request new token
    const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayPal authentication failed: ${error.error_description || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Cache token
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety
    
    return accessToken;
  }

  /**
   * Make authenticated API request to PayPal
   * @private
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} body - Request body
   * @returns {Promise<Object>} Response data
   */
  async function apiRequest(endpoint, method = 'GET', body = null) {
    const token = await getAccessToken();
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const options = {
      method,
      headers
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${baseUrl}${endpoint}`, options);
    
    const responseData = await response.json();
    
    if (!response.ok) {
      const errorMessage = responseData.message || responseData.error_description || 'Unknown error';
      throw new Error(`PayPal API error: ${errorMessage}`);
    }
    
    return responseData;
  }

  /**
   * Create a checkout session
   * @param {Object} options - Checkout options
   * @returns {Promise<Object>} Checkout session
   */
  async function createCheckoutSession(options) {
    const {
      customerId,
      customerEmail,
      priceId,
      productId,
      successUrl,
      cancelUrl,
      metadata = {},
      mode = 'payment',
      currency = 'USD',
      amount
    } = options;

    // Validate required options
    if (!successUrl) {
      throw new Error('Success URL is required');
    }

    if (!cancelUrl) {
      throw new Error('Cancel URL is required');
    }

    // Create order based on mode
    if (mode === 'payment') {
      // One-time payment
      if (!amount) {
        throw new Error('Amount is required for payment mode');
      }

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency.toUpperCase(),
              value: (amount / 100).toFixed(2) // Convert from cents to dollars
            },
            description: metadata.description || 'Payment'
          }
        ],
        application_context: {
          return_url: successUrl,
          cancel_url: cancelUrl,
          brand_name: metadata.brandName || 'Your Store',
          user_action: 'PAY_NOW'
        }
      };

      // Add customer info if available
      if (customerEmail) {
        orderData.payer = {
          email_address: customerEmail
        };
      }

      // Create order
      const order = await apiRequest('/v2/checkout/orders', 'POST', orderData);

      // Find approval URL
      const approvalUrl = order.links.find(link => link.rel === 'approve').href;

      return {
        id: order.id,
        url: approvalUrl,
        status: order.status,
        mode: 'payment',
        metadata
      };
    } else if (mode === 'subscription') {
      // Subscription
      if (!priceId && !productId) {
        throw new Error('Price ID or Product ID is required for subscription mode');
      }

      // Create subscription plan if not provided
      let planId = priceId;
      
      if (!planId && productId) {
        // TODO: Create plan from product
        throw new Error('Creating plans from products is not implemented yet');
      }

      // Create subscription
      const subscriptionData = {
        plan_id: planId,
        application_context: {
          return_url: successUrl,
          cancel_url: cancelUrl,
          brand_name: metadata.brandName || 'Your Store',
          user_action: 'SUBSCRIBE_NOW'
        }
      };

      // Add customer info if available
      if (customerEmail) {
        subscriptionData.subscriber = {
          email_address: customerEmail
        };
      }

      // Create subscription
      const subscription = await apiRequest('/v1/billing/subscriptions', 'POST', subscriptionData);

      // Find approval URL
      const approvalUrl = subscription.links.find(link => link.rel === 'approve').href;

      return {
        id: subscription.id,
        url: approvalUrl,
        status: subscription.status,
        mode: 'subscription',
        metadata
      };
    } else {
      throw new Error(`Unsupported checkout mode: ${mode}`);
    }
  }

  /**
   * Create a subscription
   * @param {Object} options - Subscription options
   * @returns {Promise<Object>} Subscription
   */
  async function createSubscription(options) {
    const {
      customerId,
      customerEmail,
      priceId,
      planId,
      metadata = {},
      paymentMethodId
    } = options;

    // Validate required options
    if (!priceId && !planId) {
      throw new Error('Price ID or Plan ID is required');
    }

    if (!customerEmail) {
      throw new Error('Customer email is required');
    }

    // Use provided plan ID or price ID
    const subscriptionPlanId = planId || priceId;

    // Create subscription
    const subscriptionData = {
      plan_id: subscriptionPlanId,
      subscriber: {
        email_address: customerEmail
      },
      application_context: {
        brand_name: metadata.brandName || 'Your Store',
        user_action: 'SUBSCRIBE_NOW'
      }
    };

    // Create subscription
    const subscription = await apiRequest('/v1/billing/subscriptions', 'POST', subscriptionData);

    return {
      id: subscription.id,
      status: subscription.status,
      customerId: customerId || subscription.subscriber.email_address,
      planId: subscriptionPlanId,
      metadata,
      startDate: subscription.start_time,
      endDate: subscription.billing_info?.next_billing_time || null
    };
  }

  /**
   * Get a subscription
   * @param {Object} options - Subscription options
   * @returns {Promise<Object>} Subscription
   */
  async function getSubscription(options) {
    const { subscriptionId } = options;

    // Validate required options
    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    // Get subscription
    const subscription = await apiRequest(`/v1/billing/subscriptions/${subscriptionId}`);

    return {
      id: subscription.id,
      status: subscription.status,
      customerId: subscription.subscriber.email_address,
      planId: subscription.plan_id,
      metadata: subscription.custom_id ? JSON.parse(subscription.custom_id) : {},
      startDate: subscription.start_time,
      endDate: subscription.billing_info?.next_billing_time || null
    };
  }

  /**
   * Cancel a subscription
   * @param {Object} options - Subscription options
   * @returns {Promise<Object>} Cancellation result
   */
  async function cancelSubscription(options) {
    const { subscriptionId, atPeriodEnd = false, reason = 'Canceled by customer' } = options;

    // Validate required options
    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    // Cancel subscription
    if (atPeriodEnd) {
      // Suspend subscription (will be canceled at period end)
      await apiRequest(`/v1/billing/subscriptions/${subscriptionId}/suspend`, 'POST', {
        reason
      });

      return {
        id: subscriptionId,
        status: 'SUSPENDED',
        canceledAt: new Date().toISOString(),
        cancelAtPeriodEnd: true
      };
    } else {
      // Cancel subscription immediately
      await apiRequest(`/v1/billing/subscriptions/${subscriptionId}/cancel`, 'POST', {
        reason
      });

      return {
        id: subscriptionId,
        status: 'CANCELED',
        canceledAt: new Date().toISOString(),
        cancelAtPeriodEnd: false
      };
    }
  }

  /**
   * Handle a webhook event
   * @param {Object} options - Webhook options
   * @returns {Promise<Object>} Webhook handling result
   */
  async function handleWebhook(options) {
    const { body, headers, signature } = options;

    // Parse webhook event
    let event;
    try {
      // Parse body if it's a string
      const eventData = typeof body === 'string' ? JSON.parse(body) : body;
      
      // Verify webhook signature if webhook ID is provided
      if (config.webhookId && signature) {
        // TODO: Implement webhook signature verification
        // This would require the PayPal webhook ID and the webhook signature
      }
      
      event = eventData;
    } catch (error) {
      throw new Error(`Invalid webhook payload: ${error.message}`);
    }

    // Map PayPal event types to standardized event types
    const eventTypeMap = {
      'PAYMENT.SALE.COMPLETED': 'payment.succeeded',
      'PAYMENT.SALE.REFUNDED': 'payment.refunded',
      'PAYMENT.SALE.REVERSED': 'payment.disputed',
      'BILLING.SUBSCRIPTION.CREATED': 'subscription.created',
      'BILLING.SUBSCRIPTION.ACTIVATED': 'subscription.activated',
      'BILLING.SUBSCRIPTION.UPDATED': 'subscription.updated',
      'BILLING.SUBSCRIPTION.CANCELLED': 'subscription.canceled',
      'BILLING.SUBSCRIPTION.SUSPENDED': 'subscription.paused',
      'BILLING.SUBSCRIPTION.PAYMENT.FAILED': 'invoice.payment_failed'
    };

    // Get standardized event type
    const standardizedEventType = eventTypeMap[event.event_type] || event.event_type;

    // Extract relevant data based on event type
    let eventData = {};
    
    if (event.resource) {
      eventData = {
        id: event.resource.id,
        object: event.resource_type.toLowerCase(),
        created: new Date(event.create_time).getTime() / 1000,
        data: {
          object: event.resource
        }
      };
    }

    return {
      id: event.id,
      event: standardizedEventType,
      data: eventData,
      created: new Date(event.create_time).getTime() / 1000
    };
  }

  // Return provider interface
  return {
    createCheckoutSession,
    createSubscription,
    getSubscription,
    cancelSubscription,
    handleWebhook
  };
}

export default createPayPalProvider;