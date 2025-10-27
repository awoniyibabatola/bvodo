# Stripe Production Payment Issue - Diagnostic Guide

## Issue Summary

**Problem**: User clicks "Proceed" for card payment → Shows "successful" → Doesn't redirect to Stripe checkout

**Root Cause**: Stripe checkout session creation failing silently in production

**Location**: `backend/src/controllers/booking.controller.ts` Lines 996-1012 (now fixed)

---

## What Was Wrong

### Old Behavior (Buggy)
```javascript
} catch (stripeError: any) {
  logger.error('[Booking] Failed to create Stripe checkout:', stripeError);
  // Don't fail the booking, just log the error  ← BUG!
  // User can retry payment later via the payment page
}

res.status(201).json({
  success: true,  ← Returns success even though Stripe failed!
  checkoutUrl: null  ← No checkout URL
});
```

**Result**:
- Booking created ✓
- Stripe checkout FAILED ❌
- API returns `success: true` with `checkoutUrl: null`
- Frontend shows "successful" but doesn't redirect
- User confused, booking created but payment not processed

---

## What's Fixed

### New Behavior (Fixed)
```javascript
} catch (stripeError: any) {
  logger.error('[Booking] ❌ CRITICAL: Failed to create Stripe checkout:', stripeError);

  // Delete the booking since we can't process payment
  await prisma.booking.delete({
    where: { id: completeBooking.id }
  });

  // Return error to user
  res.status(500).json({
    success: false,
    message: 'Failed to create payment session. Please try again or contact support if the issue persists.',
    error: 'STRIPE_CHECKOUT_FAILED',
    details: stripeError.message  ← Shows actual error
  });
  return;
}

// Additional safety check
if (paymentMethod === 'card' && !checkoutUrl) {
  logger.error('[Booking] ❌ Card payment selected but no checkout URL generated');

  await prisma.booking.delete({
    where: { id: completeBooking.id }
  });

  res.status(500).json({
    success: false,
    message: 'Failed to create payment session. Please try again.',
    error: 'CHECKOUT_URL_MISSING'
  });
  return;
}
```

**Result**:
- Stripe checkout fails → Booking DELETED
- API returns `success: false` with error details
- Frontend shows clear error message with details
- User knows what went wrong

---

## Production Diagnostic Steps

### Step 1: Check Backend Logs

**Location**: Production server logs

**What to look for**:
```
[Booking] ❌ CRITICAL: Failed to create Stripe checkout: [ERROR DETAILS]
```

**Common Errors**:

1. **"No such customer"**
   - Stripe customer ID is invalid
   - Solution: Check customer creation in `stripe.service.ts`

2. **"Invalid API Key"**
   - Wrong Stripe secret key
   - Solution: Check `STRIPE_SECRET_KEY` in production `.env`

3. **"API key has insufficient permissions"**
   - Stripe key doesn't have checkout permissions
   - Solution: Regenerate key with full permissions in Stripe dashboard

4. **"Account not activated"**
   - Stripe account not fully activated
   - Solution: Complete Stripe account setup

5. **"Network timeout" / "ECONNREFUSED"**
   - Can't reach Stripe API
   - Solution: Check firewall, network, DNS

---

### Step 2: Verify Environment Variables

**Check Production `.env` file**:

```bash
# Production backend .env
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # Must start with sk_live_ for production
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
FRONTEND_URL=https://your-production-domain.com  # Must be HTTPS for production
```

**Critical Checks**:

1. **Stripe Keys**:
   ```bash
   # WRONG (test keys in production)
   STRIPE_SECRET_KEY=sk_test_xxxxx

   # CORRECT (live keys)
   STRIPE_SECRET_KEY=sk_live_xxxxx
   ```

2. **Frontend URL**:
   ```bash
   # WRONG
   FRONTEND_URL=http://localhost:3001

   # CORRECT
   FRONTEND_URL=https://app.bvodo.com
   ```

3. **Webhook Secret**:
   ```bash
   # Must match the webhook endpoint in Stripe dashboard
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

---

### Step 3: Check Stripe Dashboard

**Login to**: https://dashboard.stripe.com

**1. Check API Keys**:
- Developers → API Keys
- Verify "Secret key" matches `STRIPE_SECRET_KEY` in production
- Verify "Publishable key" matches `STRIPE_PUBLISHABLE_KEY`

**2. Check Webhooks**:
- Developers → Webhooks
- Should see webhook endpoint: `https://api.your-domain.com/api/v1/payments/webhook`
- Status should be "Enabled"
- Events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`, `payment_intent.payment_failed`

**3. Check Recent Events**:
- Developers → Events
- Look for failed checkout sessions
- Click on event to see error details

**4. Check Account Status**:
- Settings → Account
- Ensure account is fully activated (not restricted)

---

### Step 4: Test Stripe Checkout Creation

**Create a test script** (`backend/test-stripe-production.js`):

```javascript
require('dotenv').config();
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testCheckout() {
  try {
    console.log('Testing Stripe checkout creation...');
    console.log('Using key:', process.env.STRIPE_SECRET_KEY?.substring(0, 15) + '...');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Flight Booking',
            },
            unit_amount: 10000, // $100.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    console.log('✅ SUCCESS!');
    console.log('Session ID:', session.id);
    console.log('Checkout URL:', session.url);
  } catch (error) {
    console.log('❌ FAILED!');
    console.log('Error type:', error.type);
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    console.log('Full error:', error);
  }
}

