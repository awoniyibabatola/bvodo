import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createCheckoutSession,
  handleWebhook,
  getPaymentStatus,
  verifyPayment,
} from '../controllers/payment.controller';

const router = express.Router();

/**
 * @route   POST /api/v1/payments/checkout
 * @desc    Create Stripe checkout session for booking
 * @access  Private
 */
router.post('/checkout', authenticate, createCheckoutSession);

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (verified by Stripe signature)
 * @note    This endpoint needs raw body, configured in server.ts
 */
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Manually verify and complete payment (for testing without webhooks)
 * @access  Private
 */
router.post('/verify', authenticate, verifyPayment);

/**
 * @route   GET /api/v1/payments/status/:bookingReference
 * @desc    Get payment status for a booking
 * @access  Private
 */
router.get('/status/:bookingReference', authenticate, getPaymentStatus);

export default router;
