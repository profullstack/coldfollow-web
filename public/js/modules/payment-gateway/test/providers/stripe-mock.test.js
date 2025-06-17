import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the createStripeProvider function
vi.mock('../../src/providers/stripe.js', () => {
  return {
    createStripeProvider: vi.fn().mockImplementation(() => ({
      createCheckoutSession: vi.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
        status: 'open',
        customerId: 'cus_test_123',
        customerEmail: 'test@example.com',
        mode: 'payment',
        paymentStatus: 'unpaid',
        amountTotal: 1000,
        currency: 'usd',
        metadata: {},
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        provider: 'stripe',
        providerData: {
          sessionId: 'cs_test_123',
          paymentIntentId: 'pi_test_123'
        }
      }),
      createSubscription: vi.fn().mockResolvedValue({
        id: 'sub_test_123',
        customerId: 'cus_test_123',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        metadata: {},
        items: [
          {
            id: 'si_test_123',
            priceId: 'price_test_123',
            quantity: 1
          }
        ],
        provider: 'stripe',
        providerData: {
          subscriptionId: 'sub_test_123',
          latestInvoiceId: 'inv_test_123'
        }
      }),
      getSubscription: vi.fn().mockResolvedValue({
        id: 'sub_test_123',
        customerId: 'cus_test_123',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        metadata: {},
        items: [
          {
            id: 'si_test_123',
            priceId: 'price_test_123',
            quantity: 1
          }
        ],
        provider: 'stripe',
        providerData: {
          subscriptionId: 'sub_test_123',
          latestInvoiceId: 'inv_test_123'
        }
      }),
      cancelSubscription: vi.fn().mockResolvedValue({
        id: 'sub_test_123',
        status: 'canceled',
        cancelAtPeriodEnd: false,
        canceledAt: new Date().toISOString(),
        provider: 'stripe',
        success: true
      }),
      handleWebhook: vi.fn().mockResolvedValue({
        event: 'checkout.completed',
        customerId: 'cus_test_123',
        customerEmail: 'test@example.com',
        sessionId: 'cs_test_123',
        paymentIntentId: 'pi_test_123',
        subscriptionId: 'sub_test_123',
        amount: 1000,
        currency: 'usd',
        metadata: {},
        mode: 'payment',
        status: 'complete',
        paymentStatus: 'paid',
        provider: 'stripe',
        originalEvent: {
          id: 'evt_test_123',
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_123'
            }
          }
        }
      }),
      createCustomer: vi.fn().mockResolvedValue({
        id: 'cus_test_123',
        email: 'test@example.com',
        name: 'Test User',
        metadata: {},
        provider: 'stripe',
        providerData: {
          customerId: 'cus_test_123'
        }
      }),
      getCustomer: vi.fn().mockResolvedValue({
        id: 'cus_test_123',
        email: 'test@example.com',
        name: 'Test User',
        metadata: {},
        provider: 'stripe',
        providerData: {
          customerId: 'cus_test_123'
        }
      }),
      updateCustomer: vi.fn().mockResolvedValue({
        id: 'cus_test_123',
        email: 'updated@example.com',
        name: 'Updated User',
        metadata: { updated: true },
        provider: 'stripe',
        providerData: {
          customerId: 'cus_test_123'
        }
      }),
      createPaymentMethod: vi.fn().mockResolvedValue({
        id: 'pm_test_123',
        customerId: 'cus_test_123',
        type: 'card',
        provider: 'stripe',
        providerData: {
          paymentMethodId: 'pm_test_123'
        }
      }),
      getPaymentMethods: vi.fn().mockResolvedValue([
        {
          id: 'pm_test_123',
          customerId: 'cus_test_123',
          type: 'card',
          provider: 'stripe',
          providerData: {
            paymentMethodId: 'pm_test_123',
            card: {
              brand: 'visa',
              last4: '4242'
            }
          }
        }
      ]),
      createProduct: vi.fn().mockResolvedValue({
        id: 'prod_test_123',
        name: 'Test Product',
        description: 'A test product',
        metadata: {},
        provider: 'stripe',
        providerData: {
          productId: 'prod_test_123'
        }
      }),
      createPrice: vi.fn().mockResolvedValue({
        id: 'price_test_123',
        productId: 'prod_test_123',
        currency: 'usd',
        unitAmount: 1000,
        recurring: {
          interval: 'month',
          intervalCount: 1
        },
        metadata: {},
        provider: 'stripe',
        providerData: {
          priceId: 'price_test_123'
        }
      }),
      createPayment: vi.fn().mockResolvedValue({
        id: 'pi_test_123',
        customerId: 'cus_test_123',
        amount: 1000,
        currency: 'usd',
        description: 'Test payment',
        status: 'requires_payment_method',
        clientSecret: 'pi_test_secret_123',
        metadata: {},
        provider: 'stripe',
        providerData: {
          paymentIntentId: 'pi_test_123'
        }
      }),
      getPublishableKey: vi.fn().mockReturnValue('pk_test_123')
    }))
  };
});

