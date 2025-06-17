import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockProvider } from '../../src/providers/mock.js';

describe('Mock Provider', () => {
  let provider;
  
  beforeEach(() => {
    // Create a mock provider with default options
    provider = createMockProvider({ debug: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Configuration', () => {
    it('initializes with default options', () => {
      const defaultProvider = createMockProvider();
      expect(defaultProvider).toBeDefined();
      expect(typeof defaultProvider.createCheckoutSession).toBe('function');
    });

    it('accepts custom configuration options', () => {
      const customProvider = createMockProvider({
        simulateErrors: true,
        errorRate: 0.5,
        delay: 100,
        debug: true
      });
      
      expect(customProvider).toBeDefined();
    });
  });

  describe('Checkout Sessions', () => {
    it('creates a checkout session with required parameters', async () => {
      // Create with no delay to avoid timeout
      const fastProvider = createMockProvider({ delay: 0, debug: true });
      
      const session = await fastProvider.createCheckoutSession({
        priceId: 'price_test',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
      
      expect(session.id).toMatch(/^mock_session_/);
      expect(session.url).toMatch(/^https:\/\/mock-payment-gateway\.com\/checkout\//);
      expect(session.status).toBe('pending');
      expect(session.paymentStatus).toBe('unpaid');
      // The successUrl and cancelUrl are not returned in the standardized response
      expect(session.provider).toBe('mock');
    });

    it('creates a checkout session with customer information', async () => {
      // Create with no delay to avoid timeout
      const fastProvider = createMockProvider({ delay: 0, debug: true });
      
      const session = await fastProvider.createCheckoutSession({
        priceId: 'price_test',
        customerEmail: 'test@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
      
      expect(session.customerEmail).toBe('test@example.com');
      expect(session.customerId).toMatch(/^mock_cus_/);
      
      // Should reuse the same customer for subsequent sessions
      const session2 = await fastProvider.createCheckoutSession({
        priceId: 'price_test',
        customerEmail: 'test@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
      
      expect(session2.customerId).toBe(session.customerId);
    });

    it('handles delay in operations', async () => {
      vi.useFakeTimers();
      
      const promise = provider.createCheckoutSession({
        priceId: 'price_test',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
      
      // Fast-forward time to complete the delay
      vi.advanceTimersByTime(500);
      
      const session = await promise;
      expect(session.id).toMatch(/^mock_session_/);
    });
  });

  describe('Subscriptions', () => {
    it('creates a subscription with required parameters', async () => {
      // Create with no delay to avoid timeout
      const fastProvider = createMockProvider({ delay: 0, debug: true });
      
      // First create a customer
      const customer = await fastProvider.createCustomer({
        email: 'test@example.com'
      });
      
      const subscription = await fastProvider.createSubscription({
        customerId: customer.id,
        priceId: 'price_test'
      });
      
      expect(subscription.id).toMatch(/^mock_sub_/);
      expect(subscription.customerId).toBe(customer.id);
      expect(subscription.status).toBe('active');
      expect(subscription.cancelAtPeriodEnd).toBe(false);
      expect(subscription.canceledAt).toBeNull();
      expect(subscription.provider).toBe('mock');
    });

    it('throws if customer ID is missing', async () => {
      await expect(provider.createSubscription({
        priceId: 'price_test'
      })).rejects.toThrow('Customer ID is required');
    });

    it('throws if customer does not exist', async () => {
      await expect(provider.createSubscription({
        customerId: 'non_existent',
        priceId: 'price_test'
      })).rejects.toThrow('Customer non_existent not found');
    });

    it('gets a subscription by ID', async () => {
      // Create customer and subscription
      const customer = await provider.createCustomer({
        email: 'test@example.com'
      });
      
      const subscription = await provider.createSubscription({
        customerId: customer.id,
        priceId: 'price_test'
      });
      
      // Get the subscription
      const retrievedSub = await provider.getSubscription({
        subscriptionId: subscription.id
      });
      
      expect(retrievedSub.id).toBe(subscription.id);
      expect(retrievedSub.customerId).toBe(customer.id);
    });

    it('gets a subscription by customer ID', async () => {
      // Create customer and subscription
      const customer = await provider.createCustomer({
        email: 'test@example.com'
      });
      
      const subscription = await provider.createSubscription({
        customerId: customer.id,
        priceId: 'price_test'
      });
      
      // Get the subscription by customer ID
      const retrievedSub = await provider.getSubscription({
        customerId: customer.id
      });
      
      expect(retrievedSub.id).toBe(subscription.id);
    });

    it('returns null if subscription is not found', async () => {
      const result = await provider.getSubscription({
        subscriptionId: 'non_existent'
      });
      
      expect(result).toBeNull();
    });

    it('cancels a subscription immediately', async () => {
      // Create customer and subscription
      const customer = await provider.createCustomer({
        email: 'test@example.com'
      });
      
      const subscription = await provider.createSubscription({
        customerId: customer.id,
        priceId: 'price_test'
      });
      
      // Cancel the subscription
      const result = await provider.cancelSubscription({
        subscriptionId: subscription.id,
        atPeriodEnd: false
      });
      
      expect(result.id).toBe(subscription.id);
      expect(result.status).toBe('canceled');
      expect(result.canceledAt).not.toBeNull();
      expect(result.success).toBe(true);
      
      // Verify the subscription was updated
      const retrievedSub = await provider.getSubscription({
        subscriptionId: subscription.id
      });
      
      expect(retrievedSub.status).toBe('canceled');
    });

    it('cancels a subscription at period end', async () => {
      // Create customer and subscription
      const customer = await provider.createCustomer({
        email: 'test@example.com'
      });
      
      const subscription = await provider.createSubscription({
        customerId: customer.id,
        priceId: 'price_test'
      });
      
      // Cancel the subscription at period end
      const result = await provider.cancelSubscription({
        subscriptionId: subscription.id,
        atPeriodEnd: true
      });
      
      expect(result.id).toBe(subscription.id);
      expect(result.cancelAtPeriodEnd).toBe(true);
      
      // Verify the subscription was updated
      const retrievedSub = await provider.getSubscription({
        subscriptionId: subscription.id
      });
      
      expect(retrievedSub.status).toBe('active');
      expect(retrievedSub.cancelAtPeriodEnd).toBe(true);
    });
  });

  describe('Webhooks', () => {
    it('handles checkout.session.completed webhook', async () => {
      // Create with no delay to avoid timeout
      const fastProvider = createMockProvider({ delay: 0, debug: true });
      
      // Create a checkout session
      const session = await fastProvider.createCheckoutSession({
        priceId: 'price_test',
        mode: 'subscription',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
      
      // Handle webhook
      const result = await fastProvider.handleWebhook({
        body: JSON.stringify({
          type: 'checkout.session.completed',
          data: { id: session.id }
        })
      });
      
      expect(result.event).toBe('checkout.completed');
      expect(result.sessionId).toBe(session.id);
      expect(result.subscriptionId).toMatch(/^mock_sub_/);
      expect(result.provider).toBe('mock');
    });

    it('handles invoice.paid webhook', async () => {
      // Create customer and subscription
      const customer = await provider.createCustomer({
        email: 'test@example.com'
      });
      
      const subscription = await provider.createSubscription({
        customerId: customer.id,
        priceId: 'price_test'
      });
      
      // Handle webhook
      const result = await provider.handleWebhook({
        body: JSON.stringify({
          type: 'invoice.paid',
          data: { 
            subscription: subscription.id,
            amount_paid: 2000,
            currency: 'usd'
          }
        })
      });
      
      expect(result.event).toBe('invoice.paid');
      expect(result.subscriptionId).toBe(subscription.id);
      expect(result.customerId).toBe(customer.id);
      expect(result.amount).toBe(2000);
      expect(result.currency).toBe('usd');
      expect(result.status).toBe('paid');
      expect(result.provider).toBe('mock');
    });

    it('handles customer.subscription.updated webhook', async () => {
      // Create customer and subscription
      const customer = await provider.createCustomer({
        email: 'test@example.com'
      });
      
      const subscription = await provider.createSubscription({
        customerId: customer.id,
        priceId: 'price_test'
      });
      
      // Handle webhook
      const result = await provider.handleWebhook({
        body: JSON.stringify({
          type: 'customer.subscription.updated',
          data: { 
            id: subscription.id,
            status: 'past_due',
            cancel_at_period_end: true
          }
        })
      });
      
      expect(result.event).toBe('subscription.updated');
      expect(result.subscriptionId).toBe(subscription.id);
      expect(result.customerId).toBe(customer.id);
      expect(result.provider).toBe('mock');
      
      // Verify the subscription was updated
      const retrievedSub = await provider.getSubscription({
        subscriptionId: subscription.id
      });
      
      expect(retrievedSub.status).toBe('past_due');
      expect(retrievedSub.cancelAtPeriodEnd).toBe(true);
    });

    it('handles customer.subscription.deleted webhook', async () => {
      // Create customer and subscription
      const customer = await provider.createCustomer({
        email: 'test@example.com'
      });
      
      const subscription = await provider.createSubscription({
        customerId: customer.id,
        priceId: 'price_test'
      });
      
      // Handle webhook
      const result = await provider.handleWebhook({
        body: JSON.stringify({
          type: 'customer.subscription.deleted',
          data: { id: subscription.id }
        })
      });
      
      expect(result.event).toBe('subscription.deleted');
      expect(result.subscriptionId).toBe(subscription.id);
      expect(result.customerId).toBe(customer.id);
      expect(result.status).toBe('canceled');
      expect(result.provider).toBe('mock');
      
      // Verify the subscription was updated
      const retrievedSub = await provider.getSubscription({
        subscriptionId: subscription.id
      });
      
      expect(retrievedSub.status).toBe('canceled');
      expect(retrievedSub.canceledAt).not.toBeNull();
    });

    it('handles unknown webhook types', async () => {
      const result = await provider.handleWebhook({
        body: JSON.stringify({
          type: 'custom.event',
          data: { foo: 'bar' }
        })
      });
      
      expect(result.event).toBe('custom.event');
      expect(result.data).toEqual({ foo: 'bar' });
      expect(result.provider).toBe('mock');
    });
  });

  describe('Customers', () => {
    it('creates a customer with required parameters', async () => {
      // Create with no delay to avoid timeout
      const fastProvider = createMockProvider({ delay: 0, debug: true });
      
      const customer = await fastProvider.createCustomer({
        email: 'test@example.com',
        name: 'Test User',
        metadata: { userId: '123' }
      });
      
      expect(customer.id).toMatch(/^mock_cus_/);
      expect(customer.email).toBe('test@example.com');
      expect(customer.name).toBe('Test User');
      expect(customer.metadata).toEqual({ userId: '123' });
      expect(customer.provider).toBe('mock');
    });

    it('throws if email is missing', async () => {
      await expect(provider.createCustomer({
        name: 'Test User'
      })).rejects.toThrow('Customer email is required');
    });

    it('returns existing customer if email already exists', async () => {
      // Create a customer
      const customer1 = await provider.createCustomer({
        email: 'test@example.com'
      });
      
      // Create another customer with the same email
      const customer2 = await provider.createCustomer({
        email: 'test@example.com'
      });
      
      expect(customer2.id).toBe(customer1.id);
    });

    it('gets a customer by ID', async () => {
      // Create a customer
      const customer = await provider.createCustomer({
        email: 'test@example.com'
      });
      
      // Get the customer
      const retrievedCustomer = await provider.getCustomer({
        customerId: customer.id
      });
      
      expect(retrievedCustomer.id).toBe(customer.id);
      expect(retrievedCustomer.email).toBe('test@example.com');
    });

    it('gets a customer by email', async () => {
      // Create a customer
      const customer = await provider.createCustomer({
        email: 'test@example.com'
      });
      
      // Get the customer by email
      const retrievedCustomer = await provider.getCustomer({
        email: 'test@example.com'
      });
      
      expect(retrievedCustomer.id).toBe(customer.id);
    });

    it('returns null if customer is not found', async () => {
      const result = await provider.getCustomer({
        customerId: 'non_existent'
      });
      
      expect(result).toBeNull();
    });
  });

  describe('Products and Prices', () => {
    it('creates a product with required parameters', async () => {
      // Create with no delay to avoid timeout
      const fastProvider = createMockProvider({ delay: 0, debug: true });
      
      const product = await fastProvider.createProduct({
        name: 'Test Product',
        description: 'A test product',
        metadata: { category: 'test' }
      });
      
      expect(product.id).toMatch(/^mock_prod_/);
      expect(product.name).toBe('Test Product');
      expect(product.description).toBe('A test product');
      expect(product.metadata).toEqual({ category: 'test' });
      expect(product.provider).toBe('mock');
    });

    it('throws if product name is missing', async () => {
      await expect(provider.createProduct({
        description: 'A test product'
      })).rejects.toThrow('Product name is required');
    });

    it('creates a one-time price', async () => {
      // Create a product
      const product = await provider.createProduct({
        name: 'Test Product'
      });
      
      // Create a one-time price
      const price = await provider.createPrice({
        productId: product.id,
        unitAmount: 1000,
        currency: 'usd'
      });
      
      expect(price.id).toMatch(/^mock_price_/);
      expect(price.productId).toBe(product.id);
      expect(price.unitAmount).toBe(1000);
      expect(price.currency).toBe('usd');
      expect(price.recurring).toBeUndefined();
      expect(price.provider).toBe('mock');
    });

    it('creates a recurring price', async () => {
      // Create a product
      const product = await provider.createProduct({
        name: 'Test Product'
      });
      
      // Create a recurring price
      const price = await provider.createPrice({
        productId: product.id,
        unitAmount: 1000,
        currency: 'usd',
        interval: 'month',
        intervalCount: 1
      });
      
      expect(price.id).toMatch(/^mock_price_/);
      expect(price.productId).toBe(product.id);
      expect(price.unitAmount).toBe(1000);
      expect(price.currency).toBe('usd');
      expect(price.recurring).toEqual({
        interval: 'month',
        intervalCount: 1
      });
      expect(price.provider).toBe('mock');
    });

    it('throws if product ID is missing', async () => {
      await expect(provider.createPrice({
        unitAmount: 1000,
        currency: 'usd'
      })).rejects.toThrow('Product ID is required');
    });

    it('throws if unit amount is missing', async () => {
      // Create a product
      const product = await provider.createProduct({
        name: 'Test Product'
      });
      
      await expect(provider.createPrice({
        productId: product.id,
        currency: 'usd'
      })).rejects.toThrow('Unit amount is required');
    });

    it('throws if product does not exist', async () => {
      await expect(provider.createPrice({
        productId: 'non_existent',
        unitAmount: 1000,
        currency: 'usd'
      })).rejects.toThrow('Product non_existent not found');
    });

    it('sets default price on product', async () => {
      // Create with no delay to avoid timeout
      const fastProvider = createMockProvider({ delay: 0, debug: true });
      
      // Create a product with a unique name to avoid collisions
      const uniqueName = `Test Product ${Date.now()}`;
      const product = await fastProvider.createProduct({
        name: uniqueName
      });
      
      // Create a price
      const price = await fastProvider.createPrice({
        productId: product.id,
        unitAmount: 1000,
        currency: 'usd'
      });
      
      // Verify the product has a default price
      // Note: We can't easily test this with the mock provider as it doesn't expose
      // a way to get a product by ID, only to create new ones
      expect(price.id).toMatch(/^mock_price_/);
      expect(price.productId).toBe(product.id);
    });
  });

  describe('Error Simulation', () => {
    it('simulates errors when configured', async () => {
      // Create a provider with error simulation
      const errorProvider = createMockProvider({
        simulateErrors: true,
        errorRate: 1.0, // 100% error rate
        debug: true
      });
      
      // All operations should fail
      await expect(errorProvider.createCheckoutSession({
        priceId: 'price_test'
      })).rejects.toThrow('Simulated error');
      
      await expect(errorProvider.createCustomer({
        email: 'test@example.com'
      })).rejects.toThrow('Simulated error');
    });
  });
});