/**
 * Basic usage examples for @profullstack/payment-gateway
 */

import { createPaymentGateway, createMockProvider, createStripeProvider } from '../src/index.js';

/**
 * Run the examples
 */
async function runExamples() {
  try {
    console.log('Running payment gateway examples...\n');
    
    // Example 1: Create a payment gateway with mock provider
    console.log('Example 1: Creating a payment gateway with mock provider');
    
    const mockProvider = createMockProvider({
      debug: true,
      simulateErrors: false,
      delay: 100
    });
    
    const gateway = createPaymentGateway({
      providers: {
        mock: mockProvider
      },
      defaultProvider: 'mock',
      debug: true
    });
    
    console.log('Payment gateway created with mock provider');
    console.log();
    
    // Example 2: Create a customer
    console.log('Example 2: Creating a customer');
    
    const customer = await gateway.getProvider('mock').createCustomer({
      email: 'customer@example.com',
      name: 'Example Customer',
      metadata: {
        source: 'example'
      }
    });
    
    console.log('Customer created:', customer);
    console.log();
    
    // Example 3: Create a product and price
    console.log('Example 3: Creating a product and price');
    
    const product = await gateway.getProvider('mock').createProduct({
      name: 'Premium Plan',
      description: 'Access to all premium features',
      metadata: {
        features: 'all'
      }
    });
    
    console.log('Product created:', product);
    
    // Create a monthly price
    const monthlyPrice = await gateway.getProvider('mock').createPrice({
      productId: product.id,
      unitAmount: 1000, // $10.00
      currency: 'usd',
      interval: 'month',
      intervalCount: 1,
      metadata: {
        plan: 'monthly'
      }
    });
    
    console.log('Monthly price created:', monthlyPrice);
    
    // Create a yearly price
    const yearlyPrice = await gateway.getProvider('mock').createPrice({
      productId: product.id,
      unitAmount: 10000, // $100.00
      currency: 'usd',
      interval: 'year',
      intervalCount: 1,
      metadata: {
        plan: 'yearly'
      }
    });
    
    console.log('Yearly price created:', yearlyPrice);
    console.log();
    
    // Example 4: Create a checkout session
    console.log('Example 4: Creating a checkout session');
    
    const checkoutSession = await gateway.createCheckoutSession({
      customerEmail: customer.email,
      priceId: monthlyPrice.id,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      metadata: {
        source: 'example'
      },
      mode: 'subscription'
    });
    
    console.log('Checkout session created:', checkoutSession);
    console.log();
    
    // Example 5: Simulate a completed checkout
    console.log('Example 5: Simulating a completed checkout');
    
    // Listen for webhook events
    gateway.on('webhook.checkout.completed', (data) => {
      console.log('Checkout completed event received:', data);
    });
    
    // Simulate a webhook event
    const webhookResult = await gateway.handleWebhook({
      provider: 'mock',
      body: JSON.stringify({
        type: 'checkout.session.completed',
        data: {
          id: checkoutSession.id,
          customer: customer.id,
          subscription: null
        }
      })
    });
    
    console.log('Webhook handled:', webhookResult);
    console.log();
    
    // Example 6: Create a subscription directly
    console.log('Example 6: Creating a subscription directly');
    
    const subscription = await gateway.createSubscription({
      customerId: customer.id,
      priceId: yearlyPrice.id,
      metadata: {
        source: 'example'
      }
    });
    
    console.log('Subscription created:', subscription);
    console.log();
    
    // Example 7: Get subscription details
    console.log('Example 7: Getting subscription details');
    
    const retrievedSubscription = await gateway.getSubscription({
      subscriptionId: subscription.id
    });
    
    console.log('Subscription retrieved:', retrievedSubscription);
    console.log();
    
    // Example 8: Cancel a subscription
    console.log('Example 8: Canceling a subscription');
    
    const cancelResult = await gateway.cancelSubscription({
      subscriptionId: subscription.id,
      atPeriodEnd: true
    });
    
    console.log('Subscription canceled:', cancelResult);
    console.log();
    
    // Example 9: Using multiple providers
    console.log('Example 9: Using multiple providers');
    
    // This is just for demonstration - in a real app, you would use actual credentials
    try {
      const stripeProvider = createStripeProvider({
        secretKey: 'sk_test_example',
        publishableKey: 'pk_test_example',
        debug: true
      });
      
      const multiProviderGateway = createPaymentGateway({
        providers: {
          mock: mockProvider,
          stripe: stripeProvider
        },
        defaultProvider: 'mock',
        debug: true
      });
      
      console.log('Multi-provider gateway created');
      
      // Use specific provider
      const mockCustomer = await multiProviderGateway.getProvider('mock').getCustomer({
        customerId: customer.id
      });
      
      console.log('Customer retrieved from mock provider:', mockCustomer);
      
      // This would fail in a real app without valid credentials
      console.log('Stripe provider available but not used in this example');
    } catch (error) {
      console.log('Stripe provider example skipped:', error.message);
    }
    console.log();
    
    // Example 10: Handling errors
    console.log('Example 10: Handling errors');
    
    try {
      // Try to get a non-existent subscription
      await gateway.getSubscription({
        subscriptionId: 'non_existent_id'
      });
    } catch (error) {
      console.log('Error handled successfully:', error.message);
    }
    
    // Create a provider with simulated errors
    const errorProvider = createMockProvider({
      debug: true,
      simulateErrors: true,
      errorRate: 1.0, // 100% error rate
      delay: 100
    });
    
    const errorGateway = createPaymentGateway({
      providers: {
        error: errorProvider
      },
      defaultProvider: 'error',
      debug: true
    });
    
    try {
      // This should fail due to simulated error
      await errorGateway.createCheckoutSession({
        customerEmail: 'error@example.com',
        amount: 1000,
        currency: 'usd'
      });
    } catch (error) {
      console.log('Simulated error handled successfully:', error.message);
    }
    
    console.log();
    console.log('All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples
runExamples();