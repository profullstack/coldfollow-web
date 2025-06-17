import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaymentGateway, createPaymentGateway, createMockProvider } from '../src/index.js';
import EventEmitter from 'eventemitter3';

describe('PaymentGateway', () => {
  let gateway;
  let mockProvider;
  let emittedEvents;

  // Helper to track emitted events
  const trackEvent = (eventName, data) => {
    emittedEvents.push({ eventName, data });
  };

  beforeEach(() => {
    // Reset emitted events
    emittedEvents = [];

    // Create a mock provider with controlled behavior
    mockProvider = {
      createCheckoutSession: vi.fn(async (opts) => ({ id: 'sess_123', ...opts })),
      createSubscription: vi.fn(async (opts) => ({ id: 'sub_123', ...opts })),
      getSubscription: vi.fn(async (opts) => ({ id: 'sub_123', ...opts })),
      cancelSubscription: vi.fn(async (opts) => ({ canceled: true, ...opts })),
      handleWebhook: vi.fn(async (opts) => ({ event: 'test_event', ...opts })),
      createCustomer: vi.fn(async (opts) => ({ id: 'cus_123', ...opts })),
      getCustomer: vi.fn(async (opts) => ({ id: 'cus_123', ...opts })),
      updateCustomer: vi.fn(async (opts) => ({ id: 'cus_123', ...opts })),
      createPaymentMethod: vi.fn(async (opts) => ({ id: 'pm_123', ...opts })),
      getPaymentMethods: vi.fn(async (opts) => [{ id: 'pm_123', ...opts }]),
      createProduct: vi.fn(async (opts) => ({ id: 'prod_123', ...opts })),
      createPrice: vi.fn(async (opts) => ({ id: 'price_123', ...opts })),
      createPayment: vi.fn(async (opts) => ({ id: 'pay_123', ...opts })),
    };

    // Create the gateway with the mock provider
    gateway = new PaymentGateway({
      providers: { mock: mockProvider },
      defaultProvider: 'mock',
      debug: true,
      products: {
        'prod_existing': { id: 'prod_existing', default_price: 'price_default' }
      },
      prices: {
        'price_direct': { id: 'price_direct' },
        'prod_with_plans': {
          'monthly_usd': { id: 'price_monthly' },
          'yearly_usd': { id: 'price_yearly' }
        }
      }
    });

    // Track emitted events
    gateway.on('checkout.created', (data) => trackEvent('checkout.created', data));
    gateway.on('subscription.created', (data) => trackEvent('subscription.created', data));
    gateway.on('subscription.canceled', (data) => trackEvent('subscription.canceled', data));
    gateway.on('webhook.test_event', (data) => trackEvent('webhook.test_event', data));
    gateway.on('customer.created', (data) => trackEvent('customer.created', data));
    gateway.on('customer.updated', (data) => trackEvent('customer.updated', data));
    gateway.on('paymentMethod.created', (data) => trackEvent('paymentMethod.created', data));
    gateway.on('product.created', (data) => trackEvent('product.created', data));
    gateway.on('price.created', (data) => trackEvent('price.created', data));
    gateway.on('payment.created', (data) => trackEvent('payment.created', data));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization and Provider Management', () => {
    it('initializes with default options when none provided', () => {
      const emptyGateway = new PaymentGateway();
      expect(emptyGateway.providers).toEqual({});
      expect(emptyGateway.defaultProvider).toBeNull();
      expect(emptyGateway.products).toEqual({});
      expect(emptyGateway.prices).toEqual({});
    });

    it('registers and retrieves providers', () => {
      expect(gateway.getProvider('mock')).toBe(mockProvider);
      expect(() => gateway.getProvider('none')).toThrow();
    });

    it('throws if provider name is invalid', () => {
      expect(() => gateway.registerProvider(null, mockProvider)).toThrow();
      expect(() => gateway.registerProvider('', mockProvider)).toThrow();
      expect(() => gateway.registerProvider(123, mockProvider)).toThrow();
    });

    it('throws if provider is invalid', () => {
      expect(() => gateway.registerProvider('invalid', null)).toThrow();
      expect(() => gateway.registerProvider('invalid', 'not-an-object')).toThrow();
    });

    it('throws if provider is missing required methods', () => {
      const incompleteProvider = {
        createCheckoutSession: () => {},
        // Missing other required methods
      };
      expect(() => gateway.registerProvider('incomplete', incompleteProvider)).toThrow();
    });

    it('sets first registered provider as default if none specified', () => {
      const newGateway = new PaymentGateway();
      newGateway.registerProvider('test', mockProvider);
      expect(newGateway.defaultProvider).toBe('test');
    });

    it('creates a gateway with factory function', () => {
      const factoryGateway = createPaymentGateway({
        providers: { mock: mockProvider },
        defaultProvider: 'mock'
      });
      expect(factoryGateway).toBeInstanceOf(PaymentGateway);
      expect(factoryGateway.getProvider('mock')).toBe(mockProvider);
    });
  });

  describe('Checkout Sessions', () => {
    it('creates a checkout session', async () => {
      const session = await gateway.createCheckoutSession({ priceId: 'price_1' });
      expect(session.id).toBe('sess_123');
      expect(mockProvider.createCheckoutSession).toHaveBeenCalledWith({ priceId: 'price_1' });
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].eventName).toBe('checkout.created');
    });

    it('resolves price ID from product ID and plan ID', async () => {
      await gateway.createCheckoutSession({ 
        productId: 'prod_with_plans', 
        planId: 'monthly',
        currency: 'usd'
      });
      
      expect(mockProvider.createCheckoutSession).toHaveBeenCalledWith({ 
        productId: 'prod_with_plans', 
        planId: 'monthly',
        currency: 'usd',
        priceId: 'price_monthly'
      });
    });

    it('resolves price ID from product default price', async () => {
      await gateway.createCheckoutSession({ productId: 'prod_existing' });
      
      expect(mockProvider.createCheckoutSession).toHaveBeenCalledWith({ 
        productId: 'prod_existing',
        priceId: 'price_default'
      });
    });

    it('handles errors in checkout session creation', async () => {
      mockProvider.createCheckoutSession.mockRejectedValueOnce(new Error('API error'));
      
      await expect(gateway.createCheckoutSession({ priceId: 'price_1' }))
        .rejects.toThrow('API error');
      
      expect(emittedEvents).toHaveLength(0);
    });
  });

  describe('Subscriptions', () => {
    it('creates a subscription', async () => {
      const sub = await gateway.createSubscription({ 
        priceId: 'price_1', 
        customerId: 'cus_1' 
      });
      
      expect(sub.id).toBe('sub_123');
      expect(mockProvider.createSubscription).toHaveBeenCalledWith({ 
        priceId: 'price_1', 
        customerId: 'cus_1' 
      });
      
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].eventName).toBe('subscription.created');
    });

    it('resolves price ID for subscription from plan ID', async () => {
      await gateway.createSubscription({ 
        planId: 'price_direct', 
        customerId: 'cus_1' 
      });
      
      expect(mockProvider.createSubscription).toHaveBeenCalledWith({ 
        planId: 'price_direct', 
        customerId: 'cus_1',
        priceId: 'price_direct'
      });
    });

    it('gets a subscription', async () => {
      const sub = await gateway.getSubscription({ subscriptionId: 'sub_1' });
      
      expect(sub.id).toBe('sub_123');
      expect(mockProvider.getSubscription).toHaveBeenCalledWith({ 
        subscriptionId: 'sub_1' 
      });
    });

    it('cancels a subscription', async () => {
      const res = await gateway.cancelSubscription({ subscriptionId: 'sub_1' });
      
      expect(res.canceled).toBe(true);
      expect(mockProvider.cancelSubscription).toHaveBeenCalledWith({ 
        subscriptionId: 'sub_1' 
      });
      
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].eventName).toBe('subscription.canceled');
    });

    it('handles errors in subscription operations', async () => {
      mockProvider.createSubscription.mockRejectedValueOnce(new Error('API error'));
      
      await expect(gateway.createSubscription({ 
        priceId: 'price_1', 
        customerId: 'cus_1' 
      })).rejects.toThrow('API error');
      
      expect(emittedEvents).toHaveLength(0);
    });
  });

  describe('Webhooks', () => {
    it('handles webhooks', async () => {
      const result = await gateway.handleWebhook({ 
        body: '{}', 
        headers: {}, 
        signature: 'sig' 
      });
      
      expect(result.event).toBe('test_event');
      expect(mockProvider.handleWebhook).toHaveBeenCalledWith({ 
        body: '{}', 
        headers: {}, 
        signature: 'sig' 
      });
      
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].eventName).toBe('webhook.test_event');
    });

    it('handles webhook errors', async () => {
      mockProvider.handleWebhook.mockRejectedValueOnce(new Error('Webhook error'));
      
      await expect(gateway.handleWebhook({ 
        body: '{}', 
        headers: {}, 
        signature: 'sig' 
      })).rejects.toThrow('Webhook error');
      
      expect(emittedEvents).toHaveLength(0);
    });
  });

  describe('Customers', () => {
    it('creates a customer', async () => {
      const customer = await gateway.createCustomer({ email: 'a@b.com' });
      
      expect(customer.id).toBe('cus_123');
      expect(mockProvider.createCustomer).toHaveBeenCalledWith({ 
        email: 'a@b.com' 
      });
      
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].eventName).toBe('customer.created');
    });

    it('gets a customer', async () => {
      const customer = await gateway.getCustomer({ customerId: 'cus_1' });
      
      expect(customer.id).toBe('cus_123');
      expect(mockProvider.getCustomer).toHaveBeenCalledWith({ 
        customerId: 'cus_1' 
      });
    });

    it('updates a customer', async () => {
      const customer = await gateway.updateCustomer({ 
        customerId: 'cus_1',
        name: 'Updated Name' 
      });
      
      expect(customer.id).toBe('cus_123');
      expect(mockProvider.updateCustomer).toHaveBeenCalledWith({ 
        customerId: 'cus_1',
        name: 'Updated Name'
      });
      
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].eventName).toBe('customer.updated');
    });

    it('throws if provider does not support customer methods', async () => {
      delete mockProvider.createCustomer;
      await expect(gateway.createCustomer({})).rejects.toThrow();
      
      delete mockProvider.getCustomer;
      await expect(gateway.getCustomer({ customerId: 'cus_1' })).rejects.toThrow();
      
      delete mockProvider.updateCustomer;
      await expect(gateway.updateCustomer({ customerId: 'cus_1' })).rejects.toThrow();
    });
  });

  describe('Payment Methods', () => {
    it('creates a payment method', async () => {
      const pm = await gateway.createPaymentMethod({ 
        customerId: 'cus_1', 
        type: 'card', 
        data: {} 
      });
      
      expect(pm.id).toBe('pm_123');
      expect(mockProvider.createPaymentMethod).toHaveBeenCalledWith({ 
        customerId: 'cus_1', 
        type: 'card', 
        data: {} 
      });
      
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].eventName).toBe('paymentMethod.created');
    });

    it('gets payment methods', async () => {
      const methods = await gateway.getPaymentMethods({ customerId: 'cus_1' });
      
      expect(methods[0].id).toBe('pm_123');
      expect(mockProvider.getPaymentMethods).toHaveBeenCalledWith({ 
        customerId: 'cus_1' 
      });
    });

    it('throws if provider does not support payment method methods', async () => {
      delete mockProvider.createPaymentMethod;
      await expect(gateway.createPaymentMethod({
        customerId: 'cus_1',
        type: 'card'
      })).rejects.toThrow();
      
      delete mockProvider.getPaymentMethods;
      await expect(gateway.getPaymentMethods({ 
        customerId: 'cus_1' 
      })).rejects.toThrow();
    });
  });

  describe('Products and Prices', () => {
    it('creates a product', async () => {
      const product = await gateway.createProduct({ 
        name: 'Test Product' 
      });
      
      expect(product.id).toBe('prod_123');
      expect(mockProvider.createProduct).toHaveBeenCalledWith({ 
        name: 'Test Product' 
      });
      
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].eventName).toBe('product.created');
      expect(gateway.products[product.id]).toBeDefined();
    });

    it('creates a price', async () => {
      const price = await gateway.createPrice({ 
        productId: 'prod_123', 
        unitAmount: 1000,
        currency: 'usd',
        interval: 'month'
      });
      
      expect(price.id).toBe('price_123');
      expect(mockProvider.createPrice).toHaveBeenCalledWith({ 
        productId: 'prod_123', 
        unitAmount: 1000,
        currency: 'usd',
        interval: 'month'
      });
      
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].eventName).toBe('price.created');
      expect(gateway.prices[price.id]).toBeDefined();
    });

    it('adds price to product-specific prices', async () => {
      await gateway.createPrice({ 
        productId: 'prod_123', 
        unitAmount: 1000,
        currency: 'usd',
        interval: 'month'
      });
      
      expect(gateway.prices['prod_123']).toBeDefined();
      expect(gateway.prices['prod_123']['month_usd']).toBeDefined();
    });

    it('throws if provider does not support product/price methods', async () => {
      delete mockProvider.createProduct;
      await expect(gateway.createProduct({ 
        name: 'Test Product' 
      })).rejects.toThrow();
      
      delete mockProvider.createPrice;
      await expect(gateway.createPrice({ 
        productId: 'prod_123', 
        unitAmount: 1000 
      })).rejects.toThrow();
    });
  });

  describe('Payments', () => {
    it('creates a payment', async () => {
      const payment = await gateway.createPayment({ 
        customerId: 'cus_1', 
        amount: 1000,
        currency: 'usd'
      });
      
      expect(payment.id).toBe('pay_123');
      expect(mockProvider.createPayment).toHaveBeenCalledWith({ 
        customerId: 'cus_1', 
        amount: 1000,
        currency: 'usd'
      });
      
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].eventName).toBe('payment.created');
    });

    it('throws if provider does not support payment methods', async () => {
      delete mockProvider.createPayment;
      await expect(gateway.createPayment({ 
        customerId: 'cus_1', 
        amount: 1000 
      })).rejects.toThrow();
    });
  });

  describe('Price Resolution', () => {
    it('resolves price ID from direct plan ID', () => {
      const priceId = gateway._resolvePriceId({ planId: 'price_direct' });
      expect(priceId).toBe('price_direct');
    });

    it('resolves price ID from product and plan', () => {
      const priceId = gateway._resolvePriceId({ 
        productId: 'prod_with_plans', 
        planId: 'monthly',
        currency: 'usd'
      });
      expect(priceId).toBe('price_monthly');
    });

    it('resolves price ID from product default price', () => {
      const priceId = gateway._resolvePriceId({ productId: 'prod_existing' });
      expect(priceId).toBe('price_default');
    });

    it('throws if price ID cannot be resolved', () => {
      expect(() => gateway._resolvePriceId({ 
        productId: 'non_existent', 
        planId: 'unknown' 
      })).toThrow();
    });
  });

  describe('Mock Provider Integration', () => {
    it('creates and uses a real mock provider', async () => {
      const realMockProvider = createMockProvider({ debug: true });
      const mockGateway = new PaymentGateway({
        providers: { mock: realMockProvider },
        defaultProvider: 'mock'
      });

      // Test checkout session
      const session = await mockGateway.createCheckoutSession({
        priceId: 'price_test',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
      
      expect(session.id).toMatch(/^mock_session_/);
      expect(session.url).toMatch(/^https:\/\/mock-payment-gateway\.com\/checkout\//);
      
      // Test subscription
      const customer = await mockGateway.createCustomer({
        email: 'test@example.com'
      });
      
      const subscription = await mockGateway.createSubscription({
        customerId: customer.id,
        priceId: 'price_test'
      });
      
      expect(subscription.id).toMatch(/^mock_sub_/);
      expect(subscription.status).toBe('active');
      
      // Test webhook
      const webhookResult = await mockGateway.handleWebhook({
        body: JSON.stringify({
          type: 'checkout.session.completed',
          data: { id: session.id }
        }),
        headers: {}
      });
      
      expect(webhookResult.event).toBe('checkout.completed');
    });
  });
});
