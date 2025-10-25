import Stripe from 'stripe';
import { env } from '../config/env';
import { logger } from '../utils/logger';

class StripeService {
  private stripe: Stripe | null = null;

  constructor() {
    if (env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
      });
      logger.info('Stripe initialized successfully');
    } else {
      logger.warn('Stripe not initialized - STRIPE_SECRET_KEY not found');
    }
  }

  /**
   * Create a checkout session for flight booking payment
   */
  async createCheckoutSession(params: {
    bookingReference: string;
    amount: number; // in dollars
    currency: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.');
    }

    const { bookingReference, amount, currency, customerEmail, successUrl, cancelUrl, metadata } = params;

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    logger.info(`[Stripe] Creating checkout session for booking ${bookingReference}, amount: ${amount} ${currency}`);

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `Flight Booking - ${bookingReference}`,
                description: 'Corporate travel flight booking',
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: customerEmail,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          bookingReference,
          ...metadata,
        },
        expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
      });

      logger.info(`[Stripe] ✅ Checkout session created: ${session.id}`);
      return session;
    } catch (error: any) {
      logger.error('[Stripe] Failed to create checkout session:', error);
      throw new Error(`Stripe checkout session creation failed: ${error.message}`);
    }
  }

  /**
   * Retrieve a checkout session
   */
  async getSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error: any) {
      logger.error(`[Stripe] Failed to retrieve session ${sessionId}:`, error);
      throw new Error(`Failed to retrieve Stripe session: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error: any) {
      logger.error('[Stripe] Webhook signature verification failed:', error);
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }

  /**
   * Create a refund
   */
  async createRefund(params: {
    paymentIntentId: string;
    amount?: number; // in dollars, optional (full refund if not provided)
    reason?: string;
  }): Promise<Stripe.Refund> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const { paymentIntentId, amount, reason } = params;

    logger.info(`[Stripe] Creating refund for payment ${paymentIntentId}`);

    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason: reason as Stripe.RefundCreateParams.Reason,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await this.stripe.refunds.create(refundParams);

      logger.info(`[Stripe] ✅ Refund created: ${refund.id}`);
      return refund;
    } catch (error: any) {
      logger.error('[Stripe] Failed to create refund:', error);
      throw new Error(`Stripe refund creation failed: ${error.message}`);
    }
  }
}

export const stripeService = new StripeService();
