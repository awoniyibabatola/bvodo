import { Request, Response } from 'express';
import { stripeService } from '../services/stripe.service';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { DuffelService } from '../services/duffel.service';
import emailService from '../services/email.service';

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
      successUrl: `${frontendUrl}/dashboard/bookings/${booking.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/dashboard/bookings/${booking.id}?payment=cancelled`,
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

    // Update booking payment status and store payment method
    // Card payments are auto-approved (user paid with own money)
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'completed',
        status: 'approved',  // Auto-approve card payments
        approvedAt: new Date(),
        bookingData: {
          ...(booking.bookingData as any || {}),
          paymentMethod: 'card',  // Store that this was paid via Stripe card
        },
      },
    });

    logger.info(`[Payment] ✅ Payment completed and auto-approved for booking ${booking.bookingReference}`);

    // Payment is complete and booking is now approved, create Duffel order
    if (booking.provider === 'duffel') {
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

        logger.info(`[Payment] ✅ Duffel order created successfully: ${duffelOrder.bookingReference}`);

        // CRITICAL: Update booking with Duffel order details IMMEDIATELY
        // This must happen before any other operations that might fail
        try {
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
          logger.info(`[Payment] ✅ Booking ${booking.bookingReference} marked as confirmed with PNR: ${duffelOrder.bookingReference}`);
        } catch (updateError) {
          logger.error(`[Payment] CRITICAL: Failed to update booking status after Duffel order created!`, updateError);
          logger.error(`[Payment] PNR ${duffelOrder.bookingReference} exists but booking ${booking.bookingReference} not updated in DB!`);
          // Don't throw - the booking exists in Duffel, we just failed to update our DB
        }

        // Send confirmation email after successful booking
        try {
          logger.info(`[Payment] Sending confirmation email for booking ${booking.bookingReference}`);

          // Get updated booking with full details
          const fullBooking = await prisma.booking.findUnique({
            where: { id: booking.id },
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          });

          if (fullBooking) {
            const bookingDataObj = fullBooking.bookingData as any;
            const segments = bookingDataObj?.slices?.[0]?.segments || [];
            const firstSegment = segments[0];
            const lastSegment = segments[segments.length - 1];

            await emailService.sendBookingConfirmation({
              bookingId: fullBooking.id,
              bookingReference: fullBooking.bookingReference,
              pnr: duffelOrder.bookingReference,
              travelerName: `${passengerDetails[0]?.firstName || 'Traveler'} ${passengerDetails[0]?.lastName || ''}`,
              bookerName: `${fullBooking.user.firstName} ${fullBooking.user.lastName}`,
              bookerEmail: fullBooking.user.email,
              flightDetails: {
                airline: firstSegment?.operatingCarrier?.name || firstSegment?.marketingCarrier?.name || 'N/A',
                from: fullBooking.origin || firstSegment?.origin?.iataCode || 'N/A',
                to: fullBooking.destination || lastSegment?.destination?.iataCode || 'N/A',
                departureDate: new Date(fullBooking.departureDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                departureTime: firstSegment?.departingAt ? new Date(firstSegment.departingAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A',
                arrivalTime: lastSegment?.arrivingAt ? new Date(lastSegment.arrivingAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A',
                flightNumber: firstSegment?.marketingCarrier?.iataCode && firstSegment?.marketingCarrierFlightNumber
                  ? `${firstSegment.marketingCarrier.iataCode}${firstSegment.marketingCarrierFlightNumber}`
                  : undefined,
              },
              passengerDetails: Array.isArray(passengerDetails) ? passengerDetails.map((p: any) => ({
                firstName: p.firstName,
                lastName: p.lastName,
                email: p.email,
              })) : [],
              priceDetails: {
                basePrice: Number(fullBooking.basePrice || 0),
                taxes: Number(fullBooking.taxesFees || 0),
                total: Number(fullBooking.totalPrice || 0),
                currency: fullBooking.currency || 'USD',
              },
              seatsSelected: bookingDataObj?.seatsSelected || undefined,
              baggageSelected: bookingDataObj?.baggageSelected || undefined,
            });

            logger.info(`[Payment] ✅ Confirmation email sent for ${booking.bookingReference}`);
          }
        } catch (emailError) {
          logger.error('[Payment] Failed to send confirmation email:', emailError);
          // Don't fail the booking if email fails
        }
      } catch (duffelError: any) {
        logger.error(`[Payment] ❌ Failed to create Duffel order for ${booking.bookingReference}:`, duffelError);

        // IMPORTANT: Payment was successful, so booking stays as "approved"
        // Admin must manually create the booking or issue refund
        try {
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              // Keep current status (approved) and paymentStatus (completed)
              notes: `${booking.notes || ''}\n\n⚠️ [URGENT - MANUAL REVIEW REQUIRED]\nPayment: COMPLETED ($${booking.totalPrice})\nDuffel Booking: FAILED - ${duffelError.message}\n\nACTION REQUIRED:\n1. Review Offer ID: ${booking.providerBookingReference}\n2. Either manually rebook OR initiate refund\n3. Contact customer about delay`.trim(),
            },
          });
        } catch (noteError) {
          logger.error(`[Payment] Failed to update booking notes:`, noteError);
        }

        logger.error(`[Payment] ⚠️⚠️⚠️ CRITICAL: Payment collected but flight NOT booked for ${booking.bookingReference}`);
        logger.error(`[Payment] Amount: ${booking.totalPrice} ${booking.currency}`);
        logger.error(`[Payment] Customer: ${booking.user.email}`);

        // TODO: Send URGENT email/SMS to admin
        // TODO: Consider auto-refund if offer is expired
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
 * Manually verify and complete payment (for testing without webhooks)
 */
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const user = (req as any).user;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    // Get session from Stripe
    const session = await stripeService.getSession(sessionId);

    if (!session.metadata?.bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session - no booking reference',
      });
    }

    const bookingId = session.metadata.bookingId;

    // Verify user has access to this booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        organizationId: user.organizationId,
      },
      include: {
        user: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // If payment is complete and status is 'paid', process it
    if (session.payment_status === 'paid') {
      await handleCheckoutSessionCompleted(session);

      return res.json({
        success: true,
        message: 'Payment verified and booking confirmed',
      });
    }

    return res.json({
      success: false,
      message: `Payment status: ${session.payment_status}`,
    });
  } catch (error: any) {
    logger.error('[Payment] Failed to verify payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment',
    });
  }
};

