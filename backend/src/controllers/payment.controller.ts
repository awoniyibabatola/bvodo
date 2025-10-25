import { Request, Response } from 'express';
import { stripeService } from '../services/stripe.service';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { DuffelService } from '../services/duffel.service';

const duffelService = new DuffelService();

/**
 * Create Stripe checkout session for booking payment
 */
export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { bookingReference } = req.body;
    const user = (req as any).user;

    if (!bookingReference) {
      return res.status(400).json({
        success: false,
        message: 'Booking reference is required',
      });
    }

    // Get booking details
    const booking = await prisma.booking.findFirst({
      where: {
        bookingReference,
        organizationId: user.organizationId,
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.status !== 'pending' && booking.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Cannot create payment for booking with status: ${booking.status}`,
      });
    }

    // Create Stripe checkout session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    const session = await stripeService.createCheckoutSession({
      bookingReference: booking.bookingReference,
      amount: parseFloat(booking.totalPrice.toString()),
      currency: booking.currency,
      customerEmail: booking.user.email,
      successUrl: `${frontendUrl}/dashboard/bookings/${bookingReference}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/dashboard/bookings/${bookingReference}?payment=cancelled`,
      metadata: {
        bookingId: booking.id,
        userId: booking.userId,
        organizationId: booking.organizationId,
      },
    });

    // Update booking with checkout session ID
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        checkoutSessionId: session.id,
        paymentStatus: 'pending',
      },
    });

    logger.info(`[Payment] Checkout session created for booking ${bookingReference}: ${session.id}`);

    return res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error: any) {
    logger.error('[Payment] Failed to create checkout session:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create checkout session',
    });
  }
};

/**
 * Handle Stripe webhook events
 */
export const handleWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    logger.error('[Payment] Webhook signature missing');
    return res.status(400).json({ error: 'Webhook signature missing' });
  }

  try {
    // Verify webhook signature
    const event = stripeService.verifyWebhookSignature(req.body, signature);

    logger.info(`[Payment] Webhook event received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as any);
        break;

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as any);
        break;

      case 'payment_intent.succeeded':
        logger.info(`[Payment] Payment succeeded: ${event.data.object.id}`);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as any);
        break;

      default:
        logger.info(`[Payment] Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error: any) {
    logger.error('[Payment] Webhook error:', error);
    return res.status(400).json({ error: error.message });
  }
};

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session: any) {
  try {
    const { metadata } = session;
    const bookingId = metadata?.bookingId;

    if (!bookingId) {
      logger.error('[Payment] Booking ID not found in session metadata');
      return;
    }

    logger.info(`[Payment] Processing successful payment for booking ${bookingId}`);

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
      },
    });

    if (!booking) {
      logger.error(`[Payment] Booking ${bookingId} not found`);
      return;
    }

    // Update booking payment status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'completed',
      },
    });

    logger.info(`[Payment] ✅ Payment completed for booking ${booking.bookingReference}`);

    // If booking is approved and payment is complete, create Duffel order
    if (booking.status === 'approved' && booking.provider === 'duffel') {
      try {
        logger.info(`[Payment] Creating Duffel order for approved booking ${booking.bookingReference}`);

        const bookingData = booking.bookingData as any;
        const offerId = booking.providerBookingReference || bookingData?.id;
        const passengerDetails = booking.passengerDetails as any;
        const services = bookingData?.services as any;

        if (!offerId) {
          throw new Error('Offer ID not found in booking');
        }

        // Validate offer is still valid
        await duffelService.getOfferDetails(offerId as string);

        // Extract contact info
        const firstPassenger = Array.isArray(passengerDetails) ? passengerDetails[0] : null;
        const contactEmail = firstPassenger?.email || booking.user.email;
        const contactPhone = firstPassenger?.phone || '';

        // Create Duffel order using 'balance' payment type (prepaid from Stripe payment)
        const duffelOrder = await duffelService.createBooking({
          offerId: offerId as string,
          passengers: passengerDetails || [],
          contactEmail,
          contactPhone,
          services: services || undefined,
        });

        // Update booking with Duffel order details
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            providerOrderId: duffelOrder.bookingReference,
            providerConfirmationNumber: duffelOrder.bookingReference,
            providerRawData: duffelOrder.rawData,
            status: 'confirmed',
            confirmedAt: new Date(),
          },
        });

        logger.info(`[Payment] ✅ Duffel order created: ${duffelOrder.bookingReference}`);
      } catch (duffelError: any) {
        logger.error(`[Payment] Failed to create Duffel order:`, duffelError);

        // Update booking status to failed
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: 'failed',
            notes: `${booking.notes || ''}\n\n[System] Duffel order creation failed after payment: ${duffelError.message}`.trim(),
          },
        });

        // TODO: Send notification to admin about failed booking (payment received but flight not booked)
      }
    }
  } catch (error) {
    logger.error('[Payment] Error handling checkout session completed:', error);
  }
}

/**
 * Handle expired checkout session
 */
async function handleCheckoutSessionExpired(session: any) {
  try {
    const { metadata } = session;
    const bookingId = metadata?.bookingId;

    if (!bookingId) {
      return;
    }

    logger.info(`[Payment] Checkout session expired for booking ${bookingId}`);

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'failed',
        notes: 'Payment session expired',
      },
    });
  } catch (error) {
    logger.error('[Payment] Error handling checkout session expired:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: any) {
  try {
    const { metadata } = paymentIntent;
    const bookingId = metadata?.bookingId;

    if (!bookingId) {
      return;
    }

    logger.info(`[Payment] Payment failed for booking ${bookingId}`);

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'failed',
        notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
      },
    });
  } catch (error) {
    logger.error('[Payment] Error handling payment failed:', error);
  }
}

/**
 * Get payment status for a booking
 */
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { bookingReference } = req.params;
    const user = (req as any).user;

    const booking = await prisma.booking.findFirst({
      where: {
        bookingReference,
        organizationId: user.organizationId,
      },
      select: {
        paymentStatus: true,
        checkoutSessionId: true,
        totalPrice: true,
        currency: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // If there's a checkout session, get its status from Stripe
    let sessionStatus = null;
    if (booking.checkoutSessionId) {
      try {
        const session = await stripeService.getSession(booking.checkoutSessionId);
        sessionStatus = {
          status: session.status,
          paymentStatus: session.payment_status,
        };
      } catch (error) {
        logger.error('[Payment] Failed to get session status:', error);
      }
    }

    return res.json({
      success: true,
      data: {
        paymentStatus: booking.paymentStatus,
        amount: parseFloat(booking.totalPrice.toString()),
        currency: booking.currency,
        session: sessionStatus,
      },
    });
  } catch (error: any) {
    logger.error('[Payment] Failed to get payment status:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment status',
    });
  }
};
