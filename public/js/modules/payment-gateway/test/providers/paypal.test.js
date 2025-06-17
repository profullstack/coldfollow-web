import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPayPalProvider } from '../../src/providers/paypal.js';

// Mock the fetch function
global.fetch = vi.fn();

// Helper to mock fetch responses
function mockFetchResponse(data, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data)
  });
}

describe('PayPal Provider', () => {
  let provider;
  
  beforeEach(() => {
    // Reset fetch mock
    global.fetch.mockReset();
    
    // Mock the token endpoint
    global.fetch.mockImplementationOnce(() => 
      mockFetchResponse({
        access_token: 'test_access_token',
        expires_in: 3600
      })
    );
    
    // Create a PayPal provider with test options
    provider = createPayPalProvider({
      clientId: 'test_client_id',
      clientSecret: 'test_client_secret',
      sandbox: true,
      webhookId: 'test_webhook_id',
      debug: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('throws if client ID is missing', () => {
      expect(() => createPayPalProvider({
        clientSecret: 'test_client_secret'
      })).toThrow('PayPal client ID is required');
    });

    it('throws if client secret is missing', () => {
      expect(() => createPayPalProvider({
        clientId: 'test_client_id'
      })).toThrow('PayPal client secret is required');
    });

    it('initializes with required options', () => {
      expect(provider).toBeDefined();
      expect(typeof provider.createCheckoutSession).toBe('function');
      expect(typeof provider.createSubscription).toBe('function');
      expect(typeof provider.getSubscription).toBe('function');
      expect(typeof provider.cancelSubscription).toBe('function');
      expect(typeof provider.handleWebhook).toBe('function');
    });
  });

  describe('Authentication', () => {
    it('gets an access token', async () => {
      // Mock the orders endpoint
      global.fetch.mockImplementationOnce(() => 
        mockFetchResponse({
          id: 'test_order_id',
          status: 'CREATED',
          links: [
            {
              rel: 'approve',
              href: 'https://www.sandbox.paypal.com/checkoutnow/approve/test_order_id'
            }
          ]
        })
      );
      
      // Call a method that requires authentication
      await provider.createCheckoutSession({
        amount: 1000,
        currency: 'USD',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
      
      // Verify token request
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api-m.sandbox.paypal.com/v1/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': expect.stringContaining('Basic ')
          }),
          body: 'grant_type=client_credentials'
        })
      );
    });
  });

  describe('Checkout Sessions', () => {
    it('creates a payment checkout session', async () => {
      // Mock the orders endpoint
      global.fetch.mockImplementationOnce(() => 
        mockFetchResponse({
          id: 'test_order_id',
          status: 'CREATED',
          links: [
            {
              rel: 'approve',
              href: 'https://www.sandbox.paypal.com/checkoutnow/approve/test_order_id'
            }
          ]
        })
      );
      
      const session = await provider.createCheckoutSession({
        amount: 1000,
        currency: 'USD',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
      
      expect(session.id).toBe('test_order_id');
      expect(session.url).toBe('https://www.sandbox.paypal.com/checkoutnow/approve/test_order_id');
      expect(session.status).toBe('CREATED');
      expect(session.mode).toBe('payment');
      
      // Verify API request
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api-m.sandbox.paypal.com/v2/checkout/orders',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test_access_token'
          }),
          body: expect.stringContaining('"currency_code":"USD"')
        })
      );
    });

    it('creates a subscription checkout session', async () => {
      // Mock the subscriptions endpoint
      global.fetch.mockImplementationOnce(() => 
        mockFetchResponse({
          id: 'test_subscription_id',
          status: 'APPROVAL_PENDING',
          links: [
            {
              rel: 'approve',
              href: 'https://www.sandbox.paypal.com/webapps/billing/subscriptions/approve/test_subscription_id'
            }
          ]
        })
      );
      
      const session = await provider.createCheckoutSession({
        priceId: 'test_plan_id',
        mode: 'subscription',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
      
      expect(session.id).toBe('test_subscription_id');
      expect(session.url).toBe('https://www.sandbox.paypal.com/webapps/billing/subscriptions/approve/test_subscription_id');
      expect(session.status).toBe('APPROVAL_PENDING');
      expect(session.mode).toBe('subscription');
      
      // Verify API request
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api-m.sandbox.paypal.com/v1/billing/subscriptions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test_access_token'
          }),
          body: expect.stringContaining('"plan_id":"test_plan_id"')
        })
      );
    });

    it('throws if success URL is missing', async () => {
      await expect(provider.createCheckoutSession({
        amount: 1000,
        currency: 'USD',
        cancelUrl: 'https://example.com/cancel'
      })).rejects.toThrow('Success URL is required');
    });

    it('throws if cancel URL is missing', async () => {
      await expect(provider.createCheckoutSession({
        amount: 1000,
        currency: 'USD',
        successUrl: 'https://example.com/success'
      })).rejects.toThrow('Cancel URL is required');
    });

    it('throws if amount is missing for payment mode', async () => {
      await expect(provider.createCheckoutSession({
        mode: 'payment',
        currency: 'USD',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })).rejects.toThrow('Amount is required for payment mode');
    });

    it('throws if price ID is missing for subscription mode', async () => {
      await expect(provider.createCheckoutSession({
        mode: 'subscription',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })).rejects.toThrow('Price ID or Product ID is required for subscription mode');
    });

    it('throws for unsupported checkout mode', async () => {
      await expect(provider.createCheckoutSession({
        mode: 'setup',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })).rejects.toThrow('Unsupported checkout mode: setup');
    });
  });

  describe('Subscriptions', () => {
    it('creates a subscription', async () => {
      // Mock the subscriptions endpoint
      global.fetch.mockImplementationOnce(() => 
        mockFetchResponse({
          id: 'test_subscription_id',
          status: 'APPROVAL_PENDING',
          subscriber: {
            email_address: 'test@example.com'
          },
          plan_id: 'test_plan_id',
          start_time: '2025-01-01T00:00:00Z',
          billing_info: {
            next_billing_time: '2025-02-01T00:00:00Z'
          }
        })
      );
      
      const subscription = await provider.createSubscription({
        customerEmail: 'test@example.com',
        priceId: 'test_plan_id'
      });
      
      expect(subscription.id).toBe('test_subscription_id');
      expect(subscription.status).toBe('APPROVAL_PENDING');
      expect(subscription.planId).toBe('test_plan_id');
      expect(subscription.startDate).toBe('2025-01-01T00:00:00Z');
      expect(subscription.endDate).toBe('2025-02-01T00:00:00Z');
      
      // Verify API request
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api-m.sandbox.paypal.com/v1/billing/subscriptions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test_access_token'
          }),
          body: expect.stringContaining('"plan_id":"test_plan_id"')
        })
      );
    });

    it('throws if customer email is missing', async () => {
      await expect(provider.createSubscription({
        priceId: 'test_plan_id'
      })).rejects.toThrow('Customer email is required');
    });

    it('throws if price ID and plan ID are missing', async () => {
      await expect(provider.createSubscription({
        customerEmail: 'test@example.com'
      })).rejects.toThrow('Price ID or Plan ID is required');
    });

    it('gets a subscription', async () => {
      // Mock the subscriptions endpoint
      global.fetch.mockImplementationOnce(() => 
        mockFetchResponse({
          id: 'test_subscription_id',
          status: 'ACTIVE',
          subscriber: {
            email_address: 'test@example.com'
          },
          plan_id: 'test_plan_id',
          start_time: '2025-01-01T00:00:00Z',
          billing_info: {
            next_billing_time: '2025-02-01T00:00:00Z'
          },
          custom_id: '{"userId":"123"}'
        })
      );
      
      const subscription = await provider.getSubscription({
        subscriptionId: 'test_subscription_id'
      });
      
      expect(subscription.id).toBe('test_subscription_id');
      expect(subscription.status).toBe('ACTIVE');
      expect(subscription.customerId).toBe('test@example.com');
      expect(subscription.planId).toBe('test_plan_id');
      expect(subscription.metadata).toEqual({ userId: '123' });
      
      // Verify API request
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api-m.sandbox.paypal.com/v1/billing/subscriptions/test_subscription_id',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test_access_token'
          })
        })
      );
    });

    it('throws if subscription ID is missing when getting a subscription', async () => {
      await expect(provider.getSubscription({})).rejects.toThrow('Subscription ID is required');
    });

    it('cancels a subscription at period end', async () => {
      // Mock the subscriptions endpoint
      global.fetch.mockImplementationOnce(() => 
        mockFetchResponse({
          id: 'test_subscription_id',
          status: 'SUSPENDED'
        })
      );
      
      const result = await provider.cancelSubscription({
        subscriptionId: 'test_subscription_id',
        atPeriodEnd: true,
        reason: 'Customer requested cancellation'
      });
      
      expect(result.id).toBe('test_subscription_id');
      expect(result.status).toBe('SUSPENDED');
      expect(result.cancelAtPeriodEnd).toBe(true);
      
      // Verify API request
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api-m.sandbox.paypal.com/v1/billing/subscriptions/test_subscription_id/suspend',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test_access_token'
          }),
          body: expect.stringContaining('"reason":"Customer requested cancellation"')
        })
      );
    });

    it('cancels a subscription immediately', async () => {
      // Mock the subscriptions endpoint
      global.fetch.mockImplementationOnce(() => 
        mockFetchResponse({
          id: 'test_subscription_id',
          status: 'CANCELED'
        })
      );
      
      const result = await provider.cancelSubscription({
        subscriptionId: 'test_subscription_id',
        atPeriodEnd: false,
        reason: 'Customer requested cancellation'
      });
      
      expect(result.id).toBe('test_subscription_id');
      expect(result.status).toBe('CANCELED');
      expect(result.cancelAtPeriodEnd).toBe(false);
      
      // Verify API request
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api-m.sandbox.paypal.com/v1/billing/subscriptions/test_subscription_id/cancel',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test_access_token'
          }),
          body: expect.stringContaining('"reason":"Customer requested cancellation"')
        })
      );
    });

    it('throws if subscription ID is missing when canceling a subscription', async () => {
      await expect(provider.cancelSubscription({})).rejects.toThrow('Subscription ID is required');
    });
  });

  describe('Webhooks', () => {
    it('handles payment completed webhook', async () => {
      const result = await provider.handleWebhook({
        body: JSON.stringify({
          id: 'WH-123456789',
          event_type: 'PAYMENT.SALE.COMPLETED',
          resource_type: 'sale',
          create_time: '2025-01-01T00:00:00Z',
          resource: {
            id: 'test_payment_id',
            amount: {
              total: '10.00',
              currency: 'USD'
            },
            payment_mode: 'INSTANT_TRANSFER',
            state: 'completed'
          }
        }),
        signature: 'test_signature'
      });
      
      expect(result.id).toBe('WH-123456789');
      expect(result.event).toBe('payment.succeeded');
      // The PayPal provider returns the resource directly in the data.object property
      expect(result.data.id).toBe('test_payment_id');
    });

    it('handles subscription created webhook', async () => {
      const result = await provider.handleWebhook({
        body: JSON.stringify({
          id: 'WH-123456789',
          event_type: 'BILLING.SUBSCRIPTION.CREATED',
          resource_type: 'subscription',
          create_time: '2025-01-01T00:00:00Z',
          resource: {
            id: 'test_subscription_id',
            status: 'ACTIVE',
            plan_id: 'test_plan_id'
          }
        }),
        signature: 'test_signature'
      });
      
      expect(result.id).toBe('WH-123456789');
      expect(result.event).toBe('subscription.created');
      // The PayPal provider returns the resource directly in the data.id property
      expect(result.data.id).toBe('test_subscription_id');
    });

    it('throws if webhook body is missing', async () => {
      await expect(provider.handleWebhook({
        signature: 'test_signature',
        body: undefined
      })).rejects.toThrow();
    });
  });
});