/**
 * Complete payment for pending booking (card or balance)
 */
export const completeBookingPayment = async (req: Request, res: Response) => {
  try {
    const { bookingId, paymentMethod } = req.body;
    const user = (req as any).user;

    if (!bookingId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and payment method are required',
      });
    }

    // Get booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: user.id,
        organizationId: user.organizationId,
        paymentStatus: { in: ['pending', 'failed'] }, // Allow pending or failed
      },
      include: {
        user: true,
        organization: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or already paid',
      });
    }

    // Check if booking status allows payment
    const allowedStatuses = ['pending', 'pending_approval'];
    if (!allowedStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete payment for booking with status: ${booking.status}`,
      });
    }

    // Validate passenger details exist
    const passengerDetails = booking.passengerDetails as any;
    if (!passengerDetails || (Array.isArray(passengerDetails) && passengerDetails.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'This booking is missing passenger details. Please create a new booking with complete passenger information.',
        error: 'MISSING_PASSENGER_DETAILS',
      });
    }

    // Validate required passenger fields
    if (Array.isArray(passengerDetails)) {
      const missingFields = passengerDetails.some((p: any) =>
        !p.firstName || !p.lastName || !p.dateOfBirth || !p.email
      );

      if (missingFields) {
        return res.status(400).json({
          success: false,
          message: 'Passenger details are incomplete. Required: firstName, lastName, dateOfBirth, email. Please create a new booking.',
          error: 'INCOMPLETE_PASSENGER_DETAILS',
        });
      }
    }

    // Validate offer is still available for Duffel bookings
    if (booking.provider === 'duffel') {
      try {
        const bookingData = booking.bookingData as any;
        const offerId = booking.providerBookingReference || bookingData?.id;

        if (offerId) {
          logger.info(`[Payment] Validating offer ${offerId} for booking ${booking.bookingReference}`);

          // This will throw an error if offer is expired or invalid
          await duffelService.getOfferDetails(offerId as string);

          logger.info(`[Payment] ✅ Offer ${offerId} is still valid`);
        }
      } catch (offerError: any) {
        logger.error(`[Payment] ❌ Offer validation failed:`, offerError);

        return res.status(400).json({
          success: false,
          message: 'This flight offer is no longer available. Please search for a new flight.',
          error: 'OFFER_EXPIRED',
        });
      }
    }

    // CARD PAYMENT
    if (paymentMethod === 'card') {
      // Create Stripe checkout session
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

      const session = await stripeService.createCheckoutSession({
        bookingReference: booking.bookingReference,
        amount: parseFloat(booking.totalPrice.toString()),
        currency: booking.currency,
        customerEmail: booking.user.email,
        successUrl: `${frontendUrl}/dashboard/bookings/${booking.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${frontendUrl}/dashboard/bookings/${booking.id}?payment=cancelled`,
        metadata: {
          bookingId: booking.id,
          userId: booking.userId,
          organizationId: booking.organizationId,
        },
      });

      // Update booking
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          checkoutSessionId: session.id,
          paymentStatus: 'pending',
          bookingData: {
            ...(booking.bookingData as any || {}),
            paymentMethod: 'card',
          },
        },
      });

      logger.info(`[Payment] Stripe checkout created for ${booking.bookingReference}: ${session.id}`);

      return res.json({
        success: true,
        paymentMethod: 'card',
        checkoutUrl: session.url,
      });
    }

    // BALANCE PAYMENT (Bvodo Credits)
    if (paymentMethod === 'credit') {
      // Check if user has sufficient credits
      const userCredits = await prisma.user.findUnique({
        where: { id: user.id },
        select: { availableCredits: true },
      });

      if (!userCredits || parseFloat(userCredits.availableCredits.toString()) < parseFloat(booking.totalPrice.toString())) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient credits. Please top up your account or pay with card.',
        });
      }

      // Check if approval is required
      const organization = booking.organization;
      const requiresApproval =
        organization.requireApprovalAll ||
        parseFloat(booking.totalPrice.toString()) >= parseFloat(organization.approvalThreshold.toString());

      if (requiresApproval) {
        // Update to pending_approval
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: 'pending_approval',
            paymentStatus: 'pending',
            bookingData: {
              ...(booking.bookingData as any || {}),
              paymentMethod: 'credit',
            },
          },
        });

        logger.info(`[Payment] Booking ${booking.bookingReference} updated to pending_approval for credit payment`);

        return res.json({
          success: true,
          paymentMethod: 'credit',
          requiresApproval: true,
          message: 'Booking updated to Bvodo Credits payment. Approval required before confirmation.',
        });
      } else {
        // Auto-approve and deduct credits
        await prisma.user.update({
          where: { id: user.id },
          data: {
            availableCredits: {
              decrement: parseFloat(booking.totalPrice.toString()),
            },
          },
        });

        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: 'approved',
            paymentStatus: 'completed',
            approvedAt: new Date(),
            bookingData: {
              ...(booking.bookingData as any || {}),
              paymentMethod: 'credit',
            },
          },
        });

        logger.info(`[Payment] Booking ${booking.bookingReference} auto-approved with credit payment`);

        // For Duffel bookings, create the order
        if (booking.provider === 'duffel') {
          try {
            const bookingData = booking.bookingData as any;
            const offerId = booking.providerBookingReference || bookingData?.id;
            const passengerDetails = booking.passengerDetails as any;
            const services = bookingData?.services as any;

            if (!offerId) {
              throw new Error('Offer ID not found in booking');
            }

            // Extract contact info
            const firstPassenger = Array.isArray(passengerDetails) ? passengerDetails[0] : null;
            const contactEmail = firstPassenger?.email || booking.user.email;
            const contactPhone = firstPassenger?.phone || '';

            // Create Duffel order using 'balance' payment type
            const duffelOrder = await duffelService.createBooking({
              offerId: offerId as string,
              passengers: passengerDetails || [],
              contactEmail,
              contactPhone,
              services: services || undefined,
            });

            logger.info(`[Payment] ✅ Duffel order created for ${booking.bookingReference}: ${duffelOrder.bookingReference}`);

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
          } catch (duffelError: any) {
            logger.error(`[Payment] Failed to create Duffel order:`, duffelError);
            // Don't fail the response - admin can manually create booking
          }
        }

        return res.json({
          success: true,
          paymentMethod: 'credit',
          requiresApproval: false,
          message: 'Payment completed with Bvodo Credits!',
        });
      }
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid payment method. Must be "card" or "credit"',
    });
  } catch (error: any) {
    logger.error('[Payment] Error completing booking payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete payment',
    });
  }
};

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