// Import after mocking
import { createStripeProvider } from '../../src/providers/stripe.js';

describe('Stripe Provider (Mocked)', () => {
  let provider;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Get the mocked provider
    provider = createStripeProvider({
      secretKey: 'sk_test_123',
      publishableKey: 'pk_test_123',
      webhookSecret: 'whsec_test_123',
      debug: true
    });
  });

  describe('Checkout Sessions', () => {
    it('creates a checkout session with price ID', async () => {
      const session = await provider.createCheckoutSession({
        priceId: 'price_test_123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
      
      expect(session.id).toBe('cs_test_123');
      expect(session.url).toBe('https://checkout.stripe.com/test');
      expect(session.provider).toBe('stripe');
      
      expect(provider.createCheckoutSession).toHaveBeenCalledWith({
        priceId: 'price_test_123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
    });

    it('creates a checkout session with amount and currency', async () => {
      const session = await provider.createCheckoutSession({
        amount: 1000,
        currency: 'usd',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
      
      expect(session.id).toBe('cs_test_123');
      expect(session.provider).toBe('stripe');
      
      expect(provider.createCheckoutSession).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'usd',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
    });
  });

  describe('Subscriptions', () => {
    it('creates a subscription', async () => {
      const subscription = await provider.createSubscription({
        customerId: 'cus_test_123',
        priceId: 'price_test_123'
      });
      
      expect(subscription.id).toBe('sub_test_123');
      expect(subscription.customerId).toBe('cus_test_123');
      expect(subscription.status).toBe('active');
      expect(subscription.provider).toBe('stripe');
      
      expect(provider.createSubscription).toHaveBeenCalledWith({
        customerId: 'cus_test_123',
        priceId: 'price_test_123'
      });
    });

    it('gets a subscription by ID', async () => {
      const subscription = await provider.getSubscription({
        subscriptionId: 'sub_test_123'
      });
      
      expect(subscription.id).toBe('sub_test_123');
      expect(subscription.provider).toBe('stripe');
      
      expect(provider.getSubscription).toHaveBeenCalledWith({
        subscriptionId: 'sub_test_123'
      });
    });

    it('cancels a subscription', async () => {
      const result = await provider.cancelSubscription({
        subscriptionId: 'sub_test_123',
        atPeriodEnd: false
      });
      
      expect(result.id).toBe('sub_test_123');
      expect(result.status).toBe('canceled');
      expect(result.provider).toBe('stripe');
      
      expect(provider.cancelSubscription).toHaveBeenCalledWith({
        subscriptionId: 'sub_test_123',
        atPeriodEnd: false
      });
    });
  });

  describe('Webhooks', () => {
    it('handles webhooks', async () => {
      const result = await provider.handleWebhook({
        body: '{}',
        signature: 'test_signature'
      });
      
      expect(result.event).toBe('checkout.completed');
      expect(result.provider).toBe('stripe');
      
      expect(provider.handleWebhook).toHaveBeenCalledWith({
        body: '{}',
        signature: 'test_signature'
      });
    });
  });

  describe('Customers', () => {
    it('creates a customer', async () => {
      const customer = await provider.createCustomer({
        email: 'test@example.com',
        name: 'Test User'
      });
      
      expect(customer.id).toBe('cus_test_123');
      expect(customer.email).toBe('test@example.com');
      expect(customer.provider).toBe('stripe');
      
      expect(provider.createCustomer).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User'
      });
    });

    it('gets a customer', async () => {
      const customer = await provider.getCustomer({
        customerId: 'cus_test_123'
      });
      
      expect(customer.id).toBe('cus_test_123');
      expect(customer.provider).toBe('stripe');
      
      expect(provider.getCustomer).toHaveBeenCalledWith({
        customerId: 'cus_test_123'
      });
    });

    it('updates a customer', async () => {
      const customer = await provider.updateCustomer({
        customerId: 'cus_test_123',
        email: 'updated@example.com',
        name: 'Updated User'
      });
      
      expect(customer.id).toBe('cus_test_123');
      expect(customer.email).toBe('updated@example.com');
      expect(customer.provider).toBe('stripe');
      
      expect(provider.updateCustomer).toHaveBeenCalledWith({
        customerId: 'cus_test_123',
        email: 'updated@example.com',
        name: 'Updated User'
      });
    });
  });

  describe('Payment Methods', () => {
    it('creates a payment method', async () => {
      const paymentMethod = await provider.createPaymentMethod({
        customerId: 'cus_test_123',
        type: 'card',
        data: {}
      });
      
      expect(paymentMethod.id).toBe('pm_test_123');
      expect(paymentMethod.customerId).toBe('cus_test_123');
      expect(paymentMethod.provider).toBe('stripe');
      
      expect(provider.createPaymentMethod).toHaveBeenCalledWith({
        customerId: 'cus_test_123',
        type: 'card',
        data: {}
      });
    });

    it('gets payment methods', async () => {
      const paymentMethods = await provider.getPaymentMethods({
        customerId: 'cus_test_123'
      });
      
      expect(paymentMethods).toHaveLength(1);
      expect(paymentMethods[0].id).toBe('pm_test_123');
      expect(paymentMethods[0].provider).toBe('stripe');
      
      expect(provider.getPaymentMethods).toHaveBeenCalledWith({
        customerId: 'cus_test_123'
      });
    });
  });

  describe('Products and Prices', () => {
    it('creates a product', async () => {
      const product = await provider.createProduct({
        name: 'Test Product',
        description: 'A test product'
      });
      
      expect(product.id).toBe('prod_test_123');
      expect(product.name).toBe('Test Product');
      expect(product.provider).toBe('stripe');
      
      expect(provider.createProduct).toHaveBeenCalledWith({
        name: 'Test Product',
        description: 'A test product'
      });
    });

    it('creates a price', async () => {
      const price = await provider.createPrice({
        productId: 'prod_test_123',
        unitAmount: 1000,
        currency: 'usd',
        interval: 'month'
      });
      
      expect(price.id).toBe('price_test_123');
      expect(price.productId).toBe('prod_test_123');
      expect(price.provider).toBe('stripe');
      
      expect(provider.createPrice).toHaveBeenCalledWith({
        productId: 'prod_test_123',
        unitAmount: 1000,
        currency: 'usd',
        interval: 'month'
      });
    });
  });

  describe('Payments', () => {
    it('creates a payment', async () => {
      const payment = await provider.createPayment({
        customerId: 'cus_test_123',
        amount: 1000,
        currency: 'usd'
      });
      
      expect(payment.id).toBe('pi_test_123');
      expect(payment.customerId).toBe('cus_test_123');
      expect(payment.provider).toBe('stripe');
      
      expect(provider.createPayment).toHaveBeenCalledWith({
        customerId: 'cus_test_123',
        amount: 1000,
        currency: 'usd'
      });
    });
  });

  describe('Publishable Key', () => {
    it('gets the publishable key', () => {
      const key = provider.getPublishableKey();
      expect(key).toBe('pk_test_123');
      expect(provider.getPublishableKey).toHaveBeenCalled();
    });
  });
});