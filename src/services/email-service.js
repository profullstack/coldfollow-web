import formData from 'form-data';
import Mailgun from 'mailgun.js';

/**
 * Email service for sending notifications
 */
export const emailService = {
  /**
   * Initialize Mailgun client
   * @returns {Object} - Mailgun client
   * @private
   */
  _getMailgunClient() {
    const mailgun = new Mailgun(formData);
    return mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY
    });
  },

  /**
   * Send an email
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} text - Plain text email content
   * @param {string} html - HTML email content
   * @returns {Promise<Object>} - Mailgun response
   */
  async sendEmail(to, subject, text, html) {
    const mg = this._getMailgunClient();
    
    const data = {
      from: process.env.FROM_EMAIL || 'hello@coldfollow.com',
      to: to,
      subject: subject,
      text: text,
      html: html || text,
      'h:Reply-To': process.env.REPLY_TO_EMAIL || 'help@coldfollow.com'
    };
    
    try {
      return await mg.messages.create(process.env.MAILGUN_DOMAIN, data);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },

  /**
   * Send a subscription confirmation email
   * @param {string} to - Recipient email address
   * @param {Object} subscription - Subscription details
   * @returns {Promise<Object>} - Mailgun response
   */
  async sendSubscriptionConfirmation(to, subscription) {
    const subject = 'Your Subscription Confirmation';
    const text = `
Thank you for subscribing to our document generation service!

Subscription Details:
- Plan: ${subscription.plan}
- Price: $${subscription.amount} ${subscription.interval}
- Start Date: ${new Date(subscription.start_date).toLocaleDateString()}
- Expiration Date: ${new Date(subscription.expiration_date).toLocaleDateString()}
- Payment Method: ${subscription.payment_method}
- Transaction ID: ${subscription.transaction_id || 'Pending'}

Your subscription gives you full access to all document generation features.

If you have any questions, please reply to this email.

Thank you,
The Profullstack, Inc. Team
`;

    return this.sendEmail(to, subject, text);
  },

  /**
   * Send a payment reminder email
   * @param {string} to - Recipient email address
   * @param {Object} subscription - Subscription details
   * @param {number} daysLeft - Days left until expiration
   * @returns {Promise<Object>} - Mailgun response
   */
  async sendPaymentReminder(to, subscription, daysLeft) {
    const subject = `Your Subscription Expires in ${daysLeft} Days`;
    const text = `
Your subscription to our document generation service will expire in ${daysLeft} days.

Subscription Details:
- Plan: ${subscription.plan}
- Expiration Date: ${new Date(subscription.expiration_date).toLocaleDateString()}

To continue using our service without interruption, please renew your subscription before the expiration date.

Renewal Options:
- Monthly Plan: $${process.env.MONTHLY_SUBSCRIPTION_PRICE || 5}/month
- Yearly Plan: $${process.env.YEARLY_SUBSCRIPTION_PRICE || 30}/year (Save over 50%!)

You can renew your subscription by visiting: https://coldfollow.com/subscription

If you have any questions, please reply to this email.

Thank you,
The Profullstack, Inc. Team
`;

    return this.sendEmail(to, subject, text);
  },

  /**
   * Send a subscription expired email
   * @param {string} to - Recipient email address
   * @param {Object} subscription - Subscription details
   * @returns {Promise<Object>} - Mailgun response
   */
  async sendSubscriptionExpired(to, subscription) {
    const subject = 'Your Subscription Has Expired';
    const text = `
Your subscription to our document generation service has expired.

Subscription Details:
- Plan: ${subscription.plan}
- Expiration Date: ${new Date(subscription.expiration_date).toLocaleDateString()}

To continue using our service, please renew your subscription.

Renewal Options:
- Monthly Plan: $${process.env.MONTHLY_SUBSCRIPTION_PRICE || 5}/month
- Yearly Plan: $${process.env.YEARLY_SUBSCRIPTION_PRICE || 30}/year (Save over 50%!)

You can renew your subscription by visiting: https://coldfollow.com/subscription

If you have any questions, please reply to this email.

Thank you,
The Profullstack, Inc. Team
`;

    return this.sendEmail(to, subject, text);
  },

  /**
   * Send a payment received email
   * @param {string} to - Recipient email address
   * @param {Object} payment - Payment details
   * @returns {Promise<Object>} - Mailgun response
   */
  async sendPaymentReceived(to, payment) {
    const subject = 'Payment Received';
    const text = `
Thank you for your payment!

Payment Details:
- Amount: $${payment.amount}
- Currency: ${payment.currency}
- Transaction ID: ${payment.transaction_id}
- Date: ${new Date(payment.created_at).toLocaleDateString()}

Your subscription has been extended until ${new Date(payment.subscription.expiration_date).toLocaleDateString()}.

If you have any questions, please reply to this email.

Thank you,
The Profullstack, Inc. Team
`;

    return this.sendEmail(to, subject, text);
  }
};