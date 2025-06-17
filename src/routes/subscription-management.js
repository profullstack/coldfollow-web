import { supabase } from '../utils/supabase.js';
import Stripe from 'stripe';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Helper function to get a user ID from an email address
 * @param {string} email - User email
 * @returns {Promise<string|null>} - User ID or null if not found
 */
async function getUserIdFromEmail(email) {
  if (!email) return null;
  
  try {
    // Look up user by email in the users table
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('Error looking up user by email:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Exception looking up user by email:', error);
    return null;
  }
}

// Initialize Stripe with the API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Get subscription details for the current user
 */
export async function getSubscriptionDetails(c) {
  try {
    const user = c.get('user');
    console.log('User from context:', user);
    
    if (!user) {
      console.error('No user found in context');
      return c.json({ error: 'User not authenticated' }, 401);
    }

    // Get user details from the users table (not profiles)
    const userId = user.id || await getUserIdFromEmail(user.email);
    console.log('Using userId for user lookup:', userId);
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return c.json({ error: 'Failed to fetch user profile' }, 500);
    }

    if (!profile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    // Check if user has a subscription
    if (!profile.subscription_id) {
      return c.json({ hasSubscription: false });
    }

    // Variables to hold subscription details
    let subscriptionDetails = {
      hasSubscription: true,
      status: 'Unknown',
      plan: profile.subscription_plan || 'Unknown',
      startDate: null,
      renewalDate: null,
      amount: 0,
      currency: 'USD',
      paymentType: null
    };

    // Check if it's a Stripe subscription
    if (profile.stripe_customer_id && profile.stripe_subscription_id) {
      try {
        // Get Stripe subscription
        const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
        
        // Get payment method
        let paymentMethod = null;
        if (subscription.default_payment_method) {
          paymentMethod = await stripe.paymentMethods.retrieve(subscription.default_payment_method);
        }

        // Get latest invoice
        const invoices = await stripe.invoices.list({
          customer: profile.stripe_customer_id,
          limit: 5,
        });

        // Update subscription details
        subscriptionDetails = {
          ...subscriptionDetails,
          paymentType: 'stripe',
          status: subscription.status === 'active' ? 'Active' : 
                  subscription.status === 'past_due' ? 'Past Due' : 
                  subscription.status === 'canceled' ? 'Canceled' : 
                  subscription.status === 'trialing' ? 'Trial' : 
                  subscription.status,
          startDate: new Date(subscription.start_date * 1000).toISOString(),
          renewalDate: new Date(subscription.current_period_end * 1000).toISOString(),
          amount: subscription.items.data[0]?.price?.unit_amount / 100 || 0,
          currency: subscription.currency?.toUpperCase() || 'USD',
          stripeSubscriptionId: subscription.id,
          interval: subscription.items.data[0]?.price?.recurring?.interval || 'month',
        };

        // Add card details if available
        if (paymentMethod && paymentMethod.type === 'card' && paymentMethod.card) {
          subscriptionDetails.cardBrand = paymentMethod.card.brand;
          subscriptionDetails.cardLast4 = paymentMethod.card.last4;
          subscriptionDetails.cardExpMonth = paymentMethod.card.exp_month;
          subscriptionDetails.cardExpYear = paymentMethod.card.exp_year;
        }

        // Get payment history from invoices
        if (invoices.data && invoices.data.length > 0) {
          subscriptionDetails.payments = invoices.data.map(invoice => ({
            id: invoice.id,
            date: new Date(invoice.created * 1000).toISOString(),
            amount: invoice.amount_paid / 100,
            currency: invoice.currency?.toUpperCase() || 'USD',
            status: invoice.status,
            paymentType: 'stripe',
            receiptUrl: invoice.hosted_invoice_url,
          }));
        }
      } catch (stripeError) {
        console.error('Error fetching Stripe subscription:', stripeError);
        // Continue execution to try crypto payment lookup
      }
    }

    // Check for crypto payments if no Stripe subscription details were found
    if (subscriptionDetails.paymentType !== 'stripe') {
      // Get crypto payment details
      const { data: cryptoPayments, error: cryptoError } = await supabase
        .from('crypto_payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!cryptoError && cryptoPayments && cryptoPayments.length > 0) {
        const latestPayment = cryptoPayments[0];
        
        // Calculate expiration date for the subscription
        const startDate = new Date(latestPayment.created_at);
        let endDate = new Date(startDate);
        
        if (latestPayment.plan_type === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        // Update subscription details
        subscriptionDetails = {
          ...subscriptionDetails,
          paymentType: 'crypto',
          status: new Date() < endDate ? 'Active' : 'Expired',
          startDate: startDate.toISOString(),
          renewalDate: endDate.toISOString(),
          amount: latestPayment.usd_amount || 0,
          currency: 'USD',
          cryptoCurrency: latestPayment.crypto_currency,
          walletAddress: latestPayment.wallet_address,
        };

        // Add payment history
        subscriptionDetails.payments = cryptoPayments.map(payment => ({
          id: payment.id,
          date: new Date(payment.created_at).toISOString(),
          amount: payment.usd_amount,
          currency: 'USD',
          status: payment.status,
          paymentType: 'crypto',
          cryptoAmount: payment.crypto_amount,
          cryptoCurrency: payment.crypto_currency,
        }));
      }
    }

    return c.json(subscriptionDetails);
  } catch (error) {
    console.error('Error in getSubscriptionDetails:', error);
    return errorUtils.handleError(c, error);
  }
}

/**
 * Create a Stripe customer portal session
 */
export async function createStripePortalSession(c) {
  try {
    const user = c.get('user');
    console.log('User from context (portal session):', user);
    
    if (!user) {
      console.error('No user found in context for portal session');
      return c.json({ error: 'User not authenticated' }, 401);
    }

    // Get user data to find Stripe customer ID
    const userId = user.id || await getUserIdFromEmail(user.email);
    console.log('Using userId for Stripe customer lookup:', userId);
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return c.json({ error: 'Failed to fetch user profile' }, 500);
    }

    if (!profile.stripe_customer_id) {
      return c.json({ error: 'No Stripe customer found for this user' }, 400);
    }

    // Create a portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.APP_URL || 'https://convert2doc.com'}/manage-subscription`,
    });

    return c.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return errorUtils.handleError(c, error);
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(c) {
  try {
    const user = c.get('user');
    console.log('User from context (cancel subscription):', user);
    
if (!user) {
console.error('No user found in context for subscription cancellation');
return c.json({ error: 'User not authenticated' }, 401);
    }

    // Get user data from database
    const userId = user.id || await getUserIdFromEmail(user.email);
    console.log('Using userId for subscription cancellation:', userId);
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('stripe_subscription_id, subscription_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user for cancellation:', profileError);
      return c.json({ error: 'Failed to fetch user data' }, 500);
    }

    if (!profile) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Check if user has a Stripe subscription
    if (profile.stripe_subscription_id) {
      console.log('Cancelling Stripe subscription:', profile.stripe_subscription_id);
      // Cancel Stripe subscription
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      return c.json({ success: true, message: 'Subscription will be canceled at the end of the billing period' });
    } 
    
    // If no Stripe subscription, check for other subscription types
    if (profile.subscription_id) {
      // Update user's subscription status in the database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          subscription_status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating subscription status:', updateError);
        return c.json({ error: 'Failed to cancel subscription' }, 500);
      }

      return c.json({ success: true, message: 'Subscription canceled' });
    }

    return c.json({ error: 'No active subscription found' }, 400);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return errorUtils.handleError(c, error);
  }
}