testCheckout();
```

**Run test**:
```bash
cd backend
node test-stripe-production.js
```

**If successful**:
```
✅ SUCCESS!
Session ID: cs_test_xxxxx
Checkout URL: https://checkout.stripe.com/c/pay/cs_test_xxxxx
```

**If failed**: Error details will show the exact problem

---

### Step 5: Check Network Connectivity

**Test from production server**:

```bash
# Test DNS resolution
nslookup api.stripe.com

# Test HTTPS connectivity
curl -I https://api.stripe.com/v1/checkout/sessions

# Test with authentication
curl https://api.stripe.com/v1/checkout/sessions \
  -u sk_live_YOUR_KEY: \
  -d "success_url=https://example.com/success" \
  -d "cancel_url=https://example.com/cancel" \
  -d "line_items[0][price_data][currency]=usd" \
  -d "line_items[0][price_data][product_data][name]=Test" \
  -d "line_items[0][price_data][unit_amount]=1000" \
  -d "line_items[0][quantity]=1" \
  -d "mode=payment"
```

**Expected**: JSON response with checkout session

**If failed**: Network issue (firewall, proxy, DNS)

---

## Quick Fixes

### Fix 1: Restart Backend Service

Sometimes services need a restart to pick up environment variable changes:

```bash
# Production server
pm2 restart backend
# OR
systemctl restart backend-service
```

### Fix 2: Regenerate Stripe API Keys

1. Login to Stripe Dashboard
2. Developers → API Keys
3. Click "Reveal test key token" (or live key)
4. Copy the key
5. Update production `.env`:
   ```
   STRIPE_SECRET_KEY=sk_live_NEW_KEY_HERE
   ```
6. Restart backend

### Fix 3: Recreate Webhook

1. Stripe Dashboard → Developers → Webhooks
2. Delete old webhook
3. Add new endpoint:
   - URL: `https://api.your-domain.com/api/v1/payments/webhook`
   - Events: Select all payment-related events
4. Copy webhook signing secret
5. Update production `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_NEW_SECRET_HERE
   ```
6. Restart backend

---

## How to Test After Fix

### Test 1: Create Booking with Card Payment

1. Go to production site
2. Search for a flight
3. Select a flight
4. Fill passenger details
5. **Select "Credit/Debit Card"** as payment method
6. Click "Proceed to Payment"

**Expected Result**:
- Should redirect to Stripe checkout page
- URL should be `https://checkout.stripe.com/c/pay/cs_xxxxx`

**If shows error**: Check browser console and backend logs for details

### Test 2: Check Backend Logs

After attempting payment, check production logs:

```bash
# View recent logs
tail -f /var/log/bvodo/backend.log

# OR with PM2
pm2 logs backend --lines 50
```

**What to look for**:
```
[Booking] ✅ Offer validated
[Booking] ✅ All passport expiry dates validated
[Booking] Stripe checkout created for BK...: cs_xxxxx
```

**OR if error**:
```
[Booking] ❌ CRITICAL: Failed to create Stripe checkout: [ERROR]
[Booking] ❌ Card payment selected but no checkout URL generated
```

### Test 3: Complete Payment Flow

1. Redirect to Stripe checkout
2. Enter test card: `4242 4242 4242 4242`
3. Expiry: Any future date
4. CVC: Any 3 digits
5. Complete payment

**Expected**:
- Webhook fires
- Booking confirmed
- Duffel order created
- Confirmation email sent
- Redirected to booking confirmation page

---

## Prevention

To prevent this issue in the future:

### 1. Add Health Check Endpoint

**Create** `backend/src/routes/health.routes.ts`:
```typescript
import { Router } from 'express';
import Stripe from 'stripe';

const router = Router();

router.get('/health/stripe', async (req, res) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Test Stripe connection
    await stripe.customers.list({ limit: 1 });

    res.json({
      status: 'ok',
      stripe: 'connected',
      environment: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'production' : 'test'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      stripe: 'disconnected',
      error: error.message
    });
  }
});

export default router;
```

**Check**: `https://api.your-domain.com/health/stripe`

### 2. Add Monitoring Alerts

Set up alerts for:
- Stripe checkout creation failures
- Payment webhook failures
- Booking creation without payment

### 3. Add Logging

Already added in the fix:
```typescript
logger.error('[Booking] ❌ CRITICAL: Failed to create Stripe checkout:', stripeError);
```

Monitor these logs daily.

---

## Summary

**What was broken**:
- Stripe errors were caught but ignored
- Booking created without payment session
- User saw "successful" without redirect

**What's fixed**:
- Stripe errors now delete the booking
- User sees clear error message with details
- No orphaned bookings without payment

**What to check in production**:
1. Backend logs for Stripe errors
2. Environment variables (API keys, webhook secret, frontend URL)
3. Stripe dashboard (account status, webhooks)
4. Network connectivity to Stripe API

**Next steps**:
1. Deploy this fix to production
2. Test card payment flow end-to-end
3. Monitor logs for any Stripe errors
4. Set up alerts for payment failures

---

**Files Changed**:
- `backend/src/controllers/booking.controller.ts` - Fixed error handling
- `frontend/src/app/dashboard/flights/[id]/page.tsx` - Added error messages

**Ready to deploy!** 🚀
