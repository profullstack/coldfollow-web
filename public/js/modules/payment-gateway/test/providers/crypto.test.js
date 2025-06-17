import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCryptoProvider } from '../../src/providers/crypto.js';

describe('Crypto Provider', () => {
  let provider;
  let mockExchangeRateProvider;
  let mockVerificationCallback;
  
  beforeEach(() => {
    // Mock exchange rate provider
    mockExchangeRateProvider = vi.fn().mockResolvedValue(20000); // 1 BTC = $20,000
    
    // Mock verification callback
    mockVerificationCallback = vi.fn().mockResolvedValue(true);
    
    // Create a crypto provider with test options
    provider = createCryptoProvider({
      wallets: {
        btc: 'btc_wallet_address',
        eth: 'eth_wallet_address',
        sol: 'sol_wallet_address',
        usdc: 'usdc_wallet_address'
      },
      exchangeRateProviders: {
        btc: mockExchangeRateProvider,
        eth: mockExchangeRateProvider,
        sol: mockExchangeRateProvider,
        usdc: mockExchangeRateProvider
      },
      verificationCallback: mockVerificationCallback,
      debug: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with default options', () => {
      const defaultProvider = createCryptoProvider();
      expect(defaultProvider).toBeDefined();
      expect(typeof defaultProvider.createCheckoutSession).toBe('function');
    });

    it('initializes with provided options', () => {
      expect(provider).toBeDefined();
      expect(typeof provider.createCheckoutSession).toBe('function');
      expect(typeof provider.createSubscription).toBe('function');
      expect(typeof provider.getSubscription).toBe('function');
      expect(typeof provider.cancelSubscription).toBe('function');
      expect(typeof provider.handleWebhook).toBe('function');
      expect(typeof provider.verifyPayment).toBe('function');
    });
  });

  describe('Checkout Sessions', () => {
    it('creates a checkout session with required parameters', async () => {
      const session = await provider.createCheckoutSession({
        customerEmail: 'test@example.com',
        amount: 100, // $100
        coin: 'btc',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
      
      expect(session.id).toMatch(/^crypto_/);
      expect(session.url).toMatch(/^crypto:\/\/btc\/pay/);
      expect(session.status).toBe('pending');
      expect(session.customerEmail).toBe('test@example.com');
      expect(session.amount).toBe(100);
      expect(session.currency).toBe('USD');
      expect(session.provider).toBe('crypto');
      expect(session.providerData.coin).toBe('btc');
      expect(session.providerData.cryptoAmount).toBe(0.005); // $100 / $20,000
      expect(session.providerData.walletAddress).toBe('btc_wallet_address');
      
      // Verify exchange rate provider was called
      expect(mockExchangeRateProvider).toHaveBeenCalledWith('btc', 'USD');
    });

    it('throws if customer email is missing', async () => {
      await expect(provider.createCheckoutSession({
        amount: 100,
        coin: 'btc',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })).rejects.toThrow('Customer email is required');
    });

    it('throws if amount is missing', async () => {
      await expect(provider.createCheckoutSession({
        customerEmail: 'test@example.com',
        coin: 'btc',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })).rejects.toThrow('Amount is required');
    });

    it('throws if coin is missing', async () => {
      await expect(provider.createCheckoutSession({
        customerEmail: 'test@example.com',
        amount: 100,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })).rejects.toThrow('Cryptocurrency is required');
    });

    it('throws if coin is invalid', async () => {
      await expect(provider.createCheckoutSession({
        customerEmail: 'test@example.com',
        amount: 100,
        coin: 'invalid',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })).rejects.toThrow('Invalid cryptocurrency');
    });

    it('throws if wallet address is not configured', async () => {
      const providerWithoutWallets = createCryptoProvider({
        exchangeRateProviders: {
          btc: mockExchangeRateProvider
        }
      });
      
      await expect(providerWithoutWallets.createCheckoutSession({
        customerEmail: 'test@example.com',
        amount: 100,
        coin: 'btc',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })).rejects.toThrow('No wallet address configured for btc');
    });

    it('throws if exchange rate provider is not configured', async () => {
      const providerWithoutExchangeRates = createCryptoProvider({
        wallets: {
          btc: 'btc_wallet_address'
        }
      });
      
      await expect(providerWithoutExchangeRates.createCheckoutSession({
        customerEmail: 'test@example.com',
        amount: 100,
        coin: 'btc',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })).rejects.toThrow('No exchange rate provider configured for btc');
    });
  });

  describe('Subscriptions', () => {
    it('creates a monthly subscription', async () => {
      const subscription = await provider.createSubscription({
        customerEmail: 'test@example.com',
        planId: 'monthly',
        coin: 'btc',
        amount: 10 // $10/month
      });
      
      expect(subscription.id).toMatch(/^crypto_sub_/);
      expect(subscription.customerEmail).toBe('test@example.com');
      expect(subscription.status).toBe('pending');
      expect(subscription.provider).toBe('crypto');
      expect(subscription.providerData.coin).toBe('btc');
      expect(subscription.providerData.cryptoAmount).toBe(0.0005); // $10 / $20,000
      expect(subscription.providerData.walletAddress).toBe('btc_wallet_address');
      
      // Verify exchange rate provider was called
      expect(mockExchangeRateProvider).toHaveBeenCalledWith('btc', 'USD');
    });

    it('creates a yearly subscription', async () => {
      const subscription = await provider.createSubscription({
        customerEmail: 'test@example.com',
        planId: 'yearly',
        coin: 'btc',
        amount: 100 // $100/year
      });
      
      expect(subscription.id).toMatch(/^crypto_sub_/);
      expect(subscription.customerEmail).toBe('test@example.com');
      expect(subscription.status).toBe('pending');
      expect(subscription.provider).toBe('crypto');
      
      // Check that expiration date is roughly 1 year from now
      const expirationDate = new Date(subscription.currentPeriodEnd);
      const now = new Date();
      const oneYearFromNow = new Date(now);
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      // Allow for a few seconds of difference due to test execution time
      expect(Math.abs(expirationDate.getTime() - oneYearFromNow.getTime())).toBeLessThan(5000);
    });

    it('throws if customer email is missing', async () => {
      await expect(provider.createSubscription({
        planId: 'monthly',
        coin: 'btc',
        amount: 10
      })).rejects.toThrow('Customer email is required');
    });

    it('throws if plan ID is missing', async () => {
      await expect(provider.createSubscription({
        customerEmail: 'test@example.com',
        coin: 'btc',
        amount: 10
      })).rejects.toThrow('Plan ID is required');
    });

    it('throws if coin is missing', async () => {
      await expect(provider.createSubscription({
        customerEmail: 'test@example.com',
        planId: 'monthly',
        amount: 10
      })).rejects.toThrow('Cryptocurrency is required');
    });

    it('throws if amount is missing', async () => {
      await expect(provider.createSubscription({
        customerEmail: 'test@example.com',
        planId: 'monthly',
        coin: 'btc'
      })).rejects.toThrow('Amount is required');
    });

    it('throws if plan ID is invalid', async () => {
      await expect(provider.createSubscription({
        customerEmail: 'test@example.com',
        planId: 'invalid',
        coin: 'btc',
        amount: 10
      })).rejects.toThrow('Invalid plan ID');
    });

    it('gets a subscription by ID', async () => {
      // Temporarily disable verification callback for this test
      const originalCallback = mockVerificationCallback;
      mockVerificationCallback.mockResolvedValueOnce(false);
      
      // First create a subscription
      const subscription = await provider.createSubscription({
        customerEmail: 'test@example.com',
        planId: 'monthly',
        coin: 'btc',
        amount: 10
      });
      
      // Then get it
      const retrievedSubscription = await provider.getSubscription({
        subscriptionId: subscription.id
      });
      
      expect(retrievedSubscription.id).toBe(subscription.id);
      expect(retrievedSubscription.customerEmail).toBe('test@example.com');
      expect(retrievedSubscription.status).toBe('pending');
      expect(retrievedSubscription.provider).toBe('crypto');
      
      // Restore original behavior
      mockVerificationCallback.mockImplementation(originalCallback);
    });

    it('gets a subscription by customer email', async () => {
      // Temporarily disable verification callback for this test
      const originalCallback = mockVerificationCallback;
      mockVerificationCallback.mockResolvedValueOnce(false);
      
      // First create a subscription
      const subscription = await provider.createSubscription({
        customerEmail: 'test@example.com',
        planId: 'monthly',
        coin: 'btc',
        amount: 10
      });
      
      // Then get it
      const retrievedSubscription = await provider.getSubscription({
        customerEmail: 'test@example.com'
      });
      
      expect(retrievedSubscription.id).toBe(subscription.id);
      expect(retrievedSubscription.customerEmail).toBe('test@example.com');
      expect(retrievedSubscription.status).toBe('pending');
      expect(retrievedSubscription.provider).toBe('crypto');
      
      // Restore original behavior
      mockVerificationCallback.mockImplementation(originalCallback);
    });

    it('returns null if subscription is not found', async () => {
      const result = await provider.getSubscription({
        subscriptionId: 'non_existent'
      });
      
      expect(result).toBeNull();
    });

    it('verifies subscription payment when getting a subscription', async () => {
      // First create a subscription
      const subscription = await provider.createSubscription({
        customerEmail: 'test@example.com',
        planId: 'monthly',
        coin: 'btc',
        amount: 10
      });
      
      // Then get it, which should trigger verification
      const retrievedSubscription = await provider.getSubscription({
        subscriptionId: subscription.id
      });
      
      // Verify verification callback was called
      expect(mockVerificationCallback).toHaveBeenCalled();
      expect(retrievedSubscription.status).toBe('active');
      expect(retrievedSubscription.providerData.paymentStatus).toBe('paid');
    });

    it('cancels a subscription', async () => {
      // First create a subscription
      const subscription = await provider.createSubscription({
        customerEmail: 'test@example.com',
        planId: 'monthly',
        coin: 'btc',
        amount: 10
      });
      
      // Then cancel it
      const result = await provider.cancelSubscription({
        subscriptionId: subscription.id
      });
      
      expect(result.id).toBe(subscription.id);
      expect(result.status).toBe('canceled');
      expect(result.canceledAt).not.toBeNull();
      expect(result.provider).toBe('crypto');
      expect(result.success).toBe(true);
      
      // Verify the subscription was updated
      const retrievedSubscription = await provider.getSubscription({
        subscriptionId: subscription.id
      });
      
      expect(retrievedSubscription.status).toBe('canceled');
      expect(retrievedSubscription.canceledAt).not.toBeNull();
    });

    it('throws if subscription ID is missing when canceling', async () => {
      await expect(provider.cancelSubscription({})).rejects.toThrow('Subscription ID is required');
    });

    it('throws if subscription is not found when canceling', async () => {
      await expect(provider.cancelSubscription({
        subscriptionId: 'non_existent'
      })).rejects.toThrow('Subscription non_existent not found');
    });
  });

  describe('Webhooks', () => {
    it('handles subscription payment webhook', async () => {
      // First create a subscription
      const subscription = await provider.createSubscription({
        customerEmail: 'test@example.com',
        planId: 'monthly',
        coin: 'btc',
        amount: 10
      });
      
      // Then handle webhook
      const result = await provider.handleWebhook({
        body: JSON.stringify({
          address: 'btc_wallet_address',
          txid: 'test_transaction_id',
          coin: 'btc',
          amount: 0.0005
        })
      });
      
      expect(result.event).toBe('subscription.paid');
      expect(result.subscriptionId).toBe(subscription.id);
      expect(result.customerEmail).toBe('test@example.com');
      expect(result.transactionId).toBe('test_transaction_id');
      expect(result.coin).toBe('btc');
      expect(result.status).toBe('active');
      expect(result.provider).toBe('crypto');
      
      // Verify the subscription was updated
      const retrievedSubscription = await provider.getSubscription({
        subscriptionId: subscription.id
      });
      
      expect(retrievedSubscription.status).toBe('active');
      expect(retrievedSubscription.providerData.paymentStatus).toBe('paid');
      expect(retrievedSubscription.providerData.transactionId).toBe('test_transaction_id');
    });

    it('handles payment webhook', async () => {
      // First create a checkout session
      const session = await provider.createCheckoutSession({
        customerEmail: 'test@example.com',
        amount: 100,
        coin: 'btc',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
      
      // Then handle webhook
      const result = await provider.handleWebhook({
        body: JSON.stringify({
          address: 'btc_wallet_address',
          txid: 'test_transaction_id',
          coin: 'btc',
          amount: 0.005
        })
      });
      
      expect(result.event).toBe('payment.completed');
      expect(result.paymentId).toBe(session.id);
      expect(result.customerEmail).toBe('test@example.com');
      expect(result.transactionId).toBe('test_transaction_id');
      expect(result.coin).toBe('btc');
      expect(result.status).toBe('completed');
      expect(result.provider).toBe('crypto');
    });

    it('throws if webhook body is missing', async () => {
      await expect(provider.handleWebhook({})).rejects.toThrow('Webhook body is required');
    });

    it('throws if webhook data is invalid', async () => {
      await expect(provider.handleWebhook({
        body: JSON.stringify({
          // Missing required fields
          amount: 0.005
        })
      })).rejects.toThrow('Invalid webhook data');
    });

    it('throws if no matching subscription or payment is found', async () => {
      await expect(provider.handleWebhook({
        body: JSON.stringify({
          address: 'non_existent_address',
          txid: 'test_transaction_id',
          coin: 'btc',
          amount: 0.005
        })
      })).rejects.toThrow('No matching subscription or payment found');
    });
  });

  describe('Payment Verification', () => {
    it('verifies a subscription payment', async () => {
      // First create a subscription
      const subscription = await provider.createSubscription({
        customerEmail: 'test@example.com',
        planId: 'monthly',
        coin: 'btc',
        amount: 10
      });
      
      // Then verify payment
      const result = await provider.verifyPayment({
        subscriptionId: subscription.id,
        transactionId: 'test_transaction_id'
      });
      
      expect(result).toBe(true);
      expect(mockVerificationCallback).toHaveBeenCalled();
      
      // Verify the subscription was updated
      const retrievedSubscription = await provider.getSubscription({
        subscriptionId: subscription.id
      });
      
      expect(retrievedSubscription.status).toBe('active');
      expect(retrievedSubscription.providerData.paymentStatus).toBe('paid');
      expect(retrievedSubscription.providerData.transactionId).toBe('test_transaction_id');
    });

    it('verifies a payment', async () => {
      // First create a checkout session
      const session = await provider.createCheckoutSession({
        customerEmail: 'test@example.com',
        amount: 100,
        coin: 'btc',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
      
      // Then verify payment
      const result = await provider.verifyPayment({
        paymentId: session.id,
        transactionId: 'test_transaction_id'
      });
      
      expect(result).toBe(true);
      expect(mockVerificationCallback).toHaveBeenCalled();
    });

    it('throws if subscription ID and payment ID are missing', async () => {
      await expect(provider.verifyPayment({
        transactionId: 'test_transaction_id'
      })).rejects.toThrow('Either subscription ID or payment ID is required');
    });

    it('throws if transaction ID is missing', async () => {
      await expect(provider.verifyPayment({
        subscriptionId: 'test_subscription_id'
      })).rejects.toThrow('Transaction ID is required');
    });

    it('throws if subscription is not found', async () => {
      await expect(provider.verifyPayment({
        subscriptionId: 'non_existent',
        transactionId: 'test_transaction_id'
      })).rejects.toThrow('Subscription not found');
    });
  });

  describe('Event Emission', () => {
    it('emits events when subscription is paid', async () => {
      // Create event listener
      const eventHandler = vi.fn();
      provider.on('subscription.paid', eventHandler);
      
      // Create subscription
      const subscription = await provider.createSubscription({
        customerEmail: 'test@example.com',
        planId: 'monthly',
        coin: 'btc',
        amount: 10
      });
      
      // Verify payment
      await provider.verifyPayment({
        subscriptionId: subscription.id,
        transactionId: 'test_transaction_id'
      });
      
      // Verify event was emitted
      expect(eventHandler).toHaveBeenCalled();
      expect(eventHandler.mock.calls[0][0].id).toBe(subscription.id);
    });

    it('emits events when payment is completed', async () => {
      // Create event listener
      const eventHandler = vi.fn();
      provider.on('payment.completed', eventHandler);
      
      // Create checkout session
      const session = await provider.createCheckoutSession({
        customerEmail: 'test@example.com',
        amount: 100,
        coin: 'btc',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      });
      
      // Verify payment
      await provider.verifyPayment({
        paymentId: session.id,
        transactionId: 'test_transaction_id'
      });
      
      // Verify event was emitted
      expect(eventHandler).toHaveBeenCalled();
      expect(eventHandler.mock.calls[0][0].id).toBe(session.id);
    });
  });
